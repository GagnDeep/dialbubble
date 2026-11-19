import SwiftUI

// MARK: - Demo banner

/// Slim one-line callout: the data is simulated, with one clear way forward and a quiet way out.
struct HomeDemoBanner: View {
    @Environment(AppStore.self) private var store
    @State private var showConnect = false
    @State private var confirmExit = false
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    var body: some View {
        Group {
            if dynamicTypeSize.isAccessibilitySize {
                VStack(alignment: .leading, spacing: Theme.Space.sm) {
                    message
                    HStack(spacing: Theme.Space.xs) { connectButton; exitButton }
                }
            } else {
                HStack(spacing: Theme.Space.sm) {
                    message
                    Spacer(minLength: Theme.Space.xxs)
                    connectButton
                    exitButton
                }
            }
        }
        .padding(.leading, Theme.Space.md)
        .padding(.trailing, Theme.Space.xs)
        .padding(.vertical, Theme.Space.xs)
        .frame(maxWidth: .infinity, alignment: .leading)
        .glassEffect(.regular.tint(Theme.Palette.brand.opacity(0.08)), in: .rect(cornerRadius: Theme.Radius.md))
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("home.demoBanner")
        .sheet(isPresented: $showConnect) { AddAccountSheet(replacesDemo: true) }
        .confirmationDialog("Exit Demo Mode?", isPresented: $confirmExit, titleVisibility: .visible) {
            Button("Exit Demo", role: .destructive) { withAnimation(Theme.Motion.smooth) { store.exitDemo() } }
            Button("Keep Exploring", role: .cancel) {}
        } message: {
            Text("The simulated account and its data will be removed. You can start the demo again any time.")
        }
    }

    private var message: some View {
        HStack(spacing: Theme.Space.xs) {
            Image(systemName: "play.circle.fill")
                .font(.body.weight(.semibold))
                .foregroundStyle(Theme.Palette.brandText)
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 0) {
                Text("Demo Mode").font(.subheadline.weight(.semibold))
                Text("Simulated data")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .lineLimit(dynamicTypeSize.isAccessibilitySize ? nil : 1)
                    .minimumScaleFactor(0.9)
            }
        }
        .accessibilityElement(children: .combine)
    }

    private var connectButton: some View {
        Button {
            showConnect = true
        } label: {
            Text("Connect")
                .font(.subheadline.weight(.semibold))
                .lineLimit(1)
        }
        .buttonStyle(.glassProminent)
        .tint(Theme.Palette.brand)
        .accessibilityLabel("Connect Account")
        .accessibilityIdentifier("home.connectAccount")
    }

    private var exitButton: some View {
        Button {
            confirmExit = true
        } label: {
            Image(systemName: "xmark")
                .font(.footnote.weight(.bold))
                .foregroundStyle(.secondary)
                .frame(width: 30, height: 30)
                .contentShape(.circle)
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Exit Demo")
        .accessibilityIdentifier("home.exitDemo")
    }
}

// MARK: - Setup checklist

enum HomeRoute: Hashable, Identifiable {
    case numbers, account(UUID), help
    var id: String {
        switch self {
        case .numbers: return "numbers"
        case .account(let id): return "account-\(id)"
        case .help: return "help"
        }
    }
}

/// Guides new users through the remaining setup steps with a progress ring.
struct HomeSetupChecklistCard: View {
    @Environment(AppStore.self) private var store
    @Binding var route: HomeRoute?
    @State private var showPhoneSheet = false
    @State private var showNumberSheet = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @ScaledMetric(relativeTo: .headline) private var ringSize: CGFloat = 50

