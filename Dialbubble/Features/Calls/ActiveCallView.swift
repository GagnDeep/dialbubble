import SwiftUI

struct ActiveCallView: View {
    @Environment(AppStore.self) private var store
    let session: LiveCallSession

    @State private var call: TwilioCall
    @State private var childLeg: TwilioCall?
    @State private var connectedAt: Date?
    @State private var isEnding = false
    @State private var showSpeak = false
    @State private var speakText = ""
    @State private var actionError: FriendlyError?
    @State private var speakSent = 0
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @ScaledMetric(relativeTo: .largeTitle) private var avatarSize: CGFloat = 104
    @ScaledMetric(relativeTo: .title2) private var controlSize: CGFloat = 74
    @ScaledMetric(relativeTo: .title2) private var controlGlyph: CGFloat = 26
    @ScaledMetric(relativeTo: .body) private var stageDot: CGFloat = 34
    @ScaledMetric(relativeTo: .headline) private var topButtonSize: CGFloat = 44

    private var motion: Animation? { Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion) }

    /// Subtle background glow: brand while the call is live, semantic color once it ends.
    private var glowColor: Color {
        switch displayStatus {
        case .failed, .busy, .noAnswer: return Theme.Palette.danger
        case .completed, .canceled: return .gray
        default: return Theme.Palette.brand
        }
    }

    /// Captured when the call starts: with it on, the other person is dialed only after you press a key.
    private let confirmBeforeConnect: Bool

    /// Readable glyph color for the hero avatar (mint text tone while live).
    private var heroGlyphColor: Color {
        switch displayStatus {
        case .failed, .busy, .noAnswer: return Theme.Palette.danger
        case .completed, .canceled: return .secondary
        default: return Theme.Palette.brandText
        }
    }

    init(session: LiveCallSession) {
        self.session = session
        _call = State(initialValue: session.call)
        confirmBeforeConnect = AppStore.confirmBeforeConnect
    }

    private var isBridge: Bool { session.mode == .bridge }
    private var parentStatus: CallStatus { call.statusKind }
    private var childStatus: CallStatus? { childLeg?.statusKind }

    /// For Talk calls, the user-visible status is the destination leg once it exists.
    private var displayStatus: CallStatus {
        if isBridge, parentStatus == .inProgress, let childStatus { return childStatus }
        return parentStatus
    }
    private var isTerminal: Bool { !parentStatus.isActive && parentStatus != .unknown }
    /// The other person never picked up (busy, no answer, failed): offer a text instead.
    private var didntReach: Bool {
        [.noAnswer, .busy, .failed].contains(displayStatus) || (isBridge && childLeg.map { [.noAnswer, .busy, .failed].contains($0.statusKind) } == true)
    }
    private var isConnected: Bool { (isBridge ? childStatus : parentStatus) == .inProgress }

    private var destinationText: String { ContactBook.shared.label(for: session.destination) }
    private var fromName: String {
        store.configuredNumber(for: session.from)?.displayName ?? PhoneFormat.display(session.from)
    }

    // MARK: Talk-mode stages

    private enum Stage: Int, CaseIterable {
        case callingYou, answer, pressKey, connecting, connected
    }

    /// The steps this call actually goes through ("press a key" only when confirm-to-connect is on).
    private var stages: [Stage] {
        Stage.allCases.filter { $0 != .pressKey || confirmBeforeConnect }
    }

    private var stage: Stage {
        if childStatus == .inProgress || (childStatus == .completed && isTerminal) { return .connected }
        if childLeg != nil { return .connecting }
        if parentStatus == .inProgress { return confirmBeforeConnect ? .pressKey : .connecting }
        if parentStatus == .ringing { return .answer }
        return .callingYou
    }

    /// "…8856" — enough to recognise your own phone without shouting the full number.
    private var myPhoneHint: String? {
        guard let me = store.activeProfile?.personalPhone.nilIfBlank else { return nil }
        let digits = me.filter(\.isNumber)
        return digits.count >= 4 ? "…" + digits.suffix(4) : nil
    }

    private func stageTitle(_ s: Stage) -> String {
        switch s {
        case .callingYou: return "Calling your phone"
        case .answer: return myPhoneHint.map { "Answer on your phone (\($0))" } ?? "Answer on your phone"
        case .pressKey: return "Press any key on your phone to connect"
        case .connecting: return "Calling \(destinationText)"
        case .connected: return "Connected"
        }
    }

    private func stageSymbol(_ s: Stage) -> String {
        switch s {
        case .callingYou: return "iphone.gen3.radiowaves.left.and.right"
        case .answer: return "phone.arrow.down.left.fill"
        case .pressKey: return "circle.grid.3x3.fill"
        case .connecting: return "phone.arrow.up.right.fill"
        case .connected: return "waveform"
        }
    }

    /// Large, plain-language status line.
    private var headline: String {
        if isTerminal { return endedHeadline }
        if isBridge {
            switch stage {
            case .connected: return "Connected"
            case .pressKey: return "Press any key to connect"
            case .connecting: return childStatus == .ringing ? "Ringing…" : "Calling…"
            case .answer: return stageTitle(.answer)
            case .callingYou: return "Calling your phone…"
            }
        }
        switch parentStatus {
        case .queued, .initiated: return "Calling…"
        case .ringing: return "Ringing…"
        case .inProgress:
            switch session.mode {
            case .say: return "Connected · Speaking message"
            case .play: return "Connected · Playing audio"
            default: return "Connected"
            }
        default: return parentStatus.label
        }
    }

    private var endedHeadline: String {
        if isBridge {
            if childLeg == nil {
                switch parentStatus {
                case .noAnswer: return "You didn't answer"
                case .busy: return "Your phone was busy"
                case .canceled: return "Call canceled"
                case .failed: return "Couldn't reach your phone"
                default: return confirmBeforeConnect ? "Not connected" : "Call ended"
                }
            }
            switch childStatus {
            case .noAnswer: return "No answer"
            case .busy: return "Line busy"
            case .failed: return "Call failed"
            default: return "Call ended"
            }
        }
        switch parentStatus {
        case .noAnswer: return "No answer"
        case .busy: return "Line busy"
        case .failed: return "Call failed"
        case .canceled: return "Call canceled"
        default: return "Call ended"
        }
    }

    private var endedHint: String? {
        guard isTerminal else { return nil }
        if isBridge, childLeg == nil, parentStatus == .completed, confirmBeforeConnect {
            return "After answering, press any key on your phone. That's when Dialbubble dials the other person."
        }
        if isBridge, childLeg == nil, parentStatus != .completed && parentStatus != .canceled {
            let phone = store.activeProfile?.personalPhone.nilIfBlank.map { PhoneFormat.display($0) } ?? "your phone"
            return "Twilio calls \(phone) first. Make sure it can receive calls, then try again."
        }
        if parentStatus == .failed {
            return "Check the number and your Twilio Geo Permissions, then try again."
        }
        return nil
    }

    var body: some View {
        ZStack {
            ScrollView {
                VStack(spacing: isBridge ? 16 : 22) {
                    topBar

                    CallHeroAvatar(key: session.destination, plate: glowColor, glyph: heroGlyphColor, size: min(avatarSize, isBridge ? 92 : 112))
                        .modifier(RingingPulse(isActive: !isTerminal && displayStatus == .ringing && !reduceMotion))
                        .padding(.top, isBridge ? 0 : 8)
                        .accessibilityHidden(true)

                    VStack(spacing: 8) {
                        Text(destinationText)
                            .font(.system(.largeTitle, design: .rounded).weight(.semibold))
                            .monospacedDigit()
                            .multilineTextAlignment(.center)
                            .minimumScaleFactor(0.6)
                            .lineLimit(1)
                        if ContactBook.shared.name(for: session.destination) != nil {
                            Text(PhoneFormat.display(session.destination))
                                .font(.headline.monospacedDigit())
                                .foregroundStyle(.secondary)
                        }
                        Label("via \(fromName)", systemImage: "phone.arrow.up.right")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.horizontal)

                    VStack(spacing: 10) {
                        Text(headline)
                            .font(.title2.weight(.bold))
                            .multilineTextAlignment(.center)
                            .fixedSize(horizontal: false, vertical: true)
                            .contentTransition(.opacity)
                            .accessibilityIdentifier("activeCall.status")
                            .accessibilityAddTraits(.updatesFrequently)
                        timer
                    }
                    .animation(motion, value: headline)
                    .padding(.horizontal)

                    if isBridge { bridgeTimeline } else { automatedTimeline }

                    if let endedHint {
                        Callout(style: .tip, title: "What to try", message: endedHint)
                            .padding(.horizontal, 24)
                            .transition(.opacity)
                    }

                    if let actionError {
                        FriendlyErrorView(error: actionError, onDismiss: { withAnimation(motion) { self.actionError = nil } })
                            .padding(.horizontal, 24)
                    }
                }
                .padding(.top)
                .frame(maxWidth: 520)
                .frame(maxWidth: .infinity)
            }
            .scrollBounceBehavior(.basedOnSize)
            .relayBackground(glowColor)
            .animation(Theme.Motion.adaptive(Theme.Motion.smooth, reduceMotion), value: glowColor)
            .safeAreaInset(edge: .bottom) {
                controls.padding(.vertical, 16)
            }
        }
        .task(id: call.sid) { await poll() }
        // Keep the screen awake while the call is live, so progress stays visible without touching the phone.
        .onAppear { UIApplication.shared.isIdleTimerDisabled = true }
        .onChange(of: isTerminal) { _, ended in UIApplication.shared.isIdleTimerDisabled = !ended }
        .onDisappear { UIApplication.shared.isIdleTimerDisabled = false }
        .sensoryFeedback(.success, trigger: connectedAt != nil)
        .sensoryFeedback(.impact(weight: .heavy), trigger: isTerminal)
        .sensoryFeedback(.success, trigger: speakSent)
        .onChange(of: headline) { _, new in
            AccessibilityNotification.Announcement(new).post()
        }
        .alert("Speak to the caller", isPresented: $showSpeak) {
            TextField("Message", text: $speakText)
            Button("Speak") { speak() }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Twilio will read this aloud now, replacing what the call was doing.")
        }
    }

    // MARK: Pieces

    private var topBar: some View {
        HStack {
            Button {
                // Ended calls just close; live ones keep a "Return to Call" bar at the top of the app.
                if isTerminal { store.liveCall = nil } else { store.minimizeCall() }
            } label: {
                Image(systemName: "chevron.down")
                    .font(.headline)
                    .frame(width: topButtonSize, height: topButtonSize)
            }
            .buttonStyle(.glass)
            .buttonBorderShape(.circle)
            .accessibilityLabel("Minimize call screen")
            .accessibilityIdentifier("activeCall.minimize")
            Spacer()
            if store.isDemo && !LaunchOptions.marketing {
                Badge(text: "Demo", color: Theme.Palette.brandText, symbol: "sparkles")
                    .accessibilityElement(children: .ignore)
                    .accessibilityLabel("Demo mode. This call is simulated.")
            }
            Label(session.mode.title, systemImage: session.mode.symbol)
                .font(.footnote.weight(.semibold))
                .padding(.horizontal, 12).padding(.vertical, 8)
                .glassEffect(.regular, in: .capsule)
        }
        .padding(.horizontal)
    }

    @ViewBuilder
    private var timer: some View {
        if let connectedAt {
            TimelineView(.periodic(from: connectedAt, by: 1)) { ctx in
                let end = isTerminal ? (call.endTime ?? ctx.date) : ctx.date
                let seconds = max(0, Int(end.timeIntervalSince(connectedAt)))
                Text(seconds.durationString)
                    .font(.title3.monospacedDigit().weight(.medium))
                    .foregroundStyle(.secondary)
                    .contentTransition(.numericText(countsDown: false))
                    .animation(motion, value: seconds)
                    .accessibilityLabel("Duration \(Self.spokenDuration(seconds))")
            }
        } else if isTerminal, call.durationSeconds > 0 {
            Text(call.durationSeconds.durationString)
                .font(.title3.monospacedDigit().weight(.medium))
                .foregroundStyle(.secondary)
                .accessibilityLabel("Duration \(Self.spokenDuration(call.durationSeconds))")
        }
    }

    private var bridgeTimeline: some View {
        GlassCard(cornerRadius: Theme.Radius.lg) {
            VStack(alignment: .leading, spacing: 0) {
                ForEach(stages, id: \.rawValue) { s in
                    let done = s.rawValue < stage.rawValue || (s == .connected && stage == .connected)
                    let active = s == stage && !isTerminal && s != .connected
                    let failed = isTerminal && s == stage && stage != .connected
                    HStack(spacing: 14) {
                        ZStack {
                            Circle()
                                .fill(active ? Theme.Palette.brand
                                      : done ? Theme.Palette.brand.opacity(0.16)
                                      : failed ? Theme.Palette.danger.opacity(0.16)
                                      : Color.secondary.opacity(0.14))
                                .frame(width: min(stageDot, 52), height: min(stageDot, 52))
                            Image(systemName: done ? "checkmark" : failed ? "xmark" : stageSymbol(s))
                                .font(.footnote.weight(.bold))
                                .foregroundStyle(active ? Color.white
                                                 : done ? Theme.Palette.brandText
                                                 : failed ? Theme.Palette.danger
                                                 : Color.secondary)
                                .symbolEffect(.pulse, isActive: active && !reduceMotion)
                                .contentTransition(.symbolEffect(.replace))
                        }
                        Text(stageTitle(s))
                            .font(.subheadline.weight(active ? .semibold : .regular))
                            .fixedSize(horizontal: false, vertical: true)
                            .foregroundStyle(done || active ? .primary : .secondary)
                        Spacer(minLength: 0)
                        if active { ProgressView().controlSize(.small) }
                    }
                    .padding(.vertical, 4)
                    .accessibilityElement(children: .combine)
                    .accessibilityValue(done ? "Done" : active ? "In progress" : failed ? "Failed" : "Waiting")

                    if s != .connected {
                        Rectangle()
                            .fill(done ? Theme.Palette.brand.opacity(0.45) : Color.secondary.opacity(0.2))
                            .frame(width: 2, height: 14)
                            .padding(.leading, min(stageDot, 52) / 2 - 1)
                    }
                }
            }
        }
        .padding(.horizontal, 24)
        .animation(motion, value: stage)
    }

    // MARK: Automated-call progress (Voice Message, Play Audio, TwiML)

    private enum StepState { case waiting, active, done, failed }

    /// The same calm step list Talk calls get, so automated calls show what's happening instead of empty space.
    private var automatedTimeline: some View {
        let reached = connectedAt != nil
        let status = parentStatus
        let dialing: StepState, answered: StepState, playing: StepState
        switch status {
        case .queued, .initiated, .ringing, .unknown: (dialing, answered, playing) = (.active, .waiting, .waiting)
        case .inProgress: (dialing, answered, playing) = (.done, .done, .active)
        case .completed: (dialing, answered, playing) = (.done, .done, .done)
        case .busy, .failed, .noAnswer, .canceled:
            (dialing, answered, playing) = reached ? (.done, .done, .done) : (.failed, .waiting, .waiting)
        }
        let action: (String, String) = switch session.mode {
        case .say: ("Speaking your message", "waveform")
        case .play: ("Playing your audio", "play.fill")
        default: ("Running your TwiML", "chevron.left.forwardslash.chevron.right")
        }
        let steps: [(String, String, StepState)] = [
            ("Ringing their phone", "phone.arrow.up.right.fill", dialing),
            (status == .busy ? "Line busy" : status == .noAnswer ? "No answer" : "They pick up", "person.fill", answered == .waiting && dialing == .failed ? .waiting : answered),
            (action.0, action.1, playing),
        ]
        return GlassCard(cornerRadius: Theme.Radius.lg) {
            VStack(alignment: .leading, spacing: 0) {
                ForEach(steps.indices, id: \.self) { i in
                    stepRow(title: steps[i].0, symbol: steps[i].1, state: steps[i].2)
                    if i < steps.count - 1 {
                        Rectangle()
                            .fill(steps[i].2 == .done ? Theme.Palette.brand.opacity(0.45) : Color.secondary.opacity(0.2))
                            .frame(width: 2, height: 14)
                            .padding(.leading, min(stageDot, 52) / 2 - 1)
                    }
                }
            }
        }
        .padding(.horizontal, 24)
        .animation(motion, value: status)
    }

    private func stepRow(title: String, symbol: String, state: StepState) -> some View {
        HStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(state == .active ? Theme.Palette.brand
                          : state == .done ? Theme.Palette.brand.opacity(0.16)
                          : state == .failed ? Theme.Palette.danger.opacity(0.16)
                          : Color.secondary.opacity(0.14))
                    .frame(width: min(stageDot, 52), height: min(stageDot, 52))
                Image(systemName: state == .done ? "checkmark" : state == .failed ? "xmark" : symbol)
                    .font(.footnote.weight(.bold))
                    .foregroundStyle(state == .active ? Color.white
                                     : state == .done ? Theme.Palette.brandText
                                     : state == .failed ? Theme.Palette.danger
                                     : Color.secondary)
                    .symbolEffect(.pulse, isActive: state == .active && !reduceMotion)
                    .contentTransition(.symbolEffect(.replace))
            }
            Text(title)
                .font(.subheadline.weight(state == .active ? .semibold : .regular))
                .fixedSize(horizontal: false, vertical: true)
                .foregroundStyle(state == .waiting ? .secondary : .primary)
            Spacer(minLength: 0)
            if state == .active { ProgressView().controlSize(.small) }
        }
        .padding(.vertical, 4)
        .accessibilityElement(children: .combine)
        .accessibilityValue(state == .done ? "Done" : state == .active ? "In progress" : state == .failed ? "Failed" : "Waiting")
    }

    private enum ControlStyle { case neutral, brand, danger }

    private var controls: some View {
        GlassEffectContainer(spacing: 28) {
            HStack(spacing: 28) {
                if !isTerminal && !isBridge && parentStatus == .inProgress {
                    controlButton("Speak", symbol: "text.bubble.fill", style: .neutral, id: "activeCall.speak") {
                        speakText = ""
                        showSpeak = true
                    }
                }

                if isTerminal && didntReach && FeatureFlags.messaging && !store.smsNumbers.isEmpty {
                    controlButton("Text", symbol: "message.fill", style: .neutral, id: "activeCall.text") {
                        let from = store.smsNumbers.contains { $0.phoneNumber == session.from } ? session.from : nil
                        store.liveCall = nil
                        store.openMessage(to: session.destination, from: from)
                    }
                }
                if isTerminal {
                    controlButton("Call Again", symbol: "arrow.clockwise", style: .brand, id: "activeCall.again") {
                        store.liveCall = nil
                        store.openDialer(to: session.destination, from: session.from)
                    }
                    controlButton("Done", symbol: "checkmark", style: .neutral, id: "activeCall.done") {
                        store.liveCall = nil
                    }
                } else {
                    controlButton(parentStatus == .inProgress ? "Hang Up" : "Cancel",
                                  symbol: "phone.down.fill", style: .danger, busy: isEnding, id: "activeCall.hangup") {
                        hangUp()
                    }
                }
            }
        }
        .animation(motion, value: isTerminal)
    }

    @ViewBuilder
    private func controlButton(_ title: String, symbol: String, style: ControlStyle, busy: Bool = false, id: String, action: @escaping () -> Void) -> some View {
        let side = min(controlSize, 110)
        let label = Group {
            if busy { ProgressView().tint(style == .neutral ? nil : .white) } else {
                Image(systemName: symbol).font(.system(size: min(controlGlyph, 40), weight: .semibold))
            }
        }
        .frame(width: side, height: side)

        VStack(spacing: 8) {
            Group {
                switch style {
                case .neutral:
                    Button(action: action) { label.foregroundStyle(.primary) }
                        .buttonStyle(.glass)
                case .brand:
                    Button(action: action) { label }
                        .buttonStyle(.glassProminent)
                        .tint(Theme.Palette.brand)
                case .danger:
                    Button(action: action) { label }
                        .buttonStyle(.glassProminent)
                        .tint(Theme.Palette.danger)
                }
            }
            .buttonBorderShape(.circle)
            .disabled(busy)
            .accessibilityLabel(title)
            .accessibilityIdentifier(id)
            Text(title).font(.footnote.weight(.medium))
                .lineLimit(1)
                .minimumScaleFactor(0.8)
                .accessibilityHidden(true)
        }
    }

    /// "1 minute, 15 seconds" rather than "75 seconds" for VoiceOver.
    private static func spokenDuration(_ seconds: Int) -> String {
        Duration.seconds(seconds).formatted(.units(allowed: [.hours, .minutes, .seconds], width: .wide))
    }

    // MARK: Behaviour

    private func poll() async {
        guard let client = store.client else { return }
        while !Task.isCancelled {
            do {
                let updated = try await client.fetchCall(sid: call.sid)
                withAnimation(motion) { call = updated }
                store.updateCallInList(updated)
                if isBridge, updated.statusKind == .inProgress || updated.statusKind == .completed {
                    if let child = try? await client.fetchChildCalls(parentSid: updated.sid).first {
                        withAnimation(motion) { childLeg = child }
                    }
                }
                let liveStatus = isBridge ? childLeg?.statusKind : updated.statusKind
                if connectedAt == nil, liveStatus == .inProgress {
                    let start = (isBridge ? childLeg?.startTime : updated.startTime) ?? .now
                    withAnimation(motion) { connectedAt = start < session.startedAt ? .now : start }
                }
                if !updated.statusKind.isActive && updated.statusKind != .unknown {
                    if isBridge, let child = childLeg, child.statusKind.isActive,
                       let fresh = try? await client.fetchCall(sid: child.sid) {
                        childLeg = fresh
                    }
                    break
                }
                if actionError != nil { withAnimation(motion) { actionError = nil } }
            } catch {
                if error is CancellationError { return }
                withAnimation(motion) { actionError = FriendlyError(error) }
            }
            try? await Task.sleep(for: .seconds(2))
        }
    }

    private func hangUp() {
        guard let client = store.client else { return }
        isEnding = true
        let cancel = parentStatus == .queued || parentStatus == .ringing || parentStatus == .initiated
        Task {
            defer { isEnding = false }
            do {
                let updated = try await client.endCall(sid: call.sid, cancel: cancel)
                withAnimation(motion) { call = updated }
                store.updateCallInList(updated)
            } catch {
                // A queued call may have started ringing; retry as complete.
                if cancel, let updated = try? await client.endCall(sid: call.sid, cancel: false) {
                    withAnimation(motion) { call = updated }
                    store.updateCallInList(updated)
                } else {
                    withAnimation(motion) { actionError = FriendlyError(error) }
                }
            }
        }
    }

    private func speak() {
        guard let client = store.client, let text = speakText.nilIfBlank else { return }
        let xml = "<Response>\(TwiML.say(text, voice: .default))<Pause length=\"60\"/></Response>"
        Task {
            do {
                _ = try await client.updateCallTwiML(sid: call.sid, twiml: xml)
                speakSent += 1
            } catch {
                withAnimation(motion) { actionError = FriendlyError(error) }
            }
        }
    }
}

/// Gentle "breathing" scale while the other side rings. Uses `phaseAnimator` so it can't get stuck
/// when the status changes, and is removed entirely when inactive (e.g. Reduce Motion).
private struct RingingPulse: ViewModifier {
    var isActive: Bool

    func body(content: Content) -> some View {
        if isActive {
            content.phaseAnimator([false, true]) { view, grown in
                view.scaleEffect(grown ? 1.05 : 1)
            } animation: { _ in
                .easeInOut(duration: 0.9)
            }
        } else {
            content
        }
    }
}

/// Calm tonal avatar for the call screen: a tinted plate with a person glyph and a soft glow.
private struct CallHeroAvatar: View {
    var key: String
    var plate: Color
    var glyph: Color
    var size: CGFloat
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        TonalAvatarGlyph(key: key, size: size * 0.95, tone: glyph)
            .frame(width: size, height: size)
            .background(plate.opacity(scheme == .dark ? 0.2 : 0.14), in: .circle)
            .overlay(Circle().strokeBorder(plate.opacity(0.25), lineWidth: 1))
            .shadow(color: plate.opacity(scheme == .dark ? 0.35 : 0.2), radius: 30)
    }
}
