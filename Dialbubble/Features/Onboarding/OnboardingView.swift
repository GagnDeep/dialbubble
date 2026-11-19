import SwiftUI
import UIKit

/// Guided first-run setup ("never lost"):
/// welcome (connect, or → in-flow sign-up guide, or demo) →
/// Step 1 Find your keys → Step 2 Connect → Step 3 Numbers → Step 4 Your phone → (save) → celebration.
struct OnboardingView: View {
    @Environment(AppStore.self) private var store
    @Environment(ToastCenter.self) private var toast
    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @Environment(\.openURL) private var openURL

    enum Step: String, CaseIterable, Comparable {
        case welcome, needAccount, keys, connect, numbers, phone, done

        private var order: Int { Self.allCases.firstIndex(of: self) ?? 0 }
        static func < (a: Step, b: Step) -> Bool { a.order < b.order }

        var name: String {
            switch self {
            case .welcome: return "Welcome"
            case .needAccount: return "Get a Twilio account"
            case .keys: return "Find your keys"
            case .connect: return "Connect"
            case .numbers: return "Your numbers"
            case .phone: return "Your phone"
            case .done: return "All set"
            }
        }

        /// "Step N of 4" — only the four core stages are numbered.
        var position: Int? {
            switch self {
            case .keys: return 1
            case .connect: return 2
            case .numbers: return 3
            case .phone: return 4
            default: return nil
            }
        }

        var help: OnboardingHelpTopic? {
            switch self {
            case .welcome: return nil
            case .needAccount: return .noAccount
            case .keys: return .credentials
            case .connect: return .connecting
            case .numbers: return .numbers
            case .phone: return .phone
            case .done: return .done
            }
        }
    }

    private static let stageCount = 4

    /// Non-secret progress kept across launches. The Auth Token / API secret is never persisted here.
    private enum K {
        static let step = "relay.onboarding.step"
        static let name = "relay.onboarding.name"
        static let sid = "relay.onboarding.accountSid"
        static let keySid = "relay.onboarding.apiKeySid"
        static let phone = "relay.onboarding.phone"
        static let country = "relay.onboarding.country"
        static let guide = "relay.onboarding.guide"
        static let all = [step, name, sid, keySid, phone, country, guide]
    }

    // Flow
    @State private var step: Step
    @State private var forward = true
    @State private var helpTopic: OnboardingHelpTopic?
    @State private var cameFromGuide = false
    @State private var resumed: Bool
    @State private var guideChecks: Int
    @AccessibilityFocusState private var headerFocused: Bool

    // Keys
    @State private var draft: CredentialsDraft
    @State private var focusedField: OnboardingCredentialField?
    @State private var clipboardReady = false

    // Connect
    @State private var tasks: [OnboardingTaskState] = Array(repeating: .pending, count: 4)
    @State private var taskDetails: [String?] = Array(repeating: nil, count: 4)
    @State private var connectError: FriendlyError?
    @State private var failedStage: Int?
    @State private var connectTask: Task<Void, Never>?
    @State private var connectedCredentials: TwilioCredentials?

    // Numbers
    @State private var account: TwilioAccount?
    @State private var numbers: [ConfiguredNumber] = []
    @State private var accountName: String
    @State private var defaultCaller: String?
    @State private var defaultSMS: String?
    @State private var isRechecking = false
    @State private var recheckResult: (text: String, ok: Bool)?

    // Phone
    @State private var country: OnboardingCountry
    @State private var nationalNumber: String
    @FocusState private var phoneFocused: Bool

    // Save + celebrate
    @State private var isSaving = false
    @State private var saveError: FriendlyError?
    @State private var saved: SavedSummary?
    @State private var celebrate = 0
    @State private var isStartingDemo = false
    @State private var demoError: FriendlyError?

    private struct SavedSummary {
        var name: String
        var enabledCount: Int
        var personalPhone: String
        var caller: String?
        var sms: String?
    }

    @ScaledMetric(relativeTo: .largeTitle) private var heroSize: CGFloat = 120
    @ScaledMetric(relativeTo: .headline) private var barIcon: CGFloat = 24
    @ScaledMetric(relativeTo: .title3) private var brandSize: CGFloat = 36

    init() {
        let d = UserDefaults.standard
        var draft = CredentialsDraft()
        draft.accountSid = d.string(forKey: K.sid) ?? ""
        if let key = d.string(forKey: K.keySid), !key.isEmpty {
            draft.useAPIKey = true
            draft.apiKeySid = key
        }
        _draft = State(initialValue: draft)
        _accountName = State(initialValue: d.string(forKey: K.name) ?? "")
        _nationalNumber = State(initialValue: d.string(forKey: K.phone) ?? "")
        _country = State(initialValue: OnboardingCountry.with(iso: d.string(forKey: K.country) ?? "") ?? .current)
        _guideChecks = State(initialValue: d.integer(forKey: K.guide))

        // Resume where the user left off. Anything past "keys" needs the secret again, so it resumes at keys.
        let saved = Step(rawValue: d.string(forKey: K.step) ?? "") ?? .welcome
        let resumeStep: Step
        switch saved {
        case .welcome, .needAccount: resumeStep = saved
        case .keys, .connect, .numbers, .phone: resumeStep = .keys
        case .done: resumeStep = .welcome
        }
        _step = State(initialValue: resumeStep)
        _resumed = State(initialValue: resumeStep == .keys && !draft.trimmedSid.isEmpty)
    }

    var body: some View {
        withLifecycle(withFeedback(chrome))
    }

