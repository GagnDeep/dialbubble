import SwiftUI
import TipKit

struct ConversationView: View {
    @Environment(AppStore.self) private var store
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(ToastCenter.self) private var toast
    let route: MessageThreadRoute

    @State private var from: String?
    @State private var draft = ""
    @State private var detailMessage: TwilioMessage?
    @State private var fullScreenImage: MsgIdentifiedImage?
    @State private var selectTextMessage: TwilioMessage?
    @State private var pendingDelete: TwilioMessage?
    @State private var actionError: FriendlyError?
    @State private var showLegend = false
    @State private var expanded: Set<String> = []
    @State private var copies = 0
    @State private var deletions = 0
    /// Scrolled up away from the newest message: show the jump button and don't yank the view on new replies.
    @State private var awayFromBottom = false
    @State private var unseenNew = 0
    @State private var incoming = 0
    /// A message opened from Search: scrolled to and briefly highlighted.
    @State private var flashSid: String?

    private let bubbleTip = MessageBubbleTip()

    init(route: MessageThreadRoute) {
        self.route = route
        _from = State(initialValue: route.ourNumber)
        _draft = State(initialValue: route.draftBody)
    }

    private var ourNumber: String { from ?? route.ourNumber }
    private var conversationID: String { "\(ourNumber)|\(route.counterpart)" }
    private var ourConfigured: ConfiguredNumber? { store.configuredNumber(for: ourNumber) }
    private var viaText: String { "via \(ourConfigured?.displayName ?? PhoneFormat.display(ourNumber))" }

    private func dayGroups(_ messages: [TwilioMessage]) -> [(day: Date, messages: [TwilioMessage])] {
        let cal = Calendar.current
        let groups = Dictionary(grouping: messages) { cal.startOfDay(for: $0.date) }
        return groups.keys.sorted().map { ($0, groups[$0] ?? []) }
    }

    /// "Today", "Yesterday", a weekday this week, else the date. Like Messages.
    static func dayTitle(_ day: Date) -> String {
        let cal = Calendar.current
        if cal.isDateInToday(day) { return "Today" }
        if cal.isDateInYesterday(day) { return "Yesterday" }
        if let days = cal.dateComponents([.day], from: day, to: .now).day, days < 7 {
            return day.formatted(.dateTime.weekday(.wide))
        }
        let sameYear = cal.isDate(day, equalTo: .now, toGranularity: .year)
        return sameYear ? day.formatted(.dateTime.weekday(.abbreviated).month(.abbreviated).day())
                        : day.formatted(date: .abbreviated, time: .omitted)
    }

    /// Inside a day, a pause this long gets its own time stamp (Messages does the same).
    static let gapForTimestamp: TimeInterval = 3600

    /// Messages from the same side within a few minutes form a run: tighter spacing, one footer at the end.
    static func run(_ messages: [TwilioMessage], _ idx: Int) -> (starts: Bool, ends: Bool) {
        func joined(_ a: TwilioMessage, _ b: TwilioMessage) -> Bool {
            a.isInbound == b.isInbound && abs(b.date.timeIntervalSince(a.date)) < 180
                && !a.statusKind.isFailure && a.statusKind != .scheduled
        }
        let m = messages[idx]
        let starts = idx == 0 || !joined(messages[idx - 1], m)
        let ends = idx == messages.count - 1 || !joined(m, messages[idx + 1])
        return (starts, ends)
    }

    private func animate(_ animation: Animation = Theme.Motion.snappy, _ body: () -> Void) {
        withAnimation(Theme.Motion.adaptive(animation, reduceMotion), body)
    }

