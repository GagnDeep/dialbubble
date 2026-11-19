import SwiftUI
import AVFoundation

struct CallDetailView: View {
    @Environment(AppStore.self) private var store
    let call: TwilioCall

    @State private var current: TwilioCall?
    @State private var children: [TwilioCall] = []
    @State private var recordings: [TwilioRecording] = []
    @State private var isLoading = false
    @Environment(ToastCenter.self) private var toast
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @ScaledMetric(relativeTo: .title) private var avatarSize: CGFloat = 76

    private var c: TwilioCall { current ?? call }

    private var isBridge: Bool {
        guard !c.isInbound, let me = store.activeProfile?.personalPhone.nilIfBlank else { return false }
        return c.to == store.normalize(me)
    }

    private var counterpart: String {
        if isBridge, let to = children.first?.to { return to }
        return c.counterpart
    }

    var body: some View {
        ScrollView {
            VStack(spacing: Theme.Space.lg) {
                header
                actions
                historyCard
                VStack(alignment: .leading, spacing: 10) {
                    SectionHeader(title: "Details")
                    detailsCard
                }
                if !children.isEmpty { legsCard }
                recordingsCard
            }
            .padding()
        }
        .relayBackground()
        .navigationTitle("Call Details")
        .navigationBarTitleDisplayMode(.inline)
        .refreshable { await load() }
        .task { await load() }
    }

    // MARK: Sections

    private var header: some View {
        GlassCard {
            VStack(spacing: 12) {
                CallTonalAvatar(key: counterpart, isMissed: c.isMissed, size: min(avatarSize, 120))
                if let name = ContactBook.shared.name(for: counterpart) {
                    VStack(spacing: 2) {
                        Text(name).font(.title2.weight(.semibold))
                        Text(PhoneFormat.display(counterpart))
                            .font(.subheadline.monospacedDigit())
                            .foregroundStyle(.secondary)
                            .textSelection(.enabled)
                    }
                } else {
                    Text(PhoneFormat.display(counterpart))
                        .font(.title2.weight(.semibold).monospacedDigit())
                        .textSelection(.enabled)
                }
                StatusPill(text: c.statusKind.label, symbol: c.statusKind.symbol, color: c.statusKind.color)
                Text(c.date.formatted(date: .abbreviated, time: .shortened))
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity)
            .accessibilityElement(children: .contain)
        }
    }

    private var actions: some View {
        let layout = dynamicTypeSize.isAccessibilitySize
            ? AnyLayout(VStackLayout(spacing: Theme.Space.sm))
            : AnyLayout(HStackLayout(spacing: Theme.Space.sm))
        return GlassEffectContainer(spacing: Theme.Space.sm) {
            layout {
                ActionTile(title: "Call", symbol: "phone.fill", accessibilityID: "callDetail.call") {
                    store.openDialer(to: counterpart, from: c.ourNumber.nilIfBlank)
                }
                if FeatureFlags.messaging {
                    ActionTile(title: "Message", symbol: "message.fill", accessibilityID: "callDetail.message") {
                        let from = store.smsNumbers.contains { $0.phoneNumber == c.ourNumber } ? c.ourNumber : nil
                        store.openMessage(to: counterpart, from: from)
                    }
                }
                ActionTile(title: "Copy", symbol: "doc.on.doc.fill", accessibilityID: "callDetail.copy") {
                    UIPasteboard.general.string = counterpart
                    toast.show("Number copied", style: .success)
                }
                if ContactBook.shared.name(for: counterpart) == nil, !store.isDemo {
                    ActionTile(title: "Add", symbol: "person.crop.circle.badge.plus", accessibilityID: "callDetail.addContact") {
                        ContactPicker.addContact(phone: counterpart)
                    }
                    .accessibilityLabel("Add to Contacts")
                }
            }
        }
    }

    // MARK: History with this person

    /// Other calls with the same person (newest first), resolving Talk calls to who was really dialed.
    private var otherCalls: [TwilioCall] {
        let key = ContactBook.key(counterpart).nilIfBlank ?? counterpart
        var legs: [String: String] = [:]
        for call in store.calls { if let parent = call.parentCallSid, let to = call.to, legs[parent] == nil { legs[parent] = to } }
        let me = store.activeProfile?.personalPhone.nilIfBlank.map(store.normalize)
        return store.calls.filter { other in
            guard other.parentCallSid == nil, other.sid != c.sid else { return false }
            var person = other.counterpart
            if let me, person == me, let to = legs[other.sid] { person = to }
            return (ContactBook.key(person).nilIfBlank ?? person) == key
        }
    }

