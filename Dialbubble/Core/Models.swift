import SwiftUI

// MARK: - Credentials

/// Credentials used for HTTP Basic auth against the Twilio REST API.
/// Either Account SID + Auth Token, or API Key SID + API Key Secret (URL still uses the Account SID).
struct TwilioCredentials: Codable, Hashable, Sendable {
    var accountSid: String
    var apiKeySid: String?
    var secret: String

    var username: String {
        if let key = apiKeySid?.trimmingCharacters(in: .whitespaces), !key.isEmpty { return key }
        return accountSid
    }
}

// MARK: - Twilio API resources

struct TwilioAccount: Decodable, Hashable, Sendable {
    let sid: String
    let friendlyName: String?
    let status: String?
    let type: String?
    let dateCreated: Date?

    var isTrial: Bool { type?.lowercased() == "trial" }
}

struct TwilioBalance: Decodable, Hashable, Sendable {
    let balance: String
    let currency: String

    var amount: Double { Double(balance) ?? 0 }
    var formatted: String { amount.formatted(.currency(code: currency)) }
}

struct PhoneCapabilities: Codable, Hashable, Sendable {
    var voice: Bool?
    var sms: Bool?
    var mms: Bool?

    // Twilio returns these keys in mixed case ("SMS", "MMS", "voice") depending on endpoint.
    enum CodingKeys: String, CodingKey { case voice, sms, mms, Voice, SMS, MMS }

    init(voice: Bool?, sms: Bool?, mms: Bool?) { self.voice = voice; self.sms = sms; self.mms = mms }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        voice = try c.decodeIfPresent(Bool.self, forKey: .voice) ?? c.decodeIfPresent(Bool.self, forKey: .Voice)
        sms = try c.decodeIfPresent(Bool.self, forKey: .sms) ?? c.decodeIfPresent(Bool.self, forKey: .SMS)
        mms = try c.decodeIfPresent(Bool.self, forKey: .mms) ?? c.decodeIfPresent(Bool.self, forKey: .MMS)
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(voice, forKey: .voice)
        try c.encodeIfPresent(sms, forKey: .sms)
        try c.encodeIfPresent(mms, forKey: .mms)
    }
}

struct IncomingPhoneNumber: Decodable, Hashable, Sendable {
    let sid: String
    let phoneNumber: String
    let friendlyName: String?
    let capabilities: PhoneCapabilities?
}

struct OutgoingCallerId: Decodable, Hashable, Sendable {
    let sid: String
    let phoneNumber: String
    let friendlyName: String?
}

enum MessageStatus: String, Sendable {
    case accepted, scheduled, queued, sending, sent, delivered, undelivered, failed, received, receiving, read, canceled, unknown

    var label: String {
        switch self {
        case .unknown: return "Unknown"
        default: return rawValue.capitalized
        }
    }

    var symbol: String {
        switch self {
        case .accepted, .queued, .sending: return "clock"
        case .scheduled: return "calendar.badge.clock"
        case .sent: return "checkmark"
        case .delivered, .read: return "checkmark.circle.fill"
        case .received, .receiving: return "arrow.down.circle"
        case .undelivered, .failed: return "exclamationmark.circle.fill"
        case .canceled: return "xmark.circle"
        case .unknown: return "questionmark.circle"
        }
    }

    var color: Color {
        switch self {
        case .delivered, .read, .received: return .green
        case .failed, .undelivered: return .red
        case .scheduled: return .indigo
        case .canceled: return .secondary
        default: return .orange
        }
    }

    var isFailure: Bool { self == .failed || self == .undelivered }
}

struct TwilioMessage: Codable, Identifiable, Hashable, Sendable {
    let sid: String
    let from: String?
    let to: String?
    let body: String?
    let status: String?
    let direction: String?
    let dateCreated: Date?
    let dateSent: Date?
    let dateUpdated: Date?
    let numMedia: String?
    let numSegments: String?
    let price: String?
    let priceUnit: String?
    let errorCode: Int?
    let errorMessage: String?
    let messagingServiceSid: String?

    var id: String { sid }
    var isInbound: Bool { direction == "inbound" }
    var date: Date { dateSent ?? dateCreated ?? .distantPast }
    var mediaCount: Int { Int(numMedia ?? "0") ?? 0 }
    var segments: Int { Int(numSegments ?? "1") ?? 1 }
    var statusKind: MessageStatus { MessageStatus(rawValue: status ?? "") ?? .unknown }
    /// The Twilio-side number for this message.
    var ourNumber: String { (isInbound ? to : from) ?? "" }
    /// The remote party.
    var counterpart: String { (isInbound ? from : to) ?? "" }
}

