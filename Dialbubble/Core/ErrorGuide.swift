import SwiftUI

/// Turns raw API / network errors into plain-language guidance with a concrete next step.
/// Twilio's own wording is kept in `details` (with SIDs masked) behind a "Technical details" disclosure.
struct FriendlyError: Identifiable, Equatable {
    /// Where the error is shown — changes the advice (e.g. "pull to refresh" makes no sense during setup).
    enum Context { case app, onboarding }

    var id: String { title + message }
    var title: String
    var message: String
    var suggestion: String?
    var symbol: String = "exclamationmark.triangle.fill"
    var color: Color = .orange
    var helpURL: URL?
    var code: Int?
    /// Raw technical text for support / power users. Never shown by default.
    var details: String?

    init(title: String, message: String, suggestion: String? = nil, symbol: String = "exclamationmark.triangle.fill",
         color: Color = .orange, helpURL: URL? = nil, code: Int? = nil, details: String? = nil) {
        self.title = title
        self.message = message
        self.suggestion = suggestion
        self.symbol = symbol
        self.color = color
        self.helpURL = helpURL
        self.code = code
        self.details = details
    }

    init(_ error: Error, context: Context = .app) {
        self = FriendlyError.make(error, context: context)
    }

    /// Masks Twilio SIDs (AC…, SK…, MG…) so long identifiers never dominate an error message.
    static func maskSIDs(_ text: String) -> String {
        guard let regex = try? NSRegularExpression(pattern: "\\b([A-Z]{2})[0-9a-fA-F]{28}([0-9a-fA-F]{4})\\b") else { return text }
        let range = NSRange(text.startIndex..., in: text)
        return regex.stringByReplacingMatches(in: text, range: range, withTemplate: "$1…$2")
    }

    private static func make(_ error: Error, context: Context) -> FriendlyError {
        if let api = error as? TwilioAPIError {
            return fromTwilio(api, context: context)
        }
        if let client = error as? ClientError {
            switch client {
            case .http(401):
                return FriendlyError(title: "Couldn't sign in", message: "Twilio didn't accept these credentials.",
                                     suggestion: "Copy the Account SID and Auth Token again from the Twilio Console home page. If you recently rotated your token, use the new one.",
                                     symbol: "key.slash.fill", color: .red, helpURL: URL(string: "https://console.twilio.com"), details: "HTTP 401")
            case .http(let code):
                return FriendlyError(title: "Twilio is having trouble", message: "The request didn't go through.",
                                     suggestion: "Please try again in a moment.", symbol: "exclamationmark.icloud.fill", details: "HTTP \(code)")
            case .missingCredentials:
                return FriendlyError(title: "No account connected", message: "Connect a Twilio account to continue.",
                                     suggestion: "Go to Settings → Accounts → Add Account.", symbol: "person.crop.circle.badge.exclamationmark")
            case .invalidInput(let msg):
                return FriendlyError(title: "Check your input", message: msg, symbol: "pencil.circle.fill", color: .orange)
            case .invalidResponse:
                return FriendlyError(title: "Unexpected response", message: "Twilio sent something Dialbubble didn't understand.",
                                     suggestion: "Try again. If it keeps happening, check status.twilio.com.",
                                     helpURL: URL(string: "https://status.twilio.com"))
            }
        }
        if let url = error as? URLError {
            switch url.code {
            case .notConnectedToInternet, .networkConnectionLost, .dataNotAllowed:
                return FriendlyError(title: "You're offline", message: "Dialbubble couldn't reach Twilio.",
                                     suggestion: "Check your Wi-Fi or cellular connection and try again.", symbol: "wifi.slash", color: .gray)
            case .timedOut:
                return FriendlyError(title: "Request timed out", message: "Twilio took too long to respond.",
                                     suggestion: "Try again in a moment.", symbol: "hourglass", color: .gray)
            default:
                return FriendlyError(title: "Network problem", message: "Dialbubble couldn't talk to Twilio right now.", suggestion: "Check your connection and try again.",
                                     symbol: "network.slash", color: .gray, details: url.localizedDescription)
            }
        }
        return FriendlyError(title: "Something went wrong", message: "That didn't work as expected.", suggestion: "Please try again.",
                             details: maskSIDs(error.localizedDescription))
    }