    var body: some View {
        // Computed once per render: `store.conversation` groups every message.
        let conversation = store.conversation(our: ourNumber, counterpart: route.counterpart)
        // Like Messages: "Delivered" is spelled out only under your latest message.
        let latestOutbound = conversation.messages.last(where: { !$0.isInbound })?.sid
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: 3) {
                    if conversation.messages.isEmpty {
                        MessageNewThreadCard(counterpart: route.counterpart, ourNumber: ourNumber)
                            .padding(.top, Theme.Space.lg)
                    } else {
                        MessageThreadHeader(counterpart: route.counterpart, ourNumber: ourNumber,
                                            since: conversation.messages.first?.date)
                            .padding(.top, Theme.Space.md)
                            .padding(.bottom, Theme.Space.xs)
                        TipView(bubbleTip)
                            .padding(.top, Theme.Space.xs)
                    }
                    ForEach(dayGroups(conversation.messages), id: \.day) { group in
                        // "Today 9:41 PM", like Messages: the day, then when the conversation picked up.
                        Text("\(Text(Self.dayTitle(group.day)).fontWeight(.semibold)) \(group.messages.first?.date.formatted(date: .omitted, time: .shortened) ?? "")")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                            .padding(.top, Theme.Space.sm)
                            .padding(.bottom, Theme.Space.xxs)
                            .accessibilityAddTraits(.isHeader)
                        ForEach(Array(group.messages.enumerated()), id: \.element.id) { idx, m in
                            let run = Self.run(group.messages, idx)
                            if idx > 0, m.date.timeIntervalSince(group.messages[idx - 1].date) > Self.gapForTimestamp {
                                Text(m.date, format: .dateTime.hour().minute())
                                    .font(.footnote)
                                    .foregroundStyle(.secondary)
                                    .padding(.top, Theme.Space.sm)
                                    .padding(.bottom, Theme.Space.xxs)
                            }
                            MessageBubble(
                                message: m,
                                startsRun: run.starts,
                                endsRun: run.ends,
                                isExpanded: expanded.contains(m.sid),
                                showsStatusText: m.sid == latestOutbound,
                                onTap: {
                                    animate {
                                        if expanded.contains(m.sid) { expanded.remove(m.sid) } else { expanded.insert(m.sid) }
                                    }
                                },
                                onRetry: { resend(m) },
                                onCancelSchedule: { cancelSchedule(m) },
                                onImageTap: { fullScreenImage = MsgIdentifiedImage(image: $0) },
                                onCopyCode: { copyCode($0) }
                            )
                            .id(m.sid)
                            .padding(.top, run.starts && idx > 0 ? Theme.Space.xs : 0)
                            .background {
                                if flashSid == m.sid {
                                    RoundedRectangle(cornerRadius: Theme.Radius.md, style: .continuous)
                                        .fill(Theme.Palette.brand.opacity(0.18))
                                        .padding(-6)
                                        .transition(.opacity)
                                }
                            }
                            .contextMenu { contextMenu(for: m) }
                        }
                    }
                }
                .padding(.horizontal, Theme.Space.sm)
                .padding(.top, Theme.Space.xs)
                .padding(.bottom, Theme.Space.sm)
            }
            .defaultScrollAnchor(.bottom)
            .scrollDismissesKeyboard(.interactively)
            .scrollEdgeEffectStyle(.soft, for: .all)
            .onScrollGeometryChange(for: Bool.self) { geo in
                geo.contentSize.height + geo.contentInsets.bottom - geo.visibleRect.maxY > 320
            } action: { _, away in
                withAnimation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion)) {
                    awayFromBottom = away
                    if !away { unseenNew = 0 }
                }
            }
            .onChange(of: conversation.messages.last?.sid) { _, newValue in
                guard let newValue, let last = conversation.messages.last else { return }
                let fresh = last.isInbound && last.date > .now.addingTimeInterval(-120)
                if fresh { incoming += 1 }
                if awayFromBottom && last.isInbound {
                    withAnimation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion)) { unseenNew += 1 }
                } else {
                    animate(Theme.Motion.smooth) { proxy.scrollTo(newValue, anchor: .bottom) }
                }
                store.markRead(conversation)
            }
            .task(id: route.focusSid) {
                guard let focus = route.focusSid else { return }
                try? await Task.sleep(for: .milliseconds(350))
                animate(Theme.Motion.smooth) { proxy.scrollTo(focus, anchor: .center) }
                withAnimation(Theme.Motion.adaptive(Theme.Motion.smooth, reduceMotion)) { flashSid = focus }
                try? await Task.sleep(for: .seconds(1.8))
                withAnimation(Theme.Motion.adaptive(Theme.Motion.smooth, reduceMotion)) { flashSid = nil }
            }
            .overlay(alignment: .bottomTrailing) {
                if awayFromBottom, let lastSid = conversation.messages.last?.sid {
                    jumpToLatest { animate(Theme.Motion.smooth) { proxy.scrollTo(lastSid, anchor: .bottom) } }
                        .padding(.trailing, Theme.Space.md)
                        .padding(.bottom, Theme.Space.sm)
                        .transition(.scale(scale: 0.6).combined(with: .opacity))
                }
            }
        }
        .environment(\.openURL, OpenURLAction { url in
            // Numbers in messages call through Dialbubble (your Twilio line), not the iPhone's own Phone app.
            if let phone = MessageText.phone(from: url) {
                store.openDialer(to: phone, from: ourNumber)
                return .handled
            }
            return .systemAction
        })
        .background { AmbientBackground() }
        .safeAreaBar(edge: .bottom) {
            VStack(spacing: Theme.Space.xs) {
                if let actionError {
                    FriendlyErrorView(error: actionError, onDismiss: { animate { self.actionError = nil } })
                        .padding(.horizontal, Theme.Space.sm)
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                }
                MessageComposerBar(from: $from, text: $draft, to: route.counterpart)
            }
        }
        .navigationTitle(ContactBook.shared.label(for: route.counterpart))
        .navigationSubtitle(ContactBook.shared.name(for: route.counterpart) != nil ? "\(PhoneFormat.display(route.counterpart)) · \(viaText)" : viaText)
        .navigationBarTitleDisplayMode(.inline)
        .toolbarTitleMenu { titleMenu(conversation) }
        .toolbar {
            ToolbarItemGroup(placement: .topBarTrailing) {
                Button {
                    store.openDialer(to: route.counterpart, from: ourNumber)
                } label: {
                    Label("Call", systemImage: "phone")
                }
                .accessibilityLabel("Call \(PhoneFormat.display(route.counterpart))")
                .accessibilityIdentifier("conversation.call")
                .disabled(store.callerNumbers.isEmpty)
                // Neutral, label-colored glyphs on the standard glass bar: legible on every canvas, unlike mint-on-glass.
                .tint(.primary)

                Button {
                    showLegend = true
                } label: {
                    Label("Status Info", systemImage: "info.circle")
                }
                .accessibilityLabel("What the status icons mean")
                .accessibilityIdentifier("conversation.legend")
                .tint(.primary)
            }
        }
        .sheet(isPresented: $showLegend) { MessageStatusLegend() }
        .toolbarVisibility(.hidden, for: .tabBar)
        .sheet(item: $detailMessage) { MessageDetailSheet(message: $0) }
        .sheet(item: $selectTextMessage) { MsgSelectTextSheet(message: $0) }
        .fullScreenCover(item: $fullScreenImage) { MsgFullScreenImage(image: $0.image) }
        .confirmationDialog("Delete this message?", isPresented: Binding(
            get: { pendingDelete != nil },
            set: { if !$0 { pendingDelete = nil } }
        ), titleVisibility: .visible, presenting: pendingDelete) { m in
            Button("Delete Message", role: .destructive) { delete(m) }
            Button("Cancel", role: .cancel) {}
        } message: { _ in
            Text("It's removed from your Twilio logs and this app. The recipient keeps their copy.")
        }
        .sensoryFeedback(.success, trigger: copies)
        .sensoryFeedback(.impact(weight: .light), trigger: incoming)
        .sensoryFeedback(.impact(weight: .medium), trigger: deletions)
        .sensoryFeedback(.error, trigger: actionError) { _, new in new != nil }
        .onAppear {
            store.visibleConversationID = conversationID
            if store.incomingBanner.map({ "\($0.ourNumber)|\($0.counterpart)" }) == conversationID { store.incomingBanner = nil }
            store.markRead(conversation)
            if draft.isEmpty, let saved = store.draft(for: conversationID) { draft = saved }
        }
        .onChange(of: draft) { _, text in store.setDraft(text, for: conversationID) }
        .onDisappear { if store.visibleConversationID == conversationID { store.visibleConversationID = nil } }
        .onChange(of: ourNumber) { old, _ in
            store.visibleConversationID = conversationID
            // The draft follows you when you switch the From number.
            store.setDraft("", for: "\(old)|\(route.counterpart)")
            store.setDraft(draft, for: conversationID)
        }
        .task(id: ourNumber) {
            // Poll this thread frequently while visible (no push without a server).
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(5))
                if Task.isCancelled { break }
                await pollMessages()
            }
        }
    }

    /// Fetches the latest page but only touches the store (and so only re-animates) when something actually changed.
    private func pollMessages() async {
        guard let client = store.client else { return }
        do {
            let page = try await client.fetchMessages(pageSize: 300)
            guard !Task.isCancelled, page.messages != store.messages else { return }
            animate(Theme.Motion.smooth) { store.messages = page.messages }
        } catch {
            // Background poll: stay quiet here; the app-wide refresh surfaces persistent problems.
        }
    }

    /// Floating "jump to the newest message" button; says "New message" when a reply arrived while scrolled up.
    private func jumpToLatest(_ action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 6) {
                if unseenNew > 0 {
                    Text(unseenNew == 1 ? "New message" : "\(unseenNew) new messages")
                        .font(.subheadline.weight(.semibold))
                }
                Image(systemName: "arrow.down")
                    .font(.subheadline.weight(.bold))
            }
            .foregroundStyle(unseenNew > 0 ? Color.white : Color.primary)
            .padding(.horizontal, unseenNew > 0 ? 14 : 12)
            .padding(.vertical, 12)
            .contentShape(.capsule)
        }
        .buttonStyle(.plain)
        .glassEffect(unseenNew > 0 ? .regular.tint(Theme.Palette.brand).interactive() : .regular.interactive(), in: .capsule)
        .accessibilityLabel(unseenNew > 0 ? "Show new messages" : "Jump to latest message")
        .accessibilityIdentifier("conversation.jumpToLatest")
    }

    /// Tapping the title (Messages-style) for quick actions about this person.
    @ViewBuilder
    private func titleMenu(_ conversation: Conversation) -> some View {
        if !store.callerNumbers.isEmpty {
            Button("Call", systemImage: "phone") { store.openDialer(to: route.counterpart, from: ourNumber) }
        }
        Button("Copy Number", systemImage: "doc.on.doc") {
            UIPasteboard.general.string = route.counterpart
            copies += 1
            toast.show("Number copied", style: .success)
        }
        if ContactBook.shared.name(for: route.counterpart) == nil, !store.isDemo {
            Button("Add to Contacts", systemImage: "person.crop.circle.badge.plus") {
                ContactPicker.addContact(phone: route.counterpart)
            }
        }
        if !conversation.messages.isEmpty {
            let pinned = store.isPinned(conversation)
            Button(pinned ? "Unpin" : "Pin", systemImage: pinned ? "pin.slash" : "pin") {
                store.togglePin(conversation)
                toast.show(pinned ? "Unpinned" : "Pinned to the top", style: .success)
            }
        }
    }

    private func copyCode(_ code: String) {
        UIPasteboard.general.string = code
        copies += 1
        toast.show("Code \(code) copied", style: .success)
    }

    @ViewBuilder
    private func contextMenu(for m: TwilioMessage) -> some View {
        if let body = m.body?.nilIfBlank {
            if m.isInbound, let code = MessageText.oneTimeCode(in: body) {
                Button("Copy Code \(code)", systemImage: "key") { copyCode(code) }
            }
            Button("Copy", systemImage: "doc.on.doc") {
                UIPasteboard.general.string = body
                copies += 1
                toast.show("Message copied", style: .success)
            }
            Button("Select Text", systemImage: "selection.pin.in.out") { selectTextMessage = m }
        }
        Button("Details", systemImage: "info.circle") {
            bubbleTip.invalidate(reason: .actionPerformed)
            detailMessage = m
        }
        if !m.isInbound {
            Button("Resend", systemImage: "arrow.clockwise") { resend(m) }
        }
        if m.statusKind == .scheduled {
            Button("Cancel Scheduled", systemImage: "calendar.badge.minus") { cancelSchedule(m) }
        }
        Divider()
        Button("Delete", systemImage: "trash", role: .destructive) { pendingDelete = m }
    }

    private func delete(_ m: TwilioMessage) {
        pendingDelete = nil
        Task {
            do {
                try await store.deleteMessage(m)
                deletions += 1
            } catch {
                animate { actionError = FriendlyError(error) }
            }
        }
    }

    private func resend(_ m: TwilioMessage) {
        Task {
            do {
                try await store.sendMessage(OutgoingMessage(from: ourNumber, to: route.counterpart, body: m.body ?? ""))
            } catch {
                animate { actionError = FriendlyError(error) }
            }
        }
    }

    private func cancelSchedule(_ m: TwilioMessage) {
        Task {
            do { try await store.cancelScheduled(m) } catch { animate { actionError = FriendlyError(error) } }
        }
    }
}

