import SwiftUI
import TipKit

/// Navigation value identifying a message thread.
struct MessageThreadRoute: Hashable {
    var ourNumber: String
    var counterpart: String
    var draftBody: String = ""
    var focusSid: String?
}

enum MessageListFilter: String, CaseIterable, Identifiable, Sendable {
    case all, unread, failed, scheduled
    var id: String { rawValue }
    var title: String { rawValue.capitalized }
    var symbol: String {
        switch self {
        case .all: return "tray.full.fill"
        case .unread: return "circle.fill"
        case .failed: return "exclamationmark.triangle.fill"
        case .scheduled: return "calendar.badge.clock"
        }
    }
}

struct MessagesRootView: View {
    @Environment(AppStore.self) private var store
    @Environment(ToastCenter.self) private var toast
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var path: [MessageThreadRoute] = []
    @State private var search = ""
    @State private var numberFilter: String?
    @State private var listFilter: MessageListFilter = .all
    @State private var showCompose = false
    @State private var composeDraft: MessageDraft?
    @State private var showBroadcast = false
    @State private var showTemplates = false
    @State private var markReadCount = 0
    @State private var copyCount = 0
    @State private var pendingDelete: Conversation?
    @State private var isDeleting = false

    private let composeTip = MessageComposeTip()

    /// Dialbubble's foreground inbox poll (see `AppStore.startPolling`).
    private static let pollSeconds = 20

    /// True until the first fetch for this account finishes, so we show placeholders instead of an empty-state flash.
    private var isFirstLoad: Bool {
        store.hasAccount && !store.smsNumbers.isEmpty && store.messages.isEmpty && store.lastRefresh == nil
    }

    private func matches(_ c: Conversation, _ filter: MessageListFilter) -> Bool {
        switch filter {
        case .all: return true
        case .unread: return store.isUnread(c)
        case .failed: return c.messages.contains { $0.statusKind.isFailure }
        case .scheduled: return c.messages.contains { $0.statusKind == .scheduled }
        }
    }

    private func filtered(_ all: [Conversation]) -> [Conversation] {
        let query = search.trimmingCharacters(in: .whitespaces).lowercased()
        let queryDigits = query.filter(\.isNumber)
        return all.filter { c in
            if let numberFilter, c.ourNumber != numberFilter { return false }
            if !matches(c, listFilter) { return false }
            guard !query.isEmpty else { return true }
            if !queryDigits.isEmpty, c.counterpart.filter(\.isNumber).contains(queryDigits) { return true }
            if PhoneFormat.display(c.counterpart).lowercased().contains(query) { return true }
            if ContactBook.shared.name(for: c.counterpart)?.lowercased().contains(query) == true { return true }
            return c.messages.contains { ($0.body ?? "").lowercased().contains(query) }
        }
    }

    /// One pass over the conversations to count every filter.
    private func chipItems(_ all: [Conversation]) -> [ChipItem<MessageListFilter>] {
        var counts: [MessageListFilter: Int] = [:]
        for c in all {
            if store.isUnread(c) { counts[.unread, default: 0] += 1 }
            var failed = false, scheduled = false
            for m in c.messages {
                if m.statusKind.isFailure { failed = true }
                if m.statusKind == .scheduled { scheduled = true }
                if failed && scheduled { break }
            }
            if failed { counts[.failed, default: 0] += 1 }
            if scheduled { counts[.scheduled, default: 0] += 1 }
        }
        return MessageListFilter.allCases.map { f in
            ChipItem(id: f, title: f.title, symbol: f.symbol, count: f == .all ? nil : counts[f],
                     color: Theme.Palette.brand, accessibilityID: "messages.filter.\(f.rawValue)")
        }
    }

