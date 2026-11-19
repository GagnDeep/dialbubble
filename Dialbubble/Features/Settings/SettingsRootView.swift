import SwiftUI
import LocalAuthentication

struct SettingsRootView: View {
    @Environment(AppStore.self) private var store
    @AppStorage("relay.appearance") private var appearance: AppearanceMode = .system
    @AppStorage("relay.appLock") private var appLockEnabled = false
    @AppStorage(AppStore.confirmBeforeConnectKey) private var confirmToConnect = true
    @AppStorage(Sounds.key) private var keypadTones = true
    @AppStorage(Alerts.badgeKey) private var badgeIcon = false
    @AppStorage(Alerts.backgroundKey) private var backgroundAlerts = false
    @Environment(ToastCenter.self) private var toast
    @State private var confirmClearHistory = false
    @State private var historySize = HistoryCache.size
    @State private var showAddAccount = false
    @State private var showConnectReal = false
    @State private var lockError: String?
    @State private var confirmExitDemo = false
    @State private var showSetupChecklist = false
    @State private var setupRoute: HomeRoute?

    private let biometry = Biometry.current

    var body: some View {
        NavigationStack {
            List {
                if store.isDemo && !LaunchOptions.marketing { demoSection }
                accountsSection
                numbersSection
                toolsSection
                helpSection
                appearanceSection
                privacySection
                notificationsSection
                dataSection
                securitySection
                aboutSection
            }
            .relayBackground()
            .navigationTitle("Settings")
            .sheet(isPresented: $showAddAccount) { AddAccountSheet() }
            .sheet(isPresented: $showConnectReal) { AddAccountSheet(replacesDemo: true) }
            .sheet(isPresented: $showSetupChecklist) { setupChecklistSheet }
            .alert("App Lock", isPresented: Binding(get: { lockError != nil }, set: { if !$0 { lockError = nil } })) {
                Button("OK") { lockError = nil }
            } message: {
                Text(lockError ?? "")
            }
            .confirmationDialog("Clear saved history?", isPresented: $confirmClearHistory, titleVisibility: .visible) {
                Button("Clear Saved History", role: .destructive) {
                    HistoryCache.clearAll()
                    historySize = HistoryCache.size
                    toast.show("Saved history cleared", style: .success)
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("Removes the copy kept on this iPhone for instant launch and offline use. Nothing is deleted from Twilio.")
            }
            .confirmationDialog("Exit Demo Mode?", isPresented: $confirmExitDemo, titleVisibility: .visible) {
                Button("Exit Demo", role: .destructive) { store.exitDemo() }
                Button("Keep Exploring", role: .cancel) {}
            } message: {
                Text("The simulated account and its data will be removed.")
            }
        }
    }

    // MARK: Demo

    private var demoSection: some View {
        Section {
            Button {
                showConnectReal = true
            } label: {
                SettingsRowLabel("Connect Real Account", symbol: "link.badge.plus", color: Theme.Palette.brandText,
                                 subtitle: "Use your own Twilio credentials")
            }
            .accessibilityIdentifier("settings.connectReal")
            Button {
                confirmExitDemo = true
            } label: {
                SettingsRowLabel("Exit Demo", symbol: "rectangle.portrait.and.arrow.right", color: .gray)
            }
            .accessibilityIdentifier("settings.exitDemo")
        } header: {
            Text("Demo Mode")
        } footer: {
            Text("Simulated data. Nothing is sent through Twilio or billed.")
        }
        .relayListRow()
    }

    // MARK: Accounts

    private var accountsSection: some View {
        Section {
            ForEach(store.profiles) { p in
                NavigationLink {
                    AccountEditView(profileID: p.id)
                } label: {
                    accountRow(p)
                }
                .swipeActions(edge: .leading) {
                    if p.id != store.activeProfileID {
                        Button {
                            Task { await store.activate(p) }
                        } label: {
                            Label("Switch", systemImage: "arrow.left.arrow.right")
                        }
                        .tint(p.tint.color)
                    }
                }
            }
            .onMove { store.moveProfiles(from: $0, to: $1) }

            Button {
                showAddAccount = true
            } label: {
                SettingsRowLabel("Add Twilio Account", symbol: "plus", color: Theme.Palette.brandText)
            }
            .accessibilityIdentifier("settings.addAccount")
        } header: {
            Text("Accounts")
        } footer: {
            Text("Swipe right to switch accounts. Secrets stay in this device's Keychain.")
        }
        .relayListRow()
    }

    private func accountRow(_ p: AccountProfile) -> some View {
        HStack(spacing: Theme.Space.sm) {
            AvatarView(title: p.name, tint: p.tint.color, size: 38)
            VStack(alignment: .leading, spacing: 2) {
                ViewThatFits(in: .horizontal) {
                    HStack(spacing: 6) {
                        Text(p.name).font(.headline)
                        accountBadge(p)
                    }
                    VStack(alignment: .leading, spacing: 2) {
                        Text(p.name).font(.headline)
                        accountBadge(p)
                    }
                }
                Text("\(p.enabledNumbers.count) number\(p.enabledNumbers.count == 1 ? "" : "s") · …\(String(p.accountSid.suffix(4)))")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer(minLength: 0)
            if p.id == store.activeProfileID {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(Theme.Palette.brandText)
                    .accessibilityHidden(true)
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityValue(p.id == store.activeProfileID ? "Active account" : "")
    }

    @ViewBuilder
    private func accountBadge(_ p: AccountProfile) -> some View {
        if p.accountSid == DemoBackend.accountSid {
            if !LaunchOptions.marketing { Badge(text: "Demo", color: Theme.Palette.brandText) }
        } else if p.isTrial {
            Badge(text: "Trial", color: Theme.Palette.warning)
        }
    }

    // MARK: Numbers

    private var numbersSection: some View {
        Section {
            NavigationLink {
                NumbersView()
            } label: {
                SettingsRowLabel("Phone Numbers", symbol: "number", color: Theme.Palette.brandText,
                                 detail: "\(store.enabledNumbers.count) enabled")
            }
            .accessibilityIdentifier("settings.numbers")
            if let p = store.activeProfile {
                NavigationLink {
                    AccountEditView(profileID: p.id)
                } label: {
                    SettingsRowLabel("My Phone", symbol: "iphone.gen3", color: Theme.Palette.brandText,
                                     subtitle: "Used for Talk calls",
                                     detail: p.personalPhone.isEmpty ? "Not set" : PhoneFormat.display(p.personalPhone))
                }
                if FeatureFlags.messaging {
                    NavigationLink {
                        AccountEditView(profileID: p.id)
                    } label: {
                        SettingsRowLabel("Scheduling", symbol: "calendar.badge.clock", color: Theme.Palette.brandText,
                                         subtitle: "Messaging Service",
                                         detail: p.messagingServiceSid == nil ? "Off" : "On")
                    }
                }
            }
            Toggle(isOn: $confirmToConnect) {
                SettingsRowLabel("Press a key to connect", symbol: "hand.tap", color: Theme.Palette.brandText)
            }
            .accessibilityIdentifier("settings.confirmToConnect")
            Toggle(isOn: $keypadTones) {
                SettingsRowLabel("Sounds", symbol: "speaker.wave.2", color: Theme.Palette.brandText,
                                 subtitle: "Keypad tones, sent and new-text sounds")
            }
            .accessibilityIdentifier("settings.sounds")
        } header: {
            Text("Numbers & Calling")
        } footer: {
            Text("Two-way calls ring your phone first. The other person is dialed only after you press a key — so voicemail or call screening never leaves them waiting.")
        }
        .relayListRow()
    }

    // MARK: Tools

    private var toolsSection: some View {
        Section {
            NavigationLink {
                LookupView()
            } label: {
                SettingsRowLabel("Number Lookup", symbol: "person.text.rectangle", color: Theme.Palette.brandText)
            }
            if FeatureFlags.messaging {
                NavigationLink {
                    TemplatesView()
                } label: {
                    SettingsRowLabel("Message Templates", symbol: "text.badge.star", color: Theme.Palette.brandText,
                                     detail: "\(store.templates.count)")
                }
                Button {
                    store.markAllRead()
                } label: {
                    SettingsRowLabel("Mark All Conversations Read", symbol: "envelope.open", color: .gray,
                                     detail: store.unreadCount > 0 ? "\(store.unreadCount) unread" : nil)
                }
                .disabled(store.unreadCount == 0)
            }
        } header: {
            Text("Tools")
        }
        .relayListRow()
    }

    // MARK: Help

    private var helpSection: some View {
        Section {
            NavigationLink {
                HelpCenterView()
            } label: {
                SettingsRowLabel("Help & Guides", symbol: "questionmark.circle", color: Theme.Palette.brandText,
                                 subtitle: FeatureFlags.messaging ? "Setup, calling, messaging, errors" : "Setup, calling, errors")
            }
            .accessibilityIdentifier("settings.help")
            Button {
                store.setupChecklistDismissed = false
                showSetupChecklist = true
            } label: {
                SettingsRowLabel("Setup Checklist", symbol: "checklist", color: Theme.Palette.brandText,
                                 subtitle: "Including optional extras",
                                 detail: store.setupProgress.formatted(.percent.precision(.fractionLength(0))))
            }
            .accessibilityIdentifier("settings.setupChecklist")
            ReplayTipsButton(accessibilityID: "settings.replayTips")
        } header: {
            Text("Help")
        } footer: {
            Text("The checklist shows on Home until the essentials are done.")
        }
        .relayListRow()
    }

    // MARK: Appearance

    private var appearanceSection: some View {
        Section {
            Picker(selection: $appearance) {
                ForEach(AppearanceMode.allCases) { mode in
                    Label(mode.title, systemImage: mode.symbol).tag(mode)
                }
            } label: {
                SettingsRowLabel("Theme", symbol: appearance.symbol, color: .gray)
            }
            .pickerStyle(.menu)
            .sensoryFeedback(.selection, trigger: appearance)
        } header: {
            Text("Appearance")
        } footer: {
            Text("System follows your iPhone's Light or Dark setting.")
        }
        .relayListRow()
    }

    // MARK: Contacts

    private var contacts: ContactBook { ContactBook.shared }

    private var privacySection: some View {
        Section {
            switch contacts.access {
            case .granted:
                SettingsRowLabel("Contact Names", symbol: "person.crop.circle.badge.checkmark", color: Theme.Palette.brandText, detail: "On")
            case .notDetermined:
                Button {
                    Task { await contacts.requestAccess() }
                } label: {
                    SettingsRowLabel("Show Contact Names", symbol: "person.crop.circle", color: Theme.Palette.brandText,
                                     subtitle: "Names instead of numbers in calls and messages")
                }
                .accessibilityIdentifier("settings.contacts")
            case .denied:
                Button {
                    if let url = URL(string: UIApplication.openSettingsURLString) { UIApplication.shared.open(url) }
                } label: {
                    SettingsRowLabel("Contact Names", symbol: "person.crop.circle.badge.xmark", color: .gray,
                                     subtitle: "Off. Allow access in iOS Settings", detail: "Open")
                }
                .accessibilityIdentifier("settings.contacts")
            }
        } header: {
            Text("Contacts")
        } footer: {
            Text("Dialbubble reads names on this iPhone only. Contacts are never uploaded, not even to Twilio.")
        }
        .relayListRow()
    }

    // MARK: Notifications

    private var notificationsSection: some View {
        Section {
            Toggle(isOn: Binding(get: { badgeIcon }, set: { on in setAlert(on, alerts: false) })) {
                SettingsRowLabel("App Icon Badge", symbol: "app.badge", color: Theme.Palette.brandText,
                                 subtitle: "Unread texts and missed calls")
            }
            .accessibilityIdentifier("settings.badge")
            Toggle(isOn: Binding(get: { backgroundAlerts }, set: { on in setAlert(on, alerts: true) })) {
                SettingsRowLabel("Alerts While Closed", symbol: "bell.badge", color: Theme.Palette.brandText,
                                 subtitle: "New texts and missed calls")
            }
            .accessibilityIdentifier("settings.backgroundAlerts")
        } header: {
            Text("Notifications")
        } footer: {
            Text("Dialbubble has no server, so there are no instant pushes. While closed, iOS lets it check Twilio every so often (usually within an hour) — off in Low Power Mode or when Background App Refresh is off. While open, new texts appear right away.")
        }
        .relayListRow()
    }

    private func setAlert(_ on: Bool, alerts: Bool) {
        guard on else {
            if alerts { backgroundAlerts = false; Alerts.schedule() } else { badgeIcon = false; Alerts.updateBadge(store) }
            return
        }
        Task {
            if await Alerts.requestPermission(alerts: alerts) {
                if alerts { backgroundAlerts = true; badgeIcon = true; Alerts.schedule() } else { badgeIcon = true }
                Alerts.updateBadge(store)
            } else {
                toast.show("Notifications are off for Dialbubble in iOS Settings", style: .warning)
            }
        }
    }

    // MARK: Your data

    private var dataSection: some View {
        Section {
            let export = HistoryExport(store: store)
            ShareLink(item: export, preview: SharePreview("Call and text history", image: Image(systemName: "tablecells"))) {
                SettingsRowLabel("Export History", symbol: "square.and.arrow.up", color: Theme.Palette.brandText,
                                 subtitle: "Calls and texts as a spreadsheet (CSV)")
            }
            .disabled(export.isEmpty)
            .accessibilityIdentifier("settings.export")
            Button {
                confirmClearHistory = true
            } label: {
                SettingsRowLabel("Clear Saved History", symbol: "internaldrive", color: .gray,
                                 detail: historySize > 0 ? historySize.formatted(.byteCount(style: .file)) : "Empty")
            }
            .disabled(historySize == 0)
            .accessibilityIdentifier("settings.clearHistory")
        } header: {
            Text("Your Data")
        } footer: {
            Text("Dialbubble keeps your latest calls and texts on this iPhone so it opens instantly and works offline. It's never uploaded anywhere.")
        }
        .relayListRow()
        .onAppear { historySize = HistoryCache.size }
    }

    // MARK: Security

    private var securitySection: some View {
        Section {
            Toggle(isOn: Binding(get: { appLockEnabled }, set: setAppLock)) {
                SettingsRowLabel(biometry == .none ? "App Lock" : "\(biometry.name) Lock", symbol: biometry.symbol, color: Theme.Palette.brandText)
            }
            .accessibilityIdentifier("settings.appLock")
        } header: {
            Text("Security")
        } footer: {
            Text("Requires \(biometry == .none ? "your passcode" : "\(biometry.name) or your passcode") when opening Dialbubble, and hides its content in the app switcher.")
        }
        .relayListRow()
    }

    private func setAppLock(_ on: Bool) {
        guard on else { appLockEnabled = false; return }
        let ctx = LAContext()
        var err: NSError?
        guard ctx.canEvaluatePolicy(.deviceOwnerAuthentication, error: &err) else {
            lockError = "Set up a passcode in the iOS Settings app first, then turn on App Lock."
            return
        }
        Task {
            do {
                if try await ctx.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: "Turn on App Lock for Dialbubble") {
                    appLockEnabled = true
                }
            } catch let e as LAError where e.code == .userCancel || e.code == .appCancel || e.code == .systemCancel {
                // User cancelled; leave the toggle off.
            } catch {
                lockError = error.localizedDescription
            }
        }
    }

    // MARK: About

    private var aboutSection: some View {
        Section {
            NavigationLink {
                HowItWorksView()
            } label: {
                SettingsRowLabel("How Dialbubble Works", symbol: "server.rack", color: Theme.Palette.brandText)
            }
            Link(destination: URL(string: "https://console.twilio.com")!) {
                SettingsRowLabel("Twilio Console", symbol: "arrow.up.right.square", color: .gray)
            }
            Link(destination: URL(string: "https://www.twilio.com/en-us/pricing")!) {
                SettingsRowLabel("Twilio Pricing", symbol: "dollarsign.circle", color: .gray)
            }
            Link(destination: URL(string: "https://console.twilio.com/us1/develop/phone-numbers/manage/verified")!) {
                SettingsRowLabel("Verify Caller IDs", symbol: "checkmark.shield", color: .gray)
            }
            SettingsRowLabel("Version", symbol: "info.circle", color: .gray, detail: appVersion)
        } header: {
            Text("About")
        } footer: {
            Text("Dialbubble is an independent app that uses your own Twilio account.")
        }
        .relayListRow()
    }

    private var appVersion: String {
        let v = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
        let b = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1"
        return "\(v) (\(b))"
    }

    /// The full checklist (required and optional steps), reachable even after Home hides it.
    private var setupChecklistSheet: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Space.md) {
                    HomeSetupChecklistCard(route: $setupRoute)
                    Callout(style: .tip, title: "Optional steps live here",
                            message: FeatureFlags.messaging
                                ? "Add your phone for Talk calls, enable scheduling, or lock Dialbubble with \(biometry.name) whenever you're ready."
                                : "Add your phone for Talk calls or lock Dialbubble with \(biometry.name) whenever you're ready.")
                }
                .padding()
                .frame(maxWidth: 700)
                .frame(maxWidth: .infinity)
            }
            .relayBackground()
            .navigationTitle("Setup Checklist")
            .navigationBarTitleDisplayMode(.inline)
            .navigationDestination(item: $setupRoute) { route in
                switch route {
                case .numbers: NumbersView()
                case .account(let id): AccountEditView(profileID: id)
                case .help: HelpCenterView()
                }
            }
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done", systemImage: "checkmark") { showSetupChecklist = false }
                        .buttonStyle(.glass)
                }
            }
        }
    }
}

