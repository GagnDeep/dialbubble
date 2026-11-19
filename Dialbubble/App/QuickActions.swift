import UIKit
import UserNotifications

/// Home Screen quick actions (touch and hold the Dialbubble icon): New Call, New Message, Search.
enum QuickAction: String {
    case call = "com.dialbubble.call"
    case message = "com.dialbubble.message"
    case search = "com.dialbubble.search"
    case person = "com.dialbubble.person"

    /// iOS shows at most four quick actions.
    private static let maxItems = 4

    /// The fixed actions plus, once there's history, the last two people you talked to ("Message Dana Kim").
    @MainActor
    static func install(store: AppStore? = nil) {
        var items: [UIApplicationShortcutItem] = []
        if let store, store.hasAccount {
            for person in recentPeople(store: store).prefix(2) {
                let messaging = person.lastWasMessage && FeatureFlags.messaging
                items.append(UIApplicationShortcutItem(
                    type: QuickAction.person.rawValue,
                    localizedTitle: ContactBook.shared.label(for: person.number),
                    localizedSubtitle: messaging ? "Message" : "Call",
                    icon: UIApplicationShortcutIcon(systemImageName: messaging ? "message" : "phone"),
                    userInfo: ["number": person.number as NSString, "from": person.ourNumber as NSString,
                               "message": NSNumber(value: messaging)]
                ))
            }
        }
        items += [
            UIApplicationShortcutItem(type: QuickAction.call.rawValue, localizedTitle: "New Call",
                                      localizedSubtitle: nil, icon: UIApplicationShortcutIcon(systemImageName: "phone.fill")),
        ]
        if FeatureFlags.messaging {
            items.append(UIApplicationShortcutItem(type: QuickAction.message.rawValue, localizedTitle: "New Message",
                                                   localizedSubtitle: nil, icon: UIApplicationShortcutIcon(systemImageName: "square.and.pencil")))
        }
        items.append(UIApplicationShortcutItem(type: QuickAction.search.rawValue, localizedTitle: "Search",
                                               localizedSubtitle: nil, icon: UIApplicationShortcutIcon(systemImageName: "magnifyingglass")))
        UIApplication.shared.shortcutItems = Array(items.prefix(maxItems))
    }

    struct RecentPerson: Equatable {
        let number: String
        let ourNumber: String
        let lastWasMessage: Bool
    }

    /// Distinct people from your newest calls and texts, newest first.
    @MainActor
    static func recentPeople(store: AppStore) -> [RecentPerson] {
        let own = store.ownNumberSet
        let me = store.activeProfile?.personalPhone.nilIfBlank.map(store.normalize)
        var events: [(date: Date, person: RecentPerson)] = store.calls.prefix(30).compactMap { c in
            guard c.parentCallSid == nil, !c.counterpart.isEmpty, c.counterpart != me else { return nil }
            return (c.date, RecentPerson(number: c.counterpart, ourNumber: c.ourNumber, lastWasMessage: false))
        }
        events += store.messages.prefix(30).compactMap { m in
            guard !m.counterpart.isEmpty else { return nil }
            return (m.date, RecentPerson(number: m.counterpart, ourNumber: m.ourNumber, lastWasMessage: true))
        }
        var seen = Set<String>()
        return events.sorted { $0.date > $1.date }.map(\.person).filter { p in
            guard !own.contains(p.number), p.number.filter(\.isNumber).count >= 7 else { return false }
            return seen.insert(ContactBook.key(p.number)).inserted
        }
    }

    @MainActor
    static func perform(_ item: UIApplicationShortcutItem) -> Bool {
        let store = AppStore.shared
        guard store.hasAccount, let action = QuickAction(rawValue: item.type) else { return false }
        switch action {
        case .call: store.openDialer()
        case .message: store.openMessage(to: "")
        case .search: store.selectedTab = .search
        case .person:
            guard let number = item.userInfo?["number"] as? String else { return false }
            let from = (item.userInfo?["from"] as? String)?.nilIfBlank
            if (item.userInfo?["message"] as? NSNumber)?.boolValue == true {
                store.openMessage(to: number, from: from)
            } else {
                store.openDialer(to: number, from: from)
            }
        }
        return true
    }
}

final class DialbubbleAppDelegate: NSObject, UIApplicationDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        MainActor.assumeIsolated { QuickAction.install() }
        Alerts.register()
        UNUserNotificationCenter.current().delegate = AlertsDelegate.shared
        return true
    }

    func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let config = UISceneConfiguration(name: nil, sessionRole: connectingSceneSession.role)
        config.delegateClass = DialbubbleSceneDelegate.self
        return config
    }
}

final class DialbubbleSceneDelegate: NSObject, UIWindowSceneDelegate {
    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let item = connectionOptions.shortcutItem else { return }
        // Cold launch: let RootView finish its first pass, then route.
        Task { @MainActor in
            try? await Task.sleep(for: .milliseconds(400))
            _ = QuickAction.perform(item)
        }
    }

    func windowScene(_ windowScene: UIWindowScene, performActionFor shortcutItem: UIApplicationShortcutItem) async -> Bool {
        await MainActor.run { QuickAction.perform(shortcutItem) }
    }
}
