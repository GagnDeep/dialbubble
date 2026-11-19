import SwiftUI

/// Results for one (debounced) query, computed once rather than on every render.
private struct SearchResults {
    var query = ""
    var numbers: [ConfiguredNumber] = []
    var conversations: [Conversation] = []
    var messages: [TwilioMessage] = []
    var calls: [TwilioCall] = []
    var guides: [HelpGuide] = []

    var isEmpty: Bool {
        numbers.isEmpty && conversations.isEmpty && messages.isEmpty && calls.isEmpty && guides.isEmpty
    }

    @MainActor
    static func compute(_ raw: String, store: AppStore) -> SearchResults {
        let q = raw.trimmingCharacters(in: .whitespaces).lowercased()
        guard !q.isEmpty else { return SearchResults() }
        let digits = q.filter(\.isNumber)

        func numberMatches(_ s: String) -> Bool {
            if digits.count >= 2, s.filter(\.isNumber).contains(digits) { return true }
            if ContactBook.shared.name(for: s)?.lowercased().contains(q) == true { return true }
            return s.lowercased().contains(q)
        }

        var r = SearchResults(query: q)
        r.numbers = (store.activeProfile?.numbers ?? []).filter {
            numberMatches($0.phoneNumber) || $0.displayName.lowercased().contains(q)
        }
        // FeatureFlags.messaging: no conversation/message results while texting is hidden.
        if FeatureFlags.messaging {
            r.conversations = Array(store.conversations.lazy.filter { numberMatches($0.counterpart) }.prefix(10))
            r.messages = Array(store.messages.lazy.filter { ($0.body ?? "").lowercased().contains(q) }.prefix(30))
        }
        r.calls = Array(store.calls.lazy
            .filter { $0.parentCallSid == nil && (numberMatches($0.counterpart) || numberMatches($0.ourNumber)) }
            .prefix(20))
        if q.count >= 2 {
            r.guides = Array(HelpGuide.visible.lazy.filter { $0.matches(q) }.prefix(4))
        }
        return r
    }
}

struct GlobalSearchView: View {
    @Environment(AppStore.self) private var store
    @State private var query = ""
    @State private var results = SearchResults()
    @State private var isSearching = false
    @AppStorage("relay.recentSearches") private var recentRaw = ""

    private var recents: [String] { recentRaw.split(separator: "\n").map(String.init) }
    private var trimmed: String { query.trimmingCharacters(in: .whitespaces) }

    /// Re-run when the text changes or new data arrives.
    private var searchKey: String { "\(query)|\(store.messages.count)|\(store.calls.count)|\(store.activeProfileID?.uuidString ?? "")" }

    var body: some View {
        NavigationStack {
            List {
                if trimmed.isEmpty {
                    emptyState
                } else if results.query.isEmpty || isSearching && results.isEmpty {
                    Section {
                        SkeletonRows(count: 4)
                            .padding(.vertical, 6)
                    }
                    .relayListRow()
                } else if results.isEmpty {
                    ContentUnavailableView {
                        Label("No Results for “\(trimmed)”", systemImage: "magnifyingglass")
                    } description: {
                        Text(FeatureFlags.messaging ? "Try a phone number, part of a message, or a topic like “schedule” or “trial”." : "Try a phone number or a topic like “trial”.")
                    }
                    .listRowBackground(Color.clear)
                    if PhoneFormat.isPlausible(query) { directActions }
                } else {
                    if PhoneFormat.isPlausible(query) { directActions }
                    resultSections
                }
            }
            .buttonStyle(.plain)
            .relayBackground()
            .navigationTitle("Search")
            .searchable(text: $query, prompt: FeatureFlags.messaging ? "Numbers, messages, calls" : "Numbers, calls")
            .onSubmit(of: .search, remember)
            .task(id: searchKey) { await search() }
        }
    }

    /// Debounces typing (~250 ms) and computes the results once per settled query.
    private func search() async {
        let text = query
        guard !text.trimmingCharacters(in: .whitespaces).isEmpty else {
            results = SearchResults()
            isSearching = false
            return
        }
        isSearching = true
        try? await Task.sleep(for: .milliseconds(250))
        guard !Task.isCancelled else { return }
        results = SearchResults.compute(text, store: store)
        isSearching = false
    }

