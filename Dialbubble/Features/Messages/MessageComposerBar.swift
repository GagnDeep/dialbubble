import SwiftUI

/// Computes SMS character/segment counts (GSM-7 vs UCS-2).
enum MsgSegmentCounter {
    private static let gsmBasic: Set<Character> = Set("@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà")
    private static let gsmExtended: Set<Character> = Set("^{}\\[~]|€\u{0C}")

    struct Result { let units: Int; let segments: Int; let isUnicode: Bool; let remaining: Int }

    static func count(_ text: String) -> Result {
        guard !text.isEmpty else { return Result(units: 0, segments: 0, isUnicode: false, remaining: 160) }
        let isGSM = text.allSatisfy { gsmBasic.contains($0) || gsmExtended.contains($0) }
        if isGSM {
            let units = text.reduce(0) { $0 + (gsmExtended.contains($1) ? 2 : 1) }
            let segments = units <= 160 ? 1 : Int(ceil(Double(units) / 153))
            let cap = segments == 1 ? 160 : segments * 153
            return Result(units: units, segments: segments, isUnicode: false, remaining: cap - units)
        }
        let units = text.utf16.count
        let segments = units <= 70 ? 1 : Int(ceil(Double(units) / 67))
        let cap = segments == 1 ? 70 : segments * 67
        return Result(units: units, segments: segments, isUnicode: true, remaining: cap - units)
    }
}

/// Glass composer pinned to the bottom of a conversation.
struct MessageComposerBar: View {
    @Environment(AppStore.self) private var store
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @Binding var from: String?
    @Binding var text: String
    let to: String

    @State private var mediaURLs: [URL] = []
    @State private var sendAt: Date?
    @State private var isSending = false
    @State private var error: FriendlyError?
    @State private var showMedia = false
    @State private var showSchedule = false
    @State private var showSegmentInfo = false
    @State private var sentCount = 0
    @FocusState private var focused: Bool
    @ScaledMetric(relativeTo: .title3) private var plusSize: CGFloat = 40
    @ScaledMetric(relativeTo: .headline) private var sendSize: CGFloat = 32

    private let plusTip = MessagePlusMenuTip()

    private var hasContent: Bool { text.nilIfBlank != nil || !mediaURLs.isEmpty }

    /// Why the send button is disabled, so the user is never left guessing.
    private var blockedReason: String? {
        if store.smsNumbers.isEmpty { return "None of your numbers can send texts. Enable SMS for a number in Settings." }
        if from == nil && sendAt == nil { return "Choose a number to send from." }
        if !mediaURLs.isEmpty, let f = from, store.configuredNumber(for: f)?.mms == false {
            return "This number can't send pictures (MMS). Pick another number or remove the attachment."
        }
        return nil
    }

    private var canSend: Bool { !isSending && hasContent && blockedReason == nil }