// MARK: - Bubble

/// Received-bubble surface tuned against `Theme.Palette.canvas` (0x050708 dark / 0xF3F5F5 light).
private enum MsgBubblePalette {
    static let received = Color(uiColor: UIColor { traits in
        traits.userInterfaceStyle == .dark ? UIColor(hex: 0x1E2427) : UIColor.white
    })
}

private struct MessageBubble: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let message: TwilioMessage
    var startsRun = true
    var endsRun = true
    var isExpanded: Bool
    var showsStatusText = true
    var onTap: () -> Void
    var onRetry: () -> Void
    var onCancelSchedule: () -> Void
    var onImageTap: (UIImage) -> Void
    var onCopyCode: (String) -> Void = { _ in }
    @ScaledMetric(relativeTo: .largeTitle) private var emojiSize: CGFloat = 46

    private var outbound: Bool { !message.isInbound }
    /// Corners on the sender's side tighten where bubbles in a run meet, so a run reads as one thought.
    private var shape: UnevenRoundedRectangle {
        let r = Theme.Radius.md, joined: CGFloat = 6
        let top = startsRun ? r : joined, bottom = endsRun ? r : joined
        return outbound
            ? UnevenRoundedRectangle(topLeadingRadius: r, bottomLeadingRadius: r, bottomTrailingRadius: bottom, topTrailingRadius: top, style: .continuous)
            : UnevenRoundedRectangle(topLeadingRadius: top, bottomLeadingRadius: bottom, bottomTrailingRadius: r, topTrailingRadius: r, style: .continuous)
    }

    /// Time and status only under the last bubble of a run, unless there's something to act on.
    private var showsFooter: Bool {
        endsRun || isExpanded || message.statusKind.isFailure || message.statusKind == .scheduled
    }

    var body: some View {
        HStack {
            if outbound { Spacer(minLength: 50) }
            VStack(alignment: outbound ? .trailing : .leading, spacing: 4) {
                if message.mediaCount > 0 {
                    MessageMediaStrip(message: message, onTap: onImageTap)
                }
                if let body = message.body?.nilIfBlank, MessageText.isBigEmoji(body) {
                    // Emoji on their own read best big and bare, like Messages.
                    Text(body)
                        .font(.system(size: emojiSize))
                        .padding(.horizontal, 4)
                        .opacity(message.statusKind == .scheduled ? 0.6 : 1)
                        .contentShape(.rect)
                        .onTapGesture(perform: onTap)
                        .accessibilityAddTraits(.isButton)
                } else if let body = message.body?.nilIfBlank {
                    Text(MessageText.attributed(body))
                        .tint(outbound ? Color.white : Theme.Palette.brandText)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 9)
                        .foregroundStyle(outbound ? Color.white : Color.primary)
                        .background {
                            if outbound {
                                shape
                                    .fill(Theme.Palette.bubbleGradient)
                                    .opacity(message.statusKind == .scheduled ? 0.6 : 1)
                            } else {
                                // Solid raised surface: reads clearly on the near-black canvas (glass alone was too faint).
                                shape
                                    .fill(MsgBubblePalette.received)
                                    .overlay(shape.strokeBorder(Theme.Palette.hairline))
                            }
                        }
                        .contentShape(.contextMenuPreview, shape)
                        .contentShape(shape)
                        .onTapGesture(perform: onTap)
                        .accessibilityAddTraits(.isButton)
                        .accessibilityHint(isExpanded ? "Hides the exact time and cost" : "Shows the exact time and cost")
                }
                if message.isInbound, let body = message.body, let code = MessageText.oneTimeCode(in: body) {
                    Button {
                        onCopyCode(code)
                    } label: {
                        Label("Copy Code \(code)", systemImage: "key.fill")
                            .font(.footnote.weight(.semibold).monospacedDigit())
                            .padding(.horizontal, 12)
                            .padding(.vertical, 7)
                            .contentShape(.capsule)
                    }
                    .buttonStyle(.plain)
                    .foregroundStyle(Theme.Palette.brandText)
                    .glassEffect(.regular.interactive(), in: .capsule)
                    .accessibilityIdentifier("conversation.copyCode")
                }
                footer
            }
            if !outbound { Spacer(minLength: 50) }
        }
        .transition(reduceMotion ? .opacity : .asymmetric(insertion: .move(edge: .bottom).combined(with: .opacity), removal: .opacity))
    }

    @ViewBuilder
    private var footer: some View {
        let status = message.statusKind
        if showsFooter {
            HStack(spacing: 4) {
                if status == .scheduled { Image(systemName: "calendar.badge.clock") }
                Text(message.date, format: .dateTime.hour().minute())
                if outbound {
                    Image(systemName: status.symbol)
                        .foregroundStyle(status.color)
                        .contentTransition(.symbolEffect(.replace))
                        .accessibilityLabel(status.label)
                    if showsStatusText || status.isFailure || status == .scheduled || isExpanded {
                        Text(status.label)
                            .accessibilityHidden(true)
                    }
                }
            }
            .font(.caption)
            .foregroundStyle(.secondary)
            .padding(.horizontal, 6)
            .accessibilityElement(children: .combine)
        }

        if isExpanded {
            VStack(alignment: outbound ? .trailing : .leading, spacing: 2) {
                Label(message.date.formatted(date: .complete, time: .standard), systemImage: "clock")
                if let price = message.price, let value = Double(price) {
                    Label("\(abs(value).formatted(.currency(code: message.priceUnit ?? "USD"))) · \(message.segments) part\(message.segments == 1 ? "" : "s")",
                          systemImage: "dollarsign.circle")
                }
            }
            .font(.caption)
            .foregroundStyle(.secondary)
            .padding(.horizontal, 6)
            .transition(.opacity.combined(with: .move(edge: .top)))
        }

        if status.isFailure {
            let help = MessageDeliveryHelp.friendly(for: message)
            Callout(style: .error, title: help.title, message: help.message, symbol: help.symbol) {
                HStack(spacing: Theme.Space.xs) {
                    Button("Retry", systemImage: "arrow.clockwise", action: onRetry)
                        .buttonStyle(.glass)
                    if let url = help.helpURL {
                        Link(destination: url) { Label("Why?", systemImage: "questionmark.circle") }
                            .buttonStyle(.glass)
                    }
                }
                .font(.caption.weight(.semibold))
            }
            .frame(maxWidth: 300, alignment: .leading)
        }
        if status == .scheduled {
            Button("Cancel Schedule", systemImage: "xmark.circle", action: onCancelSchedule)
                .font(.caption.weight(.semibold))
                .buttonStyle(.glass)
        }
    }
}

