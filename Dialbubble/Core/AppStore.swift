import SwiftUI

/// Single source of truth for the app. Talks to Twilio directly — there is no backend.
@MainActor
@Observable
final class AppStore {
    static let shared = AppStore()

    // MARK: Persisted state
    private(set) var profiles: [AccountProfile] = []
    private(set) var activeProfileID: UUID?
    var templates: [MessageTemplate] = [] { didSet { save(templates, key: Keys.templates) } }
    private var readMarkers: [String: Date] = [:] { didSet { save(readMarkers, key: Keys.readMarkers) } }

    // MARK: Remote state (for the active profile)
    var account: TwilioAccount?
    var balance: TwilioBalance?
    var messages: [TwilioMessage] = [] {
        didSet {
            conversationCache = nil
            noticeIncoming(old: oldValue)
        }
    }
    var calls: [TwilioCall] = []
    var messagingServices: [MessagingService] = []
    var isRefreshing = false
    var lastRefresh: Date?
    var lastError: FriendlyError?
    var setupChecklistDismissed = UserDefaults.standard.bool(forKey: "relay.setupDismissed") {
        didSet { UserDefaults.standard.set(setupChecklistDismissed, forKey: "relay.setupDismissed") }
    }

    // MARK: Navigation
    var selectedTab: AppTab = .home
    var dialDraft: DialDraft?
    var messageDraft: MessageDraft?
    /// One-shot requests from elsewhere (Home, quick actions) to show Recents, or a Messages filter.
    var recentsRequested = false
    var messagesFilterRequest: MessageListFilter?
    var liveCall: LiveCallSession?
    /// A call whose screen was put away with the chevron; a bar at the top of the app brings it back.
    var minimizedCall: LiveCallSession?
    /// The newest text that arrived while the app was open (drives the in-app banner).
    var incomingBanner: TwilioMessage?
    /// The thread on screen right now, so its own replies don't also pop a banner.
    var visibleConversationID: String?
    /// True while the onboarding flow is still on screen (e.g. the celebration step after the profile is saved).
    /// Keeps RootView from swapping to the tabs before the user taps "Start using Dialbubble".
    var isOnboarding = false

    private var pollTask: Task<Void, Never>?

    private enum Keys {
        static let profiles = "relay.profiles"
        static let activeProfile = "relay.activeProfile"
        static let templates = "relay.templates"
        static let readMarkers = "relay.readMarkers"
        static let drafts = "relay.drafts"
        static let pinned = "relay.pinned"
    }

    init() {
        profiles = load([AccountProfile].self, key: Keys.profiles) ?? []
        if let raw = UserDefaults.standard.string(forKey: Keys.activeProfile), let id = UUID(uuidString: raw) {
            activeProfileID = id
        }
        if activeProfile == nil { activeProfileID = profiles.first?.id }
        templates = load([MessageTemplate].self, key: Keys.templates) ?? [
            MessageTemplate(title: "Running late", body: "Hi! Running about 10 minutes late — see you soon."),
            MessageTemplate(title: "Call me back", body: "Please call me back when you get a chance."),
            MessageTemplate(title: "Thanks", body: "Thank you! Appreciate it."),
        ]
        readMarkers = load([String: Date].self, key: Keys.readMarkers) ?? [:]
        loadHistoryCache()
        drafts = load([String: String].self, key: Keys.drafts) ?? [:]
        pinnedConversations = load([String].self, key: Keys.pinned) ?? []
        migrateThemeIfNeeded()
    }

    /// One-time move from the old pink/red defaults to the Fresh Mint palette.
    func migrateThemeIfNeeded(defaults: UserDefaults = .standard) {
        if Self.migrateTheme(&profiles, defaults: defaults) { persistProfiles() }
    }