enum CallStatus: String, Sendable {
    case queued, initiated, ringing, inProgress = "in-progress", completed, busy, failed, noAnswer = "no-answer", canceled, unknown

    var label: String {
        switch self {
        case .inProgress: return "In Progress"
        case .noAnswer: return "No Answer"
        default: return rawValue.capitalized
        }
    }

    var symbol: String {
        switch self {
        case .queued, .initiated: return "clock"
        case .ringing: return "bell.and.waves.left.and.right"
        case .inProgress: return "waveform"
        case .completed: return "checkmark.circle.fill"
        case .busy: return "phone.badge.waveform"
        case .failed: return "exclamationmark.triangle.fill"
        case .noAnswer: return "phone.arrow.up.right"
        case .canceled: return "xmark.circle"
        case .unknown: return "questionmark.circle"
        }
    }

    var color: Color {
        switch self {
        case .completed: return .green
        case .inProgress, .ringing: return .blue
        case .failed, .busy, .noAnswer: return .red
        case .canceled: return .secondary
        default: return .orange
        }
    }

    var isActive: Bool { [.queued, .initiated, .ringing, .inProgress].contains(self) }
}

struct TwilioCall: Codable, Identifiable, Hashable, Sendable {
    let sid: String
    let from: String?
    let to: String?
    let status: String?
    let direction: String?
    let duration: String?
    let startTime: Date?
    let endTime: Date?
    let dateCreated: Date?
    let price: String?
    let priceUnit: String?
    let answeredBy: String?
    let parentCallSid: String?

    var id: String { sid }
    var isInbound: Bool { direction == "inbound" }
    var statusKind: CallStatus { CallStatus(rawValue: status ?? "") ?? .unknown }
    var durationSeconds: Int { Int(duration ?? "0") ?? 0 }
    var date: Date { startTime ?? dateCreated ?? .distantPast }
    var ourNumber: String { (isInbound ? to : from) ?? "" }
    var counterpart: String { (isInbound ? from : to) ?? "" }
    /// Nobody picked up (either direction).
    var isUnanswered: Bool { [.noAnswer, .busy, .failed, .canceled].contains(statusKind) }
    /// Someone called you and nobody answered. The only case shown in red, like the Phone app.
    var isMissed: Bool { isInbound && isUnanswered }
}

struct TwilioRecording: Decodable, Identifiable, Hashable, Sendable {
    let sid: String
    let callSid: String?
    let duration: String?
    let dateCreated: Date?
    let status: String?
    let channels: Int?
    let source: String?

    var id: String { sid }
    var durationSeconds: Int { Int(duration ?? "0") ?? 0 }
}

struct TwilioMedia: Decodable, Identifiable, Hashable, Sendable {
    let sid: String
    let contentType: String?
    let uri: String?
    var id: String { sid }
}

struct UsageRecord: Decodable, Identifiable, Hashable, Sendable {
    let category: String
    let description: String?
    let usage: String?
    let usageUnit: String?
    let count: String?
    let countUnit: String?
    let price: String?
    let priceUnit: String?

    var id: String { category }
    var priceValue: Double { Double(price ?? "0") ?? 0 }
    var usageValue: Double { Double(usage ?? "0") ?? 0 }
    var countValue: Double { Double(count ?? "0") ?? 0 }
}

struct MessagingService: Decodable, Identifiable, Hashable, Sendable {
    let sid: String
    let friendlyName: String?
    var id: String { sid }
}

struct LookupResult: Decodable, Hashable, Sendable {
    struct LineType: Decodable, Hashable, Sendable {
        let type: String?
        let carrierName: String?
        let mobileCountryCode: String?
        let mobileNetworkCode: String?
        let errorCode: Int?
    }
    struct CallerName: Decodable, Hashable, Sendable {
        let callerName: String?
        let callerType: String?
        let errorCode: Int?
    }
    let phoneNumber: String?
    let nationalFormat: String?
    let countryCode: String?
    let callingCountryCode: String?
    let valid: Bool?
    let validationErrors: [String]?
    let lineTypeIntelligence: LineType?
    let callerName: CallerName?
}

struct TwilioAPIError: Decodable, LocalizedError, Sendable {
    let code: Int?
    let message: String
    let moreInfo: String?
    let status: Int?

    var errorDescription: String? {
        if let code { return "\(message) (Twilio \(code))" }
        return message
    }
}

enum ClientError: LocalizedError {
    case invalidResponse
    case http(Int)
    case missingCredentials
    case invalidInput(String)

