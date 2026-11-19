import SwiftUI
import TipKit

struct CallRecentsView: View {
    @Environment(AppStore.self) private var store
    @Environment(ToastCenter.self) private var toast

    enum Filter: String, CaseIterable, Identifiable {
        case all = "All", missed = "Missed", outgoing = "Outgoing", incoming = "Incoming"
        var id: String { rawValue }
        var symbol: String {
            switch self {
            case .all: return "tray.full"
            case .missed: return "phone.down"
            case .outgoing: return "phone.arrow.up.right"
            case .incoming: return "phone.arrow.down.left"
            }
        }
    }

    @State private var filter: Filter = .all
    @State private var numberFilter: String?
    @State private var placingSid: String?
    @State private var didInitialLoad = false
    @State private var swipeActions = 0
    @State private var pendingDelete: Entry?
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private var motion: Animation? { Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion) }

    /// First load still in flight: show skeleton rows, never "No Calls Yet".
    private var isInitialLoading: Bool {
        store.calls.isEmpty && (!didInitialLoad || store.isRefreshing)
    }

    private static func isMissed(_ call: TwilioCall) -> Bool { call.isMissed }

    private var visibleCalls: [TwilioCall] {
        store.calls.filter { call in
            guard call.parentCallSid == nil else { return false }
            if let numberFilter, call.ourNumber != numberFilter { return false }
            switch filter {
            case .all: return true
            case .missed: return Self.isMissed(call)
            case .outgoing: return !call.isInbound
            case .incoming: return call.isInbound
            }
        }
    }

    /// One row in Recents: back-to-back calls with the same person collapse into one row with a count, like Phone.
    struct Entry: Identifiable {
        let call: TwilioCall
        var count: Int
        /// Every call folded into this row (deleted together).
        var sids: [String]
        var id: String { call.sid }
    }

    /// Talk calls: parent call SID → the number its child leg dialed. Built once per render (was a scan per row).
    private var childLegs: [String: String] {
        var map: [String: String] = [:]
        for call in store.calls {
            if let parent = call.parentCallSid, let to = call.to, map[parent] == nil { map[parent] = to }
        }
        return map
    }

    private func groupedCalls(_ calls: [TwilioCall], _ legs: [String: String]) -> [(day: Date, entries: [Entry])] {
        let cal = Calendar.current
        let groups = Dictionary(grouping: calls) { cal.startOfDay(for: $0.date) }
        return groups.keys.sorted(by: >).map { day in
            var entries: [Entry] = []
            for call in groups[day]!.sorted(by: { $0.date > $1.date }) {
                if let last = entries.last,
                   displayCounterpart(last.call, legs) == displayCounterpart(call, legs),
                   last.call.isMissed == call.isMissed,
                   last.call.isInbound == call.isInbound {
                    entries[entries.count - 1].count += 1
                    entries[entries.count - 1].sids.append(call.sid)
                } else {
                    entries.append(Entry(call: call, count: 1, sids: [call.sid]))
                }
            }
            return (day, entries)
        }
    }

    private func dayTitle(_ day: Date) -> String {
        let cal = Calendar.current
        if cal.isDateInToday(day) { return "Today" }
        if cal.isDateInYesterday(day) { return "Yesterday" }
        if let days = cal.dateComponents([.day], from: day, to: .now).day, days < 7 {
            return day.formatted(.dateTime.weekday(.wide))
        }
        return day.formatted(date: .abbreviated, time: .omitted)
    }

    private var emptyState: (title: String, symbol: String, message: String) {
        if store.calls.isEmpty {
            return ("No Calls Yet", "phone.badge.plus", "Calls you make or receive on your Twilio numbers will appear here.")
        }
        switch filter {
        case .missed: return ("No Missed Calls", "checkmark.circle", "Nice. You haven't missed anyone.")
        case .outgoing: return ("No Outgoing Calls", "phone.arrow.up.right", "Calls you place from Dialbubble will appear here.")
        case .incoming: return ("No Incoming Calls", "phone.arrow.down.left", "Calls to your Twilio numbers will appear here.")
        case .all: return ("No Calls for This Number", "line.3.horizontal.decrease.circle", "Try choosing All Numbers.")
        }
    }

    var body: some View {
        let calls = visibleCalls
        let legs = childLegs
        List {
            Section {
                filters
                    .listRowInsets(EdgeInsets())
                    .listRowBackground(Color.clear)
                    .listRowSeparator(.hidden)
            }

            if isInitialLoading {
                SkeletonRows(count: 7)
                    .padding(.horizontal)
                    .padding(.top, Theme.Space.xs)
                    .listRowInsets(EdgeInsets())
                    .listRowBackground(Color.clear)
                    .listRowSeparator(.hidden)
                    .accessibilityLabel("Loading calls")
            } else if calls.isEmpty {
                ContentUnavailableView {
                    Label(emptyState.title, systemImage: emptyState.symbol)
                } description: {
                    Text(emptyState.message)
                } actions: {
                    Button {
                        store.openDialer()
                    } label: {
                        Label("Make a Call", systemImage: "phone.fill")
                    }
                    .buttonStyle(.glassProminent)
                    .tint(Theme.Palette.brand)
                    if filter != .all || numberFilter != nil {
                        Button {
                            withAnimation(motion) { filter = .all; numberFilter = nil }
                        } label: {
                            Label("Show All Calls", systemImage: "tray.full")
                        }
                        .buttonStyle(.glass)
                    }
                }
                .listRowBackground(Color.clear)
                .listRowSeparator(.hidden)
            } else {
                TipView(CallRecentsSwipeTip())
                    .listRowBackground(Color.clear)
                    .listRowSeparator(.hidden)
                ForEach(groupedCalls(calls, legs), id: \.day) { group in
                    Section {
                        ForEach(group.entries) { entry in
                            row(entry, legs: legs)
                        }
                    } header: {
                        Text(dayTitle(group.day))
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(.secondary)
                            .textCase(nil)
                            .accessibilityAddTraits(.isHeader)
                    }
                }
            }
        }
        .listStyle(.plain)
        .accessibilityIdentifier("recents.list")
        .relayBackground()
        .refreshable { await store.refreshCalls() }
        .task {
            if store.calls.isEmpty { await store.refreshCalls() }
            withAnimation(motion) { didInitialLoad = true }
        }
        .onAppear { store.markCallsSeen() }
        .onChange(of: store.unseenMissedCalls) { _, n in if n > 0 { store.markCallsSeen() } }
        .sensoryFeedback(.impact(weight: .light), trigger: swipeActions)
        .confirmationDialog("Delete from your call history?", isPresented: Binding(
            get: { pendingDelete != nil },
            set: { if !$0 { pendingDelete = nil } }
        ), titleVisibility: .visible, presenting: pendingDelete) { entry in
            Button(entry.count > 1 ? "Delete \(entry.count) Calls" : "Delete Call", role: .destructive) { delete(entry) }
            Button("Cancel", role: .cancel) {}
        } message: { _ in
            Text("The call record is removed from your Twilio logs and this app. Recordings are kept until you delete them.")
        }
    }

    private func row(_ entry: Entry, legs: [String: String]) -> some View {
        let call = entry.call, count = entry.count
        let person = displayCounterpart(call, legs)
        return NavigationLink(value: call) {
            CallRow(call: call, isBridge: isBridge(call), count: count, person: person)
        }
        .listRowBackground(Color.clear)
        .swipeActions(edge: .leading) {
            if FeatureFlags.messaging {
                Button {
                    swipeActions += 1
                    store.openMessage(to: person, from: smsFrom(call))
                    CallRecentsSwipeTip().invalidate(reason: .actionPerformed)
                } label: {
                    Label("Message", systemImage: "message.fill")
                }
                .tint(Theme.Palette.info)
            }
        }
        .swipeActions(edge: .trailing) {
            Button {
                swipeActions += 1
                callBack(call, to: person)
                CallRecentsSwipeTip().invalidate(reason: .actionPerformed)
            } label: {
                Label("Call Back", systemImage: "phone.fill")
            }
            .tint(Theme.Palette.brand)
            if !call.statusKind.isActive {
                Button(role: .destructive) {
                    pendingDelete = entry
                } label: {
                    Label("Delete", systemImage: "trash.fill")
                }
            }
        }
        .contextMenu {
            Button("Call Back", systemImage: "phone.fill") { callBack(call, to: person) }
            Button("Open in Keypad", systemImage: "circle.grid.3x3") {
                store.openDialer(to: person, from: call.ourNumber.nilIfBlank)
            }
            if FeatureFlags.messaging {
                Button("Message", systemImage: "message") {
                    store.openMessage(to: person, from: smsFrom(call))
                }
            }
            Button("Copy Number", systemImage: "doc.on.doc") {
                UIPasteboard.general.string = person
                toast.show("Number copied", style: .success)
            }
            if ContactBook.shared.name(for: person) == nil, !store.isDemo {
                Button("Add to Contacts", systemImage: "person.crop.circle.badge.plus") {
                    ContactPicker.addContact(phone: person)
                }
            }
            if !call.statusKind.isActive {
                Divider()
                Button(count > 1 ? "Delete \(count) Calls" : "Delete Call", systemImage: "trash", role: .destructive) {
                    pendingDelete = entry
                }
            }
        }
    }

    private var filters: some View {
        let missedCount = store.calls.lazy.filter { $0.parentCallSid == nil && Self.isMissed($0) }.count
        return HStack(spacing: Theme.Space.xs) {
            ChipBar(
                items: Filter.allCases.map { f in
                    ChipItem(id: f, title: f.rawValue, symbol: f.symbol,
                             count: f == .missed ? missedCount : nil,
                             color: f == .missed ? Theme.Palette.danger : Theme.Palette.brand,
                             accessibilityID: "recents.filter.\(f.rawValue.lowercased())")
                },
                selection: $filter
            )
            .contentMargins(.leading, Theme.Space.md, for: .scrollContent)

            if store.callerNumbers.count > 1 {
                Menu {
                    Picker("Number", selection: $numberFilter) {
                        Text("All Numbers").tag(String?.none)
                        ForEach(store.enabledNumbers) { n in
                            Text(n.displayName).tag(Optional(n.phoneNumber))
                        }
                    }
                } label: {
                    Image(systemName: numberFilter == nil ? "line.3.horizontal.decrease" : "line.3.horizontal.decrease.circle.fill")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(numberFilter == nil ? Color.primary : Theme.Palette.brandText)
                        .padding(10)
                        .contentShape(.circle)
                        .glassEffect(.regular.interactive(), in: .circle)
                }
                .buttonStyle(.plain)
                .padding(.trailing, Theme.Space.md)
                .accessibilityLabel("Filter by number")
                .accessibilityValue(numberFilter.flatMap { store.configuredNumber(for: $0)?.displayName } ?? "All Numbers")
                .accessibilityIdentifier("recents.filter.number")
            }
        }
        .padding(.vertical, 6)
        .sensoryFeedback(.selection, trigger: numberFilter)
    }

    /// A bridge call is an outbound-api call to the user's own phone whose child leg dials the real destination.
    private func isBridge(_ call: TwilioCall) -> Bool {
        guard !call.isInbound, let me = store.activeProfile?.personalPhone.nilIfBlank else { return false }
        return call.to == store.normalize(me)
    }

    private func displayCounterpart(_ call: TwilioCall, _ legs: [String: String]) -> String {
        if isBridge(call), let to = legs[call.sid] { return to }
        return call.counterpart
    }

    private func smsFrom(_ call: TwilioCall) -> String? {
        store.smsNumbers.contains { $0.phoneNumber == call.ourNumber } ? call.ourNumber : nil
    }

    private func delete(_ entry: Entry) {
        pendingDelete = nil
        Task {
            do {
                try await store.deleteCalls(entry.sids)
                toast.show(entry.count > 1 ? "\(entry.count) calls deleted" : "Call deleted", style: .success)
            } catch {
                toast.show(FriendlyError(error).title, style: .error)
            }
        }
    }

    private func callBack(_ call: TwilioCall, to: String) {
        let from = store.callerNumbers.contains { $0.phoneNumber == call.ourNumber } ? call.ourNumber : store.callerNumbers.first?.phoneNumber
        guard let from, store.activeProfile?.personalPhone.nilIfBlank != nil else {
            store.openDialer(to: to, from: from)
            return
        }
        Task {
            do {
                try await store.placeCall(OutgoingCall(from: from, destination: to, mode: .bridge))
            } catch {
                store.report(error)
            }
        }
    }
}