// MARK: - Select text

/// Lets people select part of a message (the bubble itself uses touch-and-hold for its menu).
private struct MsgSelectTextSheet: View {
    @Environment(\.dismiss) private var dismiss
    let message: TwilioMessage
    @State private var copies = 0

    var body: some View {
        NavigationStack {
            ScrollView {
                Text(message.body ?? "")
                    .font(.title3)
                    .textSelection(.enabled)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(Theme.Space.md)
                    .glassEffect(.regular, in: .rect(cornerRadius: Theme.Radius.md))
                    .padding(Theme.Space.md)
                Text("Touch and hold the text, then drag the handles to select part of it.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, Theme.Space.lg)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .relayBackground()
            .navigationTitle("Select Text")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(role: .close) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Copy All", systemImage: "doc.on.doc") {
                        UIPasteboard.general.string = message.body
                        copies += 1
                    }
                }
            }
            .sensoryFeedback(.success, trigger: copies)
        }
        .presentationDetents([.medium, .large])
    }
}

// MARK: - Media

@MainActor
private enum MsgImageCache {
    static var images: [String: [UIImage]] = [:]
}

private struct MessageMediaStrip: View {
    @Environment(AppStore.self) private var store
    let message: TwilioMessage
    var onTap: (UIImage) -> Void