    /// Returns true when any profile changed. Runs only once per `defaults`.
    nonisolated static func migrateTheme(_ profiles: inout [AccountProfile], defaults: UserDefaults) -> Bool {
        let key = "relay.themeV2Migrated"
        guard !defaults.bool(forKey: key) else { return false }
        defaults.set(true, forKey: key)
        var changed = false
        for i in profiles.indices where profiles[i].tint == .red || profiles[i].tint == .pink {
            profiles[i].tint = .mint
            changed = true
        }
        return changed
    }

    // MARK: - Profiles

    var activeProfile: AccountProfile? { profiles.first { $0.id == activeProfileID } }
    var hasAccount: Bool { activeProfile != nil }
    /// App-wide accent. Always the brand color so buttons and highlights stay consistent.
    var tint: Color { Theme.Palette.brand }
    /// The active account's identity color, used only for small markers (avatar, switcher dot).
    var profileColor: Color { activeProfile?.tint.color ?? Theme.Palette.brand }

    var client: TwilioClient? {
        guard let p = activeProfile else { return nil }
        let stored = p.accountSid == DemoBackend.accountSid ? DemoBackend.secret : Keychain.get(p.id.uuidString)
        guard let secret = stored else { return nil }
        return TwilioClient(credentials: TwilioCredentials(accountSid: p.accountSid, apiKeySid: p.apiKeySid, secret: secret))
    }

    func credentials(for profile: AccountProfile) -> TwilioCredentials? {
        guard let secret = Keychain.get(profile.id.uuidString) else { return nil }
        return TwilioCredentials(accountSid: profile.accountSid, apiKeySid: profile.apiKeySid, secret: secret)
    }

    /// Validates credentials against Twilio and discovers numbers usable for calling/messaging.
    func validate(_ credentials: TwilioCredentials) async throws -> (TwilioAccount, [ConfiguredNumber]) {
        let client = TwilioClient(credentials: credentials)
        let account = try await client.fetchAccount()
        let numbers = try await discoverNumbers(client: client, existing: [])
        return (account, numbers)
    }

    @discardableResult
    func addProfile(name: String?, credentials: TwilioCredentials, personalPhone: String = "") async throws -> AccountProfile {
        let (account, numbers) = try await validate(credentials)
        var profile = AccountProfile(
            name: name?.nilIfBlank ?? account.friendlyName ?? "Twilio",
            accountSid: credentials.accountSid.trimmingCharacters(in: .whitespaces),
            apiKeySid: credentials.apiKeySid?.nilIfBlank
        )
        profile.personalPhone = personalPhone
        profile.numbers = numbers
        profile.isTrial = account.isTrial
        profile.tint = AppTint.rotation[profiles.count % AppTint.rotation.count]
        profile.defaultCallerNumber = numbers.first(where: \.voice)?.phoneNumber
        profile.defaultSMSNumber = numbers.first(where: \.sms)?.phoneNumber
        let saved = Keychain.set(credentials.secret.trimmingCharacters(in: .whitespacesAndNewlines), for: profile.id.uuidString)
        guard saved || profile.accountSid == DemoBackend.accountSid else {
            throw ClientError.invalidInput("Couldn't save your credentials securely in the Keychain. Please try again.")
        }
        profiles.append(profile)
        persistProfiles()
        await activate(profile)
        return profile
    }

    func updateProfile(_ profile: AccountProfile) {
        guard let i = profiles.firstIndex(where: { $0.id == profile.id }) else { return }
        profiles[i] = profile
        persistProfiles()
    }

    /// Replaces the secret (auth token / API key secret) for a profile.
    func updateSecret(_ secret: String, for profile: AccountProfile) {
        Keychain.set(secret, for: profile.id.uuidString)
    }

    func deleteProfile(_ profile: AccountProfile) {
        Keychain.delete(profile.id.uuidString)
        HistoryCache.delete(profile: profile.id)
        profiles.removeAll { $0.id == profile.id }
        persistProfiles()
        if activeProfileID == profile.id {
            clearRemoteState()
            activeProfileID = profiles.first?.id
            UserDefaults.standard.set(activeProfileID?.uuidString, forKey: Keys.activeProfile)
            Task { await refreshAll() }
        }
    }

