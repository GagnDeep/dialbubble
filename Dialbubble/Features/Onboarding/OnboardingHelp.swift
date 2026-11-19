import SwiftUI

/// Context-specific help content for each onboarding step.
enum OnboardingHelpTopic: String, Identifiable {
    case credentials, connecting, numbers, phone, done, noAccount

    var id: String { rawValue }

    struct Item: Hashable {
        let symbol: String
        let color: Color
        let title: String
        let body: String
    }

    struct HelpLink: Hashable {
        let title: String
        let symbol: String
        let url: URL
    }

    var title: String {
        switch self {
        case .credentials: return "Finding Your Credentials"
        case .connecting: return "Connection Problems"
        case .numbers: return "About Phone Numbers"
        case .phone: return "Why Your Phone Number?"
        case .done: return "What Happens Next"
        case .noAccount: return "New to Twilio?"
        }
    }

    var symbol: String {
        switch self {
        case .credentials: return "key.viewfinder"
        case .connecting: return "network"
        case .numbers: return "number.circle.fill"
        case .phone: return "iphone.gen3.radiowaves.left.and.right"
        case .done: return "sparkles"
        case .noAccount: return "person.crop.circle.badge.plus"
        }
    }

    var items: [Item] {
        switch self {
        case .credentials:
            return [
                Item(symbol: "1.circle.fill", color: Theme.Palette.brandText, title: "Open the Twilio Console",
                     body: "Sign in at console.twilio.com. You'll land on your account dashboard."),
                Item(symbol: "2.circle.fill", color: Theme.Palette.brandText, title: "Find “Account Info”",
                     body: "Scroll down on the home page to the Account Info panel. You'll see Account SID and Auth Token."),
                Item(symbol: "3.circle.fill", color: Theme.Palette.brandText, title: "Copy the Account SID",
                     body: "Tap the copy icon next to Account SID. It's 34 characters and starts with AC."),
                Item(symbol: "4.circle.fill", color: Theme.Palette.brandText, title: "Reveal and copy the Auth Token",
                     body: "Tap Show, then copy. It's 32 characters. Come back here and tap Paste on the Smart Paste card — Dialbubble fills the right field automatically."),
                Item(symbol: "key.horizontal.fill", color: Theme.Palette.brandText, title: "Prefer an API Key?",
                     body: "Create one under Account → API keys & tokens. API Keys can be revoked any time without affecting your Auth Token — ideal for a phone you might lose."),
                Item(symbol: "lock.shield.fill", color: Theme.Palette.brandText, title: "Is this safe?",
                     body: "Your secret is stored only in this iPhone's Keychain and is only ever sent to api.twilio.com over an encrypted connection. Dialbubble has no server."),
                Item(symbol: "exclamationmark.triangle.fill", color: .orange, title: "Test credentials won't work",
                     body: "Use your live credentials. Twilio's “test credentials” can't list numbers or place real calls."),
            ]
        case .connecting:
            return [
                Item(symbol: "key.slash.fill", color: .orange, title: "“Couldn't sign in”",
                     body: "The SID or token doesn't match. Tap Fix my keys and copy both again — a single extra space or missing character causes this. If you recently rotated your token, use the new one."),
                Item(symbol: "wifi.slash", color: .gray, title: "Offline or timed out",
                     body: "Check Wi-Fi or cellular data, then tap Try again."),
                Item(symbol: "person.crop.circle.badge.xmark", color: .orange, title: "Suspended or closed account",
                     body: "Sign in to the Twilio Console to check your account status and billing."),
                Item(symbol: "key.horizontal.fill", color: .orange, title: "Using an API Key?",
                     body: "Make sure the key belongs to the same account as the Account SID, and that it's a Standard (not Restricted) key."),
            ]
        case .numbers:
            return [
                Item(symbol: "phone.fill", color: Theme.Palette.brandText, title: "Twilio numbers",
                     body: FeatureFlags.messaging ? "Numbers you've bought in Twilio. They can call and, depending on the number, send SMS and MMS." : "Numbers you've bought in Twilio. They can make and receive calls."),
                Item(symbol: "checkmark.seal.fill", color: Theme.Palette.brandText, title: "Verified caller IDs",
                     body: FeatureFlags.messaging ? "Your own numbers you've verified with Twilio. They can be shown as caller ID on calls, but can't send texts." : "Your own numbers you've verified with Twilio. They can be shown as caller ID on calls."),
                Item(symbol: "togglepower", color: Theme.Palette.brandText, title: "Choose what to use",
                     body: "Turn off numbers you don't want to see in pickers. You can change this any time in Settings → Numbers."),
                Item(symbol: "star.fill", color: Theme.Palette.brandText, title: "Defaults",
                     body: FeatureFlags.messaging ? "Your default numbers are preselected when you call or text. You can still pick a different one each time." : "Your default number is preselected when you call. You can still pick a different one each time."),
                Item(symbol: "lock.trianglebadge.exclamationmark.fill", color: .orange, title: "Trial accounts",
                     body: FeatureFlags.messaging ? "Trial accounts can reach up to five verified numbers for 30 days. Voice Message calls work, but Talk calls and recording need a paid Twilio account, and texts must use Twilio's sample templates. Upgrade any time to remove these limits." : "Trial accounts can reach up to five verified numbers for 30 days. Voice Message calls work, but Talk calls and recording need a paid Twilio account. Upgrade any time to remove these limits."),
            ]
        case .phone:
            return [
                Item(symbol: "phone.connection.fill", color: Theme.Palette.brandText, title: "Two-way calls without VoIP",
                     body: "When you call someone, Dialbubble rings this phone first; press any key to connect. Twilio then dials the other person — no VoIP server needed."),
                Item(symbol: "person.wave.2.fill", color: Theme.Palette.brandText, title: "They see your Twilio number",
                     body: "The person you call sees your Twilio number as caller ID — not your personal number."),
                Item(symbol: "dollarsign.circle.fill", color: .gray, title: "Cost",
                     body: "Twilio bills both legs of the call (to you and to them) at normal per-minute rates."),
                Item(symbol: "forward.fill", color: .gray, title: "Skipping is fine",
                     body: FeatureFlags.messaging ? "Without your number you can still send texts and place voice-message or audio calls. Add it later in Settings." : "Without your number you can still place voice-message or audio calls. Add it later in Settings."),
            ]
        case .done:
            return [
                Item(symbol: "phone.fill", color: Theme.Palette.brandText, title: "Calls tab", body: "Use the keypad to call. Choose Talk for a live conversation, or send a spoken message."),
                FeatureFlags.messaging
                    ? Item(symbol: "message.fill", color: Theme.Palette.brandText, title: "Messages tab", body: "Text from any of your numbers. Replies appear automatically while the app is open.")
                    : nil,
                Item(symbol: "square.grid.2x2.fill", color: Theme.Palette.brandText, title: "Home", body: "See your balance, usage and a setup checklist with anything left to do."),
                Item(symbol: "gearshape.fill", color: .gray, title: "Settings", body: "Manage numbers, add more Twilio accounts, enable Face ID lock, and more."),
            ].compactMap { $0 }
        case .noAccount:
            return [
                Item(symbol: "globe", color: Theme.Palette.brandText, title: "What is Twilio?",
                     body: FeatureFlags.messaging ? "Twilio is the service that provides phone numbers, calling and texting. Dialbubble is an app that controls your Twilio account from your iPhone." : "Twilio is the service that provides phone numbers and calling. Dialbubble is an app that controls your Twilio account from your iPhone."),
                Item(symbol: "1.circle.fill", color: Theme.Palette.brandText, title: "Create a free account",
                     body: "Sign up at twilio.com. It takes about two minutes and includes trial credit — no card needed to start."),
                Item(symbol: "2.circle.fill", color: Theme.Palette.brandText, title: "Get a phone number",
                     body: "In the Console, go to Phone Numbers → Buy a number. Trial accounts can claim one number free."),
                Item(symbol: "3.circle.fill", color: Theme.Palette.brandText, title: "Verify your mobile",
                     body: "Twilio asks you to verify your own phone during sign-up — that number can then be called\(FeatureFlags.messaging ? " and texted" : "") from a trial account."),
                Item(symbol: "4.circle.fill", color: Theme.Palette.brandText, title: "Come back to Dialbubble",
                     body: "Tap “I'm back — let's connect”, then paste your Account SID and Auth Token."),
                Item(symbol: "play.circle.fill", color: Theme.Palette.brandText, title: "Just looking?",
                     body: "Try the Demo to explore every feature with simulated data. Nothing is sent and nothing is charged."),
            ]
        }
    }