    private func animate(_ body: () -> Void) {
        withAnimation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion), body)
    }

    var body: some View {
        let counter = MsgSegmentCounter.count(text)
        VStack(alignment: .leading, spacing: Theme.Space.xs) {
            if let error {
                FriendlyErrorView(error: error, retry: { send() }, onDismiss: { animate { self.error = nil } })
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }
            if hasContent || focused, let reason = blockedReason {
                Label(reason, systemImage: "info.circle.fill")
                    .font(.caption)
                    .foregroundStyle(Theme.Palette.warning)
                    .padding(.horizontal, 6)
                    .transition(.opacity)
            }
            if !mediaURLs.isEmpty || sendAt != nil {
                ScrollView(.horizontal) {
                    HStack(spacing: 6) {
                        if let sendAt {
                            chip("Sends \(sendAt.formatted(date: .abbreviated, time: .shortened))", symbol: "calendar.badge.clock", tint: Theme.Palette.brandText) {
                                self.sendAt = nil
                            }
                            .accessibilityIdentifier("conversation.schedulePill")
                        }
                        ForEach(mediaURLs, id: \.self) { url in
                            chip(url.lastPathComponent.isEmpty ? url.host() ?? "Media" : url.lastPathComponent, symbol: "photo.fill", tint: .secondary) {
                                mediaURLs.removeAll { $0 == url }
                            }
                        }
                    }
                    .padding(.vertical, 2)
                }
                .scrollIndicators(.hidden)
            }

            // One composer: a quiet "From" line + counter, then [+] and a single field with the send button inside it.
            let metaLayout = dynamicTypeSize.isAccessibilitySize
                ? AnyLayout(VStackLayout(alignment: .leading, spacing: 6))
                : AnyLayout(HStackLayout(alignment: .center, spacing: Theme.Space.xs))
            metaLayout {
                MsgComposerFromChip(selection: $from)
                if !dynamicTypeSize.isAccessibilitySize { Spacer(minLength: 4) }
                if !text.isEmpty {
                    segmentCounter(counter)
                        .transition(.opacity)
                }
            }
            .padding(.leading, plusSize + Theme.Space.xs + 4)
            .padding(.trailing, 4)
            .animation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion), value: text.isEmpty)

            GlassEffectContainer(spacing: Theme.Space.xs) {
                HStack(alignment: .bottom, spacing: Theme.Space.xs) {
                    plusMenu

                    HStack(alignment: .bottom, spacing: Theme.Space.xxs) {
                        TextField(sendAt == nil ? "Text message" : "Scheduled message", text: $text, axis: .vertical)
                            .lineLimit(1...6)
                            .focused($focused)
                            .padding(.leading, Theme.Space.md)
                            .padding(.vertical, 10)
                            .frame(minHeight: plusSize)
                            .accessibilityIdentifier("conversation.input")

                        sendButton
                            .padding(.trailing, (plusSize - sendSize) / 2)
                            .padding(.bottom, (plusSize - sendSize) / 2)
                    }
                    .glassEffect(.regular, in: .rect(cornerRadius: min(Theme.Radius.lg, plusSize / 2 + 2)))
                }
            }
        }
        .padding(.horizontal, Theme.Space.sm)
        .padding(.vertical, Theme.Space.xs)
        .animation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion), value: error)
        .animation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion), value: blockedReason)
        .sensoryFeedback(.success, trigger: sentCount)
        .sensoryFeedback(.error, trigger: error) { _, new in new != nil }
        .sheet(isPresented: $showMedia) { MsgMediaURLSheet(urls: $mediaURLs) }
        .sheet(isPresented: $showSchedule) { MsgScheduleSheet(sendAt: $sendAt) }
    }

    // MARK: Pieces

    private var plusMenu: some View {
        Menu {
            if !store.templates.isEmpty {
                Section("Insert Template") {
                    ForEach(store.templates) { t in
                        Button(t.title, systemImage: "text.quote") { insert(t.body) }
                    }
                }
            }
            Section {
                Button("Attach Picture Link", systemImage: "photo.badge.plus") { showMedia = true }
                Button(sendAt == nil ? "Schedule for Later" : "Change Schedule", systemImage: "calendar.badge.clock") { showSchedule = true }
                if sendAt != nil {
                    Button("Send Now Instead", systemImage: "paperplane") { animate { sendAt = nil } }
                }
            }
            if store.smsNumbers.count > 1 {
                Section {
                    Picker(selection: $from) {
                        ForEach(store.smsNumbers) { n in
                            Label {
                                Text(n.displayName)
                                Text(PhoneFormat.display(n.phoneNumber))
                            } icon: {
                                Image(systemName: "circle.fill").foregroundStyle(n.tint.color)
                            }
                            .tag(Optional(n.phoneNumber))
                        }
                    } label: {
                        Label("Send From", systemImage: "number.circle")
                    }
                    .pickerStyle(.menu)
                }
            }
        } label: {
            Image(systemName: "plus")
                .font(.title3.weight(.semibold))
                .foregroundStyle(.primary)
                .frame(width: plusSize, height: plusSize)
                .contentShape(.circle)
        }
        .glassEffect(.regular.interactive(), in: .circle)
        .accessibilityLabel("Templates, attachments and scheduling")
        .accessibilityIdentifier("conversation.plusMenu")
        .simultaneousGesture(TapGesture().onEnded { plusTip.invalidate(reason: .actionPerformed) })
        .popoverTip(plusTip, arrowEdge: .bottom)
    }

    /// Solid mint disc when ready to send; a quiet neutral disc otherwise — always clearly one or the other.
    private var sendButton: some View {
        Button(action: send) {
            ZStack {
                Circle()
                    .fill(canSend || isSending ? AnyShapeStyle(Theme.Palette.brand) : AnyShapeStyle(Color.secondary.opacity(0.22)))
                if isSending {
                    ProgressView().tint(.white)
                        .transition(.opacity)
                } else {
                    Image(systemName: sendAt == nil ? "arrow.up" : "calendar.badge.checkmark")
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(canSend ? AnyShapeStyle(Color.white) : AnyShapeStyle(.secondary))
                        .contentTransition(.symbolEffect(.replace))
                        .transition(.opacity)
                }
            }
            .frame(width: sendSize, height: sendSize)
            .contentShape(.circle)
        }
        .buttonStyle(.plain)
        .disabled(!canSend)
        .animation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion), value: canSend)
        .animation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion), value: isSending)
        .animation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion), value: sendAt == nil)
        .accessibilityLabel(sendAt == nil ? "Send" : "Schedule")
        .accessibilityHint(canSend ? "" : (blockedReason ?? "Type a message first"))
        .accessibilityIdentifier("conversation.send")
    }

    private func segmentCounter(_ counter: MsgSegmentCounter.Result) -> some View {
        Button {
            showSegmentInfo = true
        } label: {
            HStack(spacing: 4) {
                if counter.isUnicode {
                    Image(systemName: "face.smiling")
                }
                Text("\(counter.remaining) left · \(counter.segments) part\(counter.segments == 1 ? "" : "s")")
                    .contentTransition(.numericText())
                Image(systemName: "info.circle")
            }
            .font(.caption.monospacedDigit())
            .foregroundStyle(counter.segments > 3 ? Theme.Palette.warning : .secondary)
            .animation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion), value: counter.units)
        }
        .buttonStyle(.plain)
        .accessibilityLabel("\(counter.units) characters, \(counter.segments) message part\(counter.segments == 1 ? "" : "s"). Learn more.")
        .popover(isPresented: $showSegmentInfo) {
            MessageSegmentInfo(counter: counter)
                .presentationCompactAdaptation(.popover)
        }
    }

    private func chip(_ title: String, symbol: String, tint: Color, remove: @escaping () -> Void) -> some View {
        HStack(spacing: 5) {
            Image(systemName: symbol).foregroundStyle(tint)
            Text(title).lineLimit(1)
            Button(action: { animate { remove() } }) {
                Image(systemName: "xmark.circle.fill").foregroundStyle(.secondary)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Remove \(title)")
        }
        .font(.caption.weight(.medium))
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .glassEffect(.regular.tint(tint.opacity(0.12)), in: .capsule)
        .accessibilityElement(children: .contain)
    }

    private func insert(_ s: String) {
        text = text.isEmpty ? s : text + (text.hasSuffix(" ") ? "" : " ") + s
    }

    private func send() {
        guard canSend else { return }
        isSending = true
        animate { error = nil }
        let message = OutgoingMessage(
            from: from,
            messagingServiceSid: sendAt != nil ? store.activeProfile?.messagingServiceSid : nil,
            to: to,
            body: text.trimmingCharacters(in: .whitespacesAndNewlines),
            mediaURLs: mediaURLs,
            sendAt: sendAt
        )
        Task {
            defer { isSending = false }
            do {
                try await store.sendMessage(message)
                text = ""
                mediaURLs = []
                sendAt = nil
                sentCount += 1
            } catch {
                // Keep the typed text so nothing is lost; show what went wrong and how to fix it.
                animate { self.error = FriendlyError(error) }
            }
        }
    }
}

