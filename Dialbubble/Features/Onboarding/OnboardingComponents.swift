import SwiftUI
import UIKit

// MARK: - Twilio Console replica ("where to find it") with numbered coach marks

/// A drawn replica of the Twilio Console "Account Info" panel with ①②③ coach marks.
/// The mark matching the focused field is highlighted.
struct OnboardingConsoleMock: View {
    var highlight: OnboardingCredentialField?
    var usesAPIKey: Bool

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 8) {
                HStack(spacing: 5) {
                    ForEach([Color.gray.opacity(0.5), .gray.opacity(0.35), .gray.opacity(0.25)], id: \.self) { c in
                        Circle().fill(c).frame(width: 8, height: 8)
                    }
                }
                Text("console.twilio.com")
                    .font(.caption2.monospaced())
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 3)
                    .background(Capsule().fill(.quaternary.opacity(0.6)))
                OnboardingCoachMark(number: 1, active: highlight == nil)
                Spacer(minLength: 0)
            }
            .padding(.bottom, 12)

            Label(usesAPIKey ? "API keys & tokens" : "Account Info", systemImage: usesAPIKey ? "key.horizontal.fill" : "info.circle.fill")
                .font(.subheadline.weight(.bold))
                .foregroundStyle(.primary)
                .padding(.bottom, 8)

            if usesAPIKey {
                row("Account SID", "AC3a9e…07bf", symbol: "doc.on.doc", mark: nil, active: highlight == .accountSid)
                Divider().opacity(0.4)
                row("API Key SID", "SK8f2c…41d9", symbol: "doc.on.doc", mark: 2, active: highlight == .apiKeySid)
                Divider().opacity(0.4)
                row("Secret", "Shown once when created", symbol: "eye", mark: 3, active: highlight == .secret, dimmed: true)
            } else {
                row("Account SID", "AC3a9e…07bf", symbol: "doc.on.doc", mark: 2, active: highlight == .accountSid)
                Divider().opacity(0.4)
                row("Auth Token", "••••••••••••••••", symbol: "eye", trailingText: "Show", mark: 3, active: highlight == .secret)
                Divider().opacity(0.4)
                row("My Twilio phone number", "+1 415 555 0100", symbol: "phone", mark: nil, active: false, dimmed: true)
            }
        }
        .padding(16)
        .glassEffect(.regular, in: .rect(cornerRadius: Theme.Radius.lg))
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(usesAPIKey
            ? "Twilio Console guide. 1: open the Console. 2: in API keys and tokens, copy the key SID. 3: copy its secret. You also need your Account SID."
            : "Twilio Console guide. 1: open the Console home page. 2: under Account Info, copy the Account SID. 3: tap Show, then copy the Auth Token.")
    }

    private func row(_ title: String, _ value: String, symbol: String, trailingText: String? = nil,
                     mark: Int?, active: Bool, dimmed: Bool = false) -> some View {
        HStack(spacing: 10) {
            if let mark {
                OnboardingCoachMark(number: mark, active: active)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.caption.weight(.semibold)).foregroundStyle(.secondary)
                Text(value).font(.footnote.monospaced()).foregroundStyle(dimmed ? .secondary : .primary).lineLimit(1)
            }
            Spacer(minLength: 4)
            if let trailingText {
                Text(trailingText).font(.caption.weight(.semibold)).foregroundStyle(Theme.Palette.brandText)
            }
            Image(systemName: symbol)
                .font(.footnote)
                .foregroundStyle(active ? AnyShapeStyle(Theme.Palette.brandText) : AnyShapeStyle(.secondary))
        }
        .padding(.vertical, 9)
        .padding(.horizontal, 10)
        .background {
            if active {
                let shape = RoundedRectangle(cornerRadius: Theme.Radius.sm)
                if reduceMotion {
                    shape.strokeBorder(Theme.Palette.brand, lineWidth: 1.5)
                        .background(shape.fill(Theme.Palette.brand.opacity(0.08)))
                } else {
                    shape.strokeBorder(Theme.Palette.brand, lineWidth: 1.5)
                        .background(shape.fill(Theme.Palette.brand.opacity(0.08)))
                        .phaseAnimator([0.55, 1.0]) { content, opacity in
                            content.opacity(opacity)
                        } animation: { _ in .easeInOut(duration: 0.9) }
                }
            }
        }
        .animation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion), value: active)
    }
}