    @State private var images: [UIImage] = []
    @State private var failed = false

    var body: some View {
        Group {
            if !images.isEmpty {
                VStack(spacing: 4) {
                    ForEach(images.indices, id: \.self) { i in
                        Image(uiImage: images[i])
                            .resizable()
                            .scaledToFill()
                            .frame(maxWidth: 220, maxHeight: 260)
                            .clipShape(.rect(cornerRadius: Theme.Radius.md))
                            .onTapGesture { onTap(images[i]) }
                            .accessibilityLabel("Image attachment")
                    }
                }
            } else if failed {
                Label("\(message.mediaCount) attachment\(message.mediaCount == 1 ? "" : "s")", systemImage: "paperclip")
                    .font(.footnote)
                    .padding(12)
                    .glassEffect(.regular, in: .rect(cornerRadius: Theme.Radius.md))
            } else {
                ProgressView()
                    .frame(width: 160, height: 120)
                    .glassEffect(.regular, in: .rect(cornerRadius: Theme.Radius.md))
                    .accessibilityLabel("Loading attachment")
            }
        }
        .task(id: message.sid) { await load() }
    }

    private func load() async {
        if let cached = MsgImageCache.images[message.sid] { images = cached; return }
        guard let client = store.client else { failed = true; return }
        do {
            let media = try await client.fetchMedia(messageSid: message.sid)
            var loaded: [UIImage] = []
            for item in media where (item.contentType ?? "").hasPrefix("image/") {
                if let image = UIImage(data: try await client.downloadMedia(item)) { loaded.append(image) }
            }
            if loaded.isEmpty { failed = true } else {
                MsgImageCache.images[message.sid] = loaded
                withAnimation { images = loaded }
            }
        } catch {
            failed = true
        }
    }
}

