import SwiftUI

/// Sends the same message to many recipients, one at a time (throttled to respect Twilio rate limits).
struct BroadcastView: View {
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss

    @State private var recipientsText = ""
    @State private var from: String?
    @State private var text = ""
    @State private var results: [MsgBroadcastResult] = []
    @State private var sendTask: Task<Void, Never>?
    @State private var progress = 0
    @State private var finishedCount = 0
    @State private var confirmSend = false
    @State private var resets = 0
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @ScaledMetric(relativeTo: .title3) private var heroSize: CGFloat = 40

    /// Typical US outbound SMS price per segment, used only for an estimate.
    private let estimatedPricePerSegment = 0.0083

    private var invalidCount: Int {
        recipientsText
            .components(separatedBy: CharacterSet(charactersIn: ",;\n"))
            .compactMap { $0.nilIfBlank }
            .filter { !PhoneFormat.isPlausible($0) }
            .count
    }

    private var csv: String {
        var lines = ["number,status,detail"]
        for r in results {
            lines.append("\(r.number),\(r.state.csvStatus),\"\(r.state.csvDetail.replacingOccurrences(of: "\"", with: "'"))\"")
        }
        return lines.joined(separator: "\n")
    }

    private var recipients: [String] {
        var seen = Set<String>()
        return recipientsText
            .components(separatedBy: CharacterSet(charactersIn: ",;\n"))
            .compactMap { $0.nilIfBlank }
            .filter(PhoneFormat.isPlausible)
            .map(store.normalize)
            .filter { seen.insert($0).inserted }
    }

    private var isSending: Bool { sendTask != nil }

    var body: some View {
        let list = recipients
        NavigationStack {
            Form {
                Section {
                    HStack(alignment: .top, spacing: Theme.Space.sm) {
                        IconTile(symbol: "megaphone.fill", color: Theme.Palette.brandText, size: heroSize)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Send one text to many people").font(.headline)
                            Text("Everyone gets their own private copy. Replies arrive as separate conversations.")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.vertical, 2)
                    .accessibilityElement(children: .combine)
                }

                Section {
                    TextField("One per line, or separated by commas", text: $recipientsText, axis: .vertical)
                        .lineLimit(3...8)
                        // Digits plus comma, "+" and Return — the phone pad has no separators or new line.
                        .keyboardType(.numbersAndPunctuation)
                        .textContentType(.telephoneNumber)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .font(.body.monospacedDigit())
                        .disabled(isSending || !results.isEmpty)
                        .accessibilityHint("Enter phone numbers with country code, one per line or separated by commas")
                        .accessibilityIdentifier("broadcast.recipients")
                    HStack {
                        Button("Add from Contacts", systemImage: "person.crop.circle.badge.plus") {
                            ContactPicker.pickPhone { phone, _ in
                                recipientsText += (recipientsText.isEmpty || recipientsText.hasSuffix("\n") ? "" : "\n") + phone
                            }
                        }
                        Spacer()
                        if UIPasteboard.general.hasStrings {
                            Button("Paste", systemImage: "doc.on.clipboard") {
                                recipientsText += (recipientsText.isEmpty ? "" : "\n") + (UIPasteboard.general.string ?? "")
                            }
                        }
                    }
                    .buttonStyle(.borderless)
                    .disabled(isSending || !results.isEmpty)
                } header: {
                    Text(list.isEmpty ? "Recipients" : "Recipients · \(list.count)")
                        .monospacedDigit()
                } footer: {
                    if invalidCount > 0 {
                        Label("\(invalidCount) entr\(invalidCount == 1 ? "y doesn't" : "ies don't") look like phone numbers and will be skipped.", systemImage: "exclamationmark.triangle.fill")
                            .foregroundStyle(Theme.Palette.warning)
                    } else {
                        Text("Include the country code, like +1 415 555 0100. Duplicates are removed automatically.")
                    }
                }

                Section {
                    FromNumberPicker(selection: $from, capability: .sms)
                        .listRowBackground(Color.clear)
                        .listRowInsets(EdgeInsets())
                        .disabled(isSending || !results.isEmpty)
                } header: {
                    Text("From")
                } footer: {
                    Text("Everyone sees this number and replies to it.")
                }

                Section {
                    TextField("Message", text: $text, axis: .vertical)
                        .lineLimit(4...10)
                        .disabled(isSending || !results.isEmpty)
                        .accessibilityIdentifier("broadcast.body")
                    if !store.templates.isEmpty, !isSending, results.isEmpty {
                        MsgTemplateChips { t in text = t.body }
                            .listRowInsets(EdgeInsets(top: 8, leading: 12, bottom: 8, trailing: 12))
                    }
                } header: {
                    Text("Message")
                }

                if !list.isEmpty, text.nilIfBlank != nil, results.isEmpty {
                    let c = MsgSegmentCounter.count(text)
                    let total = c.segments * list.count
                    Section {
                        LabeledContent("Recipients") { Text("\(list.count)").monospacedDigit() }
                        LabeledContent("Message parts") { Text("\(c.segments) × \(list.count) = \(total)").monospacedDigit() }
                        LabeledContent("Estimated cost") {
                            Text("≈ \((Double(total) * estimatedPricePerSegment).formatted(.currency(code: "USD")))").monospacedDigit()
                        }
                        LabeledContent("Time to send") { Text("~\(list.count) sec").monospacedDigit() }
                    } header: {
                        Text("Review")
                    } footer: {
                        Text("Estimate uses typical US pricing; your actual Twilio price may differ. Messages are sent one per second to stay within Twilio's limits.")
                    }
                }

                if isSending || !results.isEmpty {
                    Section {
                        ProgressView(value: Double(progress), total: Double(max(results.count, 1))) {
                            Text("\(progress) of \(results.count) done")
                                .monospacedDigit()
                                .contentTransition(.numericText())
                        } currentValueLabel: {
                            Text(summary)
                        }
                        .tint(Theme.Palette.brand)
                        .animation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion), value: progress)
                        ForEach(results) { r in
                            HStack {
                                Text(PhoneFormat.display(r.number)).font(.subheadline.monospacedDigit())
                                Spacer()
                                r.state.view
                            }
                            .accessibilityElement(children: .combine)
                        }
                        if !isSending {
                            ShareLink(item: csv, preview: SharePreview("Broadcast results.csv")) {
                                Label("Export Results (CSV)", systemImage: "square.and.arrow.up")
                            }
                            Button("New Broadcast", systemImage: "arrow.counterclockwise", action: reset)
                                .accessibilityIdentifier("broadcast.reset")
                        }
                    } header: {
                        Text(isSending ? "Sending…" : "Results")
                    }
                }
            }
            .relayBackground()
            .navigationTitle("Broadcast")
            .navigationBarTitleDisplayMode(.inline)
            .interactiveDismissDisabled(isSending)
            .sensoryFeedback(.success, trigger: finishedCount)
            .sensoryFeedback(.impact(weight: .light), trigger: resets)
            .confirmationDialog("Send to \(list.count) people?", isPresented: $confirmSend, titleVisibility: .visible) {
                Button("Send \(list.count) Message\(list.count == 1 ? "" : "s")") { start(list) }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("Each recipient gets a separate text from \(from.map(PhoneFormat.display) ?? "your number"). This can't be undone once sent.")
            }
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    if isSending {
                        Button("Stop", systemImage: "stop.fill") { sendTask?.cancel() }
                            .accessibilityHint("Stops sending. Numbers not reached yet are skipped.")
                    } else {
                        Button(role: .close) { dismiss() }
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    if !results.isEmpty, !isSending {
                        Button("New", systemImage: "arrow.counterclockwise", action: reset)
                            .buttonStyle(.glassProminent)
                            .tint(Theme.Palette.brand)
                            .accessibilityLabel("New Broadcast")
                    } else {
                        Button("Send to \(list.count)") { confirmSend = true }
                            .buttonStyle(.glassProminent)
                            .tint(Theme.Palette.brand)
                            .disabled(isSending || list.isEmpty || text.nilIfBlank == nil || from == nil)
                            .accessibilityIdentifier("broadcast.send")
                    }
                }
            }
        }
    }

    private var summary: String {
        let failed = results.filter { $0.state.isFailure }.count
        let skipped = results.filter { $0.state.isSkipped }.count
        var parts: [String] = []
        if failed > 0 { parts.append("\(failed) failed") }
        if skipped > 0 { parts.append("\(skipped) skipped") }
        return parts.isEmpty ? "No failures" : parts.joined(separator: " · ")
    }

    /// Clears results so the same screen can start another broadcast.
    private func reset() {
        withAnimation(Theme.Motion.adaptive(Theme.Motion.smooth, reduceMotion)) {
            results = []
            progress = 0
            recipientsText = ""
            text = ""
        }
        resets += 1
    }

    private func start(_ list: [String]) {
        guard let from else { return }
        let body = text.trimmingCharacters(in: .whitespacesAndNewlines)
        results = list.map { MsgBroadcastResult(number: $0) }
        progress = 0
        sendTask = Task {
            for i in results.indices {
                if Task.isCancelled {
                    for j in i..<results.count { results[j].state = .skipped }
                    break
                }
                results[i].state = .sending
                do {
                    _ = try await store.sendMessage(OutgoingMessage(from: from, to: results[i].number, body: body))
                    results[i].state = .sent
                } catch {
                    // Stopping mid-request cancels the network call — that's a skip, not a delivery failure.
                    if Task.isCancelled || error is CancellationError || (error as? URLError)?.code == .cancelled {
                        for j in i..<results.count { results[j].state = .skipped }
                        break
                    }
                    results[i].state = .failed(FriendlyError(error).title)
                }
                progress += 1
                if i < results.count - 1 {
                    do { try await Task.sleep(for: .seconds(1)) } catch {
                        for j in (i + 1)..<results.count { results[j].state = .skipped }
                        break
                    }
                }
            }
            sendTask = nil
            finishedCount += 1
        }
    }
}

