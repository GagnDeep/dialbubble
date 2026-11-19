import SwiftUI
import Charts

struct DashboardView: View {
    @Environment(AppStore.self) private var store
    @Environment(ToastCenter.self) private var toast
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    @State private var usage: [UsageRecord] = []
    @State private var usagePeriod: TwilioClient.UsagePeriod = .thisMonth
    @State private var usageLoading = false
    @State private var usageLoaded = false
    @State private var usageError: String?
    @State private var showLookup = false
    @State private var refreshTick = 0
    @State private var route: HomeRoute?
    @State private var showHelp = false
    @State private var showAddAccount = false
    @State private var copyCount = 0
    @State private var isSyncingNumbers = false
    @State private var selectedDay: Date?

    @ScaledMetric(relativeTo: .largeTitle) private var balanceSize: CGFloat = 46
    @ScaledMetric(relativeTo: .body) private var numberCardWidth: CGFloat = 188
    @ScaledMetric(relativeTo: .body) private var chartHeight: CGFloat = 140
    @ScaledMetric(relativeTo: .caption) private var usageRowHeight: CGFloat = 34

    /// Nothing has come back from Twilio yet — show placeholders instead of "—" and zeros.
    private var isFirstLoad: Bool { store.lastRefresh == nil }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Space.lg) {
                    if store.isDemo && !LaunchOptions.marketing {
                        HomeDemoBanner()
                            .transition(.move(edge: .top).combined(with: .opacity))
                    }
                    attentionStrip
                    balanceHero
                    quickActions
                    if store.showsSetupChecklist {
                        HomeSetupChecklistCard(route: $route)
                            .transition(.scale(scale: 0.96).combined(with: .opacity))
                    }
                    numbersSection
                    activityCard
                    recentSection
                    usageSection
                    if let last = store.lastRefresh {
                        // Re-renders every 30 s so "Updated just now" never goes stale on screen.
                        TimelineView(.periodic(from: .now, by: 30)) { _ in
                            Text("Updated \(last, format: .relative(presentation: .named))")
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                                .frame(maxWidth: .infinity)
                        }
                    }
                }
                .padding(.horizontal, Theme.Space.md)
                .padding(.top, Theme.Space.xs)
                .padding(.bottom, Theme.Space.xl)
                .frame(maxWidth: 760)
                .frame(maxWidth: .infinity)
                .animation(Theme.Motion.adaptive(Theme.Motion.smooth, reduceMotion), value: store.isDemo)
                .animation(Theme.Motion.adaptive(Theme.Motion.smooth, reduceMotion), value: store.showsSetupChecklist)
                .animation(Theme.Motion.adaptive(Theme.Motion.smooth, reduceMotion), value: isFirstLoad)
                .animation(Theme.Motion.adaptive(Theme.Motion.smooth, reduceMotion), value: store.unreadCount)
                .animation(Theme.Motion.adaptive(Theme.Motion.smooth, reduceMotion), value: store.unseenMissedCalls)
            }
            .relayBackground()
            .scrollEdgeEffectStyle(.soft, for: .top)
            .navigationTitle(greeting)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) { profileMenu }
            }
            .navigationDestination(item: $route) { route in
                switch route {
                case .numbers: NumbersView()
                case .account(let id): AccountEditView(profileID: id)
                case .help: HelpCenterView()
                }
            }
            .sheet(isPresented: $showHelp) {
                NavigationStack { HelpCenterView(showsDone: true) }
            }
            .sheet(isPresented: $showAddAccount) { AddAccountSheet() }
            .sheet(isPresented: $showLookup) {
                NavigationStack { LookupView(showsDone: true) }
            }
            .sensoryFeedback(.success, trigger: copyCount)
            .refreshable {
                await store.refreshAll()
                await loadUsage()
                refreshTick += 1
            }
            .sensoryFeedback(.success, trigger: refreshTick)
            .task(id: "\(store.activeProfileID?.uuidString ?? "")-\(usagePeriod.rawValue)") { await loadUsage() }
        }
    }

    // MARK: Needs attention

    /// What's waiting for you, one tap away: unread texts and missed calls. Hidden when there's nothing.
    @ViewBuilder
    private var attentionStrip: some View {
        let unread = FeatureFlags.messaging ? store.unreadCount : 0
        let missed = store.unseenMissedCalls
        if unread > 0 || missed > 0 {
            let layout = dynamicTypeSize.isAccessibilitySize
                ? AnyLayout(VStackLayout(alignment: .leading, spacing: Theme.Space.xs))
                : AnyLayout(HStackLayout(spacing: Theme.Space.xs))
            GlassEffectContainer(spacing: Theme.Space.xs) {
                layout {
                    if unread > 0 {
                        attentionChip(unread == 1 ? "1 unread text" : "\(unread) unread texts",
                                      symbol: "message.badge.filled.fill", color: Theme.Palette.brandText,
                                      id: "home.attention.unread") {
                            store.openMessages(filter: .unread)
                        }
                    }
                    if missed > 0 {
                        attentionChip(missed == 1 ? "1 missed call" : "\(missed) missed calls",
                                      symbol: "phone.down.fill", color: Theme.Palette.danger,
                                      id: "home.attention.missed") {
                            store.openRecents()
                        }
                    }
                }
            }
            .transition(.opacity.combined(with: .move(edge: .top)))
        }
    }

    private func attentionChip(_ title: String, symbol: String, color: Color, id: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: symbol)
                    .foregroundStyle(color)
                    .symbolRenderingMode(.hierarchical)
                Text(title)
                    .foregroundStyle(.primary)
                    .monospacedDigit()
                Image(systemName: "chevron.right")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(.tertiary)
            }
            .font(.subheadline.weight(.semibold))
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .contentShape(.capsule)
        }
        .buttonStyle(.plain)
        .glassEffect(.regular.interactive(), in: .capsule)
        .accessibilityIdentifier(id)
    }

    private var greeting: String {
        switch Calendar.current.component(.hour, from: .now) {
        case 5..<12: "Good morning"
        case 12..<17: "Good afternoon"
        case 17..<22: "Good evening"
        default: "Hello"
        }
    }

    // MARK: Account menu (switcher, account actions and help in one place)

    private var profileMenu: some View {
        Menu {
            Section("Switch Account") {
                ForEach(store.profiles) { p in
                    Button {
                        Task { await store.activate(p) }
                    } label: {
                        Label {
                            Text(p.name)
                            Text(p.accountSid == DemoBackend.accountSid ? "Demo · simulated" : "\(p.enabledNumbers.count) numbers")
                        } icon: {
                            Image(systemName: p.id == store.activeProfileID ? "checkmark.circle.fill" : "person.crop.circle")
                        }
                    }
                }
            }
            Section {
                Button {
                    showAddAccount = true
                } label: {
                    Label("Add Account", systemImage: "person.crop.circle.badge.plus")
                }
                Button {
                    store.selectedTab = .settings
                } label: {
                    Label("Manage Accounts", systemImage: "person.2.badge.gearshape")
                }
                if let sid = store.activeProfile?.accountSid {
                    Button {
                        copySID(sid)
                    } label: {
                        Label("Copy Account SID", systemImage: "doc.on.doc")
                    }
                }
            }
            Section {
                Button {
                    showHelp = true
                } label: {
                    Label("Help & Guides", systemImage: "questionmark.circle")
                }
                .accessibilityIdentifier("home.help")
            }
        } label: {
            HStack(spacing: 6) {
                AvatarView(title: store.activeProfile?.name ?? "R", tint: store.profileColor, size: 28)
                Image(systemName: "chevron.down")
                    .font(.caption2.weight(.bold))
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 2)
        }
        .accessibilityLabel("Account: \(store.activeProfile?.name ?? "none"). Switch account, help and more")
        .accessibilityIdentifier("home.profileMenu")
    }

    private func copySID(_ sid: String) {
        UIPasteboard.general.string = sid
        copyCount += 1
        toast.show("Account SID copied", style: .success)
    }

    // MARK: Balance hero

    private var isTrial: Bool { store.account?.isTrial ?? store.activeProfile?.isTrial ?? false }

    private var balanceHero: some View {
        let loadingBalance = store.balance == nil && isFirstLoad
        return VStack(alignment: .leading, spacing: Theme.Space.xs) {
            HStack(spacing: Theme.Space.xs) {
                Circle()
                    .fill(store.profileColor)
                    .frame(width: 8, height: 8)
                    .accessibilityHidden(true)
                Text(store.account?.friendlyName ?? store.activeProfile?.name ?? "Twilio")
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                if store.isRefreshing {
                    ProgressView()
                        .controlSize(.mini)
                        .accessibilityLabel("Refreshing")
                }
                Spacer(minLength: Theme.Space.xs)
                accountBadges
            }

            Text(loadingBalance ? "$00.00" : (store.balance?.formatted ?? "Unavailable"))
                .font(.system(size: store.balance == nil && !loadingBalance ? balanceSize * 0.6 : balanceSize,
                              weight: .bold, design: .rounded))
                .monospacedDigit()
                .lineLimit(1)
                .minimumScaleFactor(0.5)
                .contentTransition(.numericText(value: store.balance?.amount ?? 0))
                .animation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion), value: store.balance?.amount)
                .redacted(reason: loadingBalance ? .placeholder : [])
                .accessibilityLabel(loadingBalance ? "Balance, loading" : "Balance, \(store.balance?.formatted ?? "unavailable")")

            Text("Available balance")
                .font(.footnote)
                .foregroundStyle(.secondary)
                .accessibilityHidden(true)

            if let balance = store.balance, balance.amount < 5, !store.isDemo {
                Callout(style: .warning, title: "Low balance",
                        message: FeatureFlags.messaging ? "Calls and texts stop when it runs out." : "Calls stop when it runs out.") {
                    Link(destination: URL(string: "https://console.twilio.com/us1/billing/manage-billing/billing-overview")!) {
                        Label("Add Funds", systemImage: "plus.circle.fill")
                            .font(.subheadline.weight(.semibold))
                    }
                    .buttonStyle(.glass)
                }
                .padding(.top, Theme.Space.xs)
            }
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .glassEffect(.regular.tint(Theme.Palette.brand.opacity(0.06)), in: .rect(cornerRadius: Theme.Radius.xl))
        .contentShape(.rect(cornerRadius: Theme.Radius.xl))
        .contextMenu {
            if let sid = store.activeProfile?.accountSid {
                Button { copySID(sid) } label: { Label("Copy Account SID", systemImage: "doc.on.doc") }
            }
            Button { store.selectedTab = .settings } label: { Label("Account Settings", systemImage: "gearshape") }
        }
        .accessibilityElement(children: .contain)
    }

    @ViewBuilder
    private var accountBadges: some View {
        if let status = store.account?.status, status != "active" {
            Badge(text: status.capitalized, color: Theme.Palette.warning)
        } else {
            Badge(text: isTrial ? "Trial" : "Full", color: isTrial ? Theme.Palette.warning : .secondary)
        }
    }

    // MARK: Quick actions

    private var quickActions: some View {
        GlassEffectContainer(spacing: Theme.Space.sm) {
            if dynamicTypeSize.isAccessibilitySize {
                LazyVGrid(columns: [GridItem(.flexible(), spacing: Theme.Space.sm), GridItem(.flexible(), spacing: Theme.Space.sm)],
                          spacing: Theme.Space.sm) {
                    quickActionTiles
                }
            } else {
                HStack(spacing: Theme.Space.sm) { quickActionTiles }
            }
        }
    }

    @ViewBuilder
    private var quickActionTiles: some View {
        ActionTile(title: "Call", symbol: "phone.fill", accessibilityID: "home.quick.call") {
            store.openDialer()
        }
        if FeatureFlags.messaging {
            ActionTile(title: "Message", symbol: "message.fill", accessibilityID: "home.quick.message") {
                store.openMessage(to: "")
            }
        }
        ActionTile(title: "Search", symbol: "magnifyingglass", accessibilityID: "home.quick.search") {
            store.selectedTab = .search
        }
        ActionTile(title: "Lookup", symbol: "person.text.rectangle", accessibilityID: "home.quick.lookup") {
            showLookup = true
        }
    }

    // MARK: Section header

    private func sectionHeader<Trailing: View>(_ title: String, @ViewBuilder trailing: () -> Trailing) -> some View {
        let label = Text(title)
            .font(.title3.weight(.bold))
            .accessibilityAddTraits(.isHeader)
        let trailingView = trailing()
        return ViewThatFits(in: .horizontal) {
            HStack(alignment: .firstTextBaseline) {
                label
                Spacer(minLength: Theme.Space.xs)
                trailingView
            }
            VStack(alignment: .leading, spacing: Theme.Space.xxs) {
                label
                trailingView
            }
        }
        .padding(.horizontal, Theme.Space.xxs)
    }

    // MARK: Numbers

    private var numbersSection: some View {
        VStack(alignment: .leading, spacing: Theme.Space.sm) {
            sectionHeader("Numbers") {
                Button(action: syncNumbers) {
                    if isSyncingNumbers {
                        HStack(spacing: 6) {
                            ProgressView().controlSize(.small)
                            Text("Syncing…")
                        }
                    } else {
                        Text("Sync")
                    }
                }
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(Theme.Palette.brandText)
                .buttonStyle(.plain)
                .disabled(isSyncingNumbers)
                .accessibilityLabel(isSyncingNumbers ? "Syncing numbers" : "Sync numbers from Twilio")
            }
            if store.enabledNumbers.isEmpty {
                Callout(style: .info, title: "No numbers yet",
                        message: "Buy a number or verify your own in the Twilio Console, then tap Sync.",
                        symbol: "number.circle.fill") {
                    ViewThatFits(in: .horizontal) {
                        HStack { emptyNumberActions }
                        VStack(alignment: .leading) { emptyNumberActions }
                    }
                    .font(.subheadline.weight(.semibold))
                }
            } else {
                ScrollView(.horizontal) {
                    GlassEffectContainer(spacing: Theme.Space.sm) {
                        HStack(spacing: Theme.Space.sm) {
                            ForEach(store.enabledNumbers) { n in numberCard(n) }
                        }
                        .padding(.vertical, Theme.Space.xxs)
                    }
                }
                .scrollIndicators(.hidden)
                .scrollClipDisabled()
            }
        }
    }

    @ViewBuilder
    private var emptyNumberActions: some View {
        Link(destination: URL(string: "https://console.twilio.com/us1/develop/phone-numbers/manage/search")!) {
            Label("Buy a Number", systemImage: "cart.fill")
        }
        .buttonStyle(.glassProminent)
        Button { route = .numbers } label: {
            Label("Manage", systemImage: "list.number")
        }
        .buttonStyle(.glass)
    }

    private func numberCard(_ n: ConfiguredNumber) -> some View {
        Menu {
            if n.voice {
                Button { store.openDialer(from: n.phoneNumber) } label: { Label("Call from this number", systemImage: "phone") }
            }
            if n.sms && FeatureFlags.messaging {
                Button { store.openMessage(to: "", from: n.phoneNumber) } label: { Label("Message from this number", systemImage: "message") }
            }
            Button {
                UIPasteboard.general.string = n.phoneNumber
                toast.show("Number copied", style: .success)
            } label: { Label("Copy Number", systemImage: "doc.on.doc") }
        } label: {
            VStack(alignment: .leading, spacing: Theme.Space.xxs) {
                HStack(spacing: Theme.Space.xs) {
                    Circle()
                        .fill(n.tint.color)
                        .frame(width: 8, height: 8)
                        .accessibilityHidden(true)
                    Text(n.displayName)
                        .font(.subheadline.weight(.semibold))
                        .lineLimit(1)
                }
                Text(PhoneFormat.display(n.phoneNumber))
                    .font(.subheadline.monospacedDigit())
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
                Text(capabilityLine(n))
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .padding(.top, 6)
            }
            .foregroundStyle(.primary)
            .padding(14)
            .frame(width: min(numberCardWidth, 320), alignment: .leading)
            .contentShape(.rect(cornerRadius: Theme.Radius.lg))
            .glassEffect(.regular.interactive(), in: .rect(cornerRadius: Theme.Radius.lg))
        }
        .buttonStyle(.plain)
        .accessibilityLabel("\(n.displayName), \(PhoneFormat.display(n.phoneNumber)), \(capabilityLine(n))")
        .accessibilityHint(FeatureFlags.messaging ? "Shows call, message and copy options" : "Shows call and copy options")
    }

    private func capabilityLine(_ n: ConfiguredNumber) -> String {
        // FeatureFlags.messaging: don't advertise SMS/MMS while texting is hidden.
        let sms = FeatureFlags.messaging && n.sms, mms = FeatureFlags.messaging && n.mms
        let caps = [n.voice ? "Voice" : nil, sms ? "SMS" : nil, mms ? "MMS" : nil].compactMap { $0 }
        if caps.isEmpty { return "No capabilities" }
        return caps.joined(separator: " · ")
    }

    private func syncNumbers() {
        guard !isSyncingNumbers else { return }
        isSyncingNumbers = true
        Task {
            let error = await store.syncNumbersReportingResult()
            isSyncingNumbers = false
            if let error {
                toast.show("\(error.title). \(error.suggestion ?? error.message)", style: .error)
            } else {
                let count = store.enabledNumbers.count
                toast.show("Numbers up to date · \(count) enabled", style: .success)
            }
        }
    }

    // MARK: Activity (three key stats + 7-day chart)

    private static let messagesColor = Theme.Palette.brand
    private static let callsColor = Theme.Palette.brandSecondary

    private struct DayActivity: Identifiable {
        let day: Date
        let kind: String
        let count: Int
        var id: String { "\(day.timeIntervalSince1970)-\(kind)" }
    }

    /// Everything the Activity card shows, computed in a single pass per render.
    private struct ActivityStats {
        var messagesWeek = 0
        var callsWeek = 0
        var callsInWeek = 0
        var callsMissedWeek = 0
        var deliveryRate: Double?
        var days: [DayActivity] = []
        var isEmpty: Bool { days.allSatisfy { $0.count == 0 } }

        init(messages: [TwilioMessage], calls: [TwilioCall]) {
            let cal = Calendar.current
            let today = cal.startOfDay(for: .now)
            guard let weekStart = cal.date(byAdding: .day, value: -6, to: today) else { return }
            var msgPerDay: [Date: Int] = [:]
            var callPerDay: [Date: Int] = [:]
            var delivered = 0, finished = 0
            for m in messages where m.date >= weekStart {
                msgPerDay[cal.startOfDay(for: m.date), default: 0] += 1
                messagesWeek += 1
                if !m.isInbound {
                    switch m.statusKind {
                    case .delivered, .read: delivered += 1; finished += 1
                    case .failed, .undelivered: finished += 1
                    default: break
                    }
                }
            }
            for c in calls where c.parentCallSid == nil && c.date >= weekStart {
                callPerDay[cal.startOfDay(for: c.date), default: 0] += 1
                callsWeek += 1
                if c.isInbound { callsInWeek += 1 }
                if c.isMissed { callsMissedWeek += 1 }
            }
            deliveryRate = finished > 0 ? Double(delivered) / Double(finished) : nil
            for offset in (0..<7).reversed() {
                guard let day = cal.date(byAdding: .day, value: -offset, to: today) else { continue }
                if FeatureFlags.messaging {
                    days.append(DayActivity(day: day, kind: "Messages", count: msgPerDay[day] ?? 0))
                }
                days.append(DayActivity(day: day, kind: "Calls", count: callPerDay[day] ?? 0))
            }
        }
    }

    private var activityCard: some View {
        // FeatureFlags.messaging: calls-only stats while texting is hidden.
        let stats = ActivityStats(messages: FeatureFlags.messaging ? store.messages : [], calls: store.calls)
        let loading = isFirstLoad && store.messages.isEmpty && store.calls.isEmpty
        return VStack(alignment: .leading, spacing: Theme.Space.sm) {
            sectionHeader("Activity") {
                Text("Last 7 days")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            VStack(alignment: .leading, spacing: Theme.Space.md) {
                let statsLayout = dynamicTypeSize.isAccessibilitySize
                    ? AnyLayout(VStackLayout(alignment: .leading, spacing: Theme.Space.sm))
                    : AnyLayout(HStackLayout(alignment: .top, spacing: Theme.Space.sm))
                statsLayout {
                    if FeatureFlags.messaging {
                        statItem("Messages", "\(stats.messagesWeek)", dot: Self.messagesColor)
                        statItem("Calls", "\(stats.callsWeek)", dot: Self.callsColor)
                        statItem("Delivered",
                                 stats.deliveryRate.map { $0.formatted(.percent.precision(.fractionLength(0))) } ?? "–",
                                 dot: nil)
                    } else {
                        statItem("Calls", "\(stats.callsWeek)", dot: Self.callsColor)
                        statItem("Incoming", "\(stats.callsInWeek)", dot: nil)
                        statItem("Missed", "\(stats.callsMissedWeek)", dot: nil)
                    }
                }
                .redacted(reason: loading ? .placeholder : [])

                if loading {
                    RoundedRectangle(cornerRadius: Theme.Radius.sm)
                        .fill(.quaternary.opacity(0.5))
                        .frame(height: chartHeight)
                        .overlay { ProgressView() }
                        .accessibilityLabel("Loading activity")
                } else if stats.isEmpty {
                    VStack(spacing: Theme.Space.xs) {
                        Text("No activity this week").font(.subheadline.weight(.semibold))
                        Text(FeatureFlags.messaging ? "Your calls and texts will show up here." : "Your calls will show up here.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, Theme.Space.md)
                } else {
                    Chart(stats.days) { item in
                        BarMark(
                            x: .value("Day", item.day, unit: .day),
                            y: .value("Count", item.count)
                        )
                        .foregroundStyle(by: .value("Type", item.kind))
                        .cornerRadius(4)
                        .opacity(selectedDay == nil || Calendar.current.isDate(item.day, inSameDayAs: selectedDay!) ? 1 : 0.35)
                        .accessibilityLabel(item.day.formatted(.dateTime.weekday(.wide)))
                        .accessibilityValue("\(item.count) \(item.kind.lowercased())")
                    }
                    .chartForegroundStyleScale(["Messages": Self.messagesColor, "Calls": Self.callsColor])
                    .chartXAxis {
                        AxisMarks(values: .stride(by: .day)) { _ in
                            AxisValueLabel(format: .dateTime.weekday(.narrow))
                        }
                    }
                    .chartYAxis {
                        AxisMarks(position: .trailing) { _ in
                            AxisGridLine().foregroundStyle(Theme.Palette.hairline)
                            AxisValueLabel()
                        }
                    }
                    .chartLegend(.hidden)
                    .chartXSelection(value: $selectedDay)
                    .chartOverlay { _ in
                        // Says what the touched day held, in plain words, above the bars.
                        if let selectedDay {
                            let day = stats.days.filter { Calendar.current.isDate($0.day, inSameDayAs: selectedDay) }
                            if let first = day.first {
                                VStack(spacing: 2) {
                                    Text(first.day.formatted(.dateTime.weekday(.wide).month().day()))
                                        .font(.caption.weight(.semibold))
                                    Text(day.map { "\($0.count) \($0.count == 1 ? String($0.kind.lowercased().dropLast()) : $0.kind.lowercased())" }
                                        .joined(separator: " · "))
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                        .monospacedDigit()
                                }
                                .padding(.horizontal, 10)
                                .padding(.vertical, 6)
                                .glassEffect(.regular, in: .rect(cornerRadius: Theme.Radius.sm))
                                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
                                .allowsHitTesting(false)
                                .transition(.opacity)
                            }
                        }
                    }
                    .sensoryFeedback(.selection, trigger: selectedDay.map { Calendar.current.startOfDay(for: $0) })
                    .frame(height: chartHeight)
                    .accessibilityLabel(FeatureFlags.messaging ? "Messages and calls over the last 7 days" : "Calls over the last 7 days")
                }
            }
            .padding(Theme.Space.md)
            .frame(maxWidth: .infinity, alignment: .leading)
            .glassEffect(.regular, in: .rect(cornerRadius: Theme.Radius.lg))
            .accessibilityElement(children: .contain)
        }
    }

    private func statItem(_ title: String, _ value: String, dot: Color?) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(value)
                .font(.title2.weight(.bold).monospacedDigit())
                .contentTransition(.numericText())
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            HStack(spacing: 5) {
                if let dot {
                    Circle().fill(dot).frame(width: 7, height: 7)
                }
                Text(title)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(title), \(value)")
    }

    // MARK: Recent

    private enum ActivityItem: Identifiable {
        case message(TwilioMessage)
        case call(TwilioCall)
        var id: String { switch self { case .message(let m): return m.sid; case .call(let c): return c.sid } }
        var date: Date { switch self { case .message(let m): return m.date; case .call(let c): return c.date } }
        var counterpart: String { switch self { case .message(let m): return m.counterpart; case .call(let c): return c.counterpart } }
    }

    /// The latest thing with each of the last five people, so one chatty thread can't fill the list.
    private var recentItems: [ActivityItem] {
        // FeatureFlags.messaging: calls only while texting is hidden.
        let m = FeatureFlags.messaging ? store.messages.prefix(40).map(ActivityItem.message) : []
        let c = store.calls.lazy.filter { $0.parentCallSid == nil }.prefix(40).map(ActivityItem.call)
        var seen = Set<String>()
        var result: [ActivityItem] = []
        for item in (m + c).sorted(by: { $0.date > $1.date }) {
            let key = ContactBook.key(item.counterpart).nilIfBlank ?? item.counterpart
            guard !item.counterpart.isEmpty, seen.insert(key).inserted else { continue }
            result.append(item)
            if result.count == 5 { break }
        }
        return result
    }

    private var recentSection: some View {
        let items = recentItems
        return VStack(alignment: .leading, spacing: Theme.Space.sm) {
            sectionHeader("Recent") { EmptyView() }
            if items.isEmpty && isFirstLoad {
                SkeletonRows(count: 3)
                    .padding(Theme.Space.md)
                    .glassEffect(.regular, in: .rect(cornerRadius: Theme.Radius.lg))
            } else if items.isEmpty {
                Text(FeatureFlags.messaging ? "Nothing here yet. Place a call or send a message to get started." : "Nothing here yet. Place a call to get started.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(Theme.Space.md)
                    .glassEffect(.regular, in: .rect(cornerRadius: Theme.Radius.lg))
            } else {
                VStack(spacing: 0) {
                    ForEach(Array(items.enumerated()), id: \.element.id) { idx, item in
                        recentRow(item)
                        if idx < items.count - 1 {
                            Rectangle()
                                .fill(Theme.Palette.hairline)
                                .frame(height: 1)
                                .padding(.leading, 66)
                        }
                    }
                }
                .padding(.vertical, Theme.Space.xxs)
                .glassEffect(.regular, in: .rect(cornerRadius: Theme.Radius.lg))
                .accessibilityElement(children: .contain)
            }
        }
    }

    @ViewBuilder
    private func recentRow(_ item: ActivityItem) -> some View {
        switch item {
        case .message(let m):
            let failed = m.statusKind.isFailure
            Button {
                store.openMessage(to: m.counterpart, from: m.ourNumber)
            } label: {
                activityRow(
                    key: m.counterpart,
                    symbol: "message.fill",
                    color: failed ? Theme.Palette.danger : Theme.Palette.brandText,
                    title: ContactBook.shared.label(for: m.counterpart),
                    subtitle: failed ? "Not delivered" : (m.body?.nilIfBlank ?? (m.mediaCount > 0 ? "Attachment" : "Message")),
                    date: m.date
                )
            }
            .buttonStyle(.plain)
            .accessibilityHint("Opens the conversation")
        case .call(let c):
            let missed = c.isMissed
            Button {
                store.openDialer(to: c.counterpart, from: c.ourNumber)
            } label: {
                activityRow(
                    key: c.counterpart,
                    symbol: c.isInbound ? "phone.arrow.down.left.fill" : "phone.arrow.up.right.fill",
                    color: missed ? Theme.Palette.danger : Theme.Palette.brandText,
                    title: ContactBook.shared.label(for: c.counterpart),
                    subtitle: "\(c.statusKind.label)\(c.durationSeconds > 0 ? " · \(c.durationSeconds.durationString)" : "")",
                    date: c.date
                )
            }
            .buttonStyle(.plain)
            .accessibilityHint("Opens the keypad with this number")
        }
    }

    /// A person row: their avatar (initials when known) with a small badge saying what happened.
    private func activityRow(key: String, symbol: String, color: Color, title: String, subtitle: String, date: Date) -> some View {
        HStack(spacing: Theme.Space.sm) {
            MsgTonalAvatar(key: key, size: 40)
                .overlay(alignment: .bottomTrailing) {
                    Image(systemName: symbol)
                        .font(.system(size: 8, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(width: 16, height: 16)
                        .background(color, in: .circle)
                        .padding(2)
                        .background(Theme.Palette.surface, in: .circle)
                        .offset(x: 7, y: 7)
                        .accessibilityHidden(true)
                }
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.body.weight(.semibold)).monospacedDigit().lineLimit(1)
                Text(subtitle).font(.subheadline).foregroundStyle(.secondary)
                    .lineLimit(dynamicTypeSize.isAccessibilitySize ? 3 : 1)
            }
            Spacer(minLength: Theme.Space.xxs)
            // Same clock-style stamps as the Messages and Recents lists ("4:12 PM", "Yesterday").
            Text(date.listStamp)
                .font(.footnote)
                .foregroundStyle(.secondary)
                .lineLimit(1)
        }
        .padding(.horizontal, Theme.Space.md)
        .padding(.vertical, Theme.Space.sm)
        .contentShape(.rect)
        .accessibilityElement(children: .combine)
    }

    // MARK: Usage

    private var usageSection: some View {
        let top = usage
            .filter { $0.priceValue > 0 && $0.category != "totalprice" }
            .sorted { $0.priceValue > $1.priceValue }
            .prefix(5)
        let total = usage.first { $0.category == "totalprice" }
        let loading = usageLoading && !usageLoaded

        return VStack(alignment: .leading, spacing: Theme.Space.sm) {
            sectionHeader("Usage") {
                Picker(selection: $usagePeriod) {
                    ForEach(TwilioClient.UsagePeriod.allCases) { Text($0.title).tag($0) }
                } label: {
                    Text("Period")
                }
                .pickerStyle(.menu)
                .tint(Theme.Palette.brandText)
                .accessibilityLabel("Usage period")
                .sensoryFeedback(.selection, trigger: usagePeriod)
            }
            VStack(alignment: .leading, spacing: Theme.Space.sm) {
                HStack(alignment: .firstTextBaseline) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(total.map { $0.priceValue.formatted(.currency(code: ($0.priceUnit ?? "usd").uppercased())) }
                             ?? (loading ? "$0.00" : 0.0.formatted(.currency(code: "USD"))))
                            .font(.title2.bold().monospacedDigit())
                            .contentTransition(.numericText())
                            .redacted(reason: loading ? .placeholder : [])
                        Text("Total spend").font(.footnote).foregroundStyle(.secondary)
                    }
                    .accessibilityElement(children: .combine)
                    Spacer()
                    if usageLoading && usageLoaded { ProgressView().accessibilityLabel("Updating usage") }
                }
                if let usageError, !usageLoading {
                    Callout(style: .warning, title: usageError, message: "Usage couldn't be loaded for this period.") {
                        Button { Task { await loadUsage() } } label: {
                            Label("Try Again", systemImage: "arrow.clockwise")
                        }
                        .buttonStyle(.glass)
                        .font(.subheadline.weight(.semibold))
                    }
                } else if loading {
                    SkeletonRows(count: 3, showsAvatar: false)
                } else if top.isEmpty {
                    Text("No billable usage for this period.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                } else {
                    Chart(Array(top)) { r in
                        BarMark(
                            x: .value("Price", r.priceValue),
                            y: .value("Category", r.description ?? r.category)
                        )
                        .foregroundStyle(Theme.Palette.brand)
                        .cornerRadius(4)
                        .annotation(position: .trailing) {
                            Text(r.priceValue.formatted(.currency(code: (r.priceUnit ?? "usd").uppercased())))
                                .font(.caption.monospacedDigit())
                                .foregroundStyle(.secondary)
                        }
                        .accessibilityLabel(r.description ?? r.category)
                        .accessibilityValue(r.priceValue.formatted(.currency(code: (r.priceUnit ?? "usd").uppercased())))
                    }
                    .chartXAxis(.hidden)
                    .chartYAxis {
                        AxisMarks { _ in AxisValueLabel().foregroundStyle(.secondary) }
                    }
                    .frame(height: CGFloat(top.count) * usageRowHeight + 10)
                    .accessibilityLabel("Spend by category")
                }
            }
            .padding(Theme.Space.md)
            .frame(maxWidth: .infinity, alignment: .leading)
            .glassEffect(.regular, in: .rect(cornerRadius: Theme.Radius.lg))
            .accessibilityElement(children: .contain)
        }
    }

    private func loadUsage() async {
        guard let client = store.client else { return }
        usageLoading = true
        defer { usageLoading = false }
        do {
            let records = try await client.fetchUsage(period: usagePeriod)
            withAnimation(Theme.Motion.adaptive(Theme.Motion.smooth, reduceMotion)) { usage = records }
            usageError = nil
        } catch is CancellationError {
            return
        } catch {
            if (error as? URLError)?.code == .cancelled { return }
            usage = []
            usageError = FriendlyError(error).title
        }
        usageLoaded = true
    }
}