    /// Shows which of your numbers the list is filtered to, with a one-tap way back to all numbers.
    @ViewBuilder
    private var numberFilterPill: some View {
        if let numberFilter, let n = store.configuredNumber(for: numberFilter) {
            Button {
                withAnimation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion)) { self.numberFilter = nil }
            } label: {
                HStack(spacing: 6) {
                    Circle().fill(n.tint.color).frame(width: 8, height: 8)
                    Text("Showing \(n.displayName)")
                    Image(systemName: "xmark.circle.fill").foregroundStyle(.secondary)
                }
                .font(.footnote.weight(.semibold))
                .padding(.horizontal, Theme.Space.sm)
                .padding(.vertical, 6)
                .glassEffect(.regular.interactive(), in: .capsule)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Showing \(n.displayName). Show all numbers")
        }
    }

    var body: some View {
        // Grouping all messages into threads is not free, so do it once per render.
        let all = store.conversations
        let visible = store.sortedForList(filtered(all))
        // Pinned threads become big avatars at the top (Messages-style) when nothing is filtered.
        let showsPinGrid = listFilter == .all && search.isEmpty && numberFilter == nil
        let pinned = showsPinGrid ? visible.filter(store.isPinned) : []
        let rows = showsPinGrid ? visible.filter { !store.isPinned($0) } : visible
        NavigationStack(path: $path) {
            List {
                if isFirstLoad {
                    SkeletonRows(count: 7)
                        .padding(.top, Theme.Space.xs)
                        .listRowBackground(Color.clear)
                        .listRowSeparator(.hidden)
                        .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                } else if !store.smsNumbers.isEmpty, !all.isEmpty {
                    VStack(alignment: .leading, spacing: 6) {
                        ChipBar(items: chipItems(all), selection: $listFilter)
                        numberFilterPill
                    }
                    .listRowBackground(Color.clear)
                    .listRowSeparator(.hidden)
                    .listRowInsets(EdgeInsets(top: 4, leading: 16, bottom: 4, trailing: 16))
                }
                // Inline, not a popover: a popover on the compose button covered the title and search field.
                if !isFirstLoad, !store.smsNumbers.isEmpty {
                    TipView(composeTip, arrowEdge: nil)
                        .listRowBackground(Color.clear)
                        .listRowSeparator(.hidden)
                        .listRowInsets(EdgeInsets(top: 4, leading: 16, bottom: 4, trailing: 16))
                }
                if !pinned.isEmpty {
                    PinnedConversationsGrid(conversations: pinned) { c in
                        path.append(MessageThreadRoute(ourNumber: c.ourNumber, counterpart: c.counterpart))
                    } onUnpin: { togglePin($0) }
                    .listRowBackground(Color.clear)
                    .listRowSeparator(.hidden)
                    .listRowInsets(EdgeInsets(top: 4, leading: 16, bottom: 8, trailing: 16))
                }
                ForEach(rows) { c in
                    // Hidden link keeps the native push + row highlight without the disclosure chevron (Messages-style).
                    ZStack {
                        NavigationLink(value: MessageThreadRoute(ourNumber: c.ourNumber, counterpart: c.counterpart)) {
                            EmptyView()
                        }
                        .opacity(0)
                        MessageConversationRow(conversation: c)
                    }
                    .listRowBackground(Color.clear)
                    .listRowSeparatorTint(Theme.Palette.hairline)
                    .listRowInsets(EdgeInsets(top: 0, leading: Theme.Space.xs, bottom: 0, trailing: Theme.Space.md))
                    .swipeActions(edge: .leading) {
                        Button {
                            togglePin(c)
                        } label: {
                            Label(store.isPinned(c) ? "Unpin" : "Pin", systemImage: store.isPinned(c) ? "pin.slash.fill" : "pin.fill")
                        }
                        .tint(Theme.Palette.warning)
                        if store.isUnread(c) {
                            Button {
                                markRead(c)
                            } label: {
                                Label("Mark Read", systemImage: "envelope.open.fill")
                            }
                            .tint(Theme.Palette.info)
                        } else if store.canMarkUnread(c) {
                            Button {
                                markUnread(c)
                            } label: {
                                Label("Mark Unread", systemImage: "envelope.badge.fill")
                            }
                            .tint(Theme.Palette.info)
                        }
                    }
                    .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                        Button(role: .destructive) {
                            pendingDelete = c
                        } label: {
                            Label("Delete", systemImage: "trash.fill")
                        }
                        Button {
                            store.openDialer(to: c.counterpart, from: c.ourNumber)
                        } label: {
                            Label("Call", systemImage: "phone.fill")
                        }
                        .tint(Theme.Palette.brand)
                        Button {
                            copy(c.counterpart)
                        } label: {
                            Label("Copy", systemImage: "doc.on.doc.fill")
                        }
                        .tint(.gray)
                    }
                    .contextMenu {
                        Button(store.isPinned(c) ? "Unpin" : "Pin", systemImage: store.isPinned(c) ? "pin.slash" : "pin") { togglePin(c) }
                        Button("Call", systemImage: "phone") { store.openDialer(to: c.counterpart, from: c.ourNumber) }
                        Button("Copy Number", systemImage: "doc.on.doc") { copy(c.counterpart) }
                        if ContactBook.shared.name(for: c.counterpart) == nil, !store.isDemo {
                            Button("Add to Contacts", systemImage: "person.crop.circle.badge.plus") {
                                ContactPicker.addContact(phone: c.counterpart)
                            }
                        }
                        if store.isUnread(c) {
                            Button("Mark as Read", systemImage: "envelope.open") { markRead(c) }
                        } else if store.canMarkUnread(c) {
                            Button("Mark as Unread", systemImage: "envelope.badge") { markUnread(c) }
                        }
                        Divider()
                        Button("Delete Conversation", systemImage: "trash", role: .destructive) { pendingDelete = c }
                    }
                }
            }
            .listStyle(.plain)
            .accessibilityIdentifier("messages.list")
            .relayBackground()
            .navigationTitle("Messages")
            .searchable(text: $search, prompt: "Search names, numbers or messages")
            .refreshable { await store.refreshMessages() }
            .overlay { if !isFirstLoad { emptyState(visible) } }
            .animation(Theme.Motion.adaptive(Theme.Motion.smooth, reduceMotion), value: isFirstLoad)
            .toolbar { toolbar }
            .navigationDestination(for: MessageThreadRoute.self) { route in
                ConversationView(route: route)
            }
            .sheet(isPresented: $showCompose, onDismiss: { composeDraft = nil }) {
                NewMessageView(draft: composeDraft) { route in
                    path.append(route)
                }
            }
            .sheet(isPresented: $showBroadcast) { BroadcastView() }
            .sheet(isPresented: $showTemplates) {
                NavigationStack { TemplatesView(isModal: true) }
            }
            .confirmationDialog("Delete this conversation?", isPresented: Binding(
                get: { pendingDelete != nil },
                set: { if !$0 { pendingDelete = nil } }
            ), titleVisibility: .visible, presenting: pendingDelete) { c in
                Button("Delete \(c.messages.count) Message\(c.messages.count == 1 ? "" : "s")", role: .destructive) { delete(c) }
                Button("Cancel", role: .cancel) {}
            } message: { c in
                Text("Every message with \(ContactBook.shared.label(for: c.counterpart)) is removed from your Twilio logs and this app. They keep their copies.")
            }
            .overlay(alignment: .bottom) {
                if isDeleting {
                    ProgressView("Deleting…")
                        .padding(.horizontal, Theme.Space.md)
                        .padding(.vertical, Theme.Space.sm)
                        .glassEffect(.regular, in: .capsule)
                        .padding(.bottom, Theme.Space.lg)
                }
            }
            .sensoryFeedback(.success, trigger: markReadCount)
            .sensoryFeedback(.impact(weight: .light), trigger: copyCount)
        }
        .onAppear(perform: consumeDraft)
        .onChange(of: store.messageDraft) { _, _ in consumeDraft() }
        .onAppear(perform: consumeFilterRequest)
        .onChange(of: store.messagesFilterRequest) { _, _ in consumeFilterRequest() }
    }

    private func consumeFilterRequest() {
        guard let f = store.messagesFilterRequest else { return }
        store.messagesFilterRequest = nil
        path = []
        search = ""
        withAnimation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion)) { listFilter = f }
    }

    private func delete(_ c: Conversation) {
        pendingDelete = nil
        isDeleting = true
        Task {
            defer { isDeleting = false }
            do {
                let kept = try await store.deleteConversation(c)
                toast.show(kept == 0 ? "Conversation deleted" : "Deleted, except \(kept) still sending", style: kept == 0 ? .success : .warning)
            } catch {
                toast.show(FriendlyError(error).title, style: .error)
            }
        }
    }

    private func togglePin(_ c: Conversation) {
        withAnimation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion)) { store.togglePin(c) }
        markReadCount += 1
    }

    private func markRead(_ c: Conversation) {
        store.markRead(c)
        markReadCount += 1
    }

    private func markUnread(_ c: Conversation) {
        withAnimation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion)) { store.markUnread(c) }
        markReadCount += 1
    }

    private func copy(_ number: String) {
        UIPasteboard.general.string = number
        copyCount += 1
        toast.show("Number copied", style: .success)
    }

    // MARK: Empty states

    @ViewBuilder
    private func emptyState(_ visible: [Conversation]) -> some View {
        if store.smsNumbers.isEmpty {
            ContentUnavailableView {
                Label("No Number Can Text Yet", systemImage: "message.badge.filled.fill")
            } description: {
                Text("To send texts you need a Twilio phone number with SMS turned on. Buy one in the Twilio Console, then sync it here — or enable SMS for a number you already have in Settings.")
            } actions: {
                Button("Open Settings", systemImage: "gearshape.fill") { store.selectedTab = .settings }
                    .buttonStyle(.glassProminent)
                Link(destination: URL(string: "https://console.twilio.com/us1/develop/phone-numbers/manage/search")!) {
                    Label("Buy a Number", systemImage: "cart.fill")
                }
                .buttonStyle(.glass)
            }
        } else if visible.isEmpty {
            if !search.isEmpty {
                ContentUnavailableView.search(text: search)
            } else if listFilter != .all {
                ContentUnavailableView {
                    Label("No \(listFilter.title) Conversations", systemImage: listFilter.symbol)
                } description: {
                    Text(emptyFilterText)
                } actions: {
                    Button("Show All", systemImage: "tray.full") {
                        withAnimation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion)) { listFilter = .all }
                    }
                    .buttonStyle(.glass)
                }
            } else {
                ContentUnavailableView {
                    Label("No Messages Yet", systemImage: "bubble.left.and.bubble.right.fill")
                } description: {
                    Text("Texts sent and received by your Twilio numbers appear here. While Dialbubble is open it checks for new replies every \(Self.pollSeconds) seconds — pull down to check right away.")
                } actions: {
                    Button("New Message", systemImage: "square.and.pencil") { openCompose() }
                        .buttonStyle(.glassProminent)
                    Button("Broadcast to Many", systemImage: "megaphone.fill") { showBroadcast = true }
                        .buttonStyle(.glass)
                }
            }
        }
    }

    private var emptyFilterText: String {
        switch listFilter {
        case .unread: return "You've read everything. Nice!"
        case .failed: return "All your messages were delivered."
        case .scheduled: return "Messages you schedule for later show up here until they're sent."
        case .all: return ""
        }
    }

    // MARK: Toolbar

    @ToolbarContentBuilder
    private var toolbar: some ToolbarContent {
        ToolbarItem(placement: .topBarLeading) {
            Menu {
                Picker("Show messages for", selection: $numberFilter) {
                    Label("All Numbers", systemImage: "tray.full").tag(String?.none)
                    ForEach(store.smsNumbers) { n in
                        Label {
                            Text(n.displayName)
                            Text(PhoneFormat.display(n.phoneNumber))
                        } icon: {
                            Image(systemName: "circle.fill").foregroundStyle(n.tint.color)
                        }
                        .tag(Optional(n.phoneNumber))
                    }
                }
            } label: {
                Image(systemName: numberFilter == nil ? "line.3.horizontal.decrease" : "line.3.horizontal.decrease.circle.fill")
            }
            .tint(.primary)
            .accessibilityLabel("Filter by number")
            .accessibilityIdentifier("messages.numberFilter")
            .disabled(store.smsNumbers.count < 2)
        }
        ToolbarItem(placement: .topBarTrailing) {
            Menu {
                Button("Broadcast", systemImage: "megaphone.fill") { showBroadcast = true }
                Button("Templates", systemImage: "text.badge.star") { showTemplates = true }
                Divider()
                Button("Mark All as Read", systemImage: "envelope.open.fill") {
                    store.markAllRead()
                    markReadCount += 1
                }
                    .disabled(store.unreadCount == 0)
                Button("Refresh", systemImage: "arrow.clockwise") { Task { await store.refreshMessages() } }
            } label: {
                Image(systemName: "ellipsis")
            }
            .tint(.primary)
            .accessibilityLabel("More")
            .accessibilityIdentifier("messages.more")
            .disabled(store.smsNumbers.isEmpty)
        }
        ToolbarSpacer(.fixed, placement: .topBarTrailing)
        ToolbarItem(placement: .topBarTrailing) {
            Button(action: openCompose) {
                Image(systemName: "square.and.pencil")
            }
            .buttonStyle(.glassProminent)
            .tint(Theme.Palette.brand)
            .accessibilityLabel("New Message")
            .accessibilityIdentifier("messages.compose")
            .disabled(store.smsNumbers.isEmpty)
        }
    }

    private func openCompose() {
        composeTip.invalidate(reason: .actionPerformed)
        composeDraft = nil
        showCompose = true
    }

    private func consumeDraft() {
        guard let draft = store.messageDraft else { return }
        store.messageDraft = nil
        let to = store.normalize(draft.to)
        let from = draft.from ?? store.activeProfile?.defaultSMSNumber ?? store.smsNumbers.first?.phoneNumber
        if let from, !to.isEmpty {
            showCompose = false
            path = [MessageThreadRoute(ourNumber: from, counterpart: to, draftBody: draft.body, focusSid: draft.focusSid)]
        } else {
            composeDraft = draft
            showCompose = true
        }
    }
}