/// Numbered circle used as a coach mark (① ② ③).
struct OnboardingCoachMark: View {
    var number: Int
    var active: Bool
    @ScaledMetric(relativeTo: .caption) private var size: CGFloat = 20

    var body: some View {
        Text("\(number)")
            .font(.caption2.weight(.heavy).monospacedDigit())
            .foregroundStyle(active ? Color.white : Theme.Palette.brandText)
            .frame(width: size, height: size)
            .background(Circle().fill(active ? AnyShapeStyle(Theme.Palette.brand) : AnyShapeStyle(Theme.Palette.brand.opacity(0.15))))
            .accessibilityHidden(true)
    }
}

/// The three coach-mark captions under the console replica.
struct OnboardingCoachLegend: View {
    var usesAPIKey: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            line(1, "Open the Twilio Console and sign in.")
            line(2, usesAPIKey ? "Copy the API Key SID (starts with SK)." : "Copy the Account SID (starts with AC).")
            line(3, usesAPIKey ? "Copy the key's secret — it's shown only once." : "Tap Show, then copy the Auth Token.")
        }
        .padding(.horizontal, 6)
        .accessibilityElement(children: .combine)
    }

    private func line(_ n: Int, _ text: String) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 10) {
            OnboardingCoachMark(number: n, active: false)
            Text(text).font(.footnote).foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}

// MARK: - Connection checklist

enum OnboardingTaskState: Equatable {
    case pending, running, done, failed
}

struct OnboardingChecklistRow: View {
    var title: String
    var detail: String?
    var symbol: String
    var state: OnboardingTaskState

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @ScaledMetric(relativeTo: .body) private var size: CGFloat = 38

    var body: some View {
        HStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(tint.opacity(state == .pending ? 0.08 : 0.16))
                    .frame(width: size, height: size)
                Group {
                    switch state {
                    case .pending:
                        Image(systemName: symbol).foregroundStyle(.tertiary)
                    case .running:
                        ProgressView().controlSize(.small)
                    case .done:
                        Image(systemName: "checkmark").foregroundStyle(Theme.Palette.success)
                            .transition(.scale.combined(with: .opacity))
                    case .failed:
                        Image(systemName: "xmark").foregroundStyle(Theme.Palette.danger)
                            .transition(.scale.combined(with: .opacity))
                    }
                }
                .font(.body.weight(.bold))
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.body.weight(state == .running ? .semibold : .regular))
                    .foregroundStyle(state == .pending ? .secondary : .primary)
                if let detail {
                    Text(detail).font(.caption).foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                        .transition(.opacity)
                }
            }
            Spacer(minLength: 0)
        }
        .animation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion), value: state)
        .accessibilityElement(children: .combine)
        .accessibilityValue(stateLabel)
    }

    private var tint: Color {
        switch state {
        case .pending: return .secondary
        case .running: return Theme.Palette.brand
        case .done: return Theme.Palette.success
        case .failed: return Theme.Palette.danger
        }
    }

    private var stateLabel: String {
        switch state {
        case .pending: return "Waiting"
        case .running: return "In progress"
        case .done: return "Done"
        case .failed: return "Failed"
        }
    }
}

// MARK: - Countries

struct OnboardingCountry: Identifiable, Hashable {
    let iso: String
    let dial: String
    var id: String { iso }

    var name: String { Locale.current.localizedString(forRegionCode: iso) ?? iso }

    var flag: String {
        iso.unicodeScalars.compactMap { UnicodeScalar(127397 + $0.value) }.map(String.init).joined()
    }

    init(iso: String, dial: String) {
        self.iso = iso
        self.dial = dial
    }

