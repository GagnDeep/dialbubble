import SwiftUI

struct CallComposerSheet: View {
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss

    let request: CallComposerRequest

    @State private var mode: CallMode
    @State private var from: String?
    @State private var message = ""
    @State private var voice: VoiceOption = .default
    @State private var loop = 1
    @State private var audioURL = ""
    @State private var twiml = ""
    @State private var record = false
    @State private var machineDetection = false
    @State private var timeout: Double = 30
    @State private var digits = ""
    @State private var isPlacing = false
    @State private var error: FriendlyError?
    /// While typing, the bottom button steps aside so it never covers the field.
    @FocusState private var isEditingText: Bool
    @State private var showPreview = false
    @State private var showAdvanced = false
    @State private var showPersonalPhoneSheet = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @ScaledMetric(relativeTo: .headline) private var avatarSize: CGFloat = 46

    private var motion: Animation? { Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion) }

    init(request: CallComposerRequest) {
        self.request = request
        _mode = State(initialValue: request.mode)
        _from = State(initialValue: request.from)
    }

    private static let sampleTwiML = """
    <Response>
      <Say voice="Polly.Joanna-Neural">Hello! This is an automated call from Dialbubble.</Say>
      <Pause length="1"/>
      <Gather numDigits="1" timeout="5">
        <Say>Press any key to confirm.</Say>
      </Gather>
      <Say>Goodbye.</Say>
    </Response>
    """

    private static let ttsLimit = 3000
    private static let twimlLimit = 4000

    private var isTrial: Bool { store.activeProfile?.isTrial == true }

    private var needsPersonalPhone: Bool {
        mode == .bridge && !isTrial && store.activeProfile?.personalPhone.nilIfBlank == nil
    }

    private var confirmTitle: String {
        switch mode {
        case .bridge: return "Call Now"
        case .say: return "Call & Speak Message"
        case .play: return "Call & Play Audio"
        case .twiml: return "Call & Run TwiML"
        }
    }

    /// What's missing before the call can be placed.
    private var missing: String? {
        switch mode {
        case .bridge:
            if isTrial { return AppStore.trialTalkMessage }
            return needsPersonalPhone ? "Add your phone so Twilio can ring you first" : nil
        case .say:
            if message.nilIfBlank == nil { return "Type a message to speak" }
            let over = message.count - Self.ttsLimit
            return over > 0 ? "Message is \(over.formatted()) characters too long (limit \(Self.ttsLimit.formatted()))" : nil
        case .play:
            guard let u = audioURL.nilIfBlank else { return "Paste a link to an audio file" }
            return URL(string: u)?.scheme?.hasPrefix("http") == true ? nil : "The link must start with https://"
        case .twiml:
            if twiml.nilIfBlank == nil { return "Write or insert some TwiML" }
            let over = twiml.utf8.count - Self.twimlLimit
            return over > 0 ? "TwiML is \(over.formatted()) characters too long (limit \(Self.twimlLimit.formatted()))" : nil
        }
    }

    private var draftCall: OutgoingCall {
        var call = OutgoingCall(from: from ?? request.from, destination: store.normalize(request.destination), mode: mode)
        call.personalPhone = store.activeProfile?.personalPhone.nilIfBlank ?? ""
        call.message = message
        call.voice = voice
        call.loop = loop
        call.audioURL = audioURL
        call.customTwiML = twiml
        call.record = record
        call.machineDetection = machineDetection
        call.timeout = Int(timeout)
        call.sendDigits = digits
        return call
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    HStack(spacing: 14) {
                        CallTonalAvatar(size: min(avatarSize, 72))
                        VStack(alignment: .leading, spacing: 2) {
                            Text(PhoneFormat.display(store.normalize(request.destination)))
                                .font(.headline.monospacedDigit())
                            Text(mode.subtitle)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel("Calling \(PhoneFormat.display(store.normalize(request.destination))). \(mode.subtitle)")
                    ViewThatFits(in: .horizontal) {
                        HStack {
                            Label("From", systemImage: "phone.arrow.up.right")
                            Spacer(minLength: Theme.Space.sm)
                            FromNumberPicker(selection: $from, capability: .voice)
                        }
                        VStack(alignment: .leading, spacing: Theme.Space.xs) {
                            Label("From", systemImage: "phone.arrow.up.right")
                            FromNumberPicker(selection: $from, capability: .voice)
                        }
                    }
                }

                Section {
                    Picker(selection: $mode.animation(motion)) {
                        ForEach(CallMode.allCases) { m in
                            Label(m.title, systemImage: m.symbol).tag(m)
                        }
                    } label: {
                        Text("Call Type")
                    }
                }

                modeSection

                optionsSection

                Section {
                    DisclosureGroup(isExpanded: $showPreview) {
                        Group {
                            if let xml = try? TwiML.build(for: draftCall) {
                                Text(xml)
                                    .font(.caption.monospaced())
                                    .textSelection(.enabled)
                            } else {
                                Label(missing ?? "Fill in the fields above to preview.", systemImage: "info.circle")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    } label: {
                        Label("Preview TwiML", systemImage: "chevron.left.forwardslash.chevron.right")
                    }
                } footer: {
                    Text(costHint)
                }

                if let error {
                    Section {
                        FriendlyErrorView(error: error, retry: { place() })
                            .listRowInsets(EdgeInsets())
                            .listRowBackground(Color.clear)
                    }
                }
            }
            .scrollDismissesKeyboard(.interactively)
            .relayBackground()
            .navigationTitle(mode.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel", systemImage: "xmark", role: .cancel) { dismiss() }
                }
                if isEditingText {
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Done") { isEditingText = false }
                            .accessibilityIdentifier("composer.doneEditing")
                    }
                }
            }
            .bottomCTA {
                if !isEditingText {
                PrimaryButton(title: isPlacing ? "Calling…" : confirmTitle,
                              symbol: isPlacing ? nil : "phone.fill",
                              isLoading: isPlacing,
                              action: place)
                    .disabled(missing != nil)
                    .accessibilityIdentifier("composer.place")
                    .accessibilityHint(missing ?? "")
                if needsPersonalPhone {
                    SecondaryButton(title: "Add Your Phone", symbol: "iphone") { showPersonalPhoneSheet = true }
                        .accessibilityIdentifier("composer.addPersonalPhone")
                } else if let missing {
                    Label(missing, systemImage: overLimit ? "exclamationmark.circle.fill" : "info.circle")
                        .font(.caption)
                        .foregroundStyle(overLimit ? Theme.Palette.danger : .secondary)
                        .multilineTextAlignment(.center)
                        .fixedSize(horizontal: false, vertical: true)
                        .transition(.opacity)
                }
                }
            }
            .animation(motion, value: missing)
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
        .sensoryFeedback(.error, trigger: error) { _, new in new != nil }
        .sheet(isPresented: $showPersonalPhoneSheet) {
            CallPersonalPhoneSheet()
        }
    }

    /// True when the text is too long for Twilio — the call is blocked until it's shortened.
    private var overLimit: Bool {
        switch mode {
        case .say: return message.count > Self.ttsLimit
        case .twiml: return twiml.utf8.count > Self.twimlLimit
        default: return false
        }
    }

    private var costHint: String {
        switch mode {
        case .bridge: return "Billed as two calls: one to your phone and one to the destination."
        case .say, .play: return "Billed as one outbound call per minute, at standard Twilio rates."
        case .twiml: return "Billed as one outbound call, plus any paid TwiML features you use."
        }
    }

    @ViewBuilder
    private var modeSection: some View {
        switch mode {
        case .bridge:
            Section {
                if let phone = store.activeProfile?.personalPhone.nilIfBlank {
                    Label {
                        Text(AppStore.confirmBeforeConnect
                             ? "Twilio rings \(PhoneFormat.display(phone)) first. Answer, then press any key to dial the person you're calling."
                             : "Twilio rings \(PhoneFormat.display(phone)) first. Answer it and you'll be connected to the person you're calling.")
                            .font(.subheadline)
                    } icon: {
                        Image(systemName: "phone.connection.fill").foregroundStyle(Theme.Palette.brandText)
                    }
                } else {
                    Callout(style: .tip,
                            title: "Add your phone first",
                            message: "For Talk calls, Twilio rings your own phone, then connects you. The other person sees your Twilio number.",
                            symbol: "iphone.gen3.radiowaves.left.and.right") {
                        Button {
                            showPersonalPhoneSheet = true
                        } label: {
                            Label("Add My Phone", systemImage: "plus")
                                .font(.subheadline.weight(.semibold))
                        }
                        .buttonStyle(.glassProminent)
                        .tint(Theme.Palette.brand)
                        .controlSize(.small)
                    }
                    .listRowInsets(EdgeInsets())
                    .listRowBackground(Color.clear)
                }
            } header: {
                Text("How Talk Works")
            }
        case .say:
            Section {
                TextEditor(text: $message)
                    .focused($isEditingText)
                    .frame(minHeight: 110)
                    .accessibilityIdentifier("composer.message")
                    .overlay(alignment: .topLeading) {
                        if message.isEmpty {
                            Text("What should the call say?")
                                .foregroundStyle(.secondary)
                                .padding(.top, 8).padding(.leading, 5)
                                .allowsHitTesting(false)
                        }
                    }
                Picker(selection: $voice) {
                    ForEach(VoiceOption.all, id: \.self) { v in
                        Text(v.name).tag(v)
                    }
                } label: {
                    Label("Voice", systemImage: "person.wave.2")
                }
                Stepper(value: $loop, in: 1...10) {
                    Label("Repeat \(loop)×", systemImage: "repeat")
                }
                if !store.templates.isEmpty {
                    Menu {
                        ForEach(store.templates) { t in
                            Button(t.title, systemImage: "text.quote") { message = t.body }
                        }
                    } label: {
                        Label("Insert Template", systemImage: "text.badge.plus")
                    }
                }
            } header: {
                Text("Message")
            } footer: {
                HStack {
                    Text("Read aloud when they answer.")
                    Spacer()
                    Text("\(message.count)/\(Self.ttsLimit)")
                        .monospacedDigit()
                        .foregroundStyle(message.count > Self.ttsLimit ? Theme.Palette.danger : .secondary)
                        .contentTransition(.numericText())
                        .animation(motion, value: message.count)
                        .accessibilityLabel("\(message.count) of \(Self.ttsLimit) characters")
                }
            }
        case .play:
            Section {
                TextField("https://example.com/audio.mp3", text: $audioURL)
                    .focused($isEditingText)
                    .keyboardType(.URL)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                Stepper(value: $loop, in: 1...10) {
                    Label("Repeat \(loop)×", systemImage: "repeat")
                }
            } header: {
                Text("Audio Link")
            } footer: {
                Text("An MP3 or WAV file at a public https link. Twilio downloads it when the call is answered.")
            }
        case .twiml:
            Section {
                TextEditor(text: $twiml)
                    .focused($isEditingText)
                    .font(.footnote.monospaced())
                    .autocorrectionDisabled()
                    .textInputAutocapitalization(.never)
                    .frame(minHeight: 180)
                Button("Insert Sample", systemImage: "wand.and.stars") { twiml = Self.sampleTwiML }
                Link(destination: URL(string: "https://www.twilio.com/docs/voice/twiml")!) {
                    Label("TwiML Reference", systemImage: "book")
                }
            } header: {
                Text("TwiML")
            } footer: {
                Text("Runs inline, so no server is needed. Up to 4,000 characters (\(twiml.utf8.count)/\(Self.twimlLimit)).")
                    .foregroundStyle(twiml.utf8.count > Self.twimlLimit ? Theme.Palette.danger : .secondary)
            }
        }
    }

    private var optionsSection: some View {
        Section {
            Toggle(isOn: $record) {
                Label(mode == .bridge ? "Record Both Sides" : "Record Call", systemImage: "record.circle")
            }
            .disabled(isTrial)
            DisclosureGroup(isExpanded: $showAdvanced) {
                if mode != .bridge {
                    Toggle(isOn: $machineDetection) {
                        Label("Detect Voicemail", systemImage: "recordingtape")
                    }
                }
                TextField(text: $digits, prompt: Text("e.g. ww1234#")) {
                    Label("Keypad Digits", systemImage: "number.square")
                }
                .keyboardType(.numbersAndPunctuation)
                .font(.body.monospaced())
                .accessibilityHint("Sent after connecting. Each w waits half a second.")
                VStack(alignment: .leading) {
                    HStack {
                        Label("Ring Timeout", systemImage: "timer")
                        Spacer()
                        Text("\(Int(timeout))s")
                            .monospacedDigit()
                            .foregroundStyle(.secondary)
                            .contentTransition(.numericText(value: timeout))
                            .animation(motion, value: timeout)
                    }
                    Slider(value: $timeout, in: 5...60, step: 5)
                        .accessibilityLabel("Ring timeout")
                        .accessibilityValue("\(Int(timeout)) seconds")
                }
            } label: {
                Label("Advanced", systemImage: "slider.horizontal.3")
            }
        } header: {
            Text("Options")
        } footer: {
            VStack(alignment: .leading, spacing: 6) {
                if isTrial {
                    Text("Twilio doesn't allow recording on trial accounts.")
                } else if record {
                    Text("Recording laws vary. Some places require everyone on the call to agree before you record.")
                }
                if showAdvanced {
                    Text("Digits are sent after connecting; each \u{201C}w\u{201D} waits half a second. Ringing stops after \(Int(timeout)) seconds.")
                }
                if showAdvanced && machineDetection && mode != .bridge {
                    Text("Voicemail detection adds a few seconds after answer.")
                }
            }
        }
    }

    private func place() {
        guard missing == nil, !isPlacing else { return }
        guard (from ?? store.callerNumbers.first?.phoneNumber) != nil else {
            error = FriendlyError(title: "Choose a number", message: "Pick a number to call from.", symbol: "phone.badge.exclamationmark")
            return
        }
        isPlacing = true
        error = nil
        Task {
            defer { isPlacing = false }
            do {
                try await store.placeCall(draftCall)
                dismiss()
            } catch let e {
                withAnimation(motion) { error = FriendlyError(e) }
            }
        }
    }
}