// MARK: - Row

private struct MessageConversationRow: View {
    @Environment(AppStore.self) private var store
    let conversation: Conversation
    @ScaledMetric(relativeTo: .body) private var avatarSize: CGFloat = 44
    @ScaledMetric(relativeTo: .subheadline) private var unreadDot: CGFloat = 10
    @ScaledMetric(relativeTo: .footnote) private var lineDot: CGFloat = 6

    var body: some View {
        let unread = store.isUnread(conversation)
        let pinned = store.isPinned(conversation)
        let draft = store.draft(for: conversation.id)
        let ours = store.configuredNumber(for: conversation.ourNumber)
        let lineName = ours?.displayName ?? PhoneFormat.display(conversation.ourNumber)
        HStack(alignment: .center, spacing: Theme.Space.sm) {
            // Unread dot lives in the leading gutter (iOS Messages), so it never crowds the preview text.
            Circle()
                .fill(unread ? Theme.Palette.brandBright : .clear)
                .frame(width: unreadDot, height: unreadDot)
                .accessibilityHidden(true)
                .padding(.trailing, -Theme.Space.xxs)
            MsgTonalAvatar(key: conversation.counterpart, size: min(avatarSize, 72))
            VStack(alignment: .leading, spacing: 2) {
                HStack(alignment: .firstTextBaseline, spacing: Theme.Space.xs) {
                    Text(ContactBook.shared.label(for: conversation.counterpart))
                        .font(.body.weight(unread ? .bold : .semibold))
                        .foregroundStyle(.primary)
                        .monospacedDigit()
                        .lineLimit(1)
                        .layoutPriority(1)
                    if let flag = store.flag(for: conversation.counterpart) {
                        Text(flag)
                            .font(.subheadline)
                            .accessibilityLabel(PhoneFormat.countryName(of: conversation.counterpart) ?? "")
                    }
                    Spacer(minLength: 0)
                    if pinned {
                        Image(systemName: "pin.fill")
                            .font(.caption2.weight(.bold))
                            .foregroundStyle(.secondary)
                            .rotationEffect(.degrees(45))
                            .accessibilityHidden(true)
                    }
                    Text(conversation.lastDate.listStamp)
                        .font(.subheadline)
                        .foregroundStyle(unread ? Theme.Palette.brandText : .secondary)
                        .lineLimit(1)
                }
                if let draft {
                    // Your unsent text wins the preview, like Messages.
                    Text("\(Text("Draft").foregroundStyle(Theme.Palette.brandText).fontWeight(.semibold)) \(draft)")
                        .foregroundStyle(.secondary)
                        .font(.subheadline)
                        .lineLimit(2)
                } else {
                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    if let icon = previewIcon {
                        Image(systemName: icon.symbol)
                            .font(.footnote.weight(.semibold))
                            .foregroundStyle(icon.color)
                    }
                    Text(preview)
                        .font(.subheadline)
                        .foregroundStyle(unread ? .primary : .secondary)
                        .lineLimit(2)
                }
                }
                HStack(spacing: 5) {
                    Circle()
                        .fill(ours?.tint.color ?? .secondary)
                        .frame(width: lineDot, height: lineDot)
                    Text(lineName)
                        .lineLimit(1)
                }
                .font(.footnote)
                .foregroundStyle(.secondary)
                .padding(.top, 1)
                .accessibilityElement(children: .ignore)
                .accessibilityLabel("Via \(lineName)")
            }
            .alignmentGuide(.listRowSeparatorLeading) { d in d[.leading] }
        }
        .padding(.vertical, 6)
        .contentShape(.rect)
        .accessibilityElement(children: .combine)
        .accessibilityValue([unread ? "Unread" : nil, pinned ? "Pinned" : nil, draft != nil ? "Has a draft" : nil]
            .compactMap { $0 }.joined(separator: ", "))
    }

    private var previewIcon: (symbol: String, color: Color)? {
        guard let m = conversation.lastMessage else { return nil }
        if m.statusKind.isFailure { return ("exclamationmark.circle.fill", Theme.Palette.danger) }
        if m.statusKind == .scheduled { return ("calendar.badge.clock", .secondary) }
        if m.mediaCount > 0 { return ("paperclip", .secondary) }
        return nil
    }

    private var preview: String {
        guard let m = conversation.lastMessage else { return "" }
        let body = m.body?.nilIfBlank ?? (m.mediaCount > 0 ? "Attachment" : "")
        if m.statusKind == .scheduled { return "Scheduled · " + body }
        if m.statusKind.isFailure { return "Not delivered · " + body }
        return m.isInbound ? body : "You: " + body
    }
}