    var links: [HelpLink] {
        switch self {
        case .credentials:
            return [HelpLink(title: "Open Twilio Console", symbol: "arrow.up.forward.app.fill", url: URL(string: "https://console.twilio.com")!),
                    HelpLink(title: "Create an API Key", symbol: "key.horizontal.fill", url: URL(string: "https://console.twilio.com/us1/account/keys-credentials/api-keys")!)]
        case .connecting:
            return [HelpLink(title: "Twilio Status", symbol: "waveform.path.ecg", url: URL(string: "https://status.twilio.com")!),
                    HelpLink(title: "Open Twilio Console", symbol: "arrow.up.forward.app.fill", url: URL(string: "https://console.twilio.com")!)]
        case .numbers:
            return [HelpLink(title: "Buy a Number", symbol: "cart.fill", url: URL(string: "https://console.twilio.com/us1/develop/phone-numbers/manage/search")!),
                    HelpLink(title: "Verify a Caller ID", symbol: "checkmark.seal.fill", url: URL(string: "https://console.twilio.com/us1/develop/phone-numbers/manage/verified")!),
                    HelpLink(title: "Upgrade Account", symbol: "arrow.up.circle.fill", url: URL(string: "https://console.twilio.com/us1/billing/manage-billing/upgrade")!)]
        case .phone:
            return [HelpLink(title: "Voice Pricing", symbol: "dollarsign.circle.fill", url: URL(string: "https://www.twilio.com/en-us/voice/pricing")!)]
        case .done:
            return []
        case .noAccount:
            return [HelpLink(title: "Sign Up for Twilio", symbol: "person.crop.circle.badge.plus", url: URL(string: "https://www.twilio.com/try-twilio")!),
                    HelpLink(title: "Open Twilio Console", symbol: "arrow.up.forward.app.fill", url: URL(string: "https://console.twilio.com")!)]
        }
    }
}

