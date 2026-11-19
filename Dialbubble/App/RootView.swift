import SwiftUI

struct RootView: View {
    @Environment(AppStore.self) private var store
    @Environment(\.scenePhase) private var scenePhase
    @AppStorage("relay.appLock") private var appLockEnabled = false
    @State private var isLocked = false

    var body: some View {
        @Bindable var store = store
        Group {
            if store.hasAccount && !store.isOnboarding {
                MainTabView()
            } else {
                OnboardingView()
                    .transition(.opacity.combined(with: .scale(scale: 0.98)))
            }
        }
        .animation(.smooth, value: store.hasAccount && !store.isOnboarding)
        .fullScreenCover(item: $store.liveCall) { session in
            ActiveCallView(session: session)
        }
        .overlay {
            if isLocked || scenePhase != .active && appLockEnabled {
                LockScreenView(isLocked: $isLocked)
                    .transition(.opacity)
            }
        }
        .task {
            if appLockEnabled { isLocked = true }
            if LaunchOptions.startInDemo, !store.hasAccount { await store.startDemo() }
            if let tab = LaunchOptions.initialTab { store.selectedTab = tab }
            await store.refreshAll()
        }
        .task(id: store.isDemo) { ContactBook.shared.demoEnabled = store.isDemo }
        .task { await ContactBook.shared.load() }
        .onChange(of: store.unreadCount + store.unseenMissedCalls) { _, _ in Alerts.updateBadge(store) }
        .onChange(of: Connectivity.shared.reconnects) { _, _ in
            // Back online: catch up right away instead of waiting for the next poll.
            Task { await store.refreshAll() }
        }
        .onChange(of: scenePhase) { _, phase in
            switch phase {
            case .active:
                store.startPolling()
                Task { await ContactBook.shared.load() }
                Task { await store.refreshAll() }
            case .background:
                store.stopPolling()
                store.saveHistoryCache()
                Alerts.updateBadge(store)
                Alerts.schedule()
                QuickAction.install(store: store)
                if appLockEnabled { isLocked = true }
            default: break
            }
        }
    }
}

struct MainTabView: View {
    @Environment(AppStore.self) private var store

    @ViewBuilder
    private var statusAccessory: some View {
        if let session = store.minimizedCall, store.liveCall == nil {
            CallReturnBar(session: session)
        } else if !Connectivity.shared.isOnline {
            OfflineBar()
        }
    }

    private var showsAccessory: Bool {
        (store.minimizedCall != nil && store.liveCall == nil) || !Connectivity.shared.isOnline
    }

    var body: some View {
        @Bindable var store = store
        TabView(selection: $store.selectedTab) {
            Tab("Home", systemImage: "square.grid.2x2.fill", value: AppTab.home) {
                DashboardView()
            }
            Tab("Calls", systemImage: "phone.fill", value: AppTab.calls) {
                CallsRootView()
            }
            .badge(store.unseenMissedCalls)
            if FeatureFlags.messaging {
                Tab("Messages", systemImage: "message.fill", value: AppTab.messages) {
                    MessagesRootView()
                }
                .badge(store.unreadCount)
            }
            Tab("Settings", systemImage: "gearshape.fill", value: AppTab.settings) {
                SettingsRootView()
            }
            Tab(value: AppTab.search, role: .search) {
                GlobalSearchView()
            }
        }
        .tabBarMinimizeBehavior(.onScrollDown)
        // Above the tab bar, like Now Playing: a call that's still going, or the offline notice.
        .modifier(StatusAccessory(isEnabled: showsAccessory) { statusAccessory })
        .onChange(of: store.selectedTab) { _, tab in
            // FeatureFlags.messaging: the Messages tab is hidden, never let selection land on it.
            if !FeatureFlags.messaging && tab == .messages { store.selectedTab = .home }
        }
        .safeAreaInset(edge: .top) {
            VStack(spacing: Theme.Space.xs) {
                if let error = store.lastError {
                    FriendlyErrorView(error: error, onDismiss: { withAnimation { store.lastError = nil } })
                        .padding(.horizontal)
                        .task(id: error) {
                            try? await Task.sleep(for: .seconds(8))
                            withAnimation { if store.lastError == error { store.lastError = nil } }
                        }
                        .transition(.move(edge: .top).combined(with: .opacity))
                }
            }
        }
        .overlay(alignment: .top) {
            if let m = store.incomingBanner {
                IncomingTextBanner(message: m) {
                    store.incomingBanner = nil
                    store.openMessage(to: m.counterpart, from: m.ourNumber)
                } onDismiss: {
                    withAnimation(.snappy) { if store.incomingBanner?.sid == m.sid { store.incomingBanner = nil } }
                }
                .padding(.horizontal, Theme.Space.sm)
                .transition(.move(edge: .top).combined(with: .opacity))
                .id(m.sid)
            }
        }
        .animation(.snappy, value: store.lastError)
        .animation(.snappy, value: store.minimizedCall)
        .animation(.snappy, value: store.incomingBanner)
        .animation(.snappy, value: Connectivity.shared.isOnline)
    }
}

/// The tab bar's bottom accessory (iOS 26.1+). On 26.0 the same content floats at the top instead.
private struct StatusAccessory<Accessory: View>: ViewModifier {
    var isEnabled: Bool
    @ViewBuilder var accessory: () -> Accessory

    func body(content: Content) -> some View {
        if #available(iOS 26.1, *) {
            content.tabViewBottomAccessory(isEnabled: isEnabled, content: accessory)
        } else {
            content.safeAreaInset(edge: .top) {
                if isEnabled {
                    accessory()
                        .padding(.vertical, 8)
                        .glassEffect(.regular.interactive(), in: .capsule)
                        .padding(.horizontal)
                }
            }
        }
    }
}