    func activate(_ profile: AccountProfile) async {
        guard profile.id != activeProfileID || messages.isEmpty else { return }
        clearRemoteState()
        activeProfileID = profile.id
        UserDefaults.standard.set(profile.id.uuidString, forKey: Keys.activeProfile)
        loadHistoryCache()
        await refreshAll()
    }

    func moveProfiles(from: IndexSet, to: Int) {
        profiles.move(fromOffsets: from, toOffset: to)
        persistProfiles()
    }

    // MARK: - Numbers

    func updateNumber(_ number: ConfiguredNumber) {
        guard var p = activeProfile, let i = p.numbers.firstIndex(where: { $0.id == number.id }) else { return }
        p.numbers[i] = number
        updateProfile(p)
    }

    func addManualNumber(_ number: ConfiguredNumber) {
        guard var p = activeProfile, !p.numbers.contains(where: { $0.id == number.id }) else { return }
        p.numbers.append(number)
        updateProfile(p)
    }

    func removeNumber(_ number: ConfiguredNumber) {
        guard var p = activeProfile else { return }
        p.numbers.removeAll { $0.id == number.id }
        updateProfile(p)
    }

    /// Re-imports numbers from Twilio, keeping user customisations (nickname, tint, enabled).
    func syncNumbers() async {
        do { try await syncNumbersThrowing() } catch { report(error) }
    }

    /// Re-imports numbers from Twilio, surfacing failures to the caller instead of the global banner.
    func syncNumbersThrowing() async throws {
        guard let client, var p = activeProfile else { return }
        p.numbers = try await discoverNumbers(client: client, existing: p.numbers)
        if p.defaultCallerNumber == nil { p.defaultCallerNumber = p.callerNumbers.first?.phoneNumber }
        if p.defaultSMSNumber == nil { p.defaultSMSNumber = p.smsNumbers.first?.phoneNumber }
        updateProfile(p)
    }

    private func discoverNumbers(client: TwilioClient, existing: [ConfiguredNumber]) async throws -> [ConfiguredNumber] {
        async let owned = client.fetchIncomingNumbers()
        async let verified = (try? await client.fetchVerifiedCallerIds()) ?? []
        let palette: [AppTint] = [.blue, .teal, .indigo, .orange, .purple, .cyan, .green, .mint]
        var result: [ConfiguredNumber] = []
        for (i, n) in try await owned.enumerated() {
            let old = existing.first { $0.phoneNumber == n.phoneNumber }
            result.append(ConfiguredNumber(
                phoneNumber: n.phoneNumber,
                friendlyName: n.friendlyName ?? n.phoneNumber,
                nickname: old?.nickname,
                tint: old?.tint ?? palette[i % palette.count],
                voice: n.capabilities?.voice ?? true,
                sms: n.capabilities?.sms ?? true,
                mms: n.capabilities?.mms ?? false,
                source: .owned,
                isEnabled: old?.isEnabled ?? true
            ))
        }
        for v in await verified where !result.contains(where: { $0.phoneNumber == v.phoneNumber }) {
            let old = existing.first { $0.phoneNumber == v.phoneNumber }
            result.append(ConfiguredNumber(
                phoneNumber: v.phoneNumber,
                friendlyName: v.friendlyName ?? v.phoneNumber,
                nickname: old?.nickname,
                tint: old?.tint ?? .indigo,
                voice: true, sms: false, mms: false,
                source: .verified,
                isEnabled: old?.isEnabled ?? true
            ))
        }
        result += existing.filter { $0.source == .manual && !result.contains($0) }
        return result
    }

    var enabledNumbers: [ConfiguredNumber] { activeProfile?.enabledNumbers ?? [] }
    var callerNumbers: [ConfiguredNumber] { activeProfile?.callerNumbers ?? [] }
    var smsNumbers: [ConfiguredNumber] { activeProfile?.smsNumbers ?? [] }
    var ownNumberSet: Set<String> { Set(activeProfile?.numbers.map(\.phoneNumber) ?? []) }