    // MARK: Sections

    @ViewBuilder
    private var resultSections: some View {
        if !results.numbers.isEmpty {
            Section {
                ForEach(results.numbers) { n in
                    Button {
                        // FeatureFlags.messaging: open the keypad from this number while texting is hidden.
                        if FeatureFlags.messaging { store.openMessage(to: "", from: n.phoneNumber) } else { store.openDialer(from: n.phoneNumber) }
                        remember()
                    } label: {
                        row(icon: "simcard", color: Theme.Palette.brandText,
                            title: highlightedText(n.displayName),
                            subtitle: highlightedPhone(PhoneFormat.display(n.phoneNumber)), trailing: nil)
                    }
                }
            } header: {
                Text("My Numbers")
            }
            .relayListRow()
        }
        if !results.conversations.isEmpty {
            Section {
                ForEach(results.conversations) { c in
                    Button { store.openMessage(to: c.counterpart, from: c.ourNumber); remember() } label: {
                        row(icon: "bubble.left.and.bubble.right", color: .gray,
                            title: personTitle(c.counterpart),
                            subtitle: highlightedText(c.lastMessage?.body ?? ""), trailing: c.lastDate)
                    }
                }
            } header: {
                Text("Conversations")
            }
            .relayListRow()
        }
        if !results.messages.isEmpty {
            Section {
                ForEach(results.messages) { m in
                    Button { store.openMessage(to: m.counterpart, from: m.ourNumber, focus: m.sid); remember() } label: {
                        row(icon: m.isInbound ? "arrow.down.message" : "arrow.up.message",
                            color: m.statusKind.isFailure ? Theme.Palette.danger : Theme.Palette.brandText,
                            title: personTitle(m.counterpart),
                            subtitle: highlightedText(m.body ?? ""), trailing: m.date)
                    }
                }
            } header: {
                Text("Messages")
            }
            .relayListRow()
        }
        if !results.calls.isEmpty {
            Section {
                ForEach(results.calls) { c in
                    Button { store.openDialer(to: c.counterpart, from: c.ourNumber); remember() } label: {
                        row(icon: c.isInbound ? "phone.arrow.down.left" : "phone.arrow.up.right",
                            color: c.isMissed ? Theme.Palette.danger : Theme.Palette.brandText,
                            title: personTitle(c.counterpart),
                            subtitle: AttributedString("\(c.statusKind.label)\(c.durationSeconds > 0 ? " · \(c.durationSeconds.durationString)" : "")"),
                            trailing: c.date)
                    }
                }
            } header: {
                Text("Calls")
            }
            .relayListRow()
        }
        if !results.guides.isEmpty {
            guidesSection(results.guides, title: "Help Guides")
        }
    }

    private var directActions: some View {
        let number = store.normalize(query)
        return Section {
            Button { store.openDialer(to: number); remember() } label: {
                row(icon: "phone.fill", color: Theme.Palette.brandText, title: AttributedString("Call \(PhoneFormat.display(number))"),
                    subtitle: AttributedString(), trailing: nil)
            }
            if FeatureFlags.messaging {
                Button { store.openMessage(to: number); remember() } label: {
                    row(icon: "message.fill", color: Theme.Palette.brandText, title: AttributedString("Message \(PhoneFormat.display(number))"),
                        subtitle: AttributedString(), trailing: nil)
                }
            }
        }
        .relayListRow()
    }