    private static func fromTwilio(_ e: TwilioAPIError, context: Context) -> FriendlyError {
        let docs = e.code.flatMap { URL(string: "https://www.twilio.com/docs/errors/\($0)") }
        let raw = maskSIDs(e.message) + (e.code.map { " (error \($0))" } ?? "")
        func f(_ title: String, _ message: String, _ suggestion: String, symbol: String = "exclamationmark.triangle.fill", color: Color = .orange, url: URL? = nil) -> FriendlyError {
            FriendlyError(title: title, message: message, suggestion: suggestion, symbol: symbol, color: color, helpURL: url ?? docs, code: e.code, details: raw)
        }
        switch e.code {
        case 20003, 20005:
            return f("Couldn't sign in", "Twilio didn't accept this Account SID and Auth Token.",
                     "Copy both again from the Twilio Console home page — they sit side by side under Account Info.",
                     symbol: "key.slash.fill", color: .red, url: URL(string: "https://console.twilio.com"))
        case 20404:
            return context == .onboarding
                ? f("Account not found", "Twilio couldn't find an account with this Account SID.",
                    "Check the Account SID — it starts with AC. Copy it again from the Console.", symbol: "magnifyingglass", url: URL(string: "https://console.twilio.com"))
                : f("Not found", "This item no longer exists on Twilio.", "Pull down to refresh.", symbol: "questionmark.folder.fill")
        case 20429, 14107:
            return f("Slow down", "Twilio is limiting how fast requests can be sent.", "Wait a few seconds and try again.", symbol: "tortoise.fill")
        case 21211, 13223, 13224:
            return f("Invalid phone number", "That doesn't look like a phone number Twilio can reach.", "Use the full international format, like +1 415 555 0100.", symbol: "number.circle.fill")
        case 21212, 21606, 21659:
            return f("Can't send from this number", "This Twilio number isn't set up for text messages.",
                     "Choose another number, or enable SMS for it in the Twilio Console.", symbol: "phone.badge.exclamationmark")
        case 21608, 21219:
            return f("Trial account limit", "Trial accounts can only reach phone numbers you've verified.",
                     "Verify this number in the Twilio Console, or upgrade your account to reach anyone.",
                     symbol: "lock.trianglebadge.exclamationmark.fill",
                     url: URL(string: "https://console.twilio.com/us1/develop/phone-numbers/manage/verified"))
        case 21610:
            return f("Recipient opted out", "This person replied STOP to your number.",
                     "They need to text START to your number before you can message them again.", symbol: "hand.raised.fill", color: .red)
        case 21614:
            return f("Not a mobile number", "This number can't receive text messages.", "Try calling instead.", symbol: "phone.down.fill")
        case 21408, 13227, 21215:
            return f("Country not enabled", "Your Twilio account isn't allowed to reach this country yet.",
                     "Turn it on in Twilio's Geo Permissions settings, then try again.", symbol: "globe.badge.chevron.backward",
                     url: URL(string: "https://console.twilio.com/us1/develop/voice/settings/geo-permissions"))
        case 30007:
            return f("Carrier filtered the message", "The recipient's carrier blocked this message.",
                     "In the US, register for A2P 10DLC to improve delivery.", symbol: "shield.slash.fill")
        case 20008:
            return f("Not available in test mode", "Test credentials can't do this.", "Use your live Auth Token instead.", symbol: "testtube.2")
        case 35111, 35114, 35115, 35118, 21703:
            return f("Scheduling problem", "Twilio couldn't schedule this message.",
                     "Scheduled messages need a Messaging Service and a time 15 minutes to 35 days from now.", symbol: "calendar.badge.exclamationmark")
        default:
            return f("Twilio couldn't complete that", "Something about this request didn't work.", "Check the details and try again.")
        }
    }
}

/// A reusable card that explains an error and how to fix it.
struct FriendlyErrorView: View {
    var error: FriendlyError
    var retry: (() -> Void)?
    var onDismiss: (() -> Void)?
    @State private var showDetails = false

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .firstTextBaseline, spacing: 10) {
                Image(systemName: error.symbol)
                    .foregroundStyle(error.color)
                    .font(.headline)
                    .symbolRenderingMode(.hierarchical)
                VStack(alignment: .leading, spacing: 4) {
                    Text(error.title).font(.headline)
                    Text(error.message).font(.subheadline).foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                    if let s = error.suggestion {
                        Label(s, systemImage: "lightbulb.fill")
                            .font(.footnote)
                            .labelStyle(TipLabelStyle())
                            .padding(.top, 2)
                    }
                }
                Spacer(minLength: 0)
                if let onDismiss {
                    Button(action: onDismiss) {
                        Image(systemName: "xmark").font(.caption.weight(.bold)).foregroundStyle(.secondary)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Dismiss")
                }
            }
            if retry != nil || error.helpURL != nil {
                HStack(spacing: 10) {
                    if let retry {
                        Button(action: retry) { Label("Try Again", systemImage: "arrow.clockwise") }
                            .buttonStyle(.glass)
                    }
                    if let url = error.helpURL {
                        Link(destination: url) { Label("Learn More", systemImage: "safari") }
                            .buttonStyle(.glass)
                    }
                }
                .font(.subheadline.weight(.semibold))
                .padding(.leading, 30)
            }
            if let details = error.details {
                DisclosureGroup(isExpanded: $showDetails) {
                    HStack(alignment: .top) {
                        Text(details)
                            .font(.caption.monospaced())
                            .foregroundStyle(.secondary)
                            .textSelection(.enabled)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        Button {
                            UIPasteboard.general.string = details
                        } label: {
                            Image(systemName: "doc.on.doc")
                        }
                        .buttonStyle(.borderless)
                        .accessibilityLabel("Copy technical details")
                    }
                    .padding(.top, 4)
                } label: {
                    Text("Technical details").font(.caption.weight(.medium)).foregroundStyle(.secondary)
                }
                .tint(.secondary)
                .padding(.leading, 30)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .glassEffect(.regular.tint(error.color.opacity(0.12)), in: .rect(cornerRadius: Theme.Radius.lg))
        .accessibilityElement(children: .contain)
    }
}

private struct TipLabelStyle: LabelStyle {
    func makeBody(configuration: Configuration) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 6) {
            configuration.icon.foregroundStyle(.yellow)
            configuration.title
        }
    }
}