    /// Countries with their calling codes, sorted by localized name.
    static let all: [OnboardingCountry] = [
        ("US", "1"), ("CA", "1"), ("GB", "44"), ("IN", "91"), ("AU", "61"), ("NZ", "64"), ("IE", "353"),
        ("DE", "49"), ("FR", "33"), ("ES", "34"), ("IT", "39"), ("NL", "31"), ("BE", "32"), ("LU", "352"),
        ("SE", "46"), ("NO", "47"), ("DK", "45"), ("FI", "358"), ("IS", "354"), ("CH", "41"), ("AT", "43"),
        ("PT", "351"), ("PL", "48"), ("CZ", "420"), ("SK", "421"), ("HU", "36"), ("RO", "40"), ("BG", "359"),
        ("GR", "30"), ("HR", "385"), ("SI", "386"), ("RS", "381"), ("UA", "380"), ("EE", "372"), ("LV", "371"),
        ("LT", "370"), ("CY", "357"), ("MT", "356"), ("TR", "90"), ("IL", "972"), ("AE", "971"), ("SA", "966"),
        ("QA", "974"), ("KW", "965"), ("BH", "973"), ("OM", "968"), ("JO", "962"), ("LB", "961"), ("EG", "20"),
        ("MA", "212"), ("TN", "216"), ("NG", "234"), ("GH", "233"), ("KE", "254"), ("UG", "256"), ("TZ", "255"),
        ("ZA", "27"), ("ET", "251"), ("PK", "92"), ("BD", "880"), ("LK", "94"), ("NP", "977"), ("SG", "65"),
        ("MY", "60"), ("ID", "62"), ("TH", "66"), ("VN", "84"), ("PH", "63"), ("HK", "852"), ("TW", "886"),
        ("JP", "81"), ("KR", "82"), ("CN", "86"), ("MX", "52"), ("BR", "55"), ("AR", "54"), ("CL", "56"),
        ("CO", "57"), ("PE", "51"), ("EC", "593"), ("UY", "598"), ("CR", "506"), ("PA", "507"), ("GT", "502"),
        ("DO", "1"), ("PR", "1"), ("JM", "1"), ("TT", "1"),
    ]
    .map { OnboardingCountry(iso: $0.0, dial: $0.1) }
    .sorted { $0.name.localizedStandardCompare($1.name) == .orderedAscending }

    /// Best guess from the device region.
    static var current: OnboardingCountry {
        let region = Locale.current.region?.identifier ?? "US"
        return all.first { $0.iso == region } ?? all.first { $0.iso == "US" }!
    }

    static func with(iso: String) -> OnboardingCountry? { all.first { $0.iso == iso } }

    /// Finds the country whose dial code prefixes an E.164 number (longest match wins; prefers the device region on ties).
    static func matching(e164: String) -> OnboardingCountry? {
        let digits = e164.filter(\.isNumber)
        let candidates = all.filter { digits.hasPrefix($0.dial) }
        guard let longest = candidates.map(\.dial.count).max() else { return nil }
        let best = candidates.filter { $0.dial.count == longest }
        return best.first { $0.iso == current.iso } ?? best.first { $0.iso == "US" } ?? best.first
    }

    /// Splits an E.164 number into a country and the national part (for prefilling a field).
    static func split(_ e164: String) -> (OnboardingCountry, String)? {
        let t = e164.trimmingCharacters(in: .whitespacesAndNewlines)
        guard t.hasPrefix("+"), let c = matching(e164: t) else { return nil }
        return (c, String(t.filter(\.isNumber).dropFirst(c.dial.count)))
    }
}

/// Glass capsule showing the flag + calling code; opens a searchable country list.
/// Shared by onboarding and Home → "Add your phone".
struct CountryCodeButton: View {
    @Binding var country: OnboardingCountry
    var accessibilityID: String = "onboarding.countryPicker"
    @State private var showPicker = false