    var body: some View {
        let tasks = store.setupTasks
        let required = tasks.filter { !$0.isOptional }
        let optional = tasks.filter(\.isOptional)
        let done = required.filter(\.isDone).count

        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 14) {
                progressRing
                VStack(alignment: .leading, spacing: 2) {
                    Text("Finish Setting Up").font(.headline)
                    Text("\(done) of \(required.count) done")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer()
                Menu {
                    Button {
                        withAnimation(Theme.Motion.adaptive(Theme.Motion.smooth, reduceMotion)) { store.setupChecklistDismissed = true }
                    } label: {
                        Label("Hide Checklist", systemImage: "eye.slash")
                    }
                } label: {
                    Image(systemName: "ellipsis")
                        .font(.subheadline.weight(.bold))
                        .frame(width: 32, height: 32)
                        .contentShape(.circle)
                }
                .buttonStyle(.glass)
                .buttonBorderShape(.circle)
                .accessibilityLabel("Checklist options")
            }

            VStack(spacing: 6) {
                ForEach(required) { taskButton($0) }
            }

            if !optional.isEmpty {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Optional")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                        .textCase(.uppercase)
                        .padding(.horizontal, 4)
                        .accessibilityAddTraits(.isHeader)
                    ForEach(optional) { taskButton($0) }
                }
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .glassEffect(.regular.tint(Theme.Palette.brand.opacity(0.08)), in: .rect(cornerRadius: Theme.Radius.lg))
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("home.setupChecklist")
        .sheet(isPresented: $showPhoneSheet) { HomePersonalPhoneSheet() }
        .sheet(isPresented: $showNumberSheet) { HomeGetNumberSheet(route: $route) }
    }

    private func taskButton(_ task: AppStore.SetupTask) -> some View {
        Button { open(task) } label: { row(task) }
            .buttonStyle(.plain)
            .disabled(task.isDone)
            .accessibilityIdentifier("home.setup.\(task.kind.rawValue)")
    }