private struct MsgIdentifiedImage: Identifiable {
    let id = UUID()
    let image: UIImage
}

private struct MsgFullScreenImage: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let image: UIImage
    @State private var scale: CGFloat = 1
    @State private var baseScale: CGFloat = 1
    @State private var offset: CGSize = .zero
    @State private var baseOffset: CGSize = .zero

    private let maxScale: CGFloat = 5

    var body: some View {
        ZStack(alignment: .topTrailing) {
            Color.black.ignoresSafeArea()
            Image(uiImage: image)
                .resizable()
                .scaledToFit()
                .scaleEffect(scale)
                .offset(offset)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .contentShape(.rect)
                .gesture(magnify.simultaneously(with: pan))
                .onTapGesture(count: 2, perform: toggleZoom)
                .accessibilityLabel("Image attachment")
                .accessibilityHint("Double-tap to zoom")
                .accessibilityAction(named: scale > 1 ? "Zoom out" : "Zoom in", toggleZoom)
                .ignoresSafeArea()
            HStack {
                ShareLink(item: Image(uiImage: image), preview: SharePreview("Image", image: Image(uiImage: image))) {
                    Image(systemName: "square.and.arrow.up")
                }
                .accessibilityLabel("Share image")
                Button { dismiss() } label: { Image(systemName: "xmark") }
                    .accessibilityLabel("Close")
            }
            .buttonStyle(.glass)
            .padding()
        }
        .statusBarHidden()
    }

    private var magnify: some Gesture {
        MagnifyGesture()
            .onChanged { value in
                scale = min(max(baseScale * value.magnification, 1), maxScale)
            }
            .onEnded { _ in
                // Keep the zoom the person chose; only settle back when they pinched (almost) all the way out.
                if scale < 1.05 {
                    withAnimation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion)) { reset() }
                } else {
                    baseScale = scale
                }
            }
    }

    private var pan: some Gesture {
        DragGesture()
            .onChanged { value in
                guard scale > 1 else { return }
                offset = CGSize(width: baseOffset.width + value.translation.width,
                                height: baseOffset.height + value.translation.height)
            }
            .onEnded { _ in baseOffset = offset }
    }

    private func toggleZoom() {
        withAnimation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion)) {
            if scale > 1 {
                reset()
            } else {
                scale = 2.5
                baseScale = 2.5
            }
        }
    }

    private func reset() {
        scale = 1; baseScale = 1
        offset = .zero; baseOffset = .zero
    }
}

