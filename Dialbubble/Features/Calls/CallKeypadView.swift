import SwiftUI
import TipKit
import AudioToolbox

struct CallKeypadView: View {
    @Environment(AppStore.self) private var store
    @Environment(ToastCenter.self) private var toast
    @Binding var number: String
    @Binding var from: String?

    @State private var mode: CallMode = .bridge
    @State private var contactName: String?
    @State private var composer: CallComposerRequest?
    @State private var isPlacing = false
    @State private var keyTaps = 0
    @State private var nudges = 0
    @State private var shakes = 0
    @State private var showBlocker = false
    @State private var showPersonalPhoneSheet = false
    @State private var showGuide = false
    @State private var callError: FriendlyError?
    @State private var tips = TipGroup(.ordered) {
        CallFromNumberTip()
        CallModesTip()
    }
    @Namespace private var modeNS
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    /// Grows the keypad with Dynamic Type; clamped below so the layout still fits on an iPhone SE.
    @ScaledMetric(relativeTo: .title) private var keyScale: CGFloat = 1
    @ScaledMetric(relativeTo: .largeTitle) private var displayFontSize: CGFloat = 36
    @ScaledMetric(relativeTo: .body) private var displayLineHeight: CGFloat = 22

    private var motion: Animation? { Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion) }

    private static let keys: [(String, String, String)] = [
        ("1", "", "1"), ("2", "ABC", "2"), ("3", "DEF", "3"),
        ("4", "GHI", "4"), ("5", "JKL", "5"), ("6", "MNO", "6"),
        ("7", "PQRS", "7"), ("8", "TUV", "8"), ("9", "WXYZ", "9"),
        ("*", "", "star"), ("0", "+", "0"), ("#", "", "hash"),
    ]

    private var digitCount: Int { number.filter(\.isNumber).count }
    private var hasSymbols: Bool { number.contains("*") || number.contains("#") }

    /// What was typed, grouped for reading — never rewritten with a country code the user didn't type.
    private var formatted: String {
        guard !number.isEmpty else { return "" }
        if hasSymbols || digitCount < 4 { return number }
        if number.hasPrefix("+"), digitCount >= 8 { return PhoneFormat.display("+" + number.filter(\.isNumber)) }
        return Self.group(number)
    }

    /// The exact E.164 number Twilio will dial.
    private var dialed: String { store.normalize(number) }

    /// True when the dialed number isn't literally what was typed (country code added, trunk 0 dropped, 00 → +).
    private var dialedDiffers: Bool {
        guard !hasSymbols, digitCount >= 7 else { return false }
        let typed = (number.hasPrefix("+") ? "+" : "") + number.filter(\.isNumber)
        return typed != dialed
    }

    /// Twilio blocks `<Dial><Number>` on trial accounts, so a Talk call would only play a "not available" notice.
    private var trialBlocksTalk: Bool {
        mode == .bridge && store.activeProfile?.isTrial == true
    }

    private var needsPersonalPhone: Bool {
        mode == .bridge && !trialBlocksTalk && store.activeProfile?.personalPhone.nilIfBlank == nil
    }

    /// Why the number can't be called yet. Only surfaced after the user tries to call.
    private var blocker: String? {
        if number.isEmpty { return nil }
        if digitCount < 7 { return "Numbers need at least 7 digits" }
        if digitCount > 15 { return "That's too long for a phone number" }
        if trialBlocksTalk { return AppStore.trialTalkMessage }
        return nil
    }

    private var recentNumbers: [String] {
        var seen = Set<String>()
        var result: [String] = []
        let me = store.activeProfile?.personalPhone.nilIfBlank.map(store.normalize)
        // One pass to map Talk calls to the person actually dialed (their child leg), instead of a search per call.
        var childTo: [String: String] = [:]
        for call in store.calls { if let parent = call.parentCallSid, let to = call.to, childTo[parent] == nil { childTo[parent] = to } }
        for call in store.calls {
            var n = call.counterpart
            if let me, n == me, let child = childTo[call.sid] { n = child }
            if call.parentCallSid != nil || n.isEmpty || n == me || store.ownNumberSet.contains(n) { continue }
            if seen.insert(n).inserted { result.append(n) }
            if result.count == 8 { break }
        }
        return result
    }

    /// The person being dialed: picked from Contacts, or recognized from the typed number.
    private var resolvedName: String? {
        if let contactName { return contactName }
        guard digitCount >= 7, !hasSymbols else { return nil }
        return ContactBook.shared.name(for: dialed)
    }

    /// One quiet suggestion for what's being typed: a recent number containing the digits, else a contact
    /// whose number contains them or whose name they spell on the keypad (5-5-6 → "Leo").
    private var suggestion: (number: String, name: String?, isRecent: Bool)? {
        let typed = number.filter(\.isNumber)
        guard typed.count >= 2, !hasSymbols, !number.hasPrefix("+") else { return nil }
        if typed.count >= 3, let recent = recentNumbers.first(where: { $0.filter(\.isNumber).contains(typed) && $0 != dialed }) {
            return (recent, ContactBook.shared.name(for: recent), true)
        }
        guard digitCount < 10 || ContactBook.shared.name(for: dialed) == nil else { return nil }
        if let person = ContactBook.shared.matches(forDigits: typed, limit: 1).first,
           ContactBook.key(person.number) != ContactBook.key(dialed) {
            return (person.number, person.name, false)
        }
        return nil
    }

    var body: some View {
        Group {
            if store.callerNumbers.isEmpty {
                noNumbers
            } else {
                GeometryReader { geo in
                    let size = keySize(for: geo.size)
                    ScrollView {
                        VStack(spacing: 0) {
                            display
                                .padding(.top, Theme.Space.xs)

                            Spacer(minLength: Theme.Space.md)

                            keypad(size: size)

                            if trialBlocksTalk {
                                trialTalkHint
                                    .padding(.top, Theme.Space.md)
                            } else if needsPersonalPhone {
                                personalPhoneHint
                                    .padding(.top, Theme.Space.md)
                            }

                            modeSelector
                                .padding(.top, Theme.Space.md)

                            actionRow(size: size)
                                .padding(.top, Theme.Space.sm)
                                .padding(.bottom, Theme.Space.sm)
                        }
                        .frame(maxWidth: 460)
                        .frame(maxWidth: .infinity)
                        .frame(minHeight: geo.size.height)
                    }
                    .scrollBounceBehavior(.basedOnSize)
                }
            }
        }
        .relayBackground()
        .toolbar {
            if !store.callerNumbers.isEmpty {
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        showGuide = true
                    } label: {
                        Image(systemName: "info.circle")
                    }
                    .accessibilityLabel("How calling works")
                    .accessibilityHint("Explains Talk, Voice Message, Play Audio and Custom TwiML")
                    .accessibilityIdentifier("keypad.modesInfo")
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        ContactPicker.pickPhone { phone, name in
                            number = phone.filter { $0.isNumber || $0 == "+" }
                            contactName = name.nilIfBlank
                        }
                    } label: {
                        Image(systemName: "person.crop.circle.badge.plus")
                    }
                    .accessibilityLabel("Choose from Contacts")
                }
            }
        }
        .sensoryFeedback(.impact(weight: .light), trigger: keyTaps)
        .sensoryFeedback(.warning, trigger: nudges)
        .sensoryFeedback(.error, trigger: callError) { _, new in new != nil }
        .sheet(item: $composer) { req in
            CallComposerSheet(request: req)
        }
        .sheet(isPresented: $showPersonalPhoneSheet) {
            CallPersonalPhoneSheet { startCall() }
        }
        .sheet(isPresented: $showGuide) {
            CallModesGuideSheet()
        }
        .onChange(of: number) { old, new in
            if new.isEmpty || (contactName != nil && !old.isEmpty && new.count < old.count) { contactName = nil }
            callError = nil
            showBlocker = false
        }
        .onChange(of: mode) { _, _ in
            CallModesTip().invalidate(reason: .actionPerformed)
        }
    }

    private func keySize(for size: CGSize) -> CGFloat {
        let byWidth = (min(size.width, 460) - 44 - 48) / 3
        // Display block, mode switch and gaps take ~280pt; the 4 key rows plus the
        // call button (1.08×) must fit in the rest so the call button never sits under the tab bar.
        let reserved: CGFloat = 280 + (needsPersonalPhone || trialBlocksTalk ? 54 : 0)
        let byHeight = (size.height - reserved) / 5.1
        // Larger text sizes ask for bigger keys, but never wider than the screen allows.
        let preferred = 80 * min(max(keyScale, 1), 1.25)
        return max(58, min(preferred, byWidth, max(byHeight, 58)))
    }

    // MARK: Empty state

    private var noNumbers: some View {
        ContentUnavailableView {
            Label("No Numbers to Call From", systemImage: "phone.badge.plus")
        } description: {
            Text("To place calls you need a Twilio phone number with voice enabled, or a verified caller ID. Buy one in the Twilio Console, then sync it here.")
        } actions: {
            Button {
                store.selectedTab = .settings
            } label: {
                Label("Open Settings", systemImage: "gearshape.fill")
            }
            .buttonStyle(.glassProminent)
            .tint(Theme.Palette.brand)
            Link(destination: URL(string: "https://console.twilio.com/us1/develop/phone-numbers/manage/search")!) {
                Label("Buy a Number in Twilio", systemImage: "safari")
            }
            .buttonStyle(.glass)
            Button {
                Task { await store.syncNumbers() }
            } label: {
                Label("Sync Numbers", systemImage: "arrow.triangle.2.circlepath")
            }
            .buttonStyle(.glass)
        }
    }

    // MARK: Display

    private var display: some View {
        VStack(spacing: Theme.Space.xs) {
            Text(formatted.isEmpty ? "Enter number" : formatted)
                .font(.system(size: formatted.isEmpty ? displayFontSize * 0.72 : (formatted.count > 16 ? displayFontSize * 0.82 : displayFontSize),
                              weight: formatted.isEmpty ? .regular : .medium, design: .rounded))
                .monospacedDigit()
                .foregroundStyle(formatted.isEmpty ? Color.secondary.opacity(0.55) : Color.primary)
                .lineLimit(1)
                .minimumScaleFactor(0.5)
                .contentTransition(.numericText())
                .animation(motion, value: formatted)
                .frame(maxWidth: .infinity)
                .frame(minHeight: displayFontSize * 1.25)
                .modifier(ShakeEffect(trigger: shakes, isEnabled: !reduceMotion))
                .accessibilityIdentifier("keypad.display")
                .accessibilityLabel(number.isEmpty ? "No number entered" : "Number \(formatted)")
                .contextMenu {
                    Button("Paste", systemImage: "doc.on.clipboard") { paste() }
                    if !number.isEmpty {
                        Button("Copy", systemImage: "doc.on.doc") {
                            UIPasteboard.general.string = dialed
                            toast.show("Number copied", style: .success)
                        }
                    }
                }

            detailLine
                .frame(minHeight: displayLineHeight)

            fromLine
        }
        .padding(.horizontal, Theme.Space.lg)
        .animation(motion, value: showBlocker)
        .animation(motion, value: dialedDiffers)
    }

    /// One quiet line: a problem (after trying to call), the contact, what will actually be dialed, or a recent match.
    @ViewBuilder
    private var detailLine: some View {
        if showBlocker, !trialBlocksTalk, let blocker {
            Label {
                Text(blocker).foregroundStyle(.secondary)
            } icon: {
                Image(systemName: "exclamationmark.circle.fill").foregroundStyle(Theme.Palette.warning)
            }
            .font(.subheadline)
            .transition(.opacity)
        } else if resolvedName != nil || dialedDiffers {
            let parts = [resolvedName, dialedDiffers ? "Calls \(PhoneFormat.display(dialed))" : nil].compactMap { $0 }
            Text(parts.joined(separator: " · "))
                .font(.subheadline.monospacedDigit())
                .foregroundStyle(.secondary)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
                .transition(.opacity)
                .accessibilityLabel(dialedDiffers ? "Will call \(PhoneFormat.display(dialed))" : (resolvedName ?? ""))
                .accessibilityIdentifier("keypad.dialedNumber")
        } else if let suggestion {
            Button {
                number = suggestion.number.filter { $0.isNumber || $0 == "+" }
                contactName = suggestion.name
                keyTaps += 1
            } label: {
                Label(suggestion.name.map { "\($0) · \(PhoneFormat.display(suggestion.number))" } ?? PhoneFormat.display(suggestion.number),
                      systemImage: suggestion.isRecent ? "clock.arrow.circlepath" : "person.crop.circle")
                    .font(.subheadline.weight(.medium).monospacedDigit())
                    .foregroundStyle(Theme.Palette.brandText)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
            .buttonStyle(.plain)
            .transition(.opacity)
            .accessibilityLabel("\(suggestion.isRecent ? "Recent" : "Contact") \(suggestion.name ?? PhoneFormat.display(suggestion.number))")
            .accessibilityHint("Puts this number on the keypad")
            .accessibilityIdentifier("keypad.suggestion")
        } else {
            Color.clear.accessibilityHidden(true)
        }
    }

    private var currentFrom: ConfiguredNumber? {
        store.callerNumbers.first { $0.phoneNumber == from } ?? store.callerNumbers.first
    }

    /// Compact "From Main Line ⌄" menu.
    private var fromLine: some View {
        Menu {
            Picker("Call from", selection: Binding(get: { currentFrom?.phoneNumber }, set: { from = $0 })) {
                ForEach(store.callerNumbers) { n in
                    Label {
                        Text(n.displayName)
                        Text(PhoneFormat.display(n.phoneNumber))
                    } icon: {
                        Image(systemName: "circle.fill")
                    }
                    .tag(Optional(n.phoneNumber))
                }
            }
            .pickerStyle(.inline)
        } label: {
            HStack(spacing: 6) {
                Text("From").foregroundStyle(.secondary)
                Circle().fill(currentFrom?.tint.color ?? .secondary).frame(width: 7, height: 7)
                Text(currentFrom?.displayName ?? "No number")
                    .fontWeight(.semibold)
                    .foregroundStyle(.primary)
                    .lineLimit(1)
                if store.callerNumbers.count > 1 {
                    Image(systemName: "chevron.down")
                        .font(.caption2.weight(.bold))
                        .foregroundStyle(.secondary)
                }
            }
            .font(.subheadline)
            .padding(.horizontal, Theme.Space.sm)
            .padding(.vertical, 6)
            .contentShape(.capsule)
        }
        .buttonStyle(.plain)
        // Opens upward, into the empty number area, instead of over the keys.
        .popoverTip(tips.currentTip as? CallFromNumberTip, arrowEdge: .bottom)
        .sensoryFeedback(.selection, trigger: from)
        .onAppear {
            if from == nil || !store.callerNumbers.contains(where: { $0.phoneNumber == from }) {
                let preferred = store.activeProfile?.defaultCallerNumber
                from = store.callerNumbers.first { $0.phoneNumber == preferred }?.phoneNumber ?? store.callerNumbers.first?.phoneNumber
            }
        }
        .accessibilityLabel("From number: \(currentFrom?.displayName ?? "none")")
        .accessibilityValue(currentFrom.map { PhoneFormat.display($0.phoneNumber) } ?? "")
    }

    // MARK: Mode

    /// One quiet glass capsule: the selected mode shows its name, the others just their glyph.
    @ScaledMetric(relativeTo: .footnote) private var modeHintOffset: CGFloat = 24

    private var modeSelector: some View {
        HStack(spacing: 2) {
            ForEach(CallMode.allCases) { m in
                let selected = m == mode
                Button {
                    withAnimation(motion) { mode = m }
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: m.symbol)
                            .font(.subheadline.weight(.semibold))
                        if selected {
                            Text(m.title)
                                .font(.subheadline.weight(.semibold))
                                .lineLimit(1)
                                .fixedSize()
                        }
                    }
                    .foregroundStyle(selected ? Color.white : Color.secondary)
                    .padding(.horizontal, selected ? 14 : 11)
                    .padding(.vertical, 8)
                    .background {
                        if selected {
                            Capsule().fill(Theme.Palette.brand)
                                .matchedGeometryEffect(id: "mode", in: modeNS)
                        }
                    }
                    .contentShape(.capsule)
                }
                .buttonStyle(.plain)
                .accessibilityLabel(m.title)
                .accessibilityHint(m.subtitle)
                .accessibilityAddTraits(selected ? .isSelected : [])
                .accessibilityIdentifier("keypad.mode.\(m.rawValue)")
            }
        }
        .padding(4)
        .glassEffect(.regular, in: .capsule)
        .popoverTip(tips.currentTip as? CallModesTip, arrowEdge: .bottom)
        .sensoryFeedback(.selection, trigger: mode)
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Call type")
        .overlay(alignment: .bottom) {
            // Says what the selected mode does, so the icon-only modes aren't a guessing game.
            Text(mode.shortHint)
                .font(.footnote)
                .foregroundStyle(.secondary)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
                .fixedSize(horizontal: true, vertical: false)
                .contentTransition(.opacity)
                .animation(motion, value: mode)
                .offset(y: modeHintOffset)
                .accessibilityHidden(true)   // the buttons' hints already say this
        }
        .padding(.bottom, modeHintOffset)
    }

    // MARK: Keys

    private func keypad(size: CGFloat) -> some View {
        GlassEffectContainer(spacing: 18) {
            Grid(horizontalSpacing: 22, verticalSpacing: 14) {
                ForEach(0..<4) { row in
                    GridRow {
                        ForEach(0..<3) { col in
                            let key = Self.keys[row * 3 + col]
                            CallKeyButton(digit: key.0, letters: key.1, size: size) {
                                append(key.0)
                            } onLongPress: {
                                append("+")
                            }
                            .accessibilityIdentifier("keypad.key.\(key.2)")
                        }
                    }
                }
            }
        }
    }

    private var trialTalkHint: some View {
        Button {
            withAnimation(motion) { mode = .say }
        } label: {
            Label("Talk needs a paid Twilio account. Use Voice Message", systemImage: "waveform")
                .font(.footnote.weight(.semibold))
                .foregroundStyle(Theme.Palette.brandText)
                .multilineTextAlignment(.center)
                .padding(.horizontal, Theme.Space.md)
                .padding(.vertical, 9)
                .contentShape(.capsule)
                .glassEffect(.regular.interactive(), in: .capsule)
        }
        .buttonStyle(.plain)
        .accessibilityHint("Switches this call to Voice Message, which works on trial accounts.")
        .accessibilityIdentifier("keypad.trialTalkHint")
        .transition(.opacity)
    }

    private var personalPhoneHint: some View {
        Button {
            showPersonalPhoneSheet = true
        } label: {
            Label("Add your phone to make Talk calls", systemImage: "plus.circle.fill")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(Theme.Palette.brandText)
                .padding(.horizontal, Theme.Space.md)
                .padding(.vertical, 9)
                .contentShape(.capsule)
                .glassEffect(.regular.interactive(), in: .capsule)
        }
        .buttonStyle(.plain)
        .accessibilityHint("Twilio rings your phone first, then connects you. The other person sees your Twilio number.")
        .accessibilityIdentifier("keypad.addPersonalPhone")
        .transition(.opacity)
    }

    private func actionRow(size: CGFloat) -> some View {
        let side = min(64, size * 0.8)
        return VStack(spacing: Theme.Space.sm) {
            HStack(spacing: 36) {
                Color.clear.frame(width: side, height: side)
                    .accessibilityHidden(true)

                Button(action: callTapped) {
                    Group {
                        if isPlacing {
                            ProgressView().tint(.white)
                        } else {
                            Image(systemName: mode == .bridge ? "phone.fill" : mode.symbol)
                                .font(.system(size: size * 0.36, weight: .semibold))
                                .foregroundStyle(.white)
                                .contentTransition(.symbolEffect(.replace))
                        }
                    }
                    .frame(width: size * 1.08, height: size * 1.08)
                }
                .buttonStyle(.glassProminent)
                .buttonBorderShape(.circle)
                .tint(Theme.Palette.brand)
                .shadow(color: Theme.Palette.brand.opacity(0.35), radius: 14, y: 6)
                .allowsHitTesting(!isPlacing)
                .accessibilityIdentifier("keypad.call")
                .accessibilityLabel(mode == .bridge ? "Call" : "Set up \(mode.title) call")
                .accessibilityHint(number.isEmpty ? (recentNumbers.isEmpty ? "Enter a number first" : "Recalls your last number") : (blocker ?? ""))

                Button {
                    guard !number.isEmpty else { return }
                    number.removeLast()
                    keyTaps += 1
                } label: {
                    Image(systemName: "delete.left.fill")
                        .font(.title2)
                        .frame(width: side, height: side)
                        .foregroundStyle(.secondary)
                        .contentShape(.rect)
                }
                .buttonStyle(.plain)
                .opacity(number.isEmpty ? 0 : 1)
                .disabled(number.isEmpty)
                .simultaneousGesture(LongPressGesture(minimumDuration: 0.5).onEnded { _ in
                    withAnimation(motion) { number = "" }
                    keyTaps += 1
                })
                .accessibilityIdentifier("keypad.delete")
                .accessibilityLabel("Delete")
                .accessibilityHint("Long press to clear the number")
            }

            if let callError {
                FriendlyErrorView(error: callError, retry: { startCall() }, onDismiss: { withAnimation(motion) { self.callError = nil } })
                    .padding(.horizontal)
                    .transition(.opacity)
            }
        }
        .animation(motion, value: number.isEmpty)
        .animation(motion, value: callError)
    }

    // MARK: Actions

    private func append(_ s: String) {
        guard number.count < 24 else { return }
        number.append(s)
        keyTaps += 1
        Self.playTone(s)
    }


    /// The familiar touch-tone for each key (follows the ring/silent switch, like the Phone app).
    private static func playTone(_ key: String) {
        guard Sounds.isEnabled else { return }
        let id: SystemSoundID? = switch key {
        case "*": 1210
        case "#": 1211
        default: key.first?.wholeNumberValue.map { SystemSoundID(1200 + $0) }
        }
        if let id { AudioServicesPlaySystemSound(id) }
    }

    private func paste() {
        guard let text = UIPasteboard.general.string else { return }
        let cleaned = text.filter { $0.isNumber || "+*#".contains($0) }
        if !cleaned.isEmpty { number = cleaned }
    }

    /// The call button is always live: empty recalls the last number (like Phone), too short nudges.
    private func callTapped() {
        if number.isEmpty {
            if let last = recentNumbers.first {
                withAnimation(motion) { number = last }
                keyTaps += 1
            } else {
                nudge()
            }
            return
        }
        if blocker != nil {
            nudge()
            withAnimation(motion) { showBlocker = true }
            return
        }
        startCall()
    }

    private func nudge() {
        nudges += 1
        if !reduceMotion { shakes += 1 }
    }

    private func startCall() {
        guard let fromNumber = from ?? store.callerNumbers.first?.phoneNumber, !number.isEmpty, blocker == nil else { return }
        callError = nil
        if mode == .bridge {
            guard !needsPersonalPhone else {
                showPersonalPhoneSheet = true
                return
            }
            isPlacing = true
            Task {
                defer { isPlacing = false }
                do {
                    try await store.placeCall(OutgoingCall(from: fromNumber, destination: number, mode: .bridge))
                } catch {
                    withAnimation(motion) { callError = FriendlyError(error) }
                }
            }
        } else {
            composer = CallComposerRequest(destination: number, from: fromNumber, mode: mode)
        }
    }

    /// Groups national digits for reading ("8968044978" → "896 804 4978") without assuming a country.
    private static func group(_ raw: String) -> String {
        let plus = raw.hasPrefix("+") ? "+" : ""
        let d = Array(raw.filter(\.isNumber))
        var groups: [String] = []
        var i = 0
        if d.count == 11 || d.count == 8 { groups.append(String(d[0])); i = 1 }
        while i < d.count {
            let remaining = d.count - i
            let len = remaining == 4 ? 4 : min(3, remaining)
            groups.append(String(d[i..<(i + len)]))
            i += len
        }
        return plus + groups.joined(separator: " ")
    }
}