    var errorDescription: String? {
        switch self {
        case .invalidResponse: return "Twilio returned an unexpected response."
        case .http(let code):
            return code == 401 ? "Authentication failed. Check your Account SID and Auth Token." : "Request failed with HTTP \(code)."
        case .missingCredentials: return "No Twilio account is configured."
        case .invalidInput(let msg): return msg
        }
    }
}

// MARK: - Local models

enum AppTint: String, Codable, CaseIterable, Identifiable, Sendable {
    case red, orange, yellow, green, mint, teal, cyan, blue, indigo, purple, pink

    var id: String { rawValue }
    var color: Color {
        switch self {
        case .red: return .red
        case .orange: return .orange
        case .yellow: return .yellow
        case .green: return .green
        case .mint: return .mint
        case .teal: return .teal
        case .cyan: return .cyan
        case .blue: return .blue
        case .indigo: return .indigo
        case .purple: return .purple
        case .pink: return .pink
        }
    }
    var name: String { rawValue.capitalized }

    /// Friendly order used when assigning colors automatically (no red/pink/yellow).
    static let rotation: [AppTint] = [.mint, .blue, .indigo, .teal, .purple, .orange, .cyan, .green]
}

/// A number the user has configured to call / message from.
struct ConfiguredNumber: Codable, Identifiable, Hashable, Sendable {
    enum Source: String, Codable, Sendable {
        case owned, verified, manual
        var label: String {
            switch self {
            case .owned: return "Twilio Number"
            case .verified: return "Verified Caller ID"
            case .manual: return "Added Manually"
            }
        }
    }

    var phoneNumber: String
    var friendlyName: String
    var nickname: String?
    var tint: AppTint
    var voice: Bool
    var sms: Bool
    var mms: Bool
    var source: Source
    var isEnabled: Bool = true

    var id: String { phoneNumber }
    var displayName: String {
        if let nickname, !nickname.trimmingCharacters(in: .whitespaces).isEmpty { return nickname }
        return friendlyName.isEmpty ? PhoneFormat.display(phoneNumber) : friendlyName
    }
}

struct AccountProfile: Codable, Identifiable, Hashable, Sendable {
    var id: UUID = UUID()
    var name: String
    var accountSid: String
    var apiKeySid: String?
    /// The user's own phone used for "bridge" calls (Twilio rings you, then connects you to the destination).
    var personalPhone: String = ""
    var defaultCallerNumber: String?
    var defaultSMSNumber: String?
    /// Optional Messaging Service SID, required by Twilio for scheduled messages.
    var messagingServiceSid: String?
    var numbers: [ConfiguredNumber] = []
    var tint: AppTint = .mint
    var isTrial: Bool = false
    var defaultCountryCode: String = "1"

    var enabledNumbers: [ConfiguredNumber] { numbers.filter(\.isEnabled) }
    var callerNumbers: [ConfiguredNumber] { enabledNumbers.filter(\.voice) }
    var smsNumbers: [ConfiguredNumber] { enabledNumbers.filter(\.sms) }
}

struct MessageTemplate: Codable, Identifiable, Hashable, Sendable {
    var id: UUID = UUID()
    var title: String
    var body: String
}

// MARK: - Outgoing requests

struct OutgoingMessage: Sendable {
    var from: String?
    var messagingServiceSid: String?
    var to: String
    var body: String
    var mediaURLs: [URL] = []
    /// When set, the message is scheduled (requires a Messaging Service, 15 min – 35 days ahead).
    var sendAt: Date?
}

enum CallMode: String, CaseIterable, Identifiable, Codable, Sendable {
    case bridge, say, play, twiml

    var id: String { rawValue }
    var title: String {
        switch self {
        case .bridge: return "Talk"
        case .say: return "Voice Message"
        case .play: return "Play Audio"
        case .twiml: return "Custom TwiML"
        }
    }
    var subtitle: String {
        switch self {
        case .bridge: return "Twilio rings your phone, then connects you using your Twilio number as caller ID."
        case .say: return "Call and speak a text-to-speech message."
        case .play: return "Call and play an audio file from a public URL."
        case .twiml: return "Call and run your own TwiML instructions."
        }
    }
    /// A few words for under the keypad's mode bar.
    var shortHint: String {
        switch self {
        case .bridge: return "Rings your phone first, then connects you"
        case .say: return "Twilio calls and reads your message aloud"
        case .play: return "Twilio calls and plays an audio link"
        case .twiml: return "Twilio calls and runs your TwiML"
        }
    }
    var symbol: String {
        switch self {
        case .bridge: return "phone.connection.fill"
        case .say: return "text.bubble.fill"
        case .play: return "play.circle.fill"
        case .twiml: return "chevron.left.forwardslash.chevron.right"
        }
    }
}