    func configuredNumber(for phone: String) -> ConfiguredNumber? {
        activeProfile?.numbers.first { $0.phoneNumber == phone }
    }

    /// 🇬🇧 for a number abroad (relative to this account's country), else nil.
    func flag(for number: String) -> String? {
        PhoneFormat.foreignFlag(number, homeCountryCode: activeProfile?.defaultCountryCode ?? "1")
    }

    func normalize(_ raw: String) -> String {
        PhoneFormat.e164(raw, defaultCountryCode: activeProfile?.defaultCountryCode ?? "1")
    }

    // MARK: - Refresh

    func refreshAll() async {
        guard let client else { return }
        isRefreshing = true
        defer { isRefreshing = false }
        async let acct = try? client.fetchAccount()
        async let bal = try? client.fetchBalance()
        // FeatureFlags.messaging: skip the SMS endpoints entirely while texting is hidden (saves API calls).
        async let services = try? (FeatureFlags.messaging ? client.fetchMessagingServices() : [])
        async let msgs: Void = FeatureFlags.messaging ? refreshMessages() : ()
        async let cls: Void = refreshCalls()
        account = await acct
        balance = await bal
        messagingServices = await services ?? []
        _ = await (msgs, cls)
        if let account, var p = activeProfile, p.isTrial != account.isTrial {
            p.isTrial = account.isTrial
            updateProfile(p)
        }
        lastRefresh = .now
        saveHistoryCache()
    }

    // MARK: On-device history

    /// Shows the last saved calls and texts right away, before Twilio answers. Demo data is never saved.
    private func loadHistoryCache() {
        guard let id = activeProfileID, !isDemo, messages.isEmpty, calls.isEmpty,
              let snapshot = HistoryCache.load(profile: id) else { return }
        suppressIncoming = true
        messages = snapshot.messages
        suppressIncoming = false
        calls = snapshot.calls
    }

    func saveHistoryCache() {
        guard let id = activeProfileID, !isDemo, !(messages.isEmpty && calls.isEmpty) else { return }
        HistoryCache.save(messages: messages, calls: calls, profile: id)
    }

    // MARK: Incoming texts

    @ObservationIgnored private var suppressIncoming = false

    /// Spots texts that just arrived (not the first load) and raises the in-app banner for the newest one.
    private func noticeIncoming(old: [TwilioMessage]) {
        guard !suppressIncoming, !old.isEmpty, UIApplication.shared.applicationState == .active else { return }
        let known = Set(old.map(\.sid))
        let fresh = messages.filter { $0.isInbound && !known.contains($0.sid) && $0.date > .now.addingTimeInterval(-300) }
        guard let newest = fresh.max(by: { $0.date < $1.date }) else { return }
        if visibleConversationID == "\(newest.ourNumber)|\(newest.counterpart)" {
            Sounds.play(.received)
            return
        }
        incomingBanner = newest
        Sounds.play(.received)
    }

    func refreshMessages() async {
        guard let client else { return }
        do {
            let page = try await client.fetchMessages(pageSize: 300)
            let fresh = page.messages
            if fresh.map(\.sid) != messages.map(\.sid) || fresh.map(\.status) != messages.map(\.status) {
                withAnimation(.smooth) { messages = fresh }
            }
        } catch {
            report(error)
        }
    }

    func refreshCalls() async {
        guard let client else { return }
        do {
            let page = try await client.fetchCalls(pageSize: 150)
            withAnimation(.smooth) { calls = page.calls }
        } catch {
            report(error)
        }
    }

    /// Polls for new messages / call updates while the app is in the foreground (no push without a server).
    func startPolling(interval: Duration = .seconds(20)) {
        pollTask?.cancel()
        pollTask = Task { [weak self] in
            while !Task.isCancelled {
                try? await Task.sleep(for: interval)
                guard !Task.isCancelled, let self else { return }
                if FeatureFlags.messaging { await self.refreshMessages() }
                await self.refreshCalls()
            }
        }
    }

    func stopPolling() {
        pollTask?.cancel()
        pollTask = nil
    }