// MARK: - How it works

private struct HowItWorksView: View {
    @Environment(AppStore.self) private var store

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                item("iphone", Theme.Palette.brandText, "Direct to Twilio",
                     "Dialbubble calls the Twilio REST API straight from your device using HTTP Basic auth. No backend, no middleman.")
                item("phone.connection.fill", Theme.Palette.brandText, "Talk calls (bridge)",
                     "Twilio first rings your own phone. When you answer, it dials the destination with your Twilio number as caller ID — real two-way conversations without a VoIP server.")
                item("text.bubble.fill", Theme.Palette.brandText, "Inline TwiML",
                     "Voice messages, audio playback and custom TwiML are sent inline with each call, so there are no webhooks to host.")
                if FeatureFlags.messaging {
                    item("arrow.triangle.2.circlepath", Theme.Palette.brandText, "Inbox refresh",
                         "Without a server there's no push for incoming texts, so Dialbubble refreshes every 20 seconds while open and on pull-to-refresh.")
                    item("photo.fill", Theme.Palette.brandText, "MMS media",
                         "Twilio fetches MMS attachments from a public URL. Paste a link to an image hosted anywhere public.")
                    item("calendar.badge.clock", Theme.Palette.brandText, "Scheduled messages",
                         "Twilio requires a Messaging Service to schedule texts. Add its SID in your account settings.")
                }
                item("key.fill", Theme.Palette.brandText, "Security",
                     "Secrets live in the iOS Keychain (this device only). For least privilege, use an API Key instead of your Auth Token.")
            }
            .padding()
            .frame(maxWidth: 700)
            .frame(maxWidth: .infinity)
        }
        .relayBackground()
        .navigationTitle("How It Works")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func item(_ symbol: String, _ color: Color, _ title: String, _ text: String) -> some View {
        GlassCard {
            HStack(alignment: .top, spacing: 14) {
                IconTile(symbol: symbol, color: color, size: 36)
                VStack(alignment: .leading, spacing: 4) {
                    Text(title).font(.headline)
                    Text(text).font(.subheadline).foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
        .accessibilityElement(children: .combine)
    }
}

// MARK: - Add account

struct AddAccountSheet: View {
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    /// When true (opened from Demo Mode), the demo account is removed after a successful connection.
    var replacesDemo = false
    @Environment(ToastCenter.self) private var toast
    @State private var draft = CredentialsDraft()
    @State private var isWorking = false
    @State private var error: FriendlyError?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    HStack(spacing: 14) {
                        SettingsIcon(symbol: "link.badge.plus", color: Theme.Palette.brandText, size: 48)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(replacesDemo ? "Connect Your Twilio Account" : "Add a Twilio Account").font(.title3.bold())
                            Text("Copy the Account SID and Auth Token from the Twilio Console home page.")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                    }
                    CredentialsFields(draft: $draft, showsName: true)
                    if let error {
                        FriendlyErrorView(error: error, retry: draft.isComplete ? add : nil, onDismiss: { self.error = nil })
                            .transition(.opacity.combined(with: .scale(scale: 0.97)))
                    }
                    Label("Dialbubble checks your credentials with Twilio, then imports your numbers.", systemImage: "checkmark.shield.fill")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
                .padding()
                .animation(.snappy, value: error)
            }
            .relayBackground()
            .navigationTitle(replacesDemo ? "Connect Account" : "Add Account")
            .navigationBarTitleDisplayMode(.inline)
            .interactiveDismissDisabled(isWorking)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel", systemImage: "xmark") { dismiss() }
                        .disabled(isWorking)
                }
                ToolbarItem(placement: .confirmationAction) {
                    if isWorking {
                        ProgressView()
                    } else {
                        Button("Connect", systemImage: "checkmark") { add() }
                            .buttonStyle(.glassProminent)
                            .disabled(!draft.isComplete)
                            .accessibilityIdentifier("addAccount.connect")
                    }
                }
            }
        }
        .presentationDetents([.large])
        .sensoryFeedback(.error, trigger: error) { _, new in new != nil }
    }

    private func add() {
        isWorking = true
        error = nil
        Task {
            defer { isWorking = false }
            do {
                let profile = try await store.addProfile(name: draft.name, credentials: draft.credentials)
                if replacesDemo { store.exitDemo() }
                toast.show("Connected \(profile.name)", style: .success)
                dismiss()
            } catch {
                self.error = FriendlyError(error)
            }
        }
    }
}