    private var scroller: some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(spacing: 0) {
                    Color.clear.frame(height: 0).id("top")
                    stepContainer
                }
            }
            .scrollDismissesKeyboard(.interactively)
            .scrollBounceBehavior(.basedOnSize)
            .onChange(of: step) { _, _ in proxy.scrollTo("top", anchor: .top) }
        }
    }

    private var stepContainer: some View {
        VStack(spacing: Theme.Space.lg) {
            if let demoError {
                FriendlyErrorView(error: demoError, retry: { startDemo() }, onDismiss: { self.demoError = nil })
            }
            content
            if isAccessibilitySize { inlineSecondary }
        }
        .padding(.horizontal, Theme.Space.lg)
        .padding(.top, step == .welcome ? Theme.Space.xl : Theme.Space.md)
        .padding(.bottom, Theme.Space.lg)
        .frame(maxWidth: 600)
        .frame(maxWidth: .infinity)
        .id(step)
        .transition(stepTransition)
    }

    private var chrome: some View {
        scroller
            .scrollEdgeEffectStyle(.soft, for: .all)
            .safeAreaBar(edge: .top, spacing: 0) {
                if step != .welcome { topBar }
            }
            .bottomCTA { footer }
            .relayBackground()
            .sheet(item: $helpTopic) { topic in
                OnboardingHelpSheet(topic: topic, onTryDemo: topic == .noAccount || topic == .connecting ? { startDemo() } : nil)
            }
            .interactiveDismissDisabled()
    }

    private func withFeedback<V: View>(_ view: V) -> some View {
        view
            .sensoryFeedback(.selection, trigger: step)
            .sensoryFeedback(.success, trigger: celebrate)
            .sensoryFeedback(.error, trigger: connectError) { _, new in new != nil }
            .sensoryFeedback(.error, trigger: saveError) { _, new in new != nil }
            .sensoryFeedback(.error, trigger: demoError) { _, new in new != nil }
    }

    private func withLifecycle<V: View>(_ view: V) -> some View {
        view
            .onChange(of: step) { _, new in stepDidChange(new) }
            .onChange(of: draft) { _, _ in persistFields() }
            .onChange(of: accountName) { _, _ in persistFields() }
            .onChange(of: nationalNumber) { _, _ in persistFields() }
            .onChange(of: country) { _, _ in persistFields() }
            .onChange(of: guideChecks) { _, new in UserDefaults.standard.set(new, forKey: K.guide) }
            .onChange(of: scenePhase) { _, phase in
                if phase == .active { checkClipboard() }
            }
    }

    private var isAccessibilitySize: Bool { dynamicTypeSize.isAccessibilitySize }

    private var stepTransition: AnyTransition {
        if reduceMotion { return .opacity }
        return .asymmetric(
            insertion: .move(edge: forward ? .trailing : .leading).combined(with: .opacity),
            removal: .move(edge: forward ? .leading : .trailing).combined(with: .opacity))
    }

    // MARK: - Content router

    @ViewBuilder
    private var content: some View {
        switch step {
        case .welcome: welcomeStep
        case .needAccount: guideStep
        case .keys: keysStep
        case .connect: connectStep
        case .numbers: numbersStep
        case .phone: phoneStep
        case .done: doneStep
        }
    }

    // MARK: - Top bar

    private var isConnected: Bool {
        connectedCredentials != nil && connectedCredentials == draft.credentials && account != nil
    }

    private var completedStages: Set<Int> {
        if step == .done { return Set(1...Self.stageCount) }
        var s = Set<Int>()
        if let p = step.position, p > 1 { s.formUnion(1..<p) }
        if isConnected { s.formUnion([1, 2]) }
        return s
    }

    private var progressLabel: String {
        if let p = step.position { return "Step \(p) of \(Self.stageCount)" }
        return step == .done ? "Setup complete" : "Before you start"
    }

    private var canGoBack: Bool { step != .welcome && step != .done }

    private var topBar: some View {
        VStack(spacing: 10) {
            HStack(spacing: 12) {
                Button {
                    goBack()
                } label: {
                    Image(systemName: "chevron.backward")
                        .font(.headline)
                        .frame(width: barIcon, height: barIcon)
                }
                .buttonStyle(.glass)
                .buttonBorderShape(.circle)
                .disabled(isBusy || !canGoBack)
                .opacity(canGoBack ? 1 : 0)
                .accessibilityHidden(!canGoBack)
                .accessibilityLabel("Back")
                .accessibilityIdentifier("onboarding.back")

                // The step's own large title names the screen; the bar only says where you are.
                Text(progressLabel)
                    .font(.subheadline.weight(.semibold).monospacedDigit())
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
                    .multilineTextAlignment(.center)
                    .contentTransition(.opacity)
                    .frame(maxWidth: .infinity)
                    .accessibilityLabel("\(progressLabel), \(step.name)")

                Button {
                    helpTopic = step.help
                } label: {
                    Image(systemName: "questionmark")
                        .font(.headline)
                        .frame(width: barIcon, height: barIcon)
                }
                .buttonStyle(.glass)
                .buttonBorderShape(.circle)
                .opacity(step.help == nil ? 0 : 1)
                .disabled(step.help == nil)
                .accessibilityHidden(step.help == nil)
                .accessibilityLabel("Help for this step")
                .accessibilityIdentifier("onboarding.help")
            }

            OnboardingSegmentedProgress(total: Self.stageCount, completed: completedStages, current: step.position)
        }
        .padding(.horizontal, 20)
        .padding(.top, 6)
        .padding(.bottom, 10)
        .frame(maxWidth: 600)
        .frame(maxWidth: .infinity)
        .animation(Theme.Motion.adaptive(Theme.Motion.smooth, reduceMotion), value: step)
    }

    // MARK: - Welcome

    private var welcomeStep: some View {
        VStack(spacing: Theme.Space.lg) {
            HStack(spacing: Theme.Space.sm) {
                BrandIconView(size: brandSize)
                Text("Dialbubble")
                    .font(.title3.weight(.bold))
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
            }
            .dynamicTypeSize(...DynamicTypeSize.accessibility2)
            .accessibilityElement(children: .combine)
            .accessibilityLabel("Dialbubble")

            // Decorative illustration: capped text size, and dropped at accessibility sizes where it can't fit.
            if !isAccessibilitySize {
                OnboardingWelcomePreview()
                    .dynamicTypeSize(...DynamicTypeSize.xxLarge)
                    .padding(.vertical, Theme.Space.xs)
            }

            VStack(spacing: Theme.Space.sm) {
                Text(FeatureFlags.messaging ? "Call and text from your Twilio numbers." : "Call from your Twilio numbers.")
                    .font(.largeTitle.weight(.bold))
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityAddTraits(.isHeader)
                    .accessibilityFocused($headerFocused)
                Text("Every number you own, on your iPhone. Connect your Twilio account and you're ready.")
                    .font(.body)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
            }

            OnboardingTrustRow()
                .padding(.top, Theme.Space.xs)
        }
    }

    // MARK: - Get-a-Twilio-account guide

    private struct GuideItem {
        let title: String
        let detail: String
        let symbol: String
        let url: URL
        let id: String
    }

    private let guideItems: [GuideItem] = [
        GuideItem(title: "Sign up for Twilio", detail: "Trial credit included, no card needed.",
                  symbol: "person.crop.circle.badge.plus", url: URL(string: "https://www.twilio.com/try-twilio")!, id: "onboarding.guide.signUp"),
        GuideItem(title: "Get your trial number", detail: "Phone Numbers → Buy a number. One is free.",
                  symbol: "number.circle.fill", url: URL(string: "https://console.twilio.com/us1/develop/phone-numbers/manage/search")!, id: "onboarding.guide.number"),
        GuideItem(title: "Verify your mobile", detail: "Trials can only reach verified numbers.",
                  symbol: "checkmark.seal.fill", url: URL(string: "https://console.twilio.com/us1/develop/phone-numbers/manage/verified")!, id: "onboarding.guide.verify"),
    ]

    private func guideDone(_ i: Int) -> Bool { guideChecks & (1 << i) != 0 }

    private var guideStep: some View {
        let doneCount = guideItems.indices.filter(guideDone).count
        return VStack(alignment: .leading, spacing: Theme.Space.lg) {
            OnboardingStepHeader(title: "Get a Twilio account",
                                 subtitle: "Open each step in Twilio, then come back here to connect.")
                .accessibilityFocused($headerFocused)

            VStack(alignment: .leading, spacing: Theme.Space.xs) {
                Text("\(doneCount) of \(guideItems.count) done")
                    .font(.footnote.weight(.semibold).monospacedDigit())
                    .foregroundStyle(.secondary)
                    .contentTransition(.numericText())
                    .padding(.horizontal, Theme.Space.xs)

                // One card, hairline-separated rows — not three stacked cards.
                VStack(spacing: 0) {
                    ForEach(guideItems.indices, id: \.self) { i in
                        if i > 0 { Divider().padding(.leading, 64) }
                        guideRow(i)
                    }
                }
                .padding(.vertical, Theme.Space.xxs)
                .glassEffect(.regular, in: .rect(cornerRadius: Theme.Radius.lg))
                .accessibilityElement(children: .contain)
            }
        }
        .sensoryFeedback(.selection, trigger: guideChecks)
    }

    private func guideRow(_ i: Int) -> some View {
        let item = guideItems[i]
        let done = guideDone(i)
        return HStack(spacing: 12) {
            Button {
                withAnimation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion)) { guideChecks ^= (1 << i) }
            } label: {
                Image(systemName: done ? "checkmark.circle.fill" : "\(i + 1).circle")
                    .font(.title2)
                    .foregroundStyle(done ? AnyShapeStyle(Theme.Palette.brandText) : AnyShapeStyle(.secondary))
                    .contentTransition(.symbolEffect(.replace))
                    .frame(minWidth: 44, minHeight: 44)
            }
            .buttonStyle(.plain)
            .accessibilityLabel(done ? "Mark “\(item.title)” as not done" : "Mark “\(item.title)” as done")

            Button {
                openURL(item.url)
                withAnimation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion)) { guideChecks |= (1 << i) }
            } label: {
                HStack(spacing: 10) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(item.title)
                            .font(.headline)
                            .strikethrough(done, color: .secondary)
                            .foregroundStyle(done ? .secondary : .primary)
                        Text(item.detail).font(.footnote).foregroundStyle(.secondary)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .multilineTextAlignment(.leading)
                    Spacer(minLength: 4)
                    Image(systemName: "arrow.up.forward").font(.footnote.weight(.semibold)).foregroundStyle(.secondary)
                        .accessibilityHidden(true)
                }
                .contentShape(.rect)
            }
            .buttonStyle(.plain)
            .accessibilityHint("Opens Twilio in Safari")
            .accessibilityValue(done ? "Done" : "Not done")
            .accessibilityIdentifier(item.id)
        }
        .padding(.leading, Theme.Space.xs)
        .padding(.trailing, Theme.Space.md)
        .padding(.vertical, Theme.Space.xs)
    }

    // MARK: - Keys (Step 1)

    private var keysStep: some View {
        VStack(alignment: .leading, spacing: Theme.Space.lg) {
            OnboardingStepHeader(title: "Find your keys",
                                 subtitle: draft.useAPIKey
                                    ? "Copy your Account SID, API Key SID and secret from the Twilio Console."
                                    : "Copy two values from the Twilio Console home page.")
                .accessibilityFocused($headerFocused)

            if resumed && draft.trimmedSecret.isEmpty {
                Callout(style: .info, title: "Welcome back",
                        message: "We kept your Account SID. For your security, paste your \(draft.useAPIKey ? "API Key secret" : "Auth Token") again to continue.",
                        symbol: "arrow.uturn.backward.circle.fill")
            }

            if isConnected {
                Callout(style: .success, title: "Already connected",
                        message: "These keys worked. Tap Continue, or change them to connect again.")
            }

            // Where to look, then the two actions that do the work: go copy, come back and paste.
            VStack(spacing: Theme.Space.sm) {
                OnboardingConsoleMock(highlight: focusedField, usesAPIKey: draft.useAPIKey)
                keysActionRow
            }

            CredentialsFields(draft: $draft, showsConsoleLink: false,
                              onFocusChange: { f in
                                  withAnimation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion)) { focusedField = f }
                              },
                              onSubmit: { connect() })

            securityNote
        }
    }

    /// "Open Twilio Console" and Smart Paste side by side (stacked at large text sizes).
    private var keysActionRow: some View {
        let layout = isAccessibilitySize
            ? AnyLayout(VStackLayout(spacing: Theme.Space.sm))
            : AnyLayout(HStackLayout(spacing: Theme.Space.md))
        return VStack(spacing: Theme.Space.xs) {
            layout {
                Link(destination: URL(string: draft.useAPIKey ? "https://console.twilio.com/us1/account/keys-credentials/api-keys" : "https://console.twilio.com")!) {
                    Label("Open Console", systemImage: "arrow.up.forward")
                        .font(.subheadline.weight(.semibold))
                        .lineLimit(1)
                        .minimumScaleFactor(0.85)
                }
                .buttonStyle(.glass)
                .controlSize(.large)
                .accessibilityHint("Opens Safari. Come back to Dialbubble when you've copied your keys.")
                .accessibilityIdentifier("onboarding.openConsole")

                PasteButton(payloadType: String.self) { strings in
                    let text = strings.joined(separator: "\n")
                    Task { @MainActor in smartPaste(text) }
                }
                .buttonBorderShape(.capsule)
                .labelStyle(.titleAndIcon)
                .tint(Theme.Palette.brand)
                .controlSize(.large)
                .accessibilityIdentifier("onboarding.smartPaste")
                .overlay {
                    if clipboardReady {
                        let ring = Capsule().strokeBorder(Theme.Palette.brandBright.opacity(0.8), lineWidth: 2).padding(-4)
                        if reduceMotion {
                            ring.allowsHitTesting(false)
                        } else {
                            ring.phaseAnimator([0.25, 1.0]) { c, o in c.opacity(o) } animation: { _ in .easeInOut(duration: 0.8) }
                                .allowsHitTesting(false)
                        }
                    }
                }
            }
            Text(clipboardReady ? "Copied your keys? Tap Paste and Dialbubble fills in each one."
                                : "Copy from Twilio, then Paste: each key lands in the right field.")
                .font(.footnote)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .contentTransition(.opacity)
        }
        .animation(Theme.Motion.adaptive(Theme.Motion.smooth, reduceMotion), value: clipboardReady)
    }

    /// When the user comes back from Safari with something on the clipboard, nudge them toward Smart Paste.
    /// `hasStrings` doesn't read the clipboard, so iOS shows no paste prompt.
    private func checkClipboard() {
        guard step == .keys, !draft.isComplete, UIPasteboard.general.hasStrings else { return }
        clipboardReady = true
        AccessibilityNotification.Announcement("Copied your keys? Tap Paste to fill them in.").post()
    }

    private func smartPaste(_ text: String) {
        var d = draft
        let filled = d.applySmartPaste(text)
        guard !filled.isEmpty else {
            // Never guess: arbitrary text doesn't go into the secret field.
            toast.show("No Twilio keys found in what you copied", style: .info)
            return
        }
        withAnimation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion)) {
            draft = d
            clipboardReady = false
        }
        toast.show("Filled \(ListFormatter.localizedString(byJoining: filled))", style: .success)
    }

    private var securityNote: some View {
        // Plain footnote, not another card.
        HStack(alignment: .firstTextBaseline, spacing: Theme.Space.xs) {
            Image(systemName: "lock.fill")
                .font(.footnote)
                .foregroundStyle(.secondary)
                .accessibilityHidden(true)
            Text("Stored only in this iPhone's Keychain and sent only to api.twilio.com. Dialbubble has no servers.")
                .font(.footnote)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.horizontal, Theme.Space.xs)
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .combine)
    }

    // MARK: - Connect (Step 2)

    private let taskTitles = ["Reaching Twilio", "Checking your keys", "Loading your account", "Finding your numbers"]
    private let taskSymbols = ["network", "key.fill", "person.crop.circle.fill", "number.circle.fill"]

    private var connectSucceeded: Bool { tasks.allSatisfy { $0 == .done } }

    private var connectStep: some View {
        VStack(alignment: .leading, spacing: Theme.Space.lg) {
            OnboardingStepHeader(
                symbol: connectError != nil ? "exclamationmark.triangle.fill" : (connectSucceeded ? "checkmark.seal.fill" : "antenna.radiowaves.left.and.right"),
                color: connectError != nil ? Theme.Palette.warning : (connectSucceeded ? Theme.Palette.success : Theme.Palette.brandText),
                title: connectError != nil ? connectFailureHeadline : (connectSucceeded ? "Connected!" : "Connecting…"),
                subtitle: connectError != nil
                    ? "Nothing was saved. Here's how to fix it."
                    : (connectSucceeded ? "Next, choose your numbers." : "Checking your keys with Twilio."))
                .accessibilityFocused($headerFocused)

            // The checklist already names the account and numbers, so no extra summary card.
            VStack(alignment: .leading, spacing: Theme.Space.md) {
                ForEach(0..<4, id: \.self) { i in
                    OnboardingChecklistRow(title: taskTitles[i], detail: taskDetails[i], symbol: taskSymbols[i], state: tasks[i])
                }
            }
            .padding(Theme.Space.md)
            .glassEffect(.regular, in: .rect(cornerRadius: Theme.Radius.lg))

            if let connectError {
                FriendlyErrorView(error: connectError, retry: nil)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                Button {
                    helpTopic = .connecting
                } label: {
                    Label("Troubleshooting tips", systemImage: "wrench.and.screwdriver")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Theme.Palette.brandText)
                        .frame(minHeight: 44)
                }
                .frame(maxWidth: .infinity)
                .accessibilityIdentifier("onboarding.troubleshoot")
            }
        }
        .animation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion), value: connectError)
        .animation(Theme.Motion.adaptive(Theme.Motion.bouncy, reduceMotion), value: connectSucceeded)
    }

    private var connectFailureHeadline: String {
        switch failedStage {
        case 0: return "Couldn't reach Twilio"
        case 3: return "Almost there"
        default: return "Let's fix your keys"
        }
    }

    private var numbersCountText: String {
        numbers.isEmpty ? "No numbers yet" : "\(numbers.count) number\(numbers.count == 1 ? "" : "s")"
    }

    private func trialBadge(_ trial: Bool) -> some View {
        trial
            ? Badge(text: "Trial", color: Theme.Palette.warning, symbol: "hourglass")
            : Badge(text: "Full", color: Theme.Palette.success, symbol: "checkmark.seal.fill")
    }

    private struct StageError: Error { let error: FriendlyError }

    private func connect() {
        guard draft.isComplete else { return }
        focusedField = nil
        // Same keys already verified (e.g. user went back from Numbers) — no need to hit Twilio again.
        if isConnected {
            go(to: .numbers)
            return
        }
        connectTask?.cancel()
        connectError = nil
        failedStage = nil
        connectedCredentials = nil
        tasks = Array(repeating: .pending, count: 4)
        taskDetails = Array(repeating: nil, count: 4)
        if step != .connect { go(to: .connect) }

        let creds = draft.credentials
        let quick = reduceMotion
        connectTask = Task { @MainActor in
            func set(_ i: Int, _ s: OnboardingTaskState, _ detail: String? = nil) {
                withAnimation(quick ? nil : Theme.Motion.snappy) {
                    tasks[i] = s
                    if let detail { taskDetails[i] = detail }
                }
            }
            func pause() async throws { try await Task.sleep(for: .milliseconds(quick ? 120 : 350)) }

            let client = TwilioClient(credentials: creds)
            var stage = 0
            do {
                set(0, .running)
                try await pause()
                let acct: TwilioAccount
                do {
                    acct = try await client.fetchAccount()
                } catch {
                    if !(error is URLError) {
                        set(0, .done)
                        stage = 1
                    }
                    throw error
                }
                set(0, .done)
                stage = 1
                set(1, .running)
                try await pause()
                set(1, .done, creds.apiKeySid != nil ? "Signed in with your API Key" : "Signed in with your Auth Token")

                stage = 2
                set(2, .running)
                try await pause()
                let status = acct.status?.lowercased()
                if status == "suspended" || status == "closed" {
                    throw StageError(error: FriendlyError(
                        title: "Account \(status ?? "unavailable")",
                        message: "This Twilio account is \(status ?? "not active"), so Dialbubble can't use it.",
                        suggestion: "Sign in to the Twilio Console to check billing and account status.",
                        symbol: "person.crop.circle.badge.xmark", color: .orange,
                        helpURL: URL(string: "https://console.twilio.com")))
                }
                set(2, .done, "\(acct.friendlyName ?? "Twilio account") · \(acct.isTrial ? "Trial" : "Full") account")

                stage = 3
                set(3, .running)
                let found = try await Self.discoverNumbers(client)
                try Task.checkCancellation()
                let voiceCount = found.filter(\.voice).count
                let smsCount = found.filter(\.sms).count
                set(3, .done, found.isEmpty ? "No numbers yet — we'll help you get one"
                                            : FeatureFlags.messaging
                                                ? "\(found.count) number\(found.count == 1 ? "" : "s") · \(voiceCount) can call · \(smsCount) can text"
                                                : "\(found.count) number\(found.count == 1 ? "" : "s") · \(voiceCount) can call")
                applyDiscovery(account: acct, numbers: found)
                connectedCredentials = creds
                AccessibilityNotification.Announcement(
                    "Connected to \(acct.friendlyName ?? "your Twilio account"). \(numbersCountText) found.").post()

                try await Task.sleep(for: .seconds(1.6))
                guard step == .connect, connectError == nil else { return }
                go(to: .numbers)
            } catch is CancellationError {
                return
            } catch {
                guard !Task.isCancelled else { return }
                set(stage, .failed)
                let friendly = Self.friendly(error, stage: stage)
                withAnimation(quick ? nil : Theme.Motion.snappy) {
                    failedStage = stage
                    connectError = friendly
                }
                AccessibilityNotification.Announcement("Couldn't connect. \(friendly.title). \(friendly.message)").post()
            }
        }
    }

    /// Maps an error to wording that matches the stage that failed.
    private static func friendly(_ error: Error, stage: Int) -> FriendlyError {
        if let staged = error as? StageError { return staged.error }
        let base = FriendlyError(error, context: .onboarding)
        guard stage == 3, !(error is URLError) else { return base }
        // Signed in fine, but listing numbers failed — don't say "Couldn't sign in".
        return FriendlyError(
            title: "Couldn't load your numbers",
            message: "Your keys work, but Twilio didn't return your phone numbers.",
            suggestion: "Try again in a moment. If you're using an API Key, make sure it's a Standard key, not Restricted.",
            symbol: "number.circle", color: .orange, helpURL: base.helpURL, code: base.code,
            details: base.details ?? base.message)
    }

    /// Lists owned numbers and verified caller IDs (without fetching the account a second time).
    private static func discoverNumbers(_ client: TwilioClient) async throws -> [ConfiguredNumber] {
        async let owned = client.fetchIncomingNumbers()
        async let verified = (try? await client.fetchVerifiedCallerIds()) ?? []
        let palette: [AppTint] = [.blue, .teal, .indigo, .orange, .purple, .cyan, .green, .mint]
        var result: [ConfiguredNumber] = []
        for (i, n) in try await owned.enumerated() {
            result.append(ConfiguredNumber(
                phoneNumber: n.phoneNumber, friendlyName: n.friendlyName ?? n.phoneNumber, nickname: nil,
                tint: palette[i % palette.count],
                voice: n.capabilities?.voice ?? true, sms: n.capabilities?.sms ?? true, mms: n.capabilities?.mms ?? false,
                source: .owned))
        }
        for v in await verified where !result.contains(where: { $0.phoneNumber == v.phoneNumber }) {
            result.append(ConfiguredNumber(
                phoneNumber: v.phoneNumber, friendlyName: v.friendlyName ?? v.phoneNumber, nickname: nil,
                tint: .indigo, voice: true, sms: false, mms: false, source: .verified))
        }
        return result
    }

    private func applyDiscovery(account acct: TwilioAccount?, numbers found: [ConfiguredNumber]) {
        // Keep the user's on/off choices if they come back to this step.
        let previous = Dictionary(numbers.map { ($0.phoneNumber, $0.isEnabled) }, uniquingKeysWith: { a, _ in a })
        if let acct { account = acct }
        numbers = found.map { n in
            var n = n
            if let was = previous[n.phoneNumber] { n.isEnabled = was }
            return n
        }
        if accountName.isEmpty { accountName = account?.friendlyName ?? "" }
        normalizeDefaults()
    }

    // MARK: - Numbers (Step 3)

    private var enabledVoice: [ConfiguredNumber] { numbers.filter { $0.isEnabled && $0.voice } }
    private var enabledSMS: [ConfiguredNumber] { numbers.filter { $0.isEnabled && $0.sms } }

    private func normalizeDefaults() {
        if !enabledVoice.contains(where: { $0.phoneNumber == defaultCaller }) { defaultCaller = enabledVoice.first?.phoneNumber }
        if !enabledSMS.contains(where: { $0.phoneNumber == defaultSMS }) { defaultSMS = enabledSMS.first?.phoneNumber }
    }

    private var numbersStep: some View {
        VStack(alignment: .leading, spacing: Theme.Space.lg) {
            OnboardingStepHeader(title: "Your numbers",
                                 subtitle: numbers.isEmpty
                                    ? "Your account is connected but has no phone number yet."
                                    : "Choose which numbers to use. You can change this later.")
                .accessibilityFocused($headerFocused)

            accountCard

            if numbers.isEmpty {
                noNumbersCallout
            } else {
                VStack(alignment: .leading, spacing: Theme.Space.xs) {
                    sectionLabel("Numbers")
                    // One calm list: identity dot, number, quiet capabilities line, toggle.
                    VStack(spacing: 0) {
                        ForEach(Array($numbers.enumerated()), id: \.element.id) { i, $n in
                            if i > 0 { Divider().padding(.leading, 38) }
                            numberRow($n)
                        }
                    }
                    .padding(.vertical, Theme.Space.xxs)
                    .glassEffect(.regular, in: .rect(cornerRadius: Theme.Radius.lg))
                }
                .sensoryFeedback(.selection, trigger: numbers.map(\.isEnabled))

                VStack(alignment: .leading, spacing: Theme.Space.xs) {
                    sectionLabel("Defaults")
                    defaultsCard
                }
            }

            if account?.isTrial == true { trialCallout }
        }
    }

    private func sectionLabel(_ text: String) -> some View {
        Text(text)
            .font(.footnote.weight(.semibold))
            .foregroundStyle(.secondary)
            .padding(.horizontal, Theme.Space.xs)
            .accessibilityAddTraits(.isHeader)
    }

    private var accountCard: some View {
        VStack(alignment: .leading, spacing: Theme.Space.sm) {
            HStack(spacing: Theme.Space.sm) {
                AvatarView(title: accountName.nilIfBlank ?? account?.friendlyName ?? "Twilio", tint: Theme.Palette.brand, size: 40)
                VStack(alignment: .leading, spacing: 2) {
                    Text(account?.friendlyName ?? "Twilio account").font(.headline)
                    Text(FriendlyError.maskSIDs(draft.trimmedSid)).font(.footnote.monospaced()).foregroundStyle(.secondary).lineLimit(1)
                }
                Spacer(minLength: 4)
                trialBadge(account?.isTrial == true)
            }
            .accessibilityElement(children: .combine)
            Divider()
            HStack(spacing: Theme.Space.sm) {
                Image(systemName: "tag").foregroundStyle(.secondary).frame(width: 20).accessibilityHidden(true)
                TextField("Name in Dialbubble (e.g. Work)", text: $accountName)
                    .textInputAutocapitalization(.words)
                    .submitLabel(.done)
                    .accessibilityLabel("Account name in Dialbubble")
                    .accessibilityIdentifier("onboarding.accountName")
            }
        }
        .padding(Theme.Space.md)
        .glassEffect(.regular, in: .rect(cornerRadius: Theme.Radius.lg))
    }

    private func capabilitiesText(_ n: ConfiguredNumber) -> String {
        var parts: [String] = []
        if n.voice { parts.append("Calls") }
        // FeatureFlags.messaging: don't advertise texting while it's hidden.
        if n.sms && FeatureFlags.messaging { parts.append("Texts") }
        if n.mms && FeatureFlags.messaging { parts.append("MMS") }
        return parts.isEmpty ? (FeatureFlags.messaging ? "No calls or texts" : "No calls") : parts.joined(separator: ", ")
    }

    private func numberRow(_ n: Binding<ConfiguredNumber>) -> some View {
        let number = n.wrappedValue
        // Skip the friendly name when Twilio just echoes the number back.
        let named = number.displayName != number.phoneNumber && number.displayName != PhoneFormat.display(number.phoneNumber)
        let detail = [named ? number.displayName : number.source.label, capabilitiesText(number)].joined(separator: " · ")
        return HStack(spacing: Theme.Space.sm) {
            Circle().fill(number.tint.color).frame(width: 10, height: 10).accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 2) {
                Text(PhoneFormat.display(number.phoneNumber))
                    .font(.body.weight(.semibold).monospacedDigit())
                    .foregroundStyle(number.isEnabled ? .primary : .secondary)
                Text(detail)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 4)
            Toggle("Use \(PhoneFormat.display(number.phoneNumber))", isOn: n.isEnabled.animation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion)))
                .labelsHidden()
                .onChange(of: number.isEnabled) { _, _ in normalizeDefaults() }
        }
        .padding(.horizontal, Theme.Space.md)
        .padding(.vertical, Theme.Space.sm)
    }

    private var defaultsCard: some View {
        VStack(spacing: 0) {
            defaultPicker(title: "Call from", options: enabledVoice, selection: $defaultCaller)
            if FeatureFlags.messaging {
                Divider().padding(.leading, Theme.Space.md)
                defaultPicker(title: "Text from", options: enabledSMS, selection: $defaultSMS)
            }
        }
        .padding(.vertical, Theme.Space.xxs)
        .glassEffect(.regular, in: .rect(cornerRadius: Theme.Radius.lg))
    }

    private func defaultPicker(title: String, options: [ConfiguredNumber], selection: Binding<String?>) -> some View {
        let label = Text(title).font(.body)
        let control = Group {
            if options.isEmpty {
                Text("No number available").font(.subheadline).foregroundStyle(.secondary)
            } else {
                Picker(title, selection: selection) {
                    ForEach(options) { n in
                        Text("\(n.displayName) · \(PhoneFormat.short(n.phoneNumber))").tag(Optional(n.phoneNumber))
                    }
                }
                .pickerStyle(.menu)
                .labelsHidden()
                .tint(Theme.Palette.brandText)
                .accessibilityLabel("Default \(title)")
            }
        }
        return ViewThatFits(in: .horizontal) {
            HStack { label; Spacer(minLength: 8); control }
            VStack(alignment: .leading, spacing: 6) { label; control }
        }
        .padding(.leading, Theme.Space.md)
        .padding(.trailing, Theme.Space.xs)
        .padding(.vertical, Theme.Space.xs)
        .sensoryFeedback(.selection, trigger: selection.wrappedValue)
    }

    private var noNumbersCallout: some View {
        VStack(alignment: .leading, spacing: Theme.Space.sm) {
            // Two options in one card, hairline-separated.
            VStack(spacing: 0) {
                Link(destination: URL(string: "https://console.twilio.com/us1/develop/phone-numbers/manage/search")!) {
                    optionRow("cart", "Buy a Twilio number", FeatureFlags.messaging ? "Calls and texts. Trials get one free." : "For calls. Trials get one free.")
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("onboarding.buyNumber")

                Divider().padding(.leading, 58)

                Link(destination: URL(string: "https://console.twilio.com/us1/develop/phone-numbers/manage/verified")!) {
                    optionRow("checkmark.seal", "Verify your own number", "Use it as caller ID for calls.")
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("onboarding.verifyNumber")
            }
            .padding(.vertical, Theme.Space.xxs)
            .glassEffect(.regular, in: .rect(cornerRadius: Theme.Radius.lg))

            Button {
                recheckNumbers()
            } label: {
                HStack {
                    if isRechecking { ProgressView().controlSize(.small) }
                    Label(isRechecking ? "Checking…" : "Check Again", systemImage: "arrow.clockwise")
                }
                .font(.headline)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 4)
            }
            .buttonStyle(.glass)
            .controlSize(.large)
            .disabled(isRechecking)
            .accessibilityIdentifier("onboarding.recheckNumbers")

            if let recheckResult {
                Label {
                    Text(recheckResult.text).foregroundStyle(.primary)
                } icon: {
                    Image(systemName: recheckResult.ok ? "checkmark.circle.fill" : "clock.fill")
                        .foregroundStyle(recheckResult.ok ? Theme.Palette.success : Theme.Palette.warning)
                }
                .font(.footnote.weight(.medium))
                .fixedSize(horizontal: false, vertical: true)
                .padding(.horizontal, Theme.Space.xs)
                .transition(.opacity)
                .accessibilityIdentifier("onboarding.recheckResult")
            }

            Text("Or tap Continue and add one later in Settings.")
                .font(.footnote)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.horizontal, Theme.Space.xs)
        }
    }

    private func optionRow(_ symbol: String, _ title: String, _ detail: String) -> some View {
        HStack(spacing: Theme.Space.sm) {
            IconTile(symbol: symbol, color: Theme.Palette.brandText, size: 30)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.body.weight(.semibold)).foregroundStyle(.primary)
                Text(detail).font(.footnote).foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .multilineTextAlignment(.leading)
            Spacer(minLength: 4)
            Image(systemName: "arrow.up.forward").font(.footnote.weight(.semibold)).foregroundStyle(.secondary)
                .accessibilityHidden(true)
        }
        .padding(.horizontal, Theme.Space.md)
        .padding(.vertical, Theme.Space.sm)
        .contentShape(.rect)
    }

    private var trialCallout: some View {
        Callout(style: .info, title: "Trial account",
                message: FeatureFlags.messaging
                    ? "You can call verified numbers with a Voice Message. Talk calls, recording and custom texts need a paid Twilio account."
                    : "You can call verified numbers with a Voice Message. Talk calls and recording need a paid Twilio account.",
                symbol: "hourglass") {
            ViewThatFits(in: .horizontal) {
                HStack(spacing: 10) { trialLinks }
                VStack(alignment: .leading, spacing: 8) { trialLinks }
            }
            .buttonStyle(.glass)
            .font(.subheadline.weight(.semibold))
        }
    }

    @ViewBuilder
    private var trialLinks: some View {
        Link(destination: URL(string: "https://console.twilio.com/us1/develop/phone-numbers/manage/verified")!) {
            Label("Verify a Number", systemImage: "checkmark.seal.fill")
        }
        Link(destination: URL(string: "https://console.twilio.com/us1/billing/manage-billing/upgrade")!) {
            Label("Upgrade", systemImage: "arrow.up.circle.fill")
        }
    }

    private func recheckNumbers() {
        guard draft.isComplete else { return }
        isRechecking = true
        recheckResult = nil
        let client = TwilioClient(credentials: draft.credentials)
        Task {
            defer { isRechecking = false }
            let result: (text: String, ok: Bool)
            do {
                let found = try await Self.discoverNumbers(client)
                withAnimation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion)) { applyDiscovery(account: nil, numbers: found) }
                result = found.isEmpty
                    ? ("Still no numbers. New numbers can take a minute to appear — try again shortly.", false)
                    : ("Found \(found.count) number\(found.count == 1 ? "" : "s")!", true)
            } catch {
                let f = FriendlyError(error, context: .onboarding)
                result = ("\(f.title). \(f.suggestion ?? f.message)", false)
            }
            withAnimation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion)) { recheckResult = result }
            AccessibilityNotification.Announcement(result.text).post()
        }
    }

    // MARK: - Your phone (Step 4)

    private var personalE164: String {
        let t = nationalNumber.trimmingCharacters(in: .whitespaces)
        guard !t.isEmpty else { return "" }
        return PhoneFormat.e164(t, defaultCountryCode: country.dial)
    }

    private var phoneValid: Bool { !personalE164.isEmpty && PhoneFormat.isPlausible(personalE164) }

    private var phoneStep: some View {
        VStack(alignment: .leading, spacing: Theme.Space.lg) {
            OnboardingStepHeader(title: "Your phone number",
                                 subtitle: "When you call someone, Dialbubble rings this phone first; press any key to connect. Optional — you can add it later.")
                .accessibilityFocused($headerFocused)

            OnboardingBridgeDiagram()

            VStack(alignment: .leading, spacing: Theme.Space.xs) {
                Text("Your mobile number")
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, Theme.Space.xs)

                let layout = isAccessibilitySize
                    ? AnyLayout(VStackLayout(alignment: .leading, spacing: 10))
                    : AnyLayout(HStackLayout(spacing: 10))
                layout {
                    CountryCodeButton(country: $country)

                    HStack(spacing: 8) {
                        TextField("Mobile number", text: $nationalNumber)
                            .keyboardType(.phonePad)
                            .textContentType(.telephoneNumber)
                            .font(.body.monospacedDigit())
                            .focused($phoneFocused)
                            .accessibilityLabel("Mobile number, without the country code")
                            .accessibilityIdentifier("onboarding.phoneField")
                        ContactPickerButton { phone, _ in usePickedPhone(phone) }
                            .controlSize(.small)
                    }
                    .padding(.leading, 16)
                    .padding(.trailing, 6)
                    .padding(.vertical, 6)
                    .glassEffect(phoneValid ? .regular.tint(Theme.Palette.success.opacity(0.08)) : .regular, in: .rect(cornerRadius: Theme.Radius.md))
                }
                .animation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion), value: phoneValid)

                // Colored glyph carries the state; the words stay high-contrast.
                Group {
                    if phoneValid {
                        Label {
                            Text("Dialbubble will ring **\(PhoneFormat.display(personalE164))**").foregroundStyle(.secondary)
                        } icon: {
                            Image(systemName: "checkmark.circle.fill").foregroundStyle(Theme.Palette.success)
                        }
                    } else if !nationalNumber.isEmpty {
                        Label {
                            Text("Enter your full number, without the country code.").foregroundStyle(.primary)
                        } icon: {
                            Image(systemName: "exclamationmark.circle.fill").foregroundStyle(Theme.Palette.warning)
                        }
                    }
                }
                .font(.footnote)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.horizontal, Theme.Space.xs)
                .contentTransition(.opacity)
            }

            if let saveError {
                FriendlyErrorView(error: saveError, retry: nil, onDismiss: { self.saveError = nil })
                    .transition(.opacity)
            }
        }
        .toolbar {
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button("Done") { phoneFocused = false }.fontWeight(.semibold)
            }
        }
    }

    private func usePickedPhone(_ raw: String) {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.hasPrefix("+") || trimmed.hasPrefix("00") {
            let e164 = PhoneFormat.e164(trimmed, defaultCountryCode: country.dial)
            if let parts = OnboardingCountry.split(e164) {
                country = parts.0
                nationalNumber = parts.1
                return
            }
        }
        nationalNumber = trimmed
    }

    // MARK: - Save, then celebrate

    /// Persists the profile *before* the celebration, so everything the done screen says is true.
    private func saveAndCelebrate(skipPhone: Bool) {
        guard !isSaving, draft.isComplete else { return }
        phoneFocused = false
        if skipPhone { nationalNumber = "" }
        isSaving = true
        saveError = nil

        let creds = draft.credentials
        let name = accountName.nilIfBlank ?? account?.friendlyName
        let phone = phoneValid ? personalE164 : ""
        let enabled = Dictionary(numbers.map { ($0.phoneNumber, $0.isEnabled) }, uniquingKeysWith: { a, _ in a })
        let caller = defaultCaller
        let sms = defaultSMS
        let countryDial = country.dial

        // Keep the onboarding on screen for the celebration even though an account now exists.
        store.isOnboarding = true
        Task {
            do {
                var profile = try await store.addProfile(name: name, credentials: creds, personalPhone: phone)
                if let current = store.profiles.first(where: { $0.id == profile.id }) { profile = current }
                for i in profile.numbers.indices {
                    if let on = enabled[profile.numbers[i].phoneNumber] { profile.numbers[i].isEnabled = on }
                }
                profile.defaultCallerNumber = profile.callerNumbers.first { $0.phoneNumber == caller }?.phoneNumber
                    ?? profile.callerNumbers.first?.phoneNumber
                profile.defaultSMSNumber = profile.smsNumbers.first { $0.phoneNumber == sms }?.phoneNumber
                    ?? profile.smsNumbers.first?.phoneNumber
                profile.defaultCountryCode = countryDial
                profile.personalPhone = phone
                store.updateProfile(profile)

                saved = SavedSummary(name: profile.name, enabledCount: profile.enabledNumbers.count, personalPhone: phone,
                                     caller: profile.defaultCallerNumber, sms: profile.defaultSMSNumber)
                clearPersisted()
                isSaving = false
                go(to: .done)
                celebrate += 1
            } catch {
                isSaving = false
                if !store.hasAccount { store.isOnboarding = false }
                withAnimation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion)) {
                    saveError = FriendlyError(error, context: .onboarding)
                }
                if let saveError { AccessibilityNotification.Announcement("Couldn't save. \(saveError.title)").post() }
            }
        }
    }

    // MARK: - Done

    private var doneStep: some View {
        VStack(spacing: Theme.Space.xl) {
            successBadge
                .overlay { OnboardingSparkles() }
                .padding(.top, Theme.Space.md)

            VStack(spacing: Theme.Space.xs) {
                Text("You're all set!")
                    .font(.largeTitle.weight(.bold))
                    .accessibilityAddTraits(.isHeader)
                    .accessibilityFocused($headerFocused)
                Text("Your account is saved. Try it now.")
                    .font(.body)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
            }

            tryItNowCard

            VStack(alignment: .leading, spacing: Theme.Space.xs) {
                Text("Summary")
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, Theme.Space.xs)
                    .accessibilityAddTraits(.isHeader)
                VStack(spacing: 0) {
                    summaryRow(done: true, "Account connected", saved?.name ?? "Twilio")
                    Divider().padding(.leading, 48)
                    let count = saved?.enabledCount ?? 0
                    summaryRow(done: count > 0,
                               count == 0 ? "No phone number yet" : "Numbers ready",
                               count == 0 ? "Your Home checklist shows how to get one" : "\(count) number\(count == 1 ? "" : "s") enabled")
                    Divider().padding(.leading, 48)
                    let phone = saved?.personalPhone ?? ""
                    summaryRow(done: !phone.isEmpty,
                               phone.isEmpty ? "Two-way calls off" : "Two-way calls on",
                               phone.isEmpty ? "Add your phone any time from Home" : "Dialbubble will ring \(PhoneFormat.display(phone))")
                }
                .padding(.vertical, Theme.Space.xxs)
                .glassEffect(.regular, in: .rect(cornerRadius: Theme.Radius.lg))
            }
        }
    }

    private var successBadge: some View {
        let badge = OnboardingHeroOrb(symbol: "checkmark", size: heroSize * 0.92, glyphScale: 0.4, glyphWeight: .bold)

        return Group {
            if reduceMotion {
                badge
            } else {
                badge.keyframeAnimator(initialValue: 0.6, repeating: false) { content, scale in
                    content.scaleEffect(scale)
                } keyframes: { _ in
                    KeyframeTrack {
                        SpringKeyframe(1.08, duration: 0.35)
                        SpringKeyframe(1.0, duration: 0.3)
                    }
                }
            }
        }
    }

    private var tryItNowCard: some View {
        let phone = saved?.personalPhone ?? ""
        let trial = account?.isTrial == true
        let canText = saved?.sms != nil && !trial
        let canCall = saved?.caller != nil
        // One card, two rows, one accent color.
        return VStack(spacing: 0) {
            if FeatureFlags.messaging {
                tryRow(symbol: "message.fill",
                       title: "Text yourself a test",
                       detail: trial ? "Needs a paid Twilio account"
                            : !canText ? "Needs a number that can text"
                            : (phone.isEmpty ? "Opens a new message with a sample" : "To \(PhoneFormat.display(phone))"),
                       enabled: canText, id: "onboarding.tryText") {
                    leaveOnboarding {
                        store.openMessage(to: phone, from: saved?.sms, body: "Hi from Dialbubble 👋 — my first text!")
                    }
                }
                Divider().padding(.leading, 64)
            }
            tryRow(symbol: "phone.fill",
                   title: "Call yourself",
                   detail: !canCall ? "Needs a number that can call"
                        : (phone.isEmpty ? "Opens the keypad" : "Calls \(PhoneFormat.display(phone))"),
                   enabled: canCall, id: "onboarding.tryCall") {
                leaveOnboarding {
                    store.openDialer(to: phone, from: saved?.caller)
                }
            }
        }
        .padding(.vertical, Theme.Space.xxs)
        .glassEffect(.regular, in: .rect(cornerRadius: Theme.Radius.lg))
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Try it now")
    }

    private func tryRow(symbol: String, title: String, detail: String, enabled: Bool, id: String,
                        action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: Theme.Space.sm) {
                IconTile(symbol: symbol, color: enabled ? Theme.Palette.brandText : .secondary, size: 36)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(.headline).foregroundStyle(enabled ? .primary : .secondary)
                    Text(detail).font(.footnote).foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .multilineTextAlignment(.leading)
                Spacer(minLength: 4)
                Image(systemName: "chevron.forward").font(.footnote.weight(.semibold)).foregroundStyle(.secondary)
                    .accessibilityHidden(true)
            }
            .padding(.horizontal, Theme.Space.md)
            .padding(.vertical, Theme.Space.sm)
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .disabled(!enabled)
        .accessibilityIdentifier(id)
    }

    private func summaryRow(done: Bool, _ title: String, _ detail: String) -> some View {
        HStack(spacing: Theme.Space.sm) {
            Image(systemName: done ? "checkmark.circle.fill" : "circle.dashed")
                .font(.title3)
                .foregroundStyle(done ? Theme.Palette.success : Theme.Palette.warning)
                .frame(width: 24)
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.body.weight(.semibold))
                Text(detail).font(.footnote).foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }
        .padding(.horizontal, Theme.Space.md)
        .padding(.vertical, Theme.Space.sm)
        .accessibilityElement(children: .combine)
        .accessibilityValue(done ? "Done" : "Not yet")
    }

    /// Dismisses onboarding (after optionally routing somewhere first).
    private func leaveOnboarding(_ route: (() -> Void)? = nil) {
        clearPersisted()
        if let route { route() } else { store.selectedTab = .home }
        store.isOnboarding = false
    }

    // MARK: - Footer

    private var isBusy: Bool { isSaving || isStartingDemo }

    private var footer: some View {
        VStack(spacing: Theme.Space.xs) {
            if !isAccessibilitySize { footerHint }
            footerPrimary
            if !isAccessibilitySize { footerSecondary }
        }
        .frame(maxWidth: 600)
        .frame(maxWidth: .infinity)
        .animation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion), value: step)
    }

    /// At accessibility text sizes the bar keeps only the primary action; hints and secondary actions move into the scroll content.
    @ViewBuilder
    private var inlineSecondary: some View {
        VStack(spacing: 12) {
            footerHint
            footerSecondary
        }
        .frame(maxWidth: .infinity)
    }

    @ViewBuilder
    private var footerHint: some View {
        if step == .keys, !isConnected, let hint = draft.missingHint {
            Label(hint, systemImage: (draft.sidError ?? draft.keyError ?? draft.secretError) != nil ? "exclamationmark.circle" : "info.circle")
                .font(.footnote)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .contentTransition(.opacity)
                .accessibilityIdentifier("onboarding.hint")
        }
    }

    @ViewBuilder
    private var footerPrimary: some View {
        switch step {
        case .welcome:
            PrimaryButton(title: "Connect Twilio Account", symbol: "arrow.right") {
                cameFromGuide = false
                go(to: .keys)
            }
            .disabled(isBusy)
            .accessibilityHint("Shows where to find your Twilio keys")
            .accessibilityIdentifier("onboarding.connect")

        case .needAccount:
            PrimaryButton(title: "I'm back — let's connect", symbol: "arrow.right") {
                cameFromGuide = true
                go(to: .keys)
            }
            .accessibilityIdentifier("onboarding.guideDone")

        case .keys:
            PrimaryButton(title: isConnected ? "Continue" : "Connect", symbol: isConnected ? "arrow.right" : "bolt.horizontal.fill") { connect() }
                .disabled(!draft.isComplete)
                .accessibilityIdentifier("onboarding.submitCredentials")

        case .connect:
            if connectError != nil {
                if failedStage == 0 || failedStage == 3 {
                    PrimaryButton(title: "Try again", symbol: "arrow.clockwise") { connect() }
                        .accessibilityIdentifier("onboarding.retry")
                } else {
                    PrimaryButton(title: "Fix my keys", symbol: "key.fill") { goBack() }
                        .accessibilityIdentifier("onboarding.editCredentials")
                }
            } else if connectSucceeded {
                PrimaryButton(title: "Continue", symbol: "arrow.right") { go(to: .numbers) }
                    .accessibilityIdentifier("onboarding.next")
            } else {
                PrimaryButton(title: "Connecting…", isLoading: true) {}
                    .accessibilityIdentifier("onboarding.connecting")
            }

        case .numbers:
            PrimaryButton(title: "Continue", symbol: "arrow.right") { go(to: .phone) }
                .accessibilityIdentifier("onboarding.next")

        case .phone:
            PrimaryButton(title: isSaving ? "Saving…" : "Continue", symbol: "arrow.right", isLoading: isSaving) {
                saveAndCelebrate(skipPhone: false)
            }
            .disabled(!nationalNumber.isEmpty && !phoneValid)
            .accessibilityIdentifier("onboarding.next")

        case .done:
            PrimaryButton(title: "Start Using Dialbubble", symbol: "sparkles") { leaveOnboarding() }
                .accessibilityIdentifier("onboarding.finish")
        }
    }

    @ViewBuilder
    private var footerSecondary: some View {
        switch step {
        case .welcome:
            // Quiet text links under the single primary action.
            ViewThatFits(in: .horizontal) {
                HStack(spacing: Theme.Space.lg) { welcomeLinks }
                VStack(spacing: Theme.Space.xxs) { welcomeLinks }
            }

        case .needAccount:
            Button {
                startDemo()
            } label: {
                footerLinkLabel(isStartingDemo ? "Starting Demo…" : "Try the Demo Instead")
            }
            .disabled(isBusy)
            .accessibilityIdentifier("onboarding.guideDemo")

        case .connect:
            if connectError != nil {
                if failedStage == 0 || failedStage == 3 {
                    SecondaryButton(title: "Fix my keys", symbol: "key.fill") { goBack() }
                        .accessibilityIdentifier("onboarding.editCredentials")
                } else {
                    SecondaryButton(title: "Try again", symbol: "arrow.clockwise") { connect() }
                        .accessibilityIdentifier("onboarding.retry")
                }
            }

        case .phone:
            Button {
                saveAndCelebrate(skipPhone: true)
            } label: {
                footerLinkLabel("Skip for Now")
            }
            .disabled(isSaving)
            .accessibilityHint("You can add your phone later")
            .accessibilityIdentifier("onboarding.skipPhone")

        case .keys, .numbers, .done:
            EmptyView()
        }
    }

    @ViewBuilder
    private var welcomeLinks: some View {
        Button {
            startDemo()
        } label: {
            footerLinkLabel(isStartingDemo ? "Starting Demo…" : "Try the Demo")
        }
        .disabled(isBusy)
        .accessibilityHint("Explore with simulated data. Nothing is sent or charged.")
        .accessibilityIdentifier("onboarding.tryDemo")

        Button {
            cameFromGuide = true
            go(to: .needAccount)
        } label: {
            footerLinkLabel("New to Twilio? Start here")
        }
        .disabled(isBusy)
        .accessibilityHint("Shows how to create a free Twilio account")
        .accessibilityIdentifier("onboarding.noAccount")
    }

    /// Mint text link with a full 44pt tap target.
    private func footerLinkLabel(_ title: String) -> some View {
        Text(title)
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(Theme.Palette.brandText)
            .multilineTextAlignment(.center)
            .frame(minHeight: 44)
            .contentShape(.rect)
            .contentTransition(.opacity)
    }

    // MARK: - Navigation

    private func go(to s: Step) {
        forward = s > step
        withAnimation(reduceMotion ? .easeInOut(duration: 0.2) : .spring(duration: 0.45, bounce: 0.12)) { step = s }
    }

    private func goBack() {
        switch step {
        case .welcome, .done: return
        case .needAccount: go(to: .welcome)
        case .keys: go(to: cameFromGuide ? .needAccount : .welcome)
        case .connect:
            connectTask?.cancel()
            go(to: .keys)
        case .numbers: go(to: .keys)
        case .phone: go(to: .numbers)
        }
    }

    private func stepDidChange(_ new: Step) {
        if new != .done { UserDefaults.standard.set(new.rawValue, forKey: K.step) }
        if new != .keys { clipboardReady = false }
        // VoiceOver: announce the new screen and land on its heading.
        AccessibilityNotification.ScreenChanged().post()
        headerFocused = false
        Task { @MainActor in
            try? await Task.sleep(for: .milliseconds(450))
            headerFocused = true
        }
    }

    // MARK: - Persistence (non-secret only)

    private func persistFields() {
        let d = UserDefaults.standard
        guard step != .done, saved == nil else { return }
        d.set(draft.trimmedSid, forKey: K.sid)
        d.set(draft.useAPIKey ? draft.trimmedKey : "", forKey: K.keySid)
        d.set(accountName, forKey: K.name)
        d.set(nationalNumber, forKey: K.phone)
        d.set(country.iso, forKey: K.country)
    }

    private func clearPersisted() {
        for key in K.all { UserDefaults.standard.removeObject(forKey: key) }
    }

    // MARK: - Demo

    private func startDemo() {
        guard !isStartingDemo else { return }
        isStartingDemo = true
        demoError = nil
        Task {
            await store.startDemo()
            isStartingDemo = false
            if !store.hasAccount, let error = store.lastError {
                withAnimation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion)) { demoError = error }
                toast.show(error.title, style: .error)
            } else {
                clearPersisted()
            }
        }
    }
}

#Preview {
    OnboardingView()
        .environment(AppStore())
        .environment(ToastCenter.shared)
        .toastHost()
}