    // MARK: - Messaging

    @discardableResult
    func sendMessage(_ message: OutgoingMessage) async throws -> TwilioMessage {
        guard let client else { throw ClientError.missingCredentials }
        var m = message
        m.to = normalize(m.to)
        let sent = try await client.sendMessage(m)
        withAnimation(.snappy) { messages.insert(sent, at: 0) }
        Sounds.play(.sent)
        return sent
    }

    /// Deletes every message in a thread from Twilio. Messages still sending can't be deleted and are kept.
    /// Returns how many couldn't be removed.
    @discardableResult
    func deleteConversation(_ c: Conversation) async throws -> Int {
        guard let client else { throw ClientError.missingCredentials }
        var kept = 0
        var firstError: Error?
        for m in c.messages {
            do {
                try await client.deleteMessage(sid: m.sid)
                withAnimation { messages.removeAll { $0.sid == m.sid } }
            } catch {
                kept += 1
                if firstError == nil { firstError = error }
            }
        }
        if kept == c.messages.count, let firstError { throw firstError }
        drafts[c.id] = nil
        pinnedConversations.removeAll { $0 == c.id }
        saveHistoryCache()
        return kept
    }

    func deleteMessage(_ message: TwilioMessage) async throws {
        guard let client else { throw ClientError.missingCredentials }
        try await client.deleteMessage(sid: message.sid)
        withAnimation { messages.removeAll { $0.sid == message.sid } }
    }

    func cancelScheduled(_ message: TwilioMessage) async throws {
        guard let client else { throw ClientError.missingCredentials }
        let updated = try await client.cancelScheduledMessage(sid: message.sid)
        if let i = messages.firstIndex(where: { $0.sid == message.sid }) { messages[i] = updated }
    }

    /// Threads built from `messages`, rebuilt only when `messages` changes (many views and the tab badge read this).
    @ObservationIgnored private var conversationCache: (list: [Conversation], byID: [String: Conversation])?

    /// Messages grouped into threads, newest thread first.
    var conversations: [Conversation] { groupedConversations().list }

    private func groupedConversations() -> (list: [Conversation], byID: [String: Conversation]) {
        let all = messages   // always read, so observers keep tracking `messages` even on a cache hit
        if let conversationCache { return conversationCache }
        let built = Self.group(all)
        conversationCache = (built, Dictionary(built.map { ($0.id, $0) }, uniquingKeysWith: { a, _ in a }))
        return conversationCache!
    }

    nonisolated static func group(_ messages: [TwilioMessage]) -> [Conversation] {
        var groups: [String: Conversation] = [:]
        for m in messages where !m.counterpart.isEmpty {
            let key = "\(m.ourNumber)|\(m.counterpart)"
            groups[key, default: Conversation(ourNumber: m.ourNumber, counterpart: m.counterpart, messages: [])].messages.append(m)
        }
        return groups.values
            .map { var c = $0; c.messages.sort { $0.date < $1.date }; return c }
            .sorted { $0.lastDate > $1.lastDate }
    }

    func conversation(our: String, counterpart: String) -> Conversation {
        groupedConversations().byID["\(our)|\(counterpart)"]
            ?? Conversation(ourNumber: our, counterpart: counterpart, messages: [])
    }

    // MARK: Drafts

    /// Unsent text per conversation ("our|counterpart"), kept when you leave a thread, like Messages.
    private(set) var drafts: [String: String] = [:] { didSet { save(drafts, key: Keys.drafts) } }

    func draft(for conversationID: String) -> String? { drafts[conversationID]?.nilIfBlank }

    func setDraft(_ text: String, for conversationID: String) {
        let value = text.nilIfBlank == nil ? nil : text
        guard drafts[conversationID] != value else { return }
        drafts[conversationID] = value
    }

    // MARK: Pins

    /// Pinned conversation IDs, in the order they were pinned.
    private(set) var pinnedConversations: [String] = [] { didSet { save(pinnedConversations, key: Keys.pinned) } }

