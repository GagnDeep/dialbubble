import BackgroundTasks
import UIKit
import UserNotifications

/// Opt-in notifications without a server: the app icon shows unread texts + missed calls, and Background
/// App Refresh lets Dialbubble check Twilio every so often while closed and post a notification for news.
/// iOS decides when background checks run (typically within an hour), so alerts are best effort, not instant.
@MainActor
enum Alerts {
    static let badgeKey = "relay.alerts.badge"
    static let backgroundKey = "relay.alerts.background"
    static let taskID = "com.dialbubble.refresh"
    private static let checkedKey = "relay.alerts.checkedAt"

    static var badgeEnabled: Bool { UserDefaults.standard.bool(forKey: badgeKey) }
    static var backgroundEnabled: Bool { UserDefaults.standard.bool(forKey: backgroundKey) }

    /// Asks iOS once; returns whether the needed permission is on.
    static func requestPermission(alerts: Bool) async -> Bool {
        let options: UNAuthorizationOptions = alerts ? [.alert, .sound, .badge] : [.badge]
        return (try? await UNUserNotificationCenter.current().requestAuthorization(options: options)) ?? false
    }

    static func updateBadge(_ store: AppStore) {
        let count = badgeEnabled ? store.unreadCount + store.unseenMissedCalls : 0
        UNUserNotificationCenter.current().setBadgeCount(count)
    }

    // MARK: Background refresh

    /// Must run before launch finishes (called from the app delegate).
    nonisolated static func register() {
        BGTaskScheduler.shared.register(forTaskWithIdentifier: taskID, using: nil) { task in
            guard let task = task as? BGAppRefreshTask else { return }
            let work = Task { @MainActor in
                schedule()
                await checkForNews()
                task.setTaskCompleted(success: true)
            }
            task.expirationHandler = { work.cancel() }
        }
    }

    /// Asks iOS for the next background check (or cancels it when the setting is off).
    static func schedule() {
        guard backgroundEnabled else {
            BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: taskID)
            return
        }
        let request = BGAppRefreshTaskRequest(identifier: taskID)
        request.earliestBeginDate = Date.now.addingTimeInterval(15 * 60)
        try? BGTaskScheduler.shared.submit(request)
    }

    /// Fetches the latest texts and calls, then posts one notification per new text or missed call.
    static func checkForNews() async {
        let store = AppStore.shared
        guard store.hasAccount, !store.isDemo else { return }
        let knownMessages = Set(store.messages.map(\.sid))
        let knownCalls = Set(store.calls.map(\.sid))
        let since = UserDefaults.standard.object(forKey: checkedKey) as? Date ?? Date.now.addingTimeInterval(-3600)
        if FeatureFlags.messaging { await store.refreshMessages() }
        await store.refreshCalls()
        guard !Task.isCancelled else { return }

        let texts = store.messages.filter { $0.isInbound && !knownMessages.contains($0.sid) && $0.date > since && !store.isRead($0) }
        let missed = store.calls.filter { $0.parentCallSid == nil && $0.isMissed && !knownCalls.contains($0.sid) && $0.date > since }
        if backgroundEnabled {
            for m in texts.prefix(4) {
                post(id: m.sid, title: ContactBook.shared.label(for: m.counterpart),
                     body: m.body?.nilIfBlank ?? (m.mediaCount > 0 ? "Attachment" : "New message"),
                     info: ["kind": "message", "number": m.counterpart, "from": m.ourNumber])
            }
            for c in missed.prefix(3) {
                post(id: c.sid, title: "Missed call", body: ContactBook.shared.label(for: c.counterpart),
                     info: ["kind": "call", "number": c.counterpart, "from": c.ourNumber])
            }
        }
        UserDefaults.standard.set(Date.now, forKey: checkedKey)
        updateBadge(store)
        store.saveHistoryCache()
    }

    private static func post(id: String, title: String, body: String, info: [String: String]) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = Sounds.isEnabled ? .default : nil
        content.userInfo = info
        content.threadIdentifier = info["number"] ?? "dialbubble"
        UNUserNotificationCenter.current().add(UNNotificationRequest(identifier: id, content: content, trigger: nil))
    }

    /// Opening a notification goes straight to the conversation, or to Recents for a missed call.
    static func open(_ info: [AnyHashable: Any]) {
        let store = AppStore.shared
        guard store.hasAccount, let number = info["number"] as? String else { return }
        if info["kind"] as? String == "message" {
            store.openMessage(to: number, from: info["from"] as? String)
        } else {
            store.openRecents()
        }
    }
}

/// Routes notification taps; in the foreground the in-app banner already covers new texts.
final class AlertsDelegate: NSObject, UNUserNotificationCenterDelegate {
    static let shared = AlertsDelegate()

    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse) async {
        let info = response.notification.request.content.userInfo
        await MainActor.run { Alerts.open(info) }
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification) async -> UNNotificationPresentationOptions {
        []
    }
}