struct OnboardingHelpSheet: View {
    var topic: OnboardingHelpTopic
    var onTryDemo: (() -> Void)? = nil
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    HStack(spacing: 14) {
                        OnboardingIconTile(symbol: topic.symbol, color: Theme.Palette.brandText, size: 48)
                        Text(topic.title).font(.title2.bold())
                            .accessibilityAddTraits(.isHeader)
                    }

                    VStack(alignment: .leading, spacing: 18) {
                        ForEach(topic.items, id: \.self) { item in
                            HStack(alignment: .top, spacing: 14) {
                                OnboardingIconTile(symbol: item.symbol, color: item.color, size: 36)
                                VStack(alignment: .leading, spacing: 3) {
                                    Text(item.title).font(.headline)
                                    Text(item.body).font(.subheadline).foregroundStyle(.secondary)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                            }
                            .accessibilityElement(children: .combine)
                        }
                    }
                    .padding(18)
                    .glassEffect(.regular, in: .rect(cornerRadius: Theme.Radius.lg))

                    if !topic.links.isEmpty || onTryDemo != nil {
                        VStack(spacing: 10) {
                            ForEach(topic.links, id: \.self) { link in
                                Link(destination: link.url) {
                                    Label(link.title, systemImage: link.symbol)
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 4)
                                }
                                .buttonStyle(.glass)
                                .controlSize(.large)
                            }
                            if let onTryDemo {
                                Button {
                                    dismiss()
                                    onTryDemo()
                                } label: {
                                    Label("Try the Demo Instead", systemImage: "play.circle.fill")
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 4)
                                }
                                .buttonStyle(.glassProminent)
                                .tint(Theme.Palette.brand)
                                .controlSize(.large)
                            }
                        }
                    }
                }
                .padding(20)
                .frame(maxWidth: 600)
                .frame(maxWidth: .infinity)
            }
            .relayBackground()
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done", systemImage: "checkmark") { dismiss() }
                        .accessibilityIdentifier("onboarding.help.done")
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }
}