    @ViewBuilder
    private var emptyState: some View {
        if !recents.isEmpty {
            Section {
                ForEach(recents, id: \.self) { r in
                    Button { query = r } label: {
                        Label {
                            Text(r).foregroundStyle(.primary)
                        } icon: {
                            Image(systemName: "clock.arrow.circlepath").foregroundStyle(.secondary)
                        }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .contentShape(.rect)
                    }
                    .accessibilityHint("Searches again")
                }
            } header: {
                HStack {
                    Text("Recent Searches")
                    Spacer()
                    Button("Clear") { recentRaw = "" }
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Theme.Palette.brandText)
                        .textCase(nil)
                        .buttonStyle(.borderless)
                        .accessibilityLabel("Clear recent searches")
                }
            }
            .relayListRow()
        }
        Section {
            // FeatureFlags.messaging: no conversation suggestions while texting is hidden.
            let suggestions = FeatureFlags.messaging ? Array(store.conversations.prefix(5)) : []
            ForEach(suggestions) { c in
                Button { store.openMessage(to: c.counterpart, from: c.ourNumber) } label: {
                    row(icon: "person.fill", color: .gray,
                        title: AttributedString(ContactBook.shared.label(for: c.counterpart)),
                        subtitle: AttributedString(c.lastMessage?.body ?? ""), trailing: c.lastDate)
                }
            }
            if suggestions.isEmpty {
                Text(FeatureFlags.messaging ? "Search across all messages, calls, and numbers on this account." : "Search across all calls and numbers on this account.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        } header: {
            Text("Suggestions")
        }
        .relayListRow()
        guidesSection(HelpGuide.visible.filter { ["getting-started", "talk-calls", "errors"].contains($0.id) }, title: "Popular Help")
    }

    private func guidesSection(_ guides: [HelpGuide], title: String) -> some View {
        Section {
            ForEach(guides) { g in
                NavigationLink {
                    HelpGuideView(guide: g)
                } label: {
                    HelpGuideRow(guide: g)
                }
            }
            NavigationLink {
                HelpCenterView()
            } label: {
                Text("All Help & Guides")
                    .foregroundStyle(Theme.Palette.brandText)
            }
        } header: {
            Text(title)
        }
        .relayListRow()
    }

    // MARK: Row

    private func row(icon: String, color: Color, title: AttributedString, subtitle: AttributedString, trailing: Date?) -> some View {
        HStack(spacing: Theme.Space.sm) {
            IconTile(symbol: icon, color: color, size: 36)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.subheadline.weight(.semibold)).lineLimit(2)
                if !subtitle.characters.isEmpty {
                    Text(subtitle)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }
            }
            Spacer(minLength: 4)
            if let trailing {
                Text(trailing, format: .relative(presentation: .numeric, unitsStyle: .abbreviated))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .contentShape(.rect)
        .accessibilityElement(children: .combine)
    }

    // MARK: Highlighting

    /// A person's row title: their contact name when known, else the formatted number.
    private func personTitle(_ number: String) -> AttributedString {
        if let name = ContactBook.shared.name(for: number) { return highlightedText(name) }
        return highlightedPhone(PhoneFormat.display(number))
    }

    /// Bolds and tints the first case-insensitive occurrence of the query.
    private func highlightedText(_ text: String) -> AttributedString {
        var a = AttributedString(text)
        let q = results.query
        if !q.isEmpty, let range = a.range(of: q, options: [.caseInsensitive, .diacriticInsensitive]) {
            emphasize(&a, range)
        }
        return a
    }

    /// Highlights a phone match even when the display formatting adds spaces, dashes or brackets.
    private func highlightedPhone(_ text: String) -> AttributedString {
        let digits = results.query.filter(\.isNumber)
        guard digits.count >= 2 else { return highlightedText(text) }
        var a = AttributedString(text)
        // Map every digit in the display string back to its character index.
        let chars = Array(text)
        let digitIndices = chars.indices.filter { chars[$0].isNumber }
        let digitString = String(digitIndices.map { chars[$0] })
        guard let match = digitString.range(of: digits) else { return highlightedText(text) }
        let lower = digitString.distance(from: digitString.startIndex, to: match.lowerBound)
        let upper = digitString.distance(from: digitString.startIndex, to: match.upperBound) - 1
        let startChar = digitIndices[lower], endChar = digitIndices[upper]
        let start = a.characters.index(a.startIndex, offsetBy: startChar)
        let end = a.characters.index(a.startIndex, offsetBy: endChar + 1)
        emphasize(&a, start..<end)
        return a
    }

    private func emphasize(_ a: inout AttributedString, _ range: Range<AttributedString.Index>) {
        a[range].foregroundColor = Theme.Palette.brandText
        a[range].inlinePresentationIntent = .stronglyEmphasized
    }

    private func remember() {
        let term = trimmed
        guard !term.isEmpty else { return }
        let updated = ([term] + recents.filter { $0 != term }).prefix(8)
        recentRaw = updated.joined(separator: "\n")
    }
}
