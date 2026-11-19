import SwiftUI

/// Twilio Lookup v2: validate and format numbers, with optional paid line-type and caller-name data.
struct LookupView: View {
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    @Environment(ToastCenter.self) private var toast
    /// Shows a Done button when presented as a sheet.
    var showsDone = false
    @AppStorage("relay.lookupRecents") private var recentsRaw = ""
    @State private var input = ""
    @State private var lineType = false
    @State private var callerName = false
    @State private var result: LookupResult?
    @State private var isLoading = false
    @State private var error: FriendlyError?
    @FocusState private var focused: Bool

    private var recents: [String] { recentsRaw.split(separator: "\n").map(String.init) }
    private var isPlausible: Bool { PhoneFormat.isPlausible(input) }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                intro

                VStack(alignment: .leading, spacing: 6) {
                    HStack(spacing: 10) {
                        HStack {
                            Image(systemName: "phone.fill").foregroundStyle(.secondary)
                            TextField("Phone number, e.g. +1 415 555 0100", text: $input)
                                .keyboardType(.phonePad)
                                .textContentType(.telephoneNumber)
                                .focused($focused)
                                .onSubmit(run)
                                .accessibilityIdentifier("lookup.field")
                            if !input.isEmpty {
                                Button {
                                    input = ""
                                    result = nil
                                    error = nil
                                } label: {
                                    Image(systemName: "xmark.circle.fill").foregroundStyle(.tertiary)
                                }
                                .buttonStyle(.plain)
                                .accessibilityLabel("Clear")
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 13)
                        .glassEffect(.regular, in: .capsule)
                        ContactPickerButton { phone, _ in input = phone }
                    }
                    if !input.isEmpty {
                        Label {
                            Text(isPlausible ? "Looks up \(PhoneFormat.display(store.normalize(input)))" : "Enter at least 7 digits, including the country code.")
                                .foregroundStyle(.secondary)
                        } icon: {
                            Image(systemName: isPlausible ? "checkmark.circle.fill" : "exclamationmark.circle.fill")
                                .foregroundStyle(isPlausible ? Theme.Palette.success : Theme.Palette.warning)
                        }
                        .font(.footnote)
                        .padding(.horizontal, 8)
                    }
                }

                GlassCard {
                    VStack(alignment: .leading, spacing: 12) {
                        Toggle(isOn: $lineType) {
                            Label {
                                VStack(alignment: .leading, spacing: 1) {
                                    Text("Line type & carrier")
                                    Text("Mobile, landline or VoIP · paid").font(.footnote).foregroundStyle(.secondary)
                                }
                            } icon: {
                                Image(systemName: "antenna.radiowaves.left.and.right").foregroundStyle(.secondary)
                            }
                        }
                        Divider()
                        Toggle(isOn: $callerName) {
                            Label {
                                VStack(alignment: .leading, spacing: 1) {
                                    Text("Caller name")
                                    Text("US numbers only · paid").font(.footnote).foregroundStyle(.secondary)
                                }
                            } icon: {
                                Image(systemName: "person.text.rectangle").foregroundStyle(.secondary)
                            }
                        }
                    }
                }

                if let error {
                    FriendlyErrorView(error: error, retry: run, onDismiss: { self.error = nil })
                }

                if let result { resultCard(result).transition(.scale(scale: 0.95).combined(with: .opacity)) }

                if result == nil && !recents.isEmpty {
                    recentList
                }
            }
            .padding()
            .frame(maxWidth: 700)
            .frame(maxWidth: .infinity)
            .animation(.snappy, value: result)
            .animation(.snappy, value: error)
        }
        .scrollDismissesKeyboard(.interactively)
        .bottomCTA {
            PrimaryButton(title: isLoading ? "Looking Up…" : "Look Up", symbol: "magnifyingglass", isLoading: isLoading, action: run)
                .disabled(!isPlausible)
                .accessibilityIdentifier("lookup.run")
        }
        .relayBackground()
        .navigationTitle("Number Lookup")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if showsDone {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done", systemImage: "checkmark") { dismiss() }
                        .buttonStyle(.glass)
                }
            }
        }
        // Only react to new results/errors — never to clearing them.
        .sensoryFeedback(trigger: result) { _, new in
            guard let new else { return nil }
            return (new.valid ?? false) ? .success : .warning
        }
        .sensoryFeedback(.error, trigger: error) { _, new in new != nil }
    }

    private var intro: some View {
        HStack(alignment: .top, spacing: 12) {
            IconTile(symbol: "person.text.rectangle", color: Theme.Palette.brandText, size: 40)
            VStack(alignment: .leading, spacing: 3) {
                Text("Check any number").font(.headline)
                Text("Validation and formatting are free. Carrier and caller name cost a small Twilio fee.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
                Link(destination: URL(string: "https://www.twilio.com/en-us/user-authentication-identity/pricing/lookup")!) {
                    Text("Lookup pricing")
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(Theme.Palette.brandText)
                }
            }
        }
    }

    private var recentList: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Recent")
                    .font(.headline)
                    .accessibilityAddTraits(.isHeader)
                Spacer()
                Button("Clear") { recentsRaw = "" }
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Theme.Palette.brandText)
                    .buttonStyle(.plain)
            }
            .padding(.horizontal, 4)
            VStack(spacing: 0) {
                ForEach(recents, id: \.self) { n in
                    Button {
                        input = n
                        run()
                    } label: {
                        HStack {
                            Image(systemName: "number").foregroundStyle(.secondary)
                            Text(PhoneFormat.display(n)).font(.body.monospacedDigit()).foregroundStyle(.primary)
                            Spacer()
                            Image(systemName: "arrow.up.left").font(.caption).foregroundStyle(.tertiary)
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .contentShape(.rect)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Look up \(PhoneFormat.display(n))")
                    if n != recents.last { Divider().padding(.leading, 44) }
                }
            }
            .glassEffect(.regular, in: .rect(cornerRadius: Theme.Radius.lg))
        }
    }

    private func resultCard(_ r: LookupResult) -> some View {
        let valid = r.valid ?? false
        let color = valid ? Theme.Palette.success : Theme.Palette.danger
        return GlassCard(tint: color) {
            VStack(alignment: .leading, spacing: 14) {
                HStack {
                    Image(systemName: valid ? "checkmark.seal.fill" : "xmark.seal.fill")
                        .font(.largeTitle)
                        .foregroundStyle(color)
                        .accessibilityHidden(true)
                        .symbolEffect(.bounce, value: r)
                    VStack(alignment: .leading) {
                        Text(r.nationalFormat ?? r.phoneNumber ?? "—").font(.title3.bold())
                        Text(valid ? "Valid number" : "Invalid number").font(.subheadline).foregroundStyle(.secondary)
                    }
                }
                Divider()
                detail("E.164", "number", r.phoneNumber)
                detail("Country", "globe", r.countryCode.map { "\(flag($0)) \($0)" })
                detail("Calling code", "plus.circle", r.callingCountryCode.map { "+\($0)" })
                if let errors = r.validationErrors, !errors.isEmpty {
                    detail("Issues", "exclamationmark.triangle", errors.joined(separator: ", ").replacingOccurrences(of: "_", with: " ").capitalized)
                }
                if let lt = r.lineTypeIntelligence {
                    detail("Line type", "antenna.radiowaves.left.and.right", lt.type?.replacingOccurrences(of: "_", with: " ").capitalized)
                    detail("Carrier", "building.2", lt.carrierName)
                }
                if let cn = r.callerName {
                    detail("Caller name", "person.fill", cn.callerName)
                    detail("Caller type", "person.2", cn.callerType?.capitalized)
                }
                if valid, let n = r.phoneNumber {
                    ViewThatFits(in: .horizontal) {
                        HStack(spacing: 10) { resultActions(n) }
                        VStack(alignment: .leading, spacing: 10) { resultActions(n) }
                    }
                    .labelStyle(.titleAndIcon)
                    .font(.subheadline)
                }
            }
        }
        .accessibilityElement(children: .contain)
    }

    @ViewBuilder
    private func resultActions(_ n: String) -> some View {
        Button("Call", systemImage: "phone.fill") { dismissIfSheet(); store.openDialer(to: n) }
            .buttonStyle(.glass)
        if FeatureFlags.messaging {
            Button("Message", systemImage: "message.fill") { dismissIfSheet(); store.openMessage(to: n) }
                .buttonStyle(.glass)
        }
        Button("Copy", systemImage: "doc.on.doc") {
            UIPasteboard.general.string = n
            toast.show("Number copied", style: .success)
        }
        .buttonStyle(.glass)
    }

    private func dismissIfSheet() {
        if showsDone { dismiss() }
    }

    @ViewBuilder
    private func detail(_ title: String, _ symbol: String, _ value: String?) -> some View {
        if let value, !value.isEmpty {
            ViewThatFits(in: .horizontal) {
                HStack {
                    Label(title, systemImage: symbol).foregroundStyle(.secondary)
                    Spacer()
                    Text(value).fontWeight(.medium).multilineTextAlignment(.trailing).textSelection(.enabled)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Label(title, systemImage: symbol).foregroundStyle(.secondary)
                    Text(value).fontWeight(.medium).textSelection(.enabled)
                }
            }
            .font(.subheadline)
        }
    }

    private func flag(_ code: String) -> String {
        code.uppercased().unicodeScalars.compactMap { UnicodeScalar(127397 + $0.value) }.map { String($0) }.joined()
    }

    private func run() {
        guard let client = store.client, PhoneFormat.isPlausible(input) else { return }
        focused = false
        isLoading = true
        error = nil
        let number = store.normalize(input)
        Task {
            defer { isLoading = false }
            do {
                result = try await client.lookup(number, lineType: lineType, callerName: callerName)
                remember(number)
            } catch {
                result = nil
                self.error = FriendlyError(error)
            }
        }
    }

    private func remember(_ number: String) {
        recentsRaw = ([number] + recents.filter { $0 != number }).prefix(6).joined(separator: "\n")
    }
}
