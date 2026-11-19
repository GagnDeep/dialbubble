import SwiftUI
import TipKit

@main
struct DialbubbleApp: App {
    @UIApplicationDelegateAdaptor(DialbubbleAppDelegate.self) private var appDelegate
    @State private var store: AppStore
    @AppStorage("relay.appearance") private var appearance: AppearanceMode = .system

    init() {
        let args = ProcessInfo.processInfo.arguments
        if UserDefaults.standard.bool(forKey: "relay.resetTipsOnNextLaunch") {
            try? Tips.resetDatastore()
            UserDefaults.standard.removeObject(forKey: "relay.resetTipsOnNextLaunch")
        }
        if args.contains("-uiTestReset") {
            AppStore.resetAllData()
            try? Tips.resetDatastore()
        }
        if args.contains("-uiTesting") {
            Tips.hideAllTipsForTesting()
        } else {
            try? Tips.configure([.displayFrequency(.immediate)])
        }
        _store = State(initialValue: AppStore.shared)
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(store)
                .toastHost()
                .environment(ToastCenter.shared)
                .tint(Theme.Palette.brand)
                .fontDesign(.rounded)
                .preferredColorScheme(appearance.colorScheme)
        }
    }
}

enum AppearanceMode: String, CaseIterable, Identifiable {
    case system, light, dark
    var id: String { rawValue }
    var title: String { rawValue.capitalized }
    var symbol: String {
        switch self {
        case .system: return "circle.lefthalf.filled"
        case .light: return "sun.max.fill"
        case .dark: return "moon.fill"
        }
    }
    var colorScheme: ColorScheme? {
        switch self {
        case .system: return nil
        case .light: return .light
        case .dark: return .dark
        }
    }
}

/// Launch-argument hooks used by UI tests and screenshots.
enum LaunchOptions {
    static var args: [String] { ProcessInfo.processInfo.arguments }
    static var startInDemo: Bool { args.contains("-demo") }
    /// Makes Demo Mode report a Twilio trial account, to exercise the trial limits. Debug builds only.
    static var trialDemo: Bool {
        #if DEBUG
        args.contains("-trialDemo")
        #else
        false
        #endif
    }
    /// App Store and website screenshots: Demo Mode's data without its "Demo" labels. Debug builds only.
    static var marketing: Bool {
        #if DEBUG
        args.contains("-marketing")
        #else
        false
        #endif
    }
    static var initialTab: AppTab? {
        guard let i = args.firstIndex(of: "-tab"), i + 1 < args.count else { return nil }
        let tab = AppTab(rawValue: args[i + 1])
        // FeatureFlags.messaging: ignore requests to open the hidden Messages tab.
        if tab == .messages && !FeatureFlags.messaging { return nil }
        return tab
    }
}