// MARK: - Details

private struct MessageDetailSheet: View {
    @Environment(\.dismiss) private var dismiss
    let message: TwilioMessage

    var body: some View {
        NavigationStack {
            List {
                Section {
                    HStack {
                        Text("Status")
                        Spacer()
                        StatusPill(text: message.statusKind.label, symbol: message.statusKind.symbol, color: message.statusKind.color)
                    }
                    row("Direction", message.direction?.replacingOccurrences(of: "-", with: " ").capitalized ?? "—")
                    row("From", message.from.map(PhoneFormat.display) ?? "—")
                    row("To", message.to.map(PhoneFormat.display) ?? "—")
                }
                Section("Delivery") {
                    row("Segments", "\(message.segments)")
                    row("Media", "\(message.mediaCount)")
                    if let price = message.price {
                        row("Price", "\(price) \(message.priceUnit ?? "")")
                    }
                    if let code = message.errorCode {
                        row("Error Code", "\(code)")
                        if let url = URL(string: "https://www.twilio.com/docs/api/errors/\(code)") {
                            Link("View error documentation", destination: url)
                        }
                    }
                    if let err = message.errorMessage { row("Error", err) }
                }
                Section("Timestamps") {
                    if let d = message.dateCreated { row("Created", d.formatted(date: .abbreviated, time: .standard)) }
                    if let d = message.dateSent { row("Sent", d.formatted(date: .abbreviated, time: .standard)) }
                    if let d = message.dateUpdated { row("Updated", d.formatted(date: .abbreviated, time: .standard)) }
                }
                Section("Identifiers") {
                    row("Message SID", message.sid, mono: true)
                    if let svc = message.messagingServiceSid { row("Service SID", svc, mono: true) }
                }
                if let body = message.body?.nilIfBlank {
                    Section("Body") {
                        Text(body).textSelection(.enabled)
                    }
                }
            }
            .relayBackground()
            .navigationTitle("Message Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(role: .close) { dismiss() }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }

    private func row(_ title: String, _ value: String, mono: Bool = false) -> some View {
        LabeledContent(title) {
            Text(value)
                .font(mono ? .caption.monospaced() : .body)
                .textSelection(.enabled)
                .multilineTextAlignment(.trailing)
        }
    }
}

// MARK: - Thread header

/// The top of every conversation: who it is, and since when, like the contact header in Messages.
private struct MessageThreadHeader: View {
    @Environment(AppStore.self) private var store
    let counterpart: String
    let ourNumber: String
    let since: Date?
    @ScaledMetric(relativeTo: .title) private var avatarSize: CGFloat = 60

    var body: some View {
        let name = ContactBook.shared.name(for: counterpart)
        let line = store.configuredNumber(for: ourNumber)?.displayName ?? PhoneFormat.display(ourNumber)
        VStack(spacing: 6) {
            MsgTonalAvatar(key: counterpart, size: min(avatarSize, 96))
            Text(name ?? PhoneFormat.display(counterpart))
                .font(.headline)
            if name != nil {
                Text(PhoneFormat.display(counterpart))
                    .font(.footnote.monospacedDigit())
                    .foregroundStyle(.secondary)
            }
            if let since {
                Text("Texting since \(since.formatted(.dateTime.month(.abbreviated).day().year())) · \(line)")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }
        }
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .combine)
    }
}

// MARK: - New thread card

/// Shown before the first message so the user knows exactly who they're texting and from where.
private struct MessageNewThreadCard: View {
    @Environment(AppStore.self) private var store
    let counterpart: String
    let ourNumber: String

    var body: some View {
        let ours = store.configuredNumber(for: ourNumber)
        VStack(spacing: 14) {
            MsgTonalAvatar(key: counterpart, size: 64)
            VStack(spacing: 4) {
                Text(ContactBook.shared.label(for: counterpart))
                    .font(.title3.weight(.bold))
                Text("New conversation")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            VStack(alignment: .leading, spacing: 10) {
                row("number.circle.fill", Theme.Palette.brandText,
                    "Sending from \(ours?.displayName ?? PhoneFormat.display(ourNumber))",
                    "They'll see \(PhoneFormat.display(ourNumber)). Switch numbers with the From chip below.")
                row("dollarsign.circle.fill", .secondary, "Billed by Twilio",
                    "Each text part costs about $0.008 in the US. Prices vary by country.")
                row("arrow.down.message.fill", .secondary, "Replies show up here",
                    "Dialbubble checks for new replies every few seconds while this screen is open.")
                if store.activeProfile?.isTrial == true {
                    row("lock.trianglebadge.exclamationmark.fill", Theme.Palette.warning, "Trial account",
                        "You can only text numbers verified in your Twilio Console, using Twilio's sample templates. A paid account lets you write your own.")
                }
                if store.isDemo {
                    row("sparkles", Theme.Palette.brandText, "Demo mode", "Nothing is really sent. You'll get a simulated reply.")
                }
            }
            .padding(Theme.Space.md)
            .background(MsgBubblePalette.received, in: .rect(cornerRadius: Theme.Radius.lg, style: .continuous))
        }
        .frame(maxWidth: 420)
        .frame(maxWidth: .infinity)
    }

    private func row(_ symbol: String, _ color: some ShapeStyle, _ title: String, _ detail: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: symbol)
                .font(.title3)
                .foregroundStyle(color)
                .symbolRenderingMode(.hierarchical)
                .frame(width: 28)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.subheadline.weight(.semibold))
                Text(detail).font(.footnote).foregroundStyle(.secondary)
            }
        }
        .accessibilityElement(children: .combine)
    }
}