    private var thread: Conversation? {
        guard FeatureFlags.messaging else { return nil }
        let key = ContactBook.key(counterpart).nilIfBlank ?? counterpart
        return store.conversations.first { (ContactBook.key($0.counterpart).nilIfBlank ?? $0.counterpart) == key }
    }

    @ViewBuilder
    private var historyCard: some View {
        let calls = Array(otherCalls.prefix(5))
        let thread = thread
        if !calls.isEmpty || thread != nil {
            VStack(alignment: .leading, spacing: 10) {
                SectionHeader(title: "History")
                GlassCard(padding: 0) {
                    VStack(spacing: 0) {
                        if let thread, let last = thread.lastMessage {
                            Button {
                                store.openMessage(to: thread.counterpart, from: thread.ourNumber)
                            } label: {
                                historyRow(symbol: "message.fill", tint: Theme.Palette.brandText,
                                           title: "\(thread.messages.count) message\(thread.messages.count == 1 ? "" : "s")",
                                           subtitle: (last.isInbound ? "" : "You: ") + (last.body?.nilIfBlank ?? "Attachment"),
                                           trailing: last.date.listStamp, chevron: true)
                            }
                            .buttonStyle(.plain)
                            .accessibilityHint("Opens the conversation")
                            if !calls.isEmpty { Divider().padding(.leading, 52) }
                        }
                        ForEach(Array(calls.enumerated()), id: \.element.sid) { idx, other in
                            NavigationLink(value: other) {
                                historyRow(symbol: other.isInbound ? "phone.arrow.down.left.fill" : "phone.arrow.up.right.fill",
                                           tint: other.isMissed ? Theme.Palette.danger : .secondary,
                                           title: other.isMissed ? "Missed call" : (other.isInbound ? "Incoming call" : "Outgoing call"),
                                           subtitle: other.durationSeconds > 0 ? other.durationSeconds.durationString : other.statusKind.label,
                                           trailing: other.date.listStamp, chevron: true)
                            }
                            .buttonStyle(.plain)
                            if idx < calls.count - 1 { Divider().padding(.leading, 52) }
                        }
                    }
                }
            }
            .accessibilityElement(children: .contain)
        }
    }