struct VoiceOption: Identifiable, Hashable, Sendable {
    /// Unique per voice + language (the same Polly voice can speak several languages).
    let id: String
    /// The TwiML `voice` attribute, e.g. "Polly.Joanna-Neural".
    let voice: String
    let name: String
    let language: String

    init(id voice: String, name: String, language: String) {
        self.id = "\(voice)|\(language)"
        self.voice = voice
        self.name = name
        self.language = language
    }

    static let all: [VoiceOption] = [
        .init(id: "Polly.Joanna-Neural", name: "Joanna (US, Neural)", language: "en-US"),
        .init(id: "Polly.Matthew-Neural", name: "Matthew (US, Neural)", language: "en-US"),
        .init(id: "Polly.Ruth-Generative", name: "Ruth (US, Generative)", language: "en-US"),
        .init(id: "Polly.Amy-Neural", name: "Amy (UK, Neural)", language: "en-GB"),
        .init(id: "Polly.Brian-Neural", name: "Brian (UK, Neural)", language: "en-GB"),
        .init(id: "Polly.Olivia-Neural", name: "Olivia (AU, Neural)", language: "en-AU"),
        .init(id: "Polly.Kajal-Neural", name: "Kajal (IN, Neural)", language: "en-IN"),
        .init(id: "Polly.Lucia-Neural", name: "Lucia (ES, Neural)", language: "es-ES"),
        .init(id: "Polly.Lea-Neural", name: "Léa (FR, Neural)", language: "fr-FR"),
        .init(id: "Polly.Vicki-Neural", name: "Vicki (DE, Neural)", language: "de-DE"),
        .init(id: "Polly.Kajal-Neural", name: "Kajal (Hindi, Neural)", language: "hi-IN"),
        .init(id: "alice", name: "Alice (Classic)", language: "en-US"),
    ]
    static let `default` = all[0]
}

struct OutgoingCall: Sendable {
    var from: String
    var destination: String
    var mode: CallMode
    /// Required for `.bridge`: the user's own phone.
    var personalPhone: String = ""
    var message: String = ""
    var voice: VoiceOption = .default
    var audioURL: String = ""
    var customTwiML: String = ""
    var loop: Int = 1
    var record: Bool = false
    var machineDetection: Bool = false
    var timeout: Int = 30
    var sendDigits: String = ""
    /// Bridge only: ask you to press a key before the other person is dialed.
    var confirmBeforeConnect: Bool = true
}

// MARK: - Navigation / app-wide state

enum AppTab: String, Hashable, CaseIterable {
    case home, calls, messages, settings, search
}

struct DialDraft: Identifiable, Hashable {
    let id = UUID()
    var to: String
    var from: String?
}

struct MessageDraft: Identifiable, Hashable {
    let id = UUID()
    var to: String
    var from: String?
    var body: String = ""
    /// A message to scroll to and flash when the thread opens (from Search).
    var focusSid: String?
}

/// A call placed from the app that is being tracked live.
struct LiveCallSession: Identifiable, Hashable {
    var id: String { call.sid }
    var call: TwilioCall
    var destination: String
    var from: String
    var mode: CallMode
    var startedAt: Date = .now
}

/// A message thread between one of our numbers and a remote party.
struct Conversation: Identifiable, Hashable {
    let ourNumber: String
    let counterpart: String
    var messages: [TwilioMessage]   // sorted oldest → newest

    var id: String { "\(ourNumber)|\(counterpart)" }
    var lastMessage: TwilioMessage? { messages.last }
    var lastDate: Date { lastMessage?.date ?? .distantPast }
}

extension String {
    var nilIfBlank: String? {
        let t = trimmingCharacters(in: .whitespacesAndNewlines)
        return t.isEmpty ? nil : t
    }
}

extension Date {
    /// List timestamp like Messages: "4:12 PM" today, "Yesterday", a weekday this week, else "11/2/26".
    var listStamp: String {
        let cal = Calendar.current
        if cal.isDateInToday(self) { return formatted(date: .omitted, time: .shortened) }
        if cal.isDateInYesterday(self) { return "Yesterday" }
        if let days = cal.dateComponents([.day], from: cal.startOfDay(for: self), to: cal.startOfDay(for: .now)).day, days < 7 {
            return formatted(.dateTime.weekday(.wide))
        }
        return formatted(date: .numeric, time: .omitted)
    }
}
