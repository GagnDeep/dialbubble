import SwiftUI

/// A self-contained help article with numbered steps, tips and deep links into the Twilio Console.
struct HelpGuide: Identifiable, Hashable {
    enum Category: String, CaseIterable, Identifiable {
        case gettingStarted = "Getting Started"
        case calling = "Calling"
        case messaging = "Messaging"
        case account = "Account & Billing"
        case troubleshooting = "Troubleshooting & Privacy"
        var id: String { rawValue }
        var symbol: String {
            switch self {
            case .gettingStarted: return "flag.checkered"
            case .calling: return "phone.fill"
            case .messaging: return "message.fill"
            case .account: return "creditcard.fill"
            case .troubleshooting: return "wrench.and.screwdriver.fill"
            }
        }
    }

    struct Step: Hashable {
        let symbol: String
        let text: String
    }

    struct Link: Hashable {
        let title: String
        let symbol: String
        let url: URL
    }

    struct ErrorRow: Hashable, Identifiable {
        let code: Int
        let title: String
        let fix: String
        var id: Int { code }
        var docsURL: URL { URL(string: "https://www.twilio.com/docs/errors/\(code)")! }
    }

    let id: String
    let title: String
    let summary: String
    let symbol: String
    let color: Color
    let category: Category
    var intro: String = ""
    var steps: [Step] = []
    var tips: [String] = []
    var links: [Link] = []
    var errors: [ErrorRow] = []
    var keywords: String = ""

    func matches(_ query: String) -> Bool {
        let q = query.trimmingCharacters(in: .whitespaces).lowercased()
        guard !q.isEmpty else { return true }
        let haystack = [title, summary, intro, keywords, steps.map(\.text).joined(separator: " "),
                        errors.map { "\($0.code) \($0.title)" }.joined(separator: " ")]
            .joined(separator: " ").lowercased()
        return q.split(separator: " ").allSatisfy { haystack.contains($0) }
    }

    static func == (lhs: HelpGuide, rhs: HelpGuide) -> Bool { lhs.id == rhs.id }
    func hash(into hasher: inout Hasher) { hasher.combine(id) }
}

private func url(_ s: String) -> URL { URL(string: s)! }

private enum Console {
    static let home = url("https://console.twilio.com")
    static let apiKeys = url("https://console.twilio.com/us1/account/keys-credentials/api-keys")
    static let buyNumber = url("https://console.twilio.com/us1/develop/phone-numbers/manage/search")
    static let activeNumbers = url("https://console.twilio.com/us1/develop/phone-numbers/manage/incoming")
    static let verified = url("https://console.twilio.com/us1/develop/phone-numbers/manage/verified")
    static let billing = url("https://console.twilio.com/us1/billing/manage-billing/billing-overview")
    static let messagingServices = url("https://console.twilio.com/us1/develop/sms/services")
    static let a2p = url("https://console.twilio.com/us1/develop/sms/regulatory-compliance/a2p-10dlc-overview")
    static let voiceGeo = url("https://console.twilio.com/us1/develop/voice/settings/geo-permissions")
    static let smsGeo = url("https://console.twilio.com/us1/develop/sms/settings/geo-permissions")
    static let pricing = url("https://www.twilio.com/en-us/pricing")
    static let support = url("https://help.twilio.com")
    static let status = url("https://status.twilio.com")
}

extension HelpGuide {
    /// Guides shown in the app. FeatureFlags.messaging: texting guides are hidden while messaging is disabled.
    static var visible: [HelpGuide] {
        FeatureFlags.messaging ? all : all.filter { $0.category != .messaging && $0.id != "no-push" }
    }

