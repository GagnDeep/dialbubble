import SwiftUI

struct NewMessageView: View {
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    var draft: MessageDraft?
    var onSent: (MessageThreadRoute) -> Void

    @State private var to = ""
    @State private var contactName = ""
    @State private var from: String?
    @State private var text = ""
    @State private var isSending = false
    @State private var error: FriendlyError?
    @State private var sentCount = 0
    @FocusState private var focus: Field?
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @ScaledMetric(relativeTo: .footnote) private var recentAvatarSize: CGFloat = 22

    private enum Field { case to, body }

    private var normalizedTo: String { store.normalize(to) }
    private var toIsValid: Bool { PhoneFormat.isPlausible(to) }
    private var canSend: Bool { !isSending && toIsValid && text.nilIfBlank != nil && from != nil }

    /// Recently texted people, for one-tap selection.
    private var recents: [String] {
        var seen = Set<String>()
        return store.conversations.map(\.counterpart).filter { seen.insert($0).inserted }.prefix(8).map { $0 }
    }

    /// People matching what's typed in To: by name, or by digits in their number. Hidden once a full number is in.
    private var suggestions: [ContactBook.Person] {
        guard !to.isEmpty, contactName.isEmpty || to.contains(where: \.isLetter) else { return [] }
        if !to.contains(where: \.isLetter), toIsValid { return [] }
        let contacts = ContactBook.shared.search(to)
        let recentPeople = recents.compactMap { n -> ContactBook.Person? in
            guard to.contains(where: \.isLetter) || n.filter(\.isNumber).contains(to.filter(\.isNumber)) else { return nil }
            if let name = ContactBook.shared.name(for: n) {
                return ContactBook.search(to, in: [ContactBook.Person(name: name, number: n)], limit: 1).first
            }
            return to.filter(\.isNumber).count >= 3 ? ContactBook.Person(name: PhoneFormat.display(n), number: n) : nil
        }
        var seen = Set<String>()
        return (recentPeople + contacts).filter { seen.insert(ContactBook.key($0.number)).inserted }.prefix(4).map { $0 }
    }

    private var sendHint: String? {
        if to.isEmpty { return "Enter a name or phone number, or pick a contact." }
        if to.contains(where: \.isLetter) { return suggestions.isEmpty ? "No contact matches \"\(to)\". Try a phone number." : "Choose a person from the list." }
        if !toIsValid { return "Include the country code, like +1 415 555 0100." }
        if from == nil { return "Choose one of your numbers to send from." }
        if text.nilIfBlank == nil { return "Type your message." }
        return nil
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    HStack {
                        Image(systemName: "person.fill")
                            .foregroundStyle(.secondary)
                            .accessibilityHidden(true)
                        TextField("Name or number", text: $to)
                            .keyboardType(.namePhonePad)
                            .autocorrectionDisabled()
                            .textInputAutocapitalization(.words)
                            .textContentType(.telephoneNumber)
                            .focused($focus, equals: .to)
                            .accessibilityIdentifier("newMessage.to")
                        if !to.isEmpty, !to.contains(where: \.isLetter) {
                            Image(systemName: toIsValid ? "checkmark.circle.fill" : "exclamationmark.circle.fill")
                                .foregroundStyle(toIsValid ? Theme.Palette.success : Theme.Palette.warning)
                                .contentTransition(.symbolEffect(.replace))
                                .accessibilityLabel(toIsValid ? "Valid number" : "Incomplete number")
                        }
                        ContactPickerButton { phone, name in
                            to = phone
                            contactName = name
                            focus = .body
                        }
                    }
                    ForEach(suggestions, id: \.number) { person in
                        Button {
                            to = person.number.filter { $0.isNumber || $0 == "+" }
                            contactName = person.name
                            focus = .body
                        } label: {
                            HStack(spacing: Theme.Space.sm) {
                                MsgTonalAvatar(key: person.number, size: 32)
                                VStack(alignment: .leading, spacing: 0) {
                                    Text(person.name).font(.subheadline.weight(.semibold)).foregroundStyle(.primary)
                                    Text(PhoneFormat.display(person.number)).font(.footnote.monospacedDigit()).foregroundStyle(.secondary)
                                }
                            }
                            .contentShape(.rect)
                        }
                        .buttonStyle(.plain)
                        .accessibilityIdentifier("newMessage.suggestion")
                    }
                    if !to.isEmpty, suggestions.isEmpty || toIsValid {
                        LabeledContent {
                            Text(PhoneFormat.display(normalizedTo)).monospacedDigit()
                        } label: {
                            Label(contactName.nilIfBlank ?? "Will send to", systemImage: "arrow.right.circle")
                        }
                        .font(.footnote)
                        .foregroundStyle(toIsValid ? Color.secondary : Theme.Palette.warning)
                    }
                    if to.isEmpty, !recents.isEmpty {
                        ScrollView(.horizontal) {
                            GlassEffectContainer(spacing: Theme.Space.xs) {
                                HStack(spacing: Theme.Space.xs) {
                                    ForEach(recents, id: \.self) { n in
                                        Button {
                                            to = n
                                            contactName = ContactBook.shared.name(for: n) ?? ""
                                            focus = .body
                                        } label: {
                                            HStack(spacing: 6) {
                                                MsgTonalAvatar(key: n, size: recentAvatarSize)
                                                Text(ContactBook.shared.label(for: n)).font(.footnote.weight(.medium).monospacedDigit())
                                            }
                                            .padding(.leading, 5)
                                            .padding(.trailing, Theme.Space.sm)
                                            .padding(.vertical, 5)
                                            .contentShape(.capsule)
                                            .glassEffect(.regular.interactive(), in: .capsule)
                                        }
                                        .buttonStyle(.plain)
                                        .accessibilityLabel("Text \(ContactBook.shared.label(for: n))")
                                    }
                                }
                                .padding(2)
                            }
                        }
                        .scrollIndicators(.hidden)
                        .scrollClipDisabled()
                        .listRowInsets(EdgeInsets(top: 8, leading: 12, bottom: 8, trailing: 12))
                    }
                } header: {
                    Text("To")
                } footer: {
                    if to.isEmpty, !recents.isEmpty { Text("Or pick a recent conversation.") }
                }