    private func historyRow(symbol: String, tint: Color, title: String, subtitle: String, trailing: String, chevron: Bool) -> some View {
        HStack(spacing: Theme.Space.sm) {
            Image(systemName: symbol)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(tint)
                .frame(width: 28)
            VStack(alignment: .leading, spacing: 1) {
                Text(title).font(.subheadline.weight(.semibold))
                Text(subtitle).font(.footnote).foregroundStyle(.secondary).lineLimit(1)
            }
            Spacer(minLength: Theme.Space.xs)
            Text(trailing).font(.footnote).foregroundStyle(.secondary).lineLimit(1)
            if chevron {
                Image(systemName: "chevron.right")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.tertiary)
            }
        }
        .padding(.horizontal, Theme.Space.md)
        .padding(.vertical, Theme.Space.sm)
        .contentShape(.rect)
        .accessibilityElement(children: .combine)
    }

    private var detailsCard: some View {
        GlassCard {
            VStack(spacing: 0) {
                detailRow("Direction", value: isBridge ? "Two-way (Talk)" : (c.isInbound ? "Incoming" : "Outgoing"), symbol: "arrow.left.arrow.right")
                Divider()
                detailRow("From", value: numberLabel(c.from), symbol: "phone.arrow.up.right")
                Divider()
                detailRow("To", value: numberLabel(c.to), symbol: "phone.arrow.down.left")
                if let start = c.startTime {
                    Divider()
                    detailRow("Started", value: start.formatted(date: .omitted, time: .standard), symbol: "play.circle")
                }
                if let end = c.endTime {
                    Divider()
                    detailRow("Ended", value: end.formatted(date: .omitted, time: .standard), symbol: "stop.circle")
                }
                Divider()
                detailRow("Duration", value: c.durationSeconds.durationString, symbol: "timer")
                if let price = c.price, let value = Double(price) {
                    Divider()
                    detailRow("Price", value: abs(value).formatted(.currency(code: c.priceUnit ?? "USD")), symbol: "dollarsign.circle")
                }
                if let answeredBy = c.answeredBy {
                    Divider()
                    detailRow("Answered By", value: answeredBy.replacingOccurrences(of: "_", with: " ").capitalized, symbol: "person.wave.2")
                }
                Divider()
                detailRow("Call SID", value: c.sid, symbol: "number", monospaced: true)
                    .contextMenu {
                        Button("Copy SID", systemImage: "doc.on.doc") {
                            UIPasteboard.general.string = c.sid
                            toast.show("Call SID copied", style: .success)
                        }
                    }
            }
        }
    }

    private func numberLabel(_ n: String?) -> String {
        guard let n else { return "—" }
        if let configured = store.configuredNumber(for: n) {
            return "\(configured.displayName) · \(PhoneFormat.display(n))"
        }
        if let me = store.activeProfile?.personalPhone.nilIfBlank, store.normalize(me) == n {
            return "My Phone · \(PhoneFormat.display(n))"
        }
        return PhoneFormat.display(n)
    }

    private func detailRow(_ title: String, value: String, symbol: String, monospaced: Bool = false) -> some View {
        let valueText = Text(value)
            .font(monospaced ? .caption.monospaced() : .subheadline.weight(.medium))
            .textSelection(.enabled)
        return Group {
            if dynamicTypeSize.isAccessibilitySize {
                VStack(alignment: .leading, spacing: Theme.Space.xxs) {
                    Label(title, systemImage: symbol).foregroundStyle(.secondary)
                    valueText
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            } else {
                HStack(alignment: .firstTextBaseline) {
                    Label(title, systemImage: symbol)
                        .foregroundStyle(.secondary)
                    Spacer(minLength: 16)
                    valueText.multilineTextAlignment(.trailing)
                }
            }
        }
        .font(.subheadline)
        .padding(.vertical, 10)
        .accessibilityElement(children: .combine)
    }

    private var legsCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            SectionHeader(title: "Call Legs")
            GlassCard {
                VStack(spacing: 10) {
                    ForEach(children) { leg in
                        HStack {
                            Image(systemName: leg.statusKind.symbol).foregroundStyle(leg.statusKind.color)
                                .accessibilityHidden(true)
                            VStack(alignment: .leading) {
                                Text(PhoneFormat.display(leg.to ?? "")).font(.subheadline.weight(.semibold))
                                Text(leg.statusKind.label).font(.caption).foregroundStyle(.secondary)
                            }
                            Spacer()
                            Text(leg.durationSeconds.durationString).font(.caption.monospacedDigit()).foregroundStyle(.secondary)
                        }
                        .accessibilityElement(children: .combine)
                    }
                }
            }
        }
    }

    private var recordingsCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            SectionHeader(title: "Recordings")
            if isLoading && recordings.isEmpty {
                GlassCard { SkeletonRows(count: 1, showsAvatar: true) }
            } else if recordings.isEmpty {
                GlassCard {
                    Label("No recordings for this call.", systemImage: "waveform.slash")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            } else {
                ForEach(recordings) { rec in
                    CallRecordingPlayerCard(recording: rec) {
                        withAnimation { recordings.removeAll { $0.sid == rec.sid } }
                    }
                }
            }
        }
    }

    // MARK: Loading

    private func load() async {
        guard let client = store.client else { return }
        isLoading = true
        defer { isLoading = false }
        async let fresh = try? client.fetchCall(sid: call.sid)
        async let legs = (try? client.fetchChildCalls(parentSid: call.sid)) ?? []
        async let recs = (try? client.fetchRecordings(callSid: call.sid)) ?? []
        let (f, l, r) = await (fresh, legs, recs)
        var allRecs = r
        for leg in l {
            if let more = try? await client.fetchRecordings(callSid: leg.sid) { allRecs += more }
        }
        withAnimation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion)) {
            if let f { current = f; store.updateCallInList(f) }
            children = l
            recordings = allRecs
        }
    }
}

// MARK: - Recording player

@MainActor
@Observable
private final class CallRecordingPlayer {
    var player: AVPlayer?
    var fileURL: URL?
    var isPlaying = false
    var progress: Double = 0
    var duration: Double = 0
    var isLoading = false
    private var observer: Any?
    private var endObserver: NSObjectProtocol?

    func load(sid: String, client: TwilioClient) async throws {
        // Already downloaded (e.g. returning to this screen after `stop()`): just re-attach observers.
        if fileURL != nil {
            attachObservers()
            return
        }
        isLoading = true
        defer { isLoading = false }
        let url = try await client.downloadRecording(sid: sid)
        fileURL = url
        let item = AVPlayerItem(url: url)
        player = AVPlayer(playerItem: item)
        if let d = try? await item.asset.load(.duration) { duration = d.seconds.isFinite ? d.seconds : 0 }
        attachObservers()
    }

    /// Idempotent: adds the progress and end-of-item observers if they aren't already attached.
    private func attachObservers() {
        guard let p = player else { return }
        if observer == nil {
            observer = p.addPeriodicTimeObserver(forInterval: CMTime(seconds: 0.25, preferredTimescale: 600), queue: .main) { [weak self] time in
                MainActor.assumeIsolated {
                    guard let self, self.duration > 0 else { return }
                    self.progress = time.seconds / self.duration
                }
            }
        }
        if endObserver == nil, let item = p.currentItem {
            endObserver = NotificationCenter.default.addObserver(forName: .AVPlayerItemDidPlayToEndTime, object: item, queue: .main) { [weak self] _ in
                MainActor.assumeIsolated {
                    self?.isPlaying = false
                    self?.progress = 0
                    self?.player?.seek(to: .zero)
                }
            }
        }
    }