    func isPinned(_ c: Conversation) -> Bool { pinnedConversations.contains(c.id) }

    func togglePin(_ c: Conversation) {
        if let i = pinnedConversations.firstIndex(of: c.id) {
            pinnedConversations.remove(at: i)
        } else {
            pinnedConversations.append(c.id)
        }
    }

    /// Pinned threads first (in pin order), then everything else newest first.
    func sortedForList(_ list: [Conversation]) -> [Conversation] {
        let order = Dictionary(pinnedConversations.enumerated().map { ($1, $0) }, uniquingKeysWith: { a, _ in a })
        let pinned = list.filter { order[$0.id] != nil }.sorted { order[$0.id]! < order[$1.id]! }
        return pinned + list.filter { order[$0.id] == nil }
    }

    func isUnread(_ c: Conversation) -> Bool {
        guard let last = c.messages.last(where: \.isInbound) else { return false }
        return last.date > (readMarkers[c.id] ?? .distantPast)
    }

    /// True when this inbound text is older than the thread's read marker.
    func isRead(_ m: TwilioMessage) -> Bool {
        m.date <= (readMarkers["\(m.ourNumber)|\(m.counterpart)"] ?? .distantPast)
    }

    func markRead(_ c: Conversation) {
        guard isUnread(c) else { return }
        readMarkers[c.id] = .now
    }

    /// Puts the conversation back in Unread (only possible when they've written to you).
    func markUnread(_ c: Conversation) {
        guard let last = c.messages.last(where: \.isInbound) else { return }
        readMarkers[c.id] = last.date.addingTimeInterval(-1)
    }

    func canMarkUnread(_ c: Conversation) -> Bool { !isUnread(c) && c.messages.contains(where: \.isInbound) }

    func markAllRead() {
        for c in conversations { readMarkers[c.id] = .now }
    }

    var unreadCount: Int { conversations.filter(isUnread).count }

    // MARK: Missed calls badge

    /// When the user last looked at Recents, per account.
    private var callsSeenAt: [String: Date] = (UserDefaults.standard.dictionary(forKey: "relay.callsSeenAt") as? [String: Date]) ?? [:] {
        didSet { UserDefaults.standard.set(callsSeenAt, forKey: "relay.callsSeenAt") }
    }

    /// Incoming calls nobody answered since Recents was last opened (only the last day counts before the first visit).
    var unseenMissedCalls: Int {
        let key = activeProfileID?.uuidString ?? ""
        let since = callsSeenAt[key] ?? Date.now.addingTimeInterval(-86400)
        return calls.lazy.filter {
            $0.parentCallSid == nil && $0.isMissed && $0.date > since
        }.count
    }

    func markCallsSeen() {
        guard let key = activeProfileID?.uuidString, unseenMissedCalls > 0 || callsSeenAt[key] == nil else { return }
        callsSeenAt[key] = .now
    }

    // MARK: - Calling

    /// User setting (Settings → Calls). On by default: the other person is dialed only after you press a key.
    static let confirmBeforeConnectKey = "relay.calls.confirmToConnect"
    nonisolated static var confirmBeforeConnect: Bool {
        UserDefaults.standard.object(forKey: confirmBeforeConnectKey) as? Bool ?? true
    }

    /// Twilio replaces `<Dial><Number>` with a spoken notice on trial accounts, so Talk can't work there.
    static let trialTalkMessage = "Talk calls need a paid Twilio account. Voice Message works on trial accounts."

    @discardableResult
    func placeCall(_ call: OutgoingCall) async throws -> TwilioCall {
        guard let client else { throw ClientError.missingCredentials }
        if call.mode == .bridge, activeProfile?.isTrial == true {
            throw ClientError.invalidInput(Self.trialTalkMessage)
        }
        var c = call
        c.destination = normalize(c.destination)
        if c.personalPhone.isEmpty { c.personalPhone = activeProfile?.personalPhone ?? "" }
        if !c.personalPhone.isEmpty { c.personalPhone = normalize(c.personalPhone) }
        c.confirmBeforeConnect = Self.confirmBeforeConnect
        let placed = try await client.placeCall(c)
        withAnimation(.snappy) {
            minimizedCall = nil
            calls.insert(placed, at: 0)
            liveCall = LiveCallSession(call: placed, destination: c.destination, from: c.from, mode: c.mode)
        }
        return placed
    }