    private var progressRing: some View {
        ZStack {
            Circle().stroke(Theme.Palette.brand.opacity(0.18), lineWidth: 6)
            Circle()
                .trim(from: 0, to: store.setupProgress)
                .stroke(Theme.Palette.brand.gradient, style: StrokeStyle(lineWidth: 6, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .animation(Theme.Motion.adaptive(Theme.Motion.smooth, reduceMotion), value: store.setupProgress)
            Text(store.setupProgress, format: .percent.precision(.fractionLength(0)))
                .font(.caption2.bold().monospacedDigit())
                .contentTransition(.numericText(value: store.setupProgress))
        }
        .frame(width: ringSize, height: ringSize)
        .accessibilityElement()
        .accessibilityLabel("Setup progress")
        .accessibilityValue(Text(store.setupProgress, format: .percent.precision(.fractionLength(0))))
    }

    private func row(_ task: AppStore.SetupTask) -> some View {
        HStack(spacing: 12) {
            ZStack {
                if task.isDone {
                    IconTile(symbol: "checkmark", color: Theme.Palette.success, size: 34)
                        .transition(.scale.combined(with: .opacity))
                } else {
                    IconTile(symbol: task.symbol, color: Theme.Palette.brandText, size: 34)
                }
            }
            VStack(alignment: .leading, spacing: 1) {
                HStack(spacing: 6) {
                    Text(task.title)
                        .font(.subheadline.weight(.semibold))
                        .strikethrough(task.isDone, color: .secondary)
                        .foregroundStyle(task.isDone ? .secondary : .primary)
                    if task.isOptional && !task.isDone {
                        Badge(text: "Optional", color: .secondary)
                    }
                }
                if !task.isDone {
                    Text(task.detail).font(.caption).foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            Spacer(minLength: 4)
            if !task.isDone {
                Image(systemName: "chevron.right").font(.caption.weight(.bold)).foregroundStyle(.tertiary)
            }
        }
        .padding(.vertical, 6)
        .padding(.horizontal, 4)
        .contentShape(.rect)
        .animation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion), value: task.isDone)
        .accessibilityElement(children: .combine)
        .accessibilityValue(task.isDone ? "Done" : (task.isOptional ? "Optional, not done" : "Not done"))
        .accessibilityHint(task.isDone ? "" : task.detail)
    }

    private func open(_ task: AppStore.SetupTask) {
        switch task.kind {
        case .numbers: showNumberSheet = true
        case .personalPhone: showPhoneSheet = true
        case .firstMessage: store.openMessage(to: "")
        case .firstCall: store.openDialer()
        case .messagingService:
            if let id = store.activeProfileID { route = .account(id) }
        case .appLock: store.selectedTab = .settings
        }
    }
}

// MARK: - Personal phone sheet

/// Collects the user's own mobile number, used for Talk (bridge) calls.
/// Uses the same country picker and wording as onboarding.
struct HomePersonalPhoneSheet: View {
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @State private var country = OnboardingCountry.current
    @State private var national = ""
    @State private var savedCount = 0
    @FocusState private var focused: Bool
    @ScaledMetric(relativeTo: .largeTitle) private var heroIcon: CGFloat = 40

    private var normalized: String {
        let t = national.trimmingCharacters(in: .whitespaces)
        guard !t.isEmpty else { return "" }
        return PhoneFormat.e164(t, defaultCountryCode: country.dial)
    }
    private var isValid: Bool { !normalized.isEmpty && PhoneFormat.isPlausible(normalized) }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Image(systemName: "iphone.gen3.radiowaves.left.and.right")
                        .font(.system(size: heroIcon))
                        .foregroundStyle(Theme.Palette.brandText)
                        .symbolRenderingMode(.hierarchical)
                        .accessibilityHidden(true)
                    Text("Your Mobile Number").font(.title2.bold())
                        .accessibilityAddTraits(.isHeader)
                    Text("For Talk calls, Twilio rings this phone first, then connects you to the person you're calling — they'll see your Twilio number.")
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)

                    let layout = dynamicTypeSize.isAccessibilitySize
                        ? AnyLayout(VStackLayout(alignment: .leading, spacing: 10))
                        : AnyLayout(HStackLayout(spacing: 10))
                    layout {
                        CountryCodeButton(country: $country, accessibilityID: "home.personalPhone.country")
                        HStack(spacing: 8) {
                            TextField("Mobile number", text: $national)
                                .keyboardType(.phonePad)
                                .textContentType(.telephoneNumber)
                                .font(.body.monospacedDigit())
                                .focused($focused)
                                .accessibilityLabel("Mobile number, without the country code")
                                .accessibilityIdentifier("home.personalPhone.field")
                            ContactPickerButton { p, _ in usePicked(p) }
                                .controlSize(.small)
                        }
                        .padding(.leading, 16)
                        .padding(.trailing, 6)
                        .padding(.vertical, 6)
                        .glassEffect(isValid ? .regular.tint(Theme.Palette.success.opacity(0.08)) : .regular,
                                     in: .rect(cornerRadius: Theme.Radius.md))
                    }

                    Group {
                        if isValid {
                            Label("Twilio will call **\(PhoneFormat.display(normalized))**", systemImage: "checkmark.circle.fill")
                                .foregroundStyle(Theme.Palette.success)
                        } else if !national.isEmpty {
                            Label("Enter your full mobile number, without the country code.", systemImage: "exclamationmark.circle.fill")
                                .foregroundStyle(Theme.Palette.warning)
                        } else {
                            Label("Pick your country, then type your number without the country code.", systemImage: "info.circle")
                                .foregroundStyle(.secondary)
                        }
                    }
                    .font(.footnote)
                    .fixedSize(horizontal: false, vertical: true)
                }
                .padding(24)
            }
            .relayBackground()
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel", systemImage: "xmark") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save", systemImage: "checkmark") { save() }
                        .buttonStyle(.glassProminent)
                        .tint(Theme.Palette.brand)
                        .disabled(!isValid)
                        .accessibilityIdentifier("home.personalPhone.save")
                }
            }
            .onAppear(perform: prefill)
        }
        .presentationDetents([.medium, .large])
        .sensoryFeedback(.success, trigger: savedCount)
    }

    private func prefill() {
        let existing = store.activeProfile?.personalPhone ?? ""
        if let parts = OnboardingCountry.split(existing) {
            country = parts.0
            national = parts.1
        } else if let code = store.activeProfile?.defaultCountryCode, code != OnboardingCountry.current.dial,
                  let match = OnboardingCountry.all.first(where: { $0.dial == code }) {
            country = match
        }
        focused = true
    }

    private func usePicked(_ raw: String) {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.hasPrefix("+") || trimmed.hasPrefix("00"),
           let parts = OnboardingCountry.split(PhoneFormat.e164(trimmed, defaultCountryCode: country.dial)) {
            country = parts.0
            national = parts.1
        } else {
            national = trimmed
        }
    }

    private func save() {
        guard var p = store.activeProfile, isValid else { return }
        p.personalPhone = normalized
        store.updateProfile(p)
        savedCount += 1
        dismiss()
    }
}