// MARK: - Pinned

/// Pinned threads as big avatars with names, three to a row, like Messages.
private struct PinnedConversationsGrid: View {
    @Environment(AppStore.self) private var store
    let conversations: [Conversation]
    var onOpen: (Conversation) -> Void
    var onUnpin: (Conversation) -> Void
    @ScaledMetric(relativeTo: .title) private var size: CGFloat = 64

    var body: some View {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: Theme.Space.sm), count: 3), spacing: Theme.Space.md) {
            ForEach(conversations) { c in
                let unread = store.isUnread(c)
                Button { onOpen(c) } label: {
                    VStack(spacing: 6) {
                        MsgTonalAvatar(key: c.counterpart, size: min(size, 96))
                            .overlay(alignment: .topTrailing) {
                                if unread {
                                    Circle()
                                        .fill(Theme.Palette.brandBright)
                                        .frame(width: 14, height: 14)
                                        .overlay(Circle().strokeBorder(Theme.Palette.surface, lineWidth: 2))
                                }
                            }
                        Text(ContactBook.shared.name(for: c.counterpart)?.split(separator: " ").first.map(String.init)
                             ?? PhoneFormat.display(c.counterpart))
                            .font(.footnote.weight(unread ? .bold : .medium))
                            .foregroundStyle(.primary)
                            .lineLimit(1)
                            .minimumScaleFactor(0.8)
                    }
                    .frame(maxWidth: .infinity)
                    .contentShape(.rect)
                }
                .buttonStyle(.plain)
                .contextMenu {
                    Button("Unpin", systemImage: "pin.slash") { onUnpin(c) }
                }
                .accessibilityLabel("\(ContactBook.shared.label(for: c.counterpart)), pinned\(unread ? ", unread" : "")")
                .accessibilityIdentifier("messages.pinned")
            }
        }
        .padding(.vertical, Theme.Space.xs)
    }
}