struct CallRow: View {
    @Environment(AppStore.self) private var store
    let call: TwilioCall
    var isBridge: Bool = false
    /// Back-to-back calls folded into this row.
    var count: Int = 1
    /// The person on the other end, when the caller already resolved it (Talk calls dial through a child leg).
    var person: String? = nil

    private var counterpart: String {
        if let person { return person }
        if isBridge, let child = store.calls.first(where: { $0.parentCallSid == call.sid }), let to = child.to { return to }
        return call.counterpart
    }

    @ScaledMetric(relativeTo: .body) private var avatarSize: CGFloat = 42
    @ScaledMetric(relativeTo: .caption) private var dotSize: CGFloat = 6
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private var isMissed: Bool { call.isMissed }

    private var directionSymbol: String {
        if isBridge { return "phone.connection.fill" }
        return call.isInbound ? "arrow.down.left" : "arrow.up.right"
    }

    private var directionLabel: String {
        let base = isBridge ? "Talk call" : (call.isInbound ? "Incoming" : "Outgoing")
        return call.isUnanswered ? "\(base), \(call.statusKind.label)" : base
    }

    var body: some View {
        HStack(spacing: 12) {
            CallTonalAvatar(key: counterpart, isMissed: isMissed, size: min(avatarSize, 60))
            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 4) {
                    Text(ContactBook.shared.label(for: counterpart))
                        .lineLimit(1)
                    if let flag = store.flag(for: counterpart) {
                        Text(flag)
                            .font(.subheadline)
                            .accessibilityLabel(PhoneFormat.countryName(of: counterpart) ?? "")
                    }
                    if count > 1 {
                        Text("(\(count))")
                            .accessibilityLabel("\(count) calls")
                    }
                }
                .font(.body.weight(.semibold).monospacedDigit())
                .foregroundStyle(isMissed ? Theme.Palette.danger : Color.primary)
                HStack(spacing: 5) {
                    Image(systemName: directionSymbol)
                        .fontWeight(.bold)
                        .foregroundStyle(isMissed ? Theme.Palette.danger : Color.secondary)
                        .accessibilityLabel(directionLabel)
                    if call.isUnanswered && !call.isInbound {
                        // Outgoing call nobody picked up: say so plainly (not red: it wasn't missed by you).
                        Text(call.statusKind.label).lineLimit(1)
                    } else if let n = store.configuredNumber(for: call.ourNumber) {
                        Circle().fill(n.tint.color).frame(width: dotSize, height: dotSize)
                        Text(n.displayName).lineLimit(1)
                    } else {
                        Text(call.statusKind.label)
                    }
                }
                .font(.caption)
                .foregroundStyle(.secondary)
            }
            Spacer(minLength: 8)
            VStack(alignment: .trailing, spacing: 3) {
                Text(call.date.formatted(date: .omitted, time: .shortened))
                    .font(.caption)
                    .foregroundStyle(.secondary)
                HStack(spacing: 4) {
                    if call.statusKind.isActive {
                        Image(systemName: "waveform")
                            .foregroundStyle(Theme.Palette.brandText)
                            .symbolEffect(.pulse, isActive: !reduceMotion)
                            .accessibilityLabel(call.statusKind.label)
                    }
                    if call.durationSeconds > 0 {
                        Text(call.durationSeconds.durationString).monospacedDigit()
                    }
                }
                .font(.caption)
                .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 4)
        .accessibilityElement(children: .combine)
    }
}

/// Tonal avatar for call lists and details. With a `key` (the phone number) it uses the same hue as
/// Messages, so a person looks the same in both tabs; missed calls are red.
struct CallTonalAvatar: View {
    var key: String? = nil
    var isMissed = false
    var size: CGFloat = 42
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        let tone: Color = isMissed ? Theme.Palette.danger : (key.map(MsgTonalAvatar.hue(for:)) ?? Color.secondary)
        TonalAvatarGlyph(key: key, size: size, tone: tone.opacity(isMissed ? 0.9 : 0.8))
            .frame(width: size, height: size)
            .background(tone.opacity(scheme == .dark ? 0.2 : 0.12), in: .circle)
            .accessibilityHidden(true)
    }
}