    var body: some View {
        Button {
            showPicker = true
        } label: {
            HStack(spacing: 4) {
                Text(country.flag)
                Text("+\(country.dial)").font(.body.monospacedDigit()).foregroundStyle(.primary)
                Image(systemName: "chevron.up.chevron.down").font(.caption2.weight(.bold)).foregroundStyle(.secondary)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 13)
            .contentShape(.rect(cornerRadius: Theme.Radius.md))
            .glassEffect(.regular.interactive(), in: .rect(cornerRadius: Theme.Radius.md))
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Country code: \(country.name), plus \(country.dial)")
        .accessibilityHint("Opens a list of countries")
        .accessibilityIdentifier(accessibilityID)
        .sheet(isPresented: $showPicker) {
            CountryPickerSheet(selection: $country)
        }
    }
}

/// Searchable list of countries with the device region suggested at the top.
struct CountryPickerSheet: View {
    @Binding var selection: OnboardingCountry
    @Environment(\.dismiss) private var dismiss
    @State private var query = ""

    private var results: [OnboardingCountry] {
        let q = query.trimmingCharacters(in: .whitespaces).lowercased()
        guard !q.isEmpty else { return OnboardingCountry.all }
        let digits = q.filter(\.isNumber)
        return OnboardingCountry.all.filter {
            $0.name.lowercased().contains(q) || $0.iso.lowercased() == q || (!digits.isEmpty && $0.dial.hasPrefix(digits))
        }
    }

