import SwiftUI

struct NumbersView: View {
    @Environment(AppStore.self) private var store
    @Environment(ToastCenter.self) private var toast
    @State private var isSyncing = false
    @State private var showAdd = false

    private var numbers: [ConfiguredNumber] { store.activeProfile?.numbers ?? [] }

    var body: some View {
        List {
            Section {
                header
            }
            .listRowBackground(Color.clear)
            .listRowInsets(EdgeInsets(top: 4, leading: 0, bottom: 4, trailing: 0))

            if numbers.isEmpty {
                Section {
                    ContentUnavailableView {
                        Label("No Numbers Yet", systemImage: "number.circle")
                    } description: {
                        Text("Buy a Twilio number or verify your own, then pull down or tap Sync.")
                    } actions: {
                        Link(destination: URL(string: "https://console.twilio.com/us1/develop/phone-numbers/manage/search")!) {
                            Label("Buy a Number", systemImage: "cart.fill")
                        }
                        .buttonStyle(.glassProminent)
                        Link(destination: URL(string: "https://console.twilio.com/us1/develop/phone-numbers/manage/verified")!) {
                            Label("Verify a Caller ID", systemImage: "checkmark.shield.fill")
                        }
                        .buttonStyle(.glass)
                        Button { Task { await sync() } } label: {
                            if isSyncing {
                                Label { Text("Syncing…") } icon: { ProgressView() }
                            } else {
                                Label("Sync from Twilio", systemImage: "arrow.triangle.2.circlepath")
                            }
                        }
                        .buttonStyle(.glass)
                        .disabled(isSyncing)
                    }
                }
                .listRowBackground(Color.clear)
            }
            ForEach(groups, id: \.0) { source, items in
                Section {
                    ForEach(items) { n in
                        NavigationLink {
                            NumberEditView(number: n)
                        } label: {
                            row(n)
                        }
                        .swipeActions {
                            if n.source == .manual {
                                Button(role: .destructive) { store.removeNumber(n) } label: {
                                    Label("Delete", systemImage: "trash")
                                }
                            }
                            Button {
                                var m = n
                                m.isEnabled.toggle()
                                store.updateNumber(m)
                            } label: {
                                Label(n.isEnabled ? "Hide" : "Show", systemImage: n.isEnabled ? "eye.slash" : "eye")
                            }
                            .tint(n.isEnabled ? .gray : Theme.Palette.brand)
                        }
                    }
                } header: {
                    Text(source.label + "s")
                } footer: {
                    Text(footer(for: source))
                }
                .relayListRow()
            }
        }
        .relayBackground()
        .navigationTitle("Numbers")
        .refreshable { await sync() }
        .toolbar {
            ToolbarItemGroup(placement: .topBarTrailing) {
                Button {
                    Task { await sync() }
                } label: {
                    Image(systemName: "arrow.triangle.2.circlepath")
                        .symbolEffect(.rotate, isActive: isSyncing)
                }
                .accessibilityLabel("Sync from Twilio")
                .disabled(isSyncing)
                Button("Add Number", systemImage: "plus") { showAdd = true }
            }
        }
        .sheet(isPresented: $showAdd) { AddManualNumberSheet() }
    }

    private var groups: [(ConfiguredNumber.Source, [ConfiguredNumber])] {
        [ConfiguredNumber.Source.owned, .verified, .manual].compactMap { s in
            let items = numbers.filter { $0.source == s }
            return items.isEmpty ? nil : (s, items)
        }
    }