// MARK: - Status legend

private struct MessageStatusLegend: View {
    @Environment(\.dismiss) private var dismiss

    private let items: [(MessageStatus, String)] = [
        (.queued, "Twilio accepted it and is about to send it."),
        (.sent, "Handed to the carrier. Waiting for delivery confirmation."),
        (.delivered, "The carrier confirmed it reached the phone."),
        (.scheduled, "Will be sent automatically at the scheduled time."),
        (.undelivered, "The carrier couldn't deliver it. Tap Why? on the message for the reason."),
        (.failed, "Twilio couldn't send it. Check the number and your account, then retry."),
        (.received, "A reply sent to your Twilio number."),
        (.canceled, "A scheduled message you canceled."),
    ]

    var body: some View {
        NavigationStack {
            List {
                Section {
                    ForEach(items, id: \.0.rawValue) { status, text in
                        HStack(alignment: .top, spacing: 14) {
                            Image(systemName: status.symbol)
                                .font(.title3)
                                .foregroundStyle(status.color)
                                .frame(width: 30)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(status.label).font(.headline)
                                Text(text).font(.subheadline).foregroundStyle(.secondary)
                            }
                        }
                        .padding(.vertical, 2)
                        .accessibilityElement(children: .combine)
                    }
                } footer: {
                    Text("Some carriers don't report delivery, so a message can stay at Sent even when it arrived.")
                }
                Section("Tips") {
                    Label("Tap a message to see its exact time and cost.", systemImage: "hand.tap.fill")
                    Label("Touch and hold for copy, select text, details, resend and delete.", systemImage: "hand.point.up.left.fill")
                    Label("Use + for templates, picture links and scheduling.", systemImage: "plus.circle.fill")
                    Label("Tap the From chip above the text field to switch numbers.", systemImage: "number.circle.fill")
                }
            }
            .relayBackground()
            .navigationTitle("Message Status")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(role: .close) { dismiss() }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
}