// MARK: - Tonal avatar

/// Calm avatar for the Messages area: a softly tinted plate with a colored glyph, instead of a saturated disc.
/// Uses a restrained hue set (no purple/indigo) keyed on the phone number so a person keeps their color.
struct MsgTonalAvatar: View {
    var key: String
    var size: CGFloat = 44
    @Environment(\.colorScheme) private var scheme

    private static let hues: [Color] = [Theme.Palette.brandText, .teal, .blue, .gray, .orange, .green, .cyan]

    static func hue(for key: String) -> Color {
        let hash = key.unicodeScalars.reduce(0) { ($0 &* 31 &+ Int($1.value)) & 0x7fffffff }
        return hues[hash % hues.count]
    }

    var body: some View {
        let hue = Self.hue(for: key)
        TonalAvatarGlyph(key: key, size: size, tone: hue.opacity(scheme == .dark ? 0.9 : 0.85))
            .frame(width: size, height: size)
            .background(hue.opacity(scheme == .dark ? 0.20 : 0.14), in: .circle)
            .accessibilityHidden(true)
    }
}

/// The inside of a tonal avatar: the contact's initials when the number is in Contacts, else a person glyph.
struct TonalAvatarGlyph: View {
    var key: String?
    var size: CGFloat
    var tone: Color

    var body: some View {
        let initials = ContactBook.shared.name(for: key).map(ContactBook.initials) ?? ""
        if let photo = ContactBook.shared.photo(for: key) {
            Image(uiImage: photo)
                .resizable()
                .scaledToFill()
                .frame(width: size, height: size)
                .clipShape(.circle)
        } else if initials.isEmpty {
            Image(systemName: "person.fill")
                .font(.system(size: size * 0.44, weight: .medium))
                .foregroundStyle(tone)
        } else {
            Text(initials)
                .font(.system(size: size * (initials.count > 1 ? 0.36 : 0.42), weight: .semibold, design: .rounded))
                .foregroundStyle(tone)
                .minimumScaleFactor(0.6)
                .lineLimit(1)
        }
    }
}