// MARK: - Edit account

struct AccountEditView: View {
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    let profileID: UUID

    @Environment(ToastCenter.self) private var toast
    @State private var profile: AccountProfile?
    @State private var newSecret = ""
    @State private var showDelete = false
    @State private var saveTask: Task<Void, Never>?
    @ScaledMetric private var countryFieldWidth: CGFloat = 60

    var body: some View {
        Form {
            if let binding = Binding($profile) {
                content(binding)
            }
        }
        .relayBackground()
        .navigationTitle(profile?.name ?? "Account")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { if profile == nil { profile = store.profiles.first { $0.id == profileID } } }
        .onChange(of: profile) { old, new in
            // Ignore the initial load; debounce edits so typing doesn't save on every keystroke.
            guard old != nil, let new, new != old else { return }
            saveTask?.cancel()
            saveTask = Task {
                try? await Task.sleep(for: .milliseconds(700))
                guard !Task.isCancelled else { return }
                store.updateProfile(new)
                toast.show("Saved", style: .success)
            }
        }
        .onDisappear(perform: flushPendingSave)
        .confirmationDialog("Remove this account from Dialbubble?", isPresented: $showDelete, titleVisibility: .visible) {
            Button("Remove Account", role: .destructive) {
                if let profile { store.deleteProfile(profile) }
                dismiss()
            }
        } message: {
            Text("Credentials are deleted from this device. Nothing changes in your Twilio account.")
        }
    }