    func minimizeCall() {
        minimizedCall = liveCall
        liveCall = nil
    }

    func resumeCall() {
        guard let session = minimizedCall else { return }
        minimizedCall = nil
        liveCall = session
    }

    /// Removes a call from your Twilio logs (and this app). Twilio keeps no copy afterwards.
    func deleteCalls(_ sids: [String]) async throws {
        guard let client else { throw ClientError.missingCredentials }
        for sid in sids {
            try await client.deleteCall(sid: sid)
            withAnimation { calls.removeAll { $0.sid == sid || $0.parentCallSid == sid } }
        }
        saveHistoryCache()
    }

    func updateCallInList(_ call: TwilioCall) {
        if let i = calls.firstIndex(where: { $0.sid == call.sid }) { calls[i] = call } else { calls.insert(call, at: 0) }
        if liveCall?.call.sid == call.sid { liveCall?.call = call }
    }

    // MARK: - Routing helpers

    func openDialer(to: String = "", from: String? = nil) {
        dialDraft = DialDraft(to: to, from: from)
        selectedTab = .calls
    }

    func openRecents() {
        recentsRequested = true
        selectedTab = .calls
    }

    func openMessages(filter: MessageListFilter) {
        guard FeatureFlags.messaging else { return }
        messagesFilterRequest = filter
        selectedTab = .messages
    }

    func openMessage(to: String, from: String? = nil, body: String = "", focus: String? = nil) {
        // FeatureFlags.messaging: texting is hidden, so never route to the Messages tab.
        guard FeatureFlags.messaging else { return }
        messageDraft = MessageDraft(to: to, from: from, body: body, focusSid: focus)
        selectedTab = .messages
    }

    // MARK: - Templates

    func saveTemplate(_ t: MessageTemplate) {
        if let i = templates.firstIndex(where: { $0.id == t.id }) { templates[i] = t } else { templates.append(t) }
    }

    func deleteTemplates(at offsets: IndexSet) { templates.remove(atOffsets: offsets) }

    // MARK: - Demo mode

    var isDemo: Bool { activeProfile?.accountSid == DemoBackend.accountSid }

    /// Adds a simulated account so people can explore every feature before connecting Twilio.
    func startDemo() async {
        if let existing = profiles.first(where: { $0.accountSid == DemoBackend.accountSid }) {
            await activate(existing)
            return
        }
        do {
            var p = try await addProfile(
                name: LaunchOptions.marketing ? "Northside" : "Demo",
                credentials: TwilioCredentials(accountSid: DemoBackend.accountSid, apiKeySid: nil, secret: DemoBackend.secret),
                personalPhone: DemoBackend.verifiedNumber
            )
            p.messagingServiceSid = "MG00000000000000000000000000000001"
            p.tint = .mint
            updateProfile(p)
        } catch {
            report(error)
        }
    }

    /// Removes the demo account and its simulated data.
    func exitDemo() {
        guard let demo = profiles.first(where: { $0.accountSid == DemoBackend.accountSid }) else { return }
        deleteProfile(demo)
        Task { await DemoBackend.shared.reset() }
    }

    // MARK: - Setup checklist

    struct SetupTask: Identifiable, Hashable {
        enum Kind: String { case numbers, personalPhone, firstMessage, firstCall, messagingService, appLock }
        let kind: Kind
        let title: String
        let detail: String
        let symbol: String
        let color: Color
        let isDone: Bool
        let isOptional: Bool
        var id: String { kind.rawValue }
    }