                Section {
                    FromNumberPicker(selection: $from, capability: .sms)
                        .listRowBackground(Color.clear)
                        .listRowInsets(EdgeInsets())
                } header: {
                    Text("From")
                } footer: {
                    Text("The recipient sees this number and replies to it.")
                }

                Section {
                    TextField("Message", text: $text, axis: .vertical)
                        .lineLimit(4...10)
                        .focused($focus, equals: .body)
                        .accessibilityIdentifier("newMessage.body")
                    if !store.templates.isEmpty {
                        MsgTemplateChips { t in
                            text = text.nilIfBlank == nil ? t.body : text + (text.hasSuffix(" ") ? "" : " ") + t.body
                        }
                        .listRowInsets(EdgeInsets(top: 8, leading: 12, bottom: 8, trailing: 12))
                    }
                } header: {
                    Text("Message")
                } footer: {
                    let c = MsgSegmentCounter.count(text)
                    Text("\(c.units) characters · \(c.segments) part\(c.segments == 1 ? "" : "s")\(c.isUnicode ? " · Unicode: 70 characters per part" : "")")
                        .monospacedDigit()
                        .contentTransition(.numericText())
                        .animation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion), value: c.units)
                }

                if let error {
                    Section {
                        FriendlyErrorView(error: error, retry: send, onDismiss: { withAnimation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion)) { self.error = nil } })
                            .listRowBackground(Color.clear)
                            .listRowInsets(EdgeInsets())
                    }
                } else if let sendHint {
                    Section {
                        Label(sendHint, systemImage: "info.circle")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                            .contentTransition(.opacity)
                    }
                    .listRowBackground(Color.clear)
                }
            }
            .relayBackground()
            .navigationTitle("New Message")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(role: .cancel) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(action: send) {
                        if isSending { ProgressView() } else { Label("Send", systemImage: "arrow.up") }
                    }
                    .buttonStyle(.glassProminent)
                    .tint(Theme.Palette.brand)
                    .disabled(!canSend)
                    .accessibilityIdentifier("newMessage.send")
                }
            }
            .sensoryFeedback(.success, trigger: sentCount)
            .sensoryFeedback(.error, trigger: error) { _, new in new != nil }
            .onAppear {
                if let draft {
                    to = draft.to
                    text = draft.body
                    if let f = draft.from { from = f }
                }
                focus = to.isEmpty ? .to : .body
            }
        }
    }

    private func send() {
        guard let from, canSend else { return }
        isSending = true
        withAnimation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion)) { error = nil }
        Task {
            defer { isSending = false }
            do {
                let sent = try await store.sendMessage(OutgoingMessage(from: from, to: to, body: text.trimmingCharacters(in: .whitespacesAndNewlines)))
                sentCount += 1
                let route = MessageThreadRoute(ourNumber: sent.from ?? from, counterpart: sent.to ?? normalizedTo)
                dismiss()
                onSent(route)
            } catch {
                withAnimation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion)) { self.error = FriendlyError(error) }
            }
        }
    }
}