    /// Saves immediately if the person leaves before the debounce fires.
    private func flushPendingSave() {
        guard let task = saveTask, !task.isCancelled else { return }
        task.cancel()
        saveTask = nil
        if let profile, store.profiles.first(where: { $0.id == profile.id }) != profile {
            store.updateProfile(profile)
        }
    }

    @ViewBuilder
    private func content(_ p: Binding<AccountProfile>) -> some View {
        Section {
            LabeledContent {
                TextField("Name", text: p.name).multilineTextAlignment(.trailing)
            } label: {
                SettingsRowLabel("Name", symbol: "tag", color: .gray)
            }
            Picker(selection: p.tint) {
                ForEach(AppTint.allCases) { t in
                    Label(t.name, systemImage: "circle.fill").tint(t.color).foregroundStyle(t.color).tag(t)
                }
            } label: {
                SettingsRowLabel("Color", symbol: "paintpalette.fill", color: p.wrappedValue.tint.color)
            }
            if p.wrappedValue.id != store.activeProfileID {
                Button {
                    if let profile { Task { await store.activate(profile) } }
                } label: {
                    SettingsRowLabel("Make Active Account", symbol: "checkmark.circle", color: Theme.Palette.brandText)
                }
            }
        } header: {
            Text("Profile")
        }
        .relayListRow()

        Section {
            LabeledContent("Account SID") {
                Text(p.wrappedValue.accountSid).font(.caption.monospaced()).textSelection(.enabled)
            }
            TextField("API Key SID (optional, SK…)", text: Binding(
                get: { p.wrappedValue.apiKeySid ?? "" },
                set: { p.wrappedValue.apiKeySid = $0.nilIfBlank }
            ))
            .font(.body.monospaced())
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
            HStack {
                SecureField(p.wrappedValue.apiKeySid == nil ? "New Auth Token" : "New API Key Secret", text: $newSecret)
                Button("Update") {
                    if let profile, let s = newSecret.nilIfBlank {
                        store.updateSecret(s, for: profile)
                        newSecret = ""
                        toast.show(profile.apiKeySid == nil ? "Auth Token updated" : "API Key Secret updated", style: .success)
                        if profile.id == store.activeProfileID { Task { await store.refreshAll() } }
                    }
                }
                .buttonStyle(.glass)
                .disabled(newSecret.nilIfBlank == nil)
            }
        } header: {
            Text("Credentials")
        } footer: {
            Text("Leave API Key SID empty to authenticate with your Auth Token. Paste a new secret only if you rotated it in the Console.")
        }
        .relayListRow()

        Section {
            HStack {
                TextField("My mobile number", text: p.personalPhone)
                    .keyboardType(.phonePad)
                    .textContentType(.telephoneNumber)
                ContactPickerButton { phone, _ in p.wrappedValue.personalPhone = PhoneFormat.e164(phone, defaultCountryCode: p.wrappedValue.defaultCountryCode) }
                    .controlSize(.small)
            }
            HStack {
                Text("Default country code")
                Spacer()
                Text("+")
                TextField("1", text: p.defaultCountryCode)
                    .keyboardType(.numberPad)
                    .frame(width: countryFieldWidth)
                    .multilineTextAlignment(.trailing)
            }
        } header: {
            Text("Calling")
        } footer: {
            Text("For Talk calls, Twilio rings this number first, then connects you. Numbers typed without “+” use the default country code.")
        }
        .relayListRow()

        Section {
            Picker("Call from", selection: p.defaultCallerNumber) {
                Text("None").tag(String?.none)
                ForEach(p.wrappedValue.callerNumbers) { n in
                    Text("\(n.displayName) · \(PhoneFormat.short(n.phoneNumber))").tag(Optional(n.phoneNumber))
                }
            }
            if FeatureFlags.messaging {
                Picker("Text from", selection: p.defaultSMSNumber) {
                    Text("None").tag(String?.none)
                    ForEach(p.wrappedValue.smsNumbers) { n in
                        Text("\(n.displayName) · \(PhoneFormat.short(n.phoneNumber))").tag(Optional(n.phoneNumber))
                    }
                }
            }
        } header: {
            Text("Defaults")
        } footer: {
            Text(FeatureFlags.messaging ? "These numbers are pre-selected when you start a new call or message." : "This number is pre-selected when you start a new call.")
        }
        .relayListRow()

        // FeatureFlags.messaging: scheduling (Messaging Service) is a texting feature.
        if FeatureFlags.messaging {
        Section {
            if p.wrappedValue.id == store.activeProfileID, !store.messagingServices.isEmpty {
                Picker("Messaging Service", selection: p.messagingServiceSid) {
                    Text("None").tag(String?.none)
                    ForEach(store.messagingServices) { s in
                        Text(s.friendlyName ?? s.sid).tag(Optional(s.sid))
                    }
                }
            }
            TextField("Messaging Service SID (MG…)", text: Binding(
                get: { p.wrappedValue.messagingServiceSid ?? "" },
                set: { p.wrappedValue.messagingServiceSid = $0.nilIfBlank }
            ))
            .font(.body.monospaced())
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
        } header: {
            Text("Scheduling")
        } footer: {
            Text("Twilio requires a Messaging Service to schedule messages 15 minutes to 35 days ahead.")
        }
        .relayListRow()
        }

        Section {
            Button(role: .destructive) { showDelete = true } label: {
                Label("Remove Account", systemImage: "trash")
                    .foregroundStyle(Theme.Palette.danger)
            }
        }
        .relayListRow()
    }
}