/// Small "From ● Main line ⌄" capsule shown above the message field. It keeps the sending number visible
/// without competing with the conversation, and opens a menu to switch numbers.
private struct MsgComposerFromChip: View {
    @Environment(AppStore.self) private var store
    @Binding var selection: String?
    @State private var changes = 0
    @ScaledMetric(relativeTo: .footnote) private var dot: CGFloat = 7

    private var options: [ConfiguredNumber] { store.smsNumbers }
    private var current: ConfiguredNumber? {
        options.first { $0.phoneNumber == selection } ?? options.first
    }

    var body: some View {
        Menu {
            Section("Send from") {
                ForEach(options) { n in
                    Button {
                        selection = n.phoneNumber
                        changes += 1
                    } label: {
                        Label {
                            Text(n.displayName)
                            Text(PhoneFormat.display(n.phoneNumber))
                        } icon: {
                            Image(systemName: n.phoneNumber == current?.phoneNumber ? "checkmark.circle.fill" : "circle.fill")
                        }
                    }
                    .tint(n.tint.color)
                }
            }
        } label: {
            HStack(spacing: 5) {
                Text("From")
                    .foregroundStyle(.secondary)
                    .accessibilityHidden(true)
                Circle()
                    .fill(current?.tint.color ?? .secondary)
                    .frame(width: dot, height: dot)
                Text(current?.displayName ?? "No number")
                    .fontWeight(.semibold)
                    .foregroundStyle(.primary)
                    .lineLimit(1)
                if options.count > 1 {
                    Image(systemName: "chevron.up.chevron.down")
                        .font(.caption2.weight(.bold))
                        .foregroundStyle(.secondary)
                }
            }
            .font(.footnote)
            .padding(.vertical, 4)
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .disabled(options.isEmpty)
        .sensoryFeedback(.selection, trigger: changes)
        .onAppear {
            if selection == nil || !options.contains(where: { $0.phoneNumber == selection }) {
                let preferred = store.activeProfile?.defaultSMSNumber
                selection = options.first { $0.phoneNumber == preferred }?.phoneNumber ?? options.first?.phoneNumber
            }
        }
        .accessibilityLabel("Sending from \(current?.displayName ?? "no number")\(current.map { ", " + PhoneFormat.display($0.phoneNumber) } ?? "")")
        .accessibilityHint(options.count > 1 ? "Double-tap to choose another number" : "")
        .accessibilityIdentifier("conversation.from")
    }
}

/// Explains SMS segments and encoding in plain language.
private struct MessageSegmentInfo: View {
    let counter: MsgSegmentCounter.Result

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("How texts are counted", systemImage: "text.word.spacing")
                .font(.headline)
            Text("Long texts are split into parts. Twilio bills each part separately, but the recipient sees one message.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Divider()
            LabeledContent("Characters", value: "\(counter.units)")
            LabeledContent("Parts", value: "\(counter.segments)")
            LabeledContent("Encoding", value: counter.isUnicode ? "Unicode" : "Standard (GSM-7)")
            Divider()
            Label(counter.isUnicode
                  ? "Emoji or special characters switch to Unicode: 70 characters per part (67 when split)."
                  : "Standard text fits 160 characters per part (153 when split).",
                  systemImage: counter.isUnicode ? "face.smiling" : "textformat.abc")
                .font(.footnote)
        }
        .font(.subheadline)
        .padding()
        .frame(width: 300)
    }
}