    private var header: some View {
        Text("Tap a number to rename it or change its color. Swipe to hide it from pickers.")
            .font(.subheadline)
            .foregroundStyle(.secondary)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, Theme.Space.md)
    }

    private func symbol(for source: ConfiguredNumber.Source) -> String {
        switch source {
        case .owned: return "simcard.fill"
        case .verified: return "checkmark.shield.fill"
        case .manual: return "hand.point.up.left.fill"
        }
    }

    private func footer(for source: ConfiguredNumber.Source) -> String {
        switch source {
        case .owned: return "Numbers you own in Twilio. Capabilities come from Twilio."
        case .verified: return "Your own phones verified with Twilio. Usable as caller ID for calls only."
        case .manual: return "Senders you added yourself, such as a WhatsApp sender."
        }
    }

    private func row(_ n: ConfiguredNumber) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: Theme.Space.sm) {
            Circle()
                .fill(n.tint.color)
                .frame(width: 10, height: 10)
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text(n.displayName).font(.body.weight(.semibold))
                    if !n.isEnabled {
                        Badge(text: "Hidden", color: .secondary)
                    }
                }
                Text(PhoneFormat.display(n.phoneNumber))
                    .font(.subheadline.monospacedDigit())
                    .foregroundStyle(.secondary)
                Text(numberCapabilityLine(n))
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 2)
        .opacity(n.isEnabled ? 1 : 0.6)
        .accessibilityElement(children: .combine)
    }

    /// Reports the outcome once through `ToastCenter` (no duplicate global error banner).
    private func sync() async {
        guard !isSyncing else { return }
        isSyncing = true
        let error = await store.syncNumbersReportingResult()
        isSyncing = false
        if let error {
            toast.show("\(error.title). \(error.suggestion ?? error.message)", style: .error)
        } else {
            let count = numbers.count
            toast.show("Synced · \(count) number\(count == 1 ? "" : "s")", style: .success)
        }
    }
}

private struct NumberEditView: View {
    @Environment(AppStore.self) private var store
    @Environment(ToastCenter.self) private var toast
    @State var number: ConfiguredNumber
    @ScaledMetric(relativeTo: .largeTitle) private var heroSize: CGFloat = 76
    @ScaledMetric private var swatchSize: CGFloat = 30