    var body: some View {
        NavigationStack {
            List {
                if query.isEmpty {
                    Section("Suggested") {
                        row(OnboardingCountry.current)
                        if selection != OnboardingCountry.current { row(selection) }
                    }
                }
                Section(query.isEmpty ? "All countries" : "Results") {
                    ForEach(results) { row($0) }
                }
            }
            .searchable(text: $query, placement: .navigationBarDrawer(displayMode: .always), prompt: "Country or code")
            .overlay {
                if results.isEmpty {
                    ContentUnavailableView.search(text: query)
                }
            }
            .navigationTitle("Country")
            .navigationBarTitleDisplayMode(.inline)
            .relayBackground()
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close", systemImage: "xmark") { dismiss() }
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }

    private func row(_ c: OnboardingCountry) -> some View {
        Button {
            selection = c
            dismiss()
        } label: {
            HStack(spacing: 12) {
                Text(c.flag).font(.title3)
                Text(c.name).foregroundStyle(.primary)
                Spacer()
                Text("+\(c.dial)").font(.body.monospacedDigit()).foregroundStyle(.secondary)
                if c == selection {
                    Image(systemName: "checkmark").font(.body.weight(.semibold)).foregroundStyle(Theme.Palette.brand)
                }
            }
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .accessibilityLabel("\(c.name), plus \(c.dial)")
        .accessibilityAddTraits(c == selection ? .isSelected : [])
        .listRowBackground(Color.clear)
    }
}

// MARK: - Bridge call diagram

/// Twilio → you → them diagram explaining two-way "Talk" calls. Static under Reduce Motion.
struct OnboardingBridgeDiagram: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @ScaledMetric(relativeTo: .title2) private var nodeSize: CGFloat = 56

    private let nodes: [(String, String)] = [
        ("iphone.gen3.radiowaves.left.and.right", "Dialbubble rings this phone"),
        ("circle.grid.3x3.fill", "Press any key"),
        ("person.wave.2.fill", "They see your Twilio number"),
    ]

    var body: some View {
        Group {
            if reduceMotion {
                diagram(phase: nil)
            } else {
                PhaseAnimator([0, 1, 2]) { phase in
                    diagram(phase: phase)
                } animation: { _ in .spring(duration: 0.7, bounce: 0.3).delay(0.6) }
            }
        }
        .padding(16)
        .glassEffect(.regular, in: .rect(cornerRadius: Theme.Radius.lg))
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Dialbubble rings this phone first. Answer and press any key to connect. The other person sees your Twilio number.")
    }

    @ViewBuilder
    private func diagram(phase: Int?) -> some View {
        let layout = dynamicTypeSize.isAccessibilitySize
            ? AnyLayout(VStackLayout(alignment: .leading, spacing: 10))
            : AnyLayout(HStackLayout(alignment: .top, spacing: 4))
        layout {
            ForEach(nodes.indices, id: \.self) { i in
                node(i, active: phase.map { $0 == i } ?? false)
                if i < nodes.count - 1 {
                    Image(systemName: dynamicTypeSize.isAccessibilitySize ? "chevron.down" : "chevron.forward")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(phase.map { i < $0 } ?? true ? AnyShapeStyle(Theme.Palette.brandText) : AnyShapeStyle(.secondary))
                        .padding(.top, dynamicTypeSize.isAccessibilitySize ? 0 : nodeSize / 2 - 6)
                        .padding(.leading, dynamicTypeSize.isAccessibilitySize ? nodeSize / 2 - 6 : 0)
                }
            }
        }
    }

    private func node(_ i: Int, active: Bool) -> some View {
        let layout = dynamicTypeSize.isAccessibilitySize
            ? AnyLayout(HStackLayout(spacing: 12))
            : AnyLayout(VStackLayout(spacing: 8))
        return layout {
            Image(systemName: nodes[i].0)
                .font(.title2)
                .foregroundStyle(active ? Color.white : Theme.Palette.brandText)
                .frame(width: nodeSize, height: nodeSize)
                .background(Circle().fill(active ? AnyShapeStyle(Theme.Palette.brand.gradient) : AnyShapeStyle(Theme.Palette.brand.opacity(0.12))))
                .scaleEffect(active ? 1.08 : 1)
            Text(nodes[i].1)
                .font(.caption)
                .multilineTextAlignment(dynamicTypeSize.isAccessibilitySize ? .leading : .center)
                .foregroundStyle(active ? .primary : .secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: dynamicTypeSize.isAccessibilitySize ? nil : .infinity)
    }
}

// MARK: - Progress

/// Segmented 4-part progress bar. `completed` segments are filled, `current` is highlighted.
struct OnboardingSegmentedProgress: View {
    var total: Int
    var completed: Set<Int>
    var current: Int?

    var body: some View {
        HStack(spacing: 6) {
            ForEach(1...total, id: \.self) { i in
                Capsule()
                    .fill(fill(i))
                    .frame(height: 6)
            }
        }
        .accessibilityElement()
        .accessibilityLabel("Setup progress")
        .accessibilityValue(current.map { "Step \($0) of \(total)" } ?? "\(completed.count) of \(total) steps done")
    }

    private func fill(_ i: Int) -> AnyShapeStyle {
        if completed.contains(i) { return AnyShapeStyle(Theme.Palette.brand) }
        if i == current { return AnyShapeStyle(Theme.Palette.brand.opacity(0.55)) }
        return AnyShapeStyle(Color.primary.opacity(0.12))
    }
}

// MARK: - Choice card

/// Large glass choice used on the "Do you have a Twilio account?" fork.
struct OnboardingChoiceCard: View {
    var symbol: String
    var color: Color
    var title: String
    var detail: String
    var accessibilityID: String
    var action: () -> Void

    @ScaledMetric(relativeTo: .title) private var tile: CGFloat = 48

    var body: some View {
        Button(action: action) {
            HStack(spacing: 16) {
                IconTile(symbol: symbol, color: color, size: tile)
                VStack(alignment: .leading, spacing: 4) {
                    Text(title).font(.title3.weight(.semibold)).foregroundStyle(.primary)
                    Text(detail).font(.subheadline).foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .multilineTextAlignment(.leading)
                Spacer(minLength: 4)
                Image(systemName: "chevron.forward")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.secondary)
            }
            .padding(Theme.Space.md)
            .frame(maxWidth: .infinity, alignment: .leading)
            .contentShape(.rect(cornerRadius: Theme.Radius.lg))
            .glassEffect(.regular.interactive(), in: .rect(cornerRadius: Theme.Radius.lg))
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(.isButton)
        .accessibilityIdentifier(accessibilityID)
    }
}

// MARK: - Hero orb

/// Premium mint orb for hero moments (Welcome, All set, Lock screen).
/// A clean mint gradient with a soft specular highlight and a faint luminous halo —
/// no glass layered on top, so it stays crisp (not muddy) on the near-black canvas.
struct OnboardingHeroOrb: View {
    var symbol: String
    var size: CGFloat
    var glyphScale: CGFloat = 0.42
    var glyphWeight: Font.Weight = .semibold

    @Environment(\.colorScheme) private var scheme

    private static let fill = LinearGradient(
        colors: [Color(uiColor: UIColor(hex: 0x3EDBC4)), Color(uiColor: UIColor(hex: 0x10A896)), Color(uiColor: UIColor(hex: 0x0B7A80))],
        startPoint: .topLeading, endPoint: .bottomTrailing)

    var body: some View {
        let dark = scheme == .dark
        ZStack {
            // Halo: a whisper of brandBright behind the orb.
            Circle()
                .fill(Theme.Palette.brandBright.opacity(dark ? 0.22 : 0.14))
                .frame(width: size * 1.45, height: size * 1.45)
                .blur(radius: size * 0.3)
            Circle()
                .fill(Self.fill)
                .overlay {
                    // Specular highlight on the upper half.
                    Circle().fill(LinearGradient(colors: [.white.opacity(dark ? 0.28 : 0.34), .white.opacity(0)],
                                                 startPoint: .top, endPoint: .center))
                }
                .overlay { Circle().strokeBorder(.white.opacity(dark ? 0.18 : 0.4), lineWidth: 1) }
                .frame(width: size, height: size)
                .shadow(color: Theme.Palette.brand.opacity(dark ? 0.3 : 0.22), radius: size * 0.16, y: size * 0.07)
            Image(systemName: symbol)
                .font(.system(size: size * glyphScale, weight: glyphWeight))
                .foregroundStyle(.white)
                .shadow(color: .black.opacity(0.12), radius: 2, y: 1)
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true)
    }
}

// MARK: - Celebration

/// One-shot sparkle burst around the success badge. Nothing moves under Reduce Motion.
struct OnboardingSparkles: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var animate = false
    @ScaledMetric(relativeTo: .largeTitle) private var radius: CGFloat = 95
    private let colors: [Color] = [Theme.Palette.brandBright, Theme.Palette.brand, Theme.Palette.brandText]

    var body: some View {
        if !reduceMotion {
            ZStack {
                ForEach(0..<12, id: \.self) { i in
                    Image(systemName: i.isMultiple(of: 2) ? "sparkle" : "circle.fill")
                        .font(.system(size: i.isMultiple(of: 2) ? 14 : 6))
                        .foregroundStyle(colors[i % colors.count])
                        .offset(y: animate ? -radius : -radius * 0.42)
                        .rotationEffect(.degrees(Double(i) * 30))
                        .opacity(animate ? 0 : 1)
                }
            }
            .onAppear {
                withAnimation(.easeOut(duration: 1.2).delay(0.15)) { animate = true }
            }
            .allowsHitTesting(false)
            .accessibilityHidden(true)
        }
    }
}

// MARK: - Shared bits

/// Soft icon tile (tinted background, colored symbol) used for checklists and value props.
struct OnboardingIconTile: View {
    var symbol: String
    var color: Color
    var size: CGFloat = 40
    @ScaledMetric private var scale: CGFloat = 1

    var body: some View {
        let s = size * min(scale, 1.5)
        Image(systemName: symbol)
            .font(.system(size: s * 0.45, weight: .semibold))
            .foregroundStyle(color)
            .symbolRenderingMode(.hierarchical)
            .frame(width: s, height: s)
            .background(RoundedRectangle(cornerRadius: s * 0.3, style: .continuous).fill(color.opacity(0.14)))
            .accessibilityHidden(true)
    }
}

/// Step title + one short line. The icon is optional — only status steps (Connect) show one.
struct OnboardingStepHeader: View {
    var symbol: String? = nil
    var color: Color = Theme.Palette.brandText
    var title: String
    var subtitle: String

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Space.xs) {
            if let symbol {
                OnboardingIconTile(symbol: symbol, color: color, size: 48)
                    .symbolEffect(.bounce, options: .nonRepeating)
                    .contentTransition(.symbolEffect(.replace))
                    .padding(.bottom, Theme.Space.xxs)
            }
            Text(title)
                .font(.largeTitle.bold())
                .fixedSize(horizontal: false, vertical: true)
            Text(subtitle)
                .font(.body)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(.isHeader)
    }
}