    static let all: [HelpGuide] = [
        HelpGuide(
            id: "getting-started", title: "Set Up Dialbubble",
            summary: "Connect your Twilio account and make your first call in minutes.",
            symbol: "sparkles", color: Theme.Palette.brandText, category: .gettingStarted,
            intro: "Dialbubble talks to Twilio directly from your iPhone. You need a Twilio account, its credentials, and at least one phone number.",
            steps: [
                Step(symbol: "person.crop.circle.badge.plus", text: "Create a free Twilio account at twilio.com (or sign in to an existing one)."),
                Step(symbol: "key.fill", text: "Copy your Account SID and Auth Token from the Console home page."),
                Step(symbol: "link", text: "Paste them into Dialbubble. It verifies them and imports your numbers automatically."),
                Step(symbol: "iphone.gen3", text: "Add your own mobile number so Dialbubble can connect two-way Talk calls."),
                Step(symbol: "phone.fill", text: "Open the Calls tab, enter a number and tap the green button."),
            ],
            tips: ["Not ready yet? Explore Demo Mode first — everything works with simulated data."],
            links: [Link(title: "Open Twilio Console", symbol: "arrow.up.right.square", url: Console.home),
                    Link(title: "Sign up for Twilio", symbol: "person.badge.plus", url: url("https://www.twilio.com/try-twilio"))],
            keywords: "setup start begin onboarding first"
        ),
        HelpGuide(
            id: "credentials", title: "Find Your Account SID & Auth Token",
            summary: "Where your credentials live in the Twilio Console.",
            symbol: "key.fill", color: Theme.Palette.brandText, category: .gettingStarted,
            intro: "Your Account SID identifies your account. The Auth Token is like its password.",
            steps: [
                Step(symbol: "safari", text: "Open console.twilio.com and sign in."),
                Step(symbol: "rectangle.and.text.magnifyingglass", text: "On the Console home page, scroll to “Account Info”."),
                Step(symbol: "doc.on.doc", text: "Copy the Account SID — it starts with “AC” and is 34 characters long."),
                Step(symbol: "eye", text: "Click “Show” next to Auth Token, then copy it (32 characters)."),
                Step(symbol: "doc.on.clipboard", text: "In Dialbubble, tap the paste button next to each field."),
            ],
            tips: [
                "Prefer an API Key: create one under Account → API keys & tokens. You can revoke it any time without changing your Auth Token.",
                "If you ever rotate your Auth Token, update it in Settings → your account.",
            ],
            links: [Link(title: "Console Home", symbol: "house", url: Console.home),
                    Link(title: "API Keys", symbol: "key.horizontal", url: Console.apiKeys)],
            keywords: "sid token password api key secret sk ac login sign in"
        ),
        HelpGuide(
            id: "buy-number", title: "Buy a Phone Number",
            summary: FeatureFlags.messaging ? "Get a number you can call and text from." : "Get a number you can call from.",
            symbol: "number.circle.fill", color: Theme.Palette.brandText, category: .gettingStarted,
            intro: "Twilio numbers cost about a dollar a month in many countries. Dialbubble imports every number on your account.",
            steps: [
                Step(symbol: "magnifyingglass", text: "In the Console, go to Phone Numbers → Buy a number."),
                Step(symbol: "checklist", text: FeatureFlags.messaging ? "Filter by country and tick Voice and SMS capabilities." : "Filter by country and tick the Voice capability."),
                Step(symbol: "cart.fill", text: "Choose a number and tap Buy."),
                Step(symbol: "arrow.triangle.2.circlepath", text: "Back in Dialbubble, open Settings → Numbers and tap Sync."),
            ],
            tips: ["Some countries require a regulatory bundle (address or ID) before you can buy a number."],
            links: [Link(title: "Buy a Number", symbol: "cart", url: Console.buyNumber),
                    Link(title: "Active Numbers", symbol: "list.number", url: Console.activeNumbers)],
            keywords: "purchase phone number get new line"
        ),
        HelpGuide(
            id: "trial", title: "Trial Accounts & Verified Numbers",
            summary: "What trial accounts can do and how to remove the limits.",
            symbol: "hourglass", color: Theme.Palette.warning, category: .gettingStarted,
            intro: FeatureFlags.messaging
                ? "Trial accounts can reach up to five verified numbers for 30 days. Voice Message calls work, but Talk calls and recording need a paid Twilio account, and texts must use Twilio's sample templates."
                : "Trial accounts can reach up to five verified numbers for 30 days. Voice Message calls work, but Talk calls and recording need a paid Twilio account.",
            steps: [
                Step(symbol: "checkmark.shield.fill", text: "Open Phone Numbers → Verified Caller IDs in the Console."),
                Step(symbol: "plus.circle.fill", text: "Add the number you want to reach and confirm the code Twilio sends."),
                Step(symbol: "arrow.triangle.2.circlepath", text: "Sync numbers in Dialbubble — verified numbers can also be used as your caller ID."),
                Step(symbol: "creditcard.fill", text: "To reach anyone and use Talk calls, upgrade your account by adding a payment method."),
            ],
            links: [Link(title: "Verified Caller IDs", symbol: "checkmark.shield", url: Console.verified),
                    Link(title: "Upgrade / Billing", symbol: "creditcard", url: Console.billing)],
            errors: [ErrorRow(code: 21608, title: "Unverified number on trial", fix: "Verify the number or upgrade your account.")],
            keywords: "trial free limit verify verified caller id upgrade talk record template 21608"
        ),
        HelpGuide(
            id: "talk-calls", title: "How Talk Calls Work",
            summary: "Two-way calls through your Twilio number without a VoIP server.",
            symbol: "phone.connection.fill", color: Theme.Palette.brandText, category: .calling,
            intro: "In-app VoIP requires a server, so Dialbubble uses a “bridge”: Twilio calls you first, then connects you to the person you're calling.",
            steps: [
                Step(symbol: "hand.tap.fill", text: "Enter a number in the Calls tab and choose Talk."),
                Step(symbol: "iphone.radiowaves.left.and.right", text: "Twilio rings your own phone (the number in Settings → My Phone)."),
                Step(symbol: "phone.fill.arrow.down.left", text: "Answer. You'll hear “Connecting your call”."),
                Step(symbol: "person.wave.2.fill", text: "Twilio dials the destination. They see your Twilio number as caller ID."),
            ],
            tips: [
                "You're billed for both legs of the call (to you and to them).",
                "Turn on Record in call options to record both sides — recordings appear in the call details.",
            ],
            links: [Link(title: "Voice Pricing", symbol: "dollarsign.circle", url: url("https://www.twilio.com/en-us/voice/pricing"))],
            keywords: "bridge talk call two way voice my phone personal caller id dial"
        ),
        HelpGuide(
            id: "voice-messages", title: "Voice Messages & TwiML",
            summary: "Call someone and speak a message, play audio, or run TwiML.",
            symbol: "text.bubble.fill", color: Theme.Palette.brandText, category: .calling,
            intro: "Dialbubble sends instructions inline with each call (TwiML), so there are no webhooks to host.",
            steps: [
                Step(symbol: "text.bubble", text: "Voice Message: type text, pick a voice and language, and how many times to repeat."),
                Step(symbol: "play.circle", text: "Play Audio: paste a public https link to an MP3 or WAV file."),
                Step(symbol: "chevron.left.forwardslash.chevron.right", text: "Custom TwiML: write any TwiML verbs like <Say>, <Play>, <Pause>, <Gather>."),
                Step(symbol: "waveform.badge.magnifyingglass", text: "Enable answering-machine detection to know whether a person or voicemail picked up."),
            ],
            tips: ["Inline TwiML is limited to 4,000 characters."],
            links: [Link(title: "TwiML Reference", symbol: "book", url: url("https://www.twilio.com/docs/voice/twiml")),
                    Link(title: "Text-to-Speech Voices", symbol: "speaker.wave.2", url: url("https://www.twilio.com/docs/voice/twiml/say/text-speech"))],
            keywords: "say tts text to speech polly voice play audio twiml xml robocall message"
        ),
        HelpGuide(
            id: "scheduling", title: "Scheduling Texts",
            summary: "Send messages later with a Messaging Service.",
            symbol: "calendar.badge.clock", color: Theme.Palette.brandText, category: .messaging,
            intro: "Twilio only schedules messages that are sent through a Messaging Service, between 15 minutes and 35 days ahead.",
            steps: [
                Step(symbol: "plus.app.fill", text: "In the Console, open Messaging → Services and create a service."),
                Step(symbol: "number", text: "Add your phone number(s) to the service's Sender Pool."),
                Step(symbol: "doc.on.doc", text: "Copy the service SID (starts with “MG”)."),
                Step(symbol: "gearshape.fill", text: "In Dialbubble, open Settings → your account → Scheduling and pick or paste it."),
                Step(symbol: "clock.badge.checkmark", text: "In a conversation, tap + → Schedule and pick a time."),
            ],
            tips: ["You can cancel a scheduled message from its bubble until it's sent."],
            links: [Link(title: "Messaging Services", symbol: "tray.full", url: Console.messagingServices),
                    Link(title: "Scheduling Docs", symbol: "book", url: url("https://www.twilio.com/docs/messaging/features/message-scheduling"))],
            keywords: "schedule later send at messaging service mg calendar"
        ),
        HelpGuide(
            id: "mms", title: "MMS & Public Media Links",
            summary: "Send pictures by linking to a public file.",
            symbol: "photo.on.rectangle.angled", color: Theme.Palette.brandText, category: .messaging,
            intro: "Twilio downloads MMS media itself, so attachments must be public https links. Dialbubble has no server to upload photos to.",
            steps: [
                Step(symbol: "icloud.and.arrow.up", text: "Upload your image somewhere public (a website, CDN, or a public share link that points directly to the file)."),
                Step(symbol: "link", text: "In a conversation, tap + → Attach Media Link and paste the URL."),
                Step(symbol: "paperplane.fill", text: "Send. Twilio fetches and delivers the image."),
            ],
            tips: ["MMS is supported in the US and Canada. Elsewhere, Twilio sends the link as text.",
                   "Your number must be MMS-capable — look for the photo badge in Settings → Numbers."],
            links: [Link(title: "Supported Media Types", symbol: "doc.richtext", url: url("https://www.twilio.com/docs/messaging/guides/accepted-mime-types"))],
            keywords: "mms picture image photo attachment media url gif"
        ),
        HelpGuide(
            id: "a2p", title: "US A2P 10DLC Registration",
            summary: "Why texts to US numbers may be filtered, and how to fix it.",
            symbol: "checkmark.seal.text.page.fill", color: Theme.Palette.info, category: .messaging,
            intro: "US carriers require businesses texting from regular 10-digit numbers to register a brand and campaign. Unregistered traffic is often blocked.",
            steps: [
                Step(symbol: "building.2.fill", text: "In the Console, open Messaging → Regulatory Compliance → A2P 10DLC."),
                Step(symbol: "person.text.rectangle.fill", text: "Register your brand (sole proprietors can register too)."),
                Step(symbol: "megaphone.fill", text: "Create a campaign describing what you send."),
                Step(symbol: "link.badge.plus", text: "Attach your Messaging Service and numbers to the campaign."),
            ],
            tips: ["Toll-free numbers use a separate toll-free verification instead."],
            links: [Link(title: "A2P 10DLC in Console", symbol: "checkmark.seal", url: Console.a2p),
                    Link(title: "Learn about A2P 10DLC", symbol: "book", url: url("https://www.twilio.com/docs/messaging/compliance/a2p-10dlc"))],
            errors: [ErrorRow(code: 30007, title: "Message filtered by carrier", fix: "Register for A2P 10DLC and avoid spam-like content.")],
            keywords: "a2p 10dlc filtered blocked carrier registration compliance campaign brand 30007 30034"
        ),
        HelpGuide(
            id: "pricing", title: "Pricing & Balance",
            summary: "What things cost and how to top up.",
            symbol: "dollarsign.circle.fill", color: Theme.Palette.success, category: .account,
            intro: "Twilio is pay-as-you-go. Dialbubble shows your balance and usage on the Home tab.",
            steps: [
                Step(symbol: "message.fill", text: "Each SMS segment is billed (160 GSM characters, or 70 with emoji)."),
                Step(symbol: "phone.fill", text: "Calls are billed per minute; Talk calls bill both legs."),
                Step(symbol: "number", text: "Phone numbers have a monthly fee."),
                Step(symbol: "creditcard.fill", text: "Add funds or enable auto-recharge in Console → Billing."),
            ].filter { FeatureFlags.messaging || $0.symbol != "message.fill" },
            tips: ["Dialbubble warns you on Home when your balance drops below $5."],
            links: [Link(title: "Billing", symbol: "creditcard", url: Console.billing),
                    Link(title: "Twilio Pricing", symbol: "dollarsign.circle", url: Console.pricing)],
            keywords: "price cost balance money billing funds recharge usage segments"
        ),
        HelpGuide(
            id: "geo", title: FeatureFlags.messaging ? "Calling & Texting Internationally" : "Calling Internationally",
            summary: "Enable countries with Geo Permissions.",
            symbol: "globe.americas.fill", color: Theme.Palette.info, category: .account,
            intro: "To protect you from fraud, Twilio blocks many countries by default.",
            steps: [
                Step(symbol: "globe", text: "Open Voice → Settings → Geo Permissions (for calls)."),
                Step(symbol: "checkmark.square.fill", text: "Tick the countries you need and save."),
                Step(symbol: "message.badge", text: "Do the same under Messaging → Settings → Geo Permissions for texts."),
            ].filter { FeatureFlags.messaging || $0.symbol != "message.badge" },
            links: [Link(title: "Voice Geo Permissions", symbol: "phone", url: Console.voiceGeo),
                    Link(title: "SMS Geo Permissions", symbol: "message", url: Console.smsGeo)]
                .filter { FeatureFlags.messaging || $0.symbol != "message" },
            errors: [ErrorRow(code: 21408, title: "Permission to send to this region not enabled", fix: "Enable the country in SMS Geo Permissions."),
                     ErrorRow(code: 13227, title: "Calling to this country not enabled", fix: "Enable the country in Voice Geo Permissions.")],
            keywords: "international country geo permissions abroad 21408 13227 21215"
        ),
        HelpGuide(
            id: "no-push", title: "Why No Push Notifications?",
            summary: "How Dialbubble checks for new messages without a server.",
            symbol: "bell.slash.fill", color: .gray, category: .troubleshooting,
            intro: "Push notifications require a server to receive Twilio webhooks and forward them to Apple. Dialbubble is serverless by design.",
            steps: [
                Step(symbol: "arrow.clockwise", text: "While Dialbubble is open, it checks for new messages and calls every 20 seconds."),
                Step(symbol: "bubble.left.and.bubble.right", text: "Inside a conversation it checks every 5 seconds."),
                Step(symbol: "hand.draw", text: "Pull down on any list to refresh immediately."),
            ],
            tips: ["Incoming calls to your Twilio number follow the setup in the Twilio Console (e.g. forward to your mobile)."],
            keywords: "push notification notify alert incoming background webhook server"
        ),
        HelpGuide(
            id: "security", title: "Security & Privacy",
            summary: "How your credentials are stored and used.",
            symbol: "lock.shield.fill", color: .gray, category: .troubleshooting,
            intro: "Dialbubble has no backend. Your data goes only between this device and Twilio.",
            steps: [
                Step(symbol: "key.fill", text: "Secrets are saved in the iOS Keychain, on this device only."),
                Step(symbol: "network.badge.shield.half.filled", text: "Requests go straight to api.twilio.com over TLS."),
                Step(symbol: "faceid", text: "Turn on Face ID lock in Settings → Security to protect the app."),
                Step(symbol: "key.horizontal.fill", text: "Use a revocable API Key instead of your Auth Token for least privilege."),
            ],
            links: [Link(title: "API Keys", symbol: "key.horizontal", url: Console.apiKeys)],
            keywords: "security privacy keychain safe secure face id lock password"
        ),
        HelpGuide(
            id: "errors", title: "Troubleshooting Common Errors",
            summary: "What Twilio error codes mean and how to fix them.",
            symbol: "exclamationmark.triangle.fill", color: Theme.Palette.warning, category: .troubleshooting,
            intro: "Dialbubble explains most errors inline. Here are the ones you're most likely to see.",
            tips: ["Tap any error code to read Twilio's full documentation.",
                   "Check status.twilio.com if everything suddenly fails."],
            links: [Link(title: "Twilio Status", symbol: "waveform.path.ecg", url: Console.status),
                    Link(title: "Twilio Support", symbol: "lifepreserver", url: Console.support)],
            errors: [
                ErrorRow(code: 20003, title: "Authentication failed", fix: "Re-copy your Account SID and Auth Token (or API Key) from the Console."),
                ErrorRow(code: 21211, title: "Invalid “To” number", fix: "Use full international format, e.g. +1 415 555 0100."),
                ErrorRow(code: 21608, title: "Trial account: unverified number", fix: "Verify the recipient in the Console or upgrade."),
                ErrorRow(code: 21610, title: "Recipient replied STOP", fix: "They must text START to your number before you can message them."),
                ErrorRow(code: 21614, title: "Not a mobile number", fix: "The number can't receive SMS — try calling instead."),
                ErrorRow(code: 30007, title: "Filtered by carrier", fix: "Register for A2P 10DLC (US) and avoid spam-like content."),
            ].filter { FeatureFlags.messaging || ![21610, 21614, 30007].contains($0.code) },
            keywords: "error code problem fail failed undelivered help fix troubleshoot"
        ),
    ]
}