    var body: some View {
        Form {
            Section {
                VStack(spacing: 10) {
                    Image(systemName: number.source == .verified ? "checkmark.shield.fill" : "simcard.fill")
                        .font(.system(size: heroSize * 0.5))
                        .foregroundStyle(number.tint.color)
                        .frame(width: heroSize, height: heroSize)
                        .accessibilityHidden(true)
                        .glassEffect(.regular.tint(number.tint.color.opacity(0.2)), in: .circle)
                    Text(PhoneFormat.display(number.phoneNumber)).font(.title3.bold().monospacedDigit())
                    Text("\(number.source.label) · \(numberCapabilityLine(number))")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
            }
            .listRowBackground(Color.clear)

            Section {
                TextField(number.friendlyName, text: Binding(
                    get: { number.nickname ?? "" },
                    set: { number.nickname = $0.nilIfBlank }
                ))
                ScrollView(.horizontal) {
                    HStack(spacing: 10) {
                        ForEach(AppTint.allCases) { t in
                            Button {
                                number.tint = t
                            } label: {
                                Circle()
                                    .fill(t.color.gradient)
                                    .frame(width: swatchSize, height: swatchSize)
                                    .overlay {
                                        if number.tint == t {
                                            Image(systemName: "checkmark").font(.caption.bold()).foregroundStyle(.white)
                                        }
                                    }
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel(t.name)
                            .accessibilityAddTraits(number.tint == t ? .isSelected : [])
                        }
                    }
                    .padding(.vertical, 4)
                }
                .scrollIndicators(.hidden)
                .sensoryFeedback(.selection, trigger: number.tint)
            } header: {
                Text("Nickname & Color")
            } footer: {
                Text(FeatureFlags.messaging ? "The nickname and color help you tell numbers apart in pickers and conversations." : "The nickname and color help you tell numbers apart in pickers and call history.")
            }
            .relayListRow()

            Section {
                Toggle(isOn: $number.isEnabled) {
                    SettingsRowLabel("Show in Pickers", symbol: "eye", color: Theme.Palette.brandText)
                }
                if number.source == .manual {
                    Toggle(isOn: $number.voice) { SettingsRowLabel("Calls", symbol: "phone", color: Theme.Palette.brandText) }
                    if FeatureFlags.messaging {
                        Toggle(isOn: $number.sms) { SettingsRowLabel("SMS", symbol: "message", color: Theme.Palette.brandText) }
                        Toggle(isOn: $number.mms) { SettingsRowLabel("MMS", symbol: "photo", color: Theme.Palette.brandText) }
                    }
                }
            } footer: {
                Text(FeatureFlags.messaging ? "Disabled numbers are hidden when choosing who to call or text from." : "Disabled numbers are hidden when choosing who to call from.")
            }
            .relayListRow()

            Section {
                if number.voice {
                    Button("Call from this number", systemImage: "phone.fill") { store.openDialer(from: number.phoneNumber) }
                }
                if number.sms && FeatureFlags.messaging {
                    Button("Message from this number", systemImage: "message.fill") { store.openMessage(to: "", from: number.phoneNumber) }
                }
                Button("Copy Number", systemImage: "doc.on.doc") {
                    UIPasteboard.general.string = number.phoneNumber
                    toast.show("Number copied", style: .success)
                }
            }
            .relayListRow()
        }
        .relayBackground()
        .navigationTitle(number.displayName)
        .navigationBarTitleDisplayMode(.inline)
        .onChange(of: number) { _, new in store.updateNumber(new) }
    }
}

private struct AddManualNumberSheet: View {
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    @State private var phone = ""
    @State private var nickname = ""
    @State private var voice = true
    @State private var sms = true
    @State private var mms = false
    @State private var tint: AppTint = .teal
    @Environment(ToastCenter.self) private var toast

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Label {
                        TextField("+1 415 555 0100", text: $phone).keyboardType(.phonePad)
                    } icon: { Image(systemName: "phone.fill").foregroundStyle(.secondary) }
                    Label {
                        TextField("Nickname (optional)", text: $nickname)
                    } icon: { Image(systemName: "tag.fill").foregroundStyle(.secondary) }
                    if !phone.isEmpty && !PhoneFormat.isPlausible(phone) {
                        Label("Enter a full number with country code.", systemImage: "exclamationmark.circle.fill")
                            .font(.footnote)
                            .foregroundStyle(Theme.Palette.warning)
                    }
                } footer: {
                    Text("Use for numbers Twilio lets you send from that aren't listed automatically (e.g. a WhatsApp sender like whatsapp:+1…).")
                }
                Section {
                    Toggle(isOn: $voice) { SettingsRowLabel("Calls", symbol: "phone", color: Theme.Palette.brandText) }
                    if FeatureFlags.messaging {
                        Toggle(isOn: $sms) { SettingsRowLabel("SMS", symbol: "message", color: Theme.Palette.brandText) }
                        Toggle(isOn: $mms) { SettingsRowLabel("MMS", symbol: "photo", color: Theme.Palette.brandText) }
                    }
                } header: {
                    Text("Capabilities")
                }
                Section {
                    Picker(selection: $tint) {
                        ForEach(AppTint.allCases) { t in
                            Label(t.name, systemImage: "circle.fill").foregroundStyle(t.color).tag(t)
                        }
                    } label: {
                        SettingsRowLabel("Color", symbol: "paintpalette.fill", color: tint.color)
                    }
                }
            }
            .relayBackground()
            .navigationTitle("Add Number")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel", systemImage: "xmark") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add", systemImage: "checkmark") {
                        let e164 = store.normalize(phone)
                        store.addManualNumber(ConfiguredNumber(
                            phoneNumber: e164, friendlyName: PhoneFormat.display(e164), nickname: nickname.nilIfBlank,
                            tint: tint, voice: voice, sms: sms, mms: mms, source: .manual))
                        toast.show("Number added", style: .success)
                        dismiss()
                    }
                    .disabled(!PhoneFormat.isPlausible(phone))
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
}

/// "Voice · SMS · MMS" — one quiet line instead of a row of capability icons.
private func numberCapabilityLine(_ n: ConfiguredNumber) -> String {
    // FeatureFlags.messaging: don't advertise SMS/MMS while texting is hidden.
    let sms = FeatureFlags.messaging && n.sms, mms = FeatureFlags.messaging && n.mms
    let caps = [n.voice ? "Voice" : nil, sms ? "SMS" : nil, mms ? "MMS" : nil].compactMap { $0 }
    return caps.isEmpty ? "No capabilities" : caps.joined(separator: " · ")
}