// MARK: - Media URL sheet

struct MsgMediaURLSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Binding var urls: [URL]
    @State private var input = ""

    private var parsed: URL? {
        guard let url = URL(string: input.trimmingCharacters(in: .whitespaces)), url.scheme == "https" || url.scheme == "http", url.host() != nil else { return nil }
        return url
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("https://example.com/photo.jpg", text: $input)
                        .keyboardType(.URL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    Button("Add URL", systemImage: "plus.circle.fill") {
                        if let parsed, urls.count < 10 { urls.append(parsed); input = "" }
                    }
                    .disabled(parsed == nil || urls.count >= 10)
                    if let clip = UIPasteboard.general.url {
                        Button("Paste \(clip.host() ?? "URL")", systemImage: "doc.on.clipboard") { input = clip.absoluteString }
                    }
                } footer: {
                    Text("Twilio fetches MMS media from a publicly reachable URL, so attachments must already be hosted online (up to 10 per message, 5 MB total). MMS is supported for US & Canada numbers.")
                }
                if !urls.isEmpty {
                    Section("Attached") {
                        ForEach(urls, id: \.self) { Text($0.absoluteString).font(.footnote).lineLimit(2) }
                            .onDelete { urls.remove(atOffsets: $0) }
                    }
                }
            }
            .relayBackground()
            .navigationTitle("Attach Media")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(role: .confirm) { dismiss() }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
}

// MARK: - Schedule sheet

struct MsgScheduleSheet: View {
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    @Binding var sendAt: Date?
    @State private var date = Date.now.addingTimeInterval(3600)
    @State private var serviceSid = ""

    private var range: ClosedRange<Date> {
        Date.now.addingTimeInterval(16 * 60)...Date.now.addingTimeInterval(35 * 24 * 3600)
    }

    private var hasService: Bool { store.activeProfile?.messagingServiceSid?.nilIfBlank != nil }

    var body: some View {
        NavigationStack {
            Form {
                if !hasService {
                    Section {
                        if store.messagingServices.isEmpty {
                            TextField("MGxxxxxxxxxxxxxxxx", text: $serviceSid)
                                .font(.body.monospaced())
                                .textInputAutocapitalization(.never)
                                .autocorrectionDisabled()
                        } else {
                            Picker("Messaging Service", selection: $serviceSid) {
                                Text("Choose…").tag("")
                                ForEach(store.messagingServices) { s in
                                    Text(s.friendlyName ?? s.sid).tag(s.sid)
                                }
                            }
                        }
                        Button("Save Service", systemImage: "checkmark.circle.fill") { saveService() }
                            .disabled(!serviceSid.hasPrefix("MG"))
                    } header: {
                        Text("Messaging Service Required")
                    } footer: {
                        Text("Twilio only schedules messages sent through a Messaging Service. Create one in the Twilio Console (Messaging → Services), add your number to its sender pool, then select it here.")
                    }
                }
                Section {
                    DatePicker("Send at", selection: $date, in: range)
                        .datePickerStyle(.graphical)
                } footer: {
                    Text("Messages can be scheduled from 15 minutes to 35 days ahead.")
                }
            }
            .relayBackground()
            .navigationTitle("Schedule Message")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(role: .cancel) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Schedule") {
                        sendAt = min(max(date, range.lowerBound), range.upperBound)
                        dismiss()
                    }
                    .disabled(!hasService)
                }
            }
            .onAppear { if let sendAt { date = sendAt } }
        }
    }

    private func saveService() {
        guard var p = store.activeProfile else { return }
        p.messagingServiceSid = serviceSid.trimmingCharacters(in: .whitespaces)
        store.updateProfile(p)
    }
}