    var setupTasks: [SetupTask] {
        guard let p = activeProfile else { return [] }
        let appLock = UserDefaults.standard.bool(forKey: "relay.appLock")
        let tasks: [SetupTask] = [
            SetupTask(kind: .numbers, title: "Get a phone number", detail: FeatureFlags.messaging ? "Buy or verify a number in Twilio so you can call and text." : "Buy or verify a number in Twilio so you can make calls.",
                      symbol: "number.circle.fill", color: .teal, isDone: !p.enabledNumbers.isEmpty, isOptional: false),
            SetupTask(kind: .personalPhone, title: "Add your phone", detail: "Needed for two-way Talk calls through your Twilio number.",
                      symbol: "iphone.gen3", color: .green, isDone: !p.personalPhone.isEmpty, isOptional: true),
            SetupTask(kind: .firstMessage, title: "Send your first text", detail: "Try messaging yourself or a friend.",
                      symbol: "message.fill", color: .blue, isDone: messages.contains { !$0.isInbound }, isOptional: false),
            SetupTask(kind: .firstCall, title: "Place your first call", detail: "Open the keypad and tap the green button.",
                      symbol: "phone.fill", color: .green, isDone: calls.contains { !$0.isInbound }, isOptional: false),
            SetupTask(kind: .messagingService, title: "Enable scheduling", detail: "Link a Messaging Service to schedule texts.",
                      symbol: "calendar.badge.clock", color: .indigo, isDone: p.messagingServiceSid?.nilIfBlank != nil, isOptional: true),
            SetupTask(kind: .appLock, title: "Turn on Face ID lock", detail: "Keep your account private on this device.",
                      symbol: "faceid", color: .purple, isDone: appLock, isOptional: true),
        ]
        // FeatureFlags.messaging: hide texting tasks while messaging is disabled.
        guard !FeatureFlags.messaging else { return tasks }
        return tasks.filter { $0.kind != .firstMessage && $0.kind != .messagingService }
    }

    var setupProgress: Double {
        let tasks = setupTasks.filter { !$0.isOptional }
        guard !tasks.isEmpty else { return 1 }
        return Double(tasks.filter(\.isDone).count) / Double(tasks.count)
    }

    var showsSetupChecklist: Bool {
        !setupChecklistDismissed && setupTasks.contains { !$0.isDone && !$0.isOptional }
    }

    // MARK: - Testing support

    /// Wipes all saved data and secrets (used by UI tests via the `-uiTestReset` launch argument).
    nonisolated static func resetAllData() {
        let defaults = UserDefaults.standard
        if let data = defaults.data(forKey: "relay.profiles"),
           let profiles = try? JSONDecoder().decode([AccountProfile].self, from: data) {
            for p in profiles { Keychain.delete(p.id.uuidString) }
        }
        for key in defaults.dictionaryRepresentation().keys where key.hasPrefix("relay.") {
            defaults.removeObject(forKey: key)
        }
        HistoryCache.clearAll()
    }

    // MARK: - Helpers

    func report(_ error: Error) {
        if (error as? URLError)?.code == .cancelled || error is CancellationError { return }
        // Offline: the offline bar already says so, and Dialbubble refreshes by itself when the connection is back.
        if let code = (error as? URLError)?.code, [.notConnectedToInternet, .networkConnectionLost, .dataNotAllowed].contains(code) { return }
        lastError = FriendlyError(error)
    }

    private func clearRemoteState() {
        suppressIncoming = true
        account = nil; balance = nil; messages = []; calls = []; messagingServices = []; lastRefresh = nil
        suppressIncoming = false
        minimizedCall = nil; incomingBanner = nil
    }

    private func persistProfiles() { save(profiles, key: Keys.profiles) }

    private func save<T: Encodable>(_ value: T, key: String) {
        if let data = try? JSONEncoder().encode(value) { UserDefaults.standard.set(data, forKey: key) }
    }

    private func load<T: Decodable>(_ type: T.Type, key: String) -> T? {
        guard let data = UserDefaults.standard.data(forKey: key) else { return nil }
        return try? JSONDecoder().decode(type, from: data)
    }
}