// MARK: - Get a number sheet

/// Explains how to get a usable number and links to the right Console pages.
struct HomeGetNumberSheet: View {
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    @Binding var route: HomeRoute?
    @State private var syncing = false
    @ScaledMetric(relativeTo: .largeTitle) private var heroIcon: CGFloat = 44

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Image(systemName: "number.circle.fill")
                        .font(.system(size: heroIcon))
                        .foregroundStyle(Theme.Palette.brandText)
                        .symbolRenderingMode(.hierarchical)
                    Text("Get a Phone Number").font(.title2.bold())
                    Text(FeatureFlags.messaging ? "You need a Twilio number (or a verified caller ID) to call and text. Here's how:" : "You need a Twilio number (or a verified caller ID) to make calls. Here's how:")
                        .foregroundStyle(.secondary)

                    option(symbol: "cart.fill", color: Theme.Palette.brandText, title: "Buy a Twilio number",
                           text: FeatureFlags.messaging ? "Calls and texts. Usually about $1–2 per month." : "For calls. Usually about $1–2 per month.",
                           url: "https://console.twilio.com/us1/develop/phone-numbers/manage/search")
                    option(symbol: "checkmark.shield.fill", color: Theme.Palette.brandText, title: "Verify your existing number",
                           text: "Use your own number as caller ID for calls (free).",
                           url: "https://console.twilio.com/us1/develop/phone-numbers/manage/verified")

                    Label("After buying or verifying, come back and tap Sync.", systemImage: "info.circle.fill")
                        .font(.footnote)
                        .foregroundStyle(.secondary)

                    Button {
                        syncing = true
                        Task {
                            await store.syncNumbers()
                            syncing = false
                            if !store.enabledNumbers.isEmpty { dismiss() }
                        }
                    } label: {
                        HStack {
                            if syncing { ProgressView() } else { Image(systemName: "arrow.triangle.2.circlepath") }
                            Text(syncing ? "Syncing…" : "Sync Numbers").font(.headline)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 4)
                    }
                    .buttonStyle(.glassProminent)
                    .tint(Theme.Palette.brand)
                    .controlSize(.large)
                    .disabled(syncing)

                    Button {
                        dismiss()
                        route = .numbers
                    } label: {
                        Label("Manage Numbers", systemImage: "list.number")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.glass)
                    .controlSize(.large)
                }
                .padding(24)
            }
            .relayBackground()
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close", systemImage: "xmark") { dismiss() }
                }
            }
        }
        .presentationDetents([.large])
    }

    private func option(symbol: String, color: Color, title: String, text: String, url: String) -> some View {
        Link(destination: URL(string: url)!) {
            HStack(spacing: 14) {
                IconTile(symbol: symbol, color: color, size: 40)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(.headline).foregroundStyle(.primary)
                    Text(text).font(.subheadline).foregroundStyle(.secondary)
                }
                Spacer()
                Image(systemName: "arrow.up.right").font(.caption.weight(.bold)).foregroundStyle(.tertiary)
            }
            .padding(14)
            .contentShape(.rect(cornerRadius: Theme.Radius.md))
        }
        .buttonStyle(.plain)
        .glassEffect(.regular.interactive(), in: .rect(cornerRadius: Theme.Radius.md))
        .accessibilityHint("Opens the Twilio Console")
    }
}