struct CallComposerRequest: Identifiable {
    let id = UUID()
    var destination: String
    var from: String
    var mode: CallMode
}

/// Horizontal "no" shake for the number display.
private struct ShakeEffect: ViewModifier {
    var trigger: Int
    var isEnabled: Bool

    func body(content: Content) -> some View {
        if isEnabled {
            content.keyframeAnimator(initialValue: CGFloat(0), trigger: trigger) { view, x in
                view.offset(x: x)
            } keyframes: { _ in
                KeyframeTrack {
                    LinearKeyframe(-10, duration: 0.06)
                    LinearKeyframe(9, duration: 0.08)
                    LinearKeyframe(-6, duration: 0.07)
                    LinearKeyframe(3, duration: 0.06)
                    LinearKeyframe(0, duration: 0.05)
                }
            }
        } else {
            content
        }
    }
}

private struct CallKeyButton: View {
    var digit: String
    var letters: String
    var size: CGFloat
    var action: () -> Void
    var onLongPress: () -> Void

    var body: some View {
        VStack(spacing: -2) {
            Text(digit)
                .font(.system(size: size * (digit == "*" ? 0.48 : 0.41), weight: .regular, design: .rounded))
                .offset(y: digit == "*" ? size * 0.07 : 0)
            Text(letters.isEmpty ? " " : letters)
                .font(.system(size: max(9, size * 0.13), weight: .bold, design: .rounded))
                .tracking(1.5)
                .foregroundStyle(.secondary)
        }
        .frame(width: size, height: size)
        .contentShape(.circle)
        .glassEffect(.regular.interactive(), in: .circle)
        .onTapGesture(perform: action)
        .onLongPressGesture(minimumDuration: 0.45) {
            if digit == "0" { onLongPress() } else { action() }
        }
        .accessibilityElement()
        .accessibilityLabel(digit == "*" ? "Star" : digit == "#" ? "Pound" : digit)
        .accessibilityHint(digit == "0" ? "Long press for plus" : "")
        .accessibilityAddTraits(.isButton)
        .accessibilityAction { action() }
    }
}