struct MsgBroadcastResult: Identifiable {
    enum State {
        case pending, sending, sent, failed(String), skipped

        var isFailure: Bool { if case .failed = self { return true } else { return false } }
        var isSkipped: Bool { if case .skipped = self { return true } else { return false } }

        var csvStatus: String {
            switch self {
            case .pending: return "pending"
            case .sending: return "sending"
            case .sent: return "sent"
            case .failed: return "failed"
            case .skipped: return "skipped"
            }
        }

        var csvDetail: String { if case .failed(let m) = self { return m } else { return "" } }

        @ViewBuilder var view: some View {
            switch self {
            case .pending: Image(systemName: "circle.dotted").foregroundStyle(.secondary).accessibilityLabel("Waiting")
            case .sending: ProgressView().controlSize(.small)
            case .sent: Image(systemName: "checkmark.circle.fill").foregroundStyle(Theme.Palette.success).accessibilityLabel("Sent")
            case .skipped: Label("Skipped", systemImage: "forward.fill").font(.caption).foregroundStyle(.secondary)
            case .failed(let msg):
                Label(msg, systemImage: "exclamationmark.circle.fill")
                    .font(.caption)
                    .foregroundStyle(Theme.Palette.danger)
                    .lineLimit(2)
            }
        }
    }

    let id = UUID()
    let number: String
    var state: State = .pending
}