    func toggle() {
        guard let player else { return }
        if isPlaying { player.pause() } else {
            try? AVAudioSession.sharedInstance().setCategory(.playback)
            try? AVAudioSession.sharedInstance().setActive(true)
            player.play()
        }
        isPlaying.toggle()
    }

    func seek(to fraction: Double) {
        guard duration > 0 else { return }
        player?.seek(to: CMTime(seconds: fraction * duration, preferredTimescale: 600))
        progress = fraction
    }

    func stop() {
        player?.pause()
        isPlaying = false
        if let observer { player?.removeTimeObserver(observer) }
        if let endObserver { NotificationCenter.default.removeObserver(endObserver) }
        observer = nil
        endObserver = nil
    }
}

private struct CallRecordingPlayerCard: View {
    @Environment(AppStore.self) private var store
    let recording: TwilioRecording
    var onDelete: () -> Void

    @State private var player = CallRecordingPlayer()
    @State private var error: FriendlyError?
    @State private var confirmDelete = false
    @ScaledMetric(relativeTo: .title3) private var playSize: CGFloat = 48
    @ScaledMetric(relativeTo: .body) private var menuSize: CGFloat = 36

    var body: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 14) {
                    Button {
                        Task { await playTapped() }
                    } label: {
                        Group {
                            if player.isLoading {
                                ProgressView()
                            } else {
                                Image(systemName: player.isPlaying ? "pause.fill" : "play.fill")
                                    .font(.title3)
                                    .contentTransition(.symbolEffect(.replace))
                            }
                        }
                        .frame(width: min(playSize, 72), height: min(playSize, 72))
                    }
                    .buttonStyle(.glassProminent)
                    .tint(Theme.Palette.brand)
                    .buttonBorderShape(.circle)
                    .accessibilityLabel(player.isPlaying ? "Pause recording" : "Play recording")
                    .accessibilityIdentifier("callDetail.recording.play")

                    VStack(alignment: .leading, spacing: 4) {
                        Text(recording.dateCreated?.formatted(date: .abbreviated, time: .shortened) ?? "Recording")
                            .font(.subheadline.weight(.semibold))
                        Text("\(recording.durationSeconds.durationString)\(recording.channels == 2 ? " · Dual channel" : "")")
                            .font(.caption.monospacedDigit())
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    Menu {
                        if let url = player.fileURL {
                            ShareLink(item: url) { Label("Share", systemImage: "square.and.arrow.up") }
                        }
                        Button("Copy SID", systemImage: "doc.on.doc") { UIPasteboard.general.string = recording.sid }
                        Button("Delete", systemImage: "trash", role: .destructive) { confirmDelete = true }
                    } label: {
                        Image(systemName: "ellipsis").frame(width: min(menuSize, 56), height: min(menuSize, 56))
                    }
                    .accessibilityLabel("Recording options")
                    .buttonStyle(.glass)
                    .buttonBorderShape(.circle)
                }

                if player.player != nil {
                    Slider(value: Binding(get: { player.progress }, set: { player.seek(to: $0) }), in: 0...1)
                        .accessibilityLabel("Playback position")
                        .accessibilityValue("\(Int(player.progress * player.duration)) of \(Int(player.duration)) seconds")
                    HStack {
                        Text(Int(player.progress * player.duration).durationString)
                        Spacer()
                        Text(Int(player.duration).durationString)
                    }
                    .font(.caption2.monospacedDigit())
                    .foregroundStyle(.secondary)
                }

                if let error {
                    FriendlyErrorView(error: error, onDismiss: { self.error = nil })
                }
            }
        }
        .accessibilityElement(children: .contain)
        .onDisappear { player.stop() }
        .confirmationDialog("Delete this recording?", isPresented: $confirmDelete, titleVisibility: .visible) {
            Button("Delete Recording", role: .destructive) { delete() }
        } message: {
            Text("It will be permanently removed from your Twilio account.")
        }
    }

    private func playTapped() async {
        guard let client = store.client else { return }
        do {
            try await player.load(sid: recording.sid, client: client)
            player.toggle()
        } catch {
            self.error = FriendlyError(error)
        }
    }

    private func delete() {
        guard let client = store.client else { return }
        Task {
            do {
                player.stop()
                try await client.deleteRecording(sid: recording.sid)
                onDelete()
            } catch {
                self.error = FriendlyError(error)
            }
        }
    }
}
