import Foundation

/// A lightweight, server-less client for the Twilio REST API.
/// All requests are authenticated with HTTP Basic auth straight from the device.
struct TwilioClient: Sendable {
    let credentials: TwilioCredentials
    var session: URLSession = .shared

    private static let apiHost = "https://api.twilio.com"
    private var accountBase: String { "\(Self.apiHost)/2010-04-01/Accounts/\(credentials.accountSid)" }

    // MARK: Account

    func fetchAccount() async throws -> TwilioAccount {
        try await get("\(accountBase).json")
    }

    func fetchBalance() async throws -> TwilioBalance {
        try await get("\(accountBase)/Balance.json")
    }

    func fetchUsage(period: UsagePeriod = .thisMonth) async throws -> [UsageRecord] {
        struct Page: Decodable { let usageRecords: [UsageRecord] }
        let page: Page = try await get("\(accountBase)/Usage/Records/\(period.rawValue).json", query: [("PageSize", "200")])
        return page.usageRecords
    }

    enum UsagePeriod: String, CaseIterable, Identifiable, Sendable {
        case today = "Today", yesterday = "Yesterday", thisMonth = "ThisMonth", lastMonth = "LastMonth", allTime = "AllTime"
        var id: String { rawValue }
        var title: String {
            switch self {
            case .today: return "Today"
            case .yesterday: return "Yesterday"
            case .thisMonth: return "This Month"
            case .lastMonth: return "Last Month"
            case .allTime: return "All Time"
            }
        }
    }

    // MARK: Numbers

    func fetchIncomingNumbers() async throws -> [IncomingPhoneNumber] {
        struct Page: Decodable { let incomingPhoneNumbers: [IncomingPhoneNumber] }
        let page: Page = try await get("\(accountBase)/IncomingPhoneNumbers.json", query: [("PageSize", "1000")])
        return page.incomingPhoneNumbers
    }

    func fetchVerifiedCallerIds() async throws -> [OutgoingCallerId] {
        struct Page: Decodable { let outgoingCallerIds: [OutgoingCallerId] }
        let page: Page = try await get("\(accountBase)/OutgoingCallerIds.json", query: [("PageSize", "1000")])
        return page.outgoingCallerIds
    }

    func fetchMessagingServices() async throws -> [MessagingService] {
        struct Page: Decodable { let services: [MessagingService] }
        let page: Page = try await get("https://messaging.twilio.com/v1/Services", query: [("PageSize", "100")])
        return page.services
    }

    // MARK: Messages

    struct MessagesPage: Decodable, Sendable { let messages: [TwilioMessage]; let nextPageUri: String? }

    func fetchMessages(pageSize: Int = 200, to: String? = nil, from: String? = nil) async throws -> MessagesPage {
        var q = [("PageSize", String(pageSize))]
        if let to { q.append(("To", to)) }
        if let from { q.append(("From", from)) }
        return try await get("\(accountBase)/Messages.json", query: q)
    }

    func fetchMessage(sid: String) async throws -> TwilioMessage {
        try await get("\(accountBase)/Messages/\(sid).json")
    }

    func sendMessage(_ m: OutgoingMessage) async throws -> TwilioMessage {
        var form: [(String, String)] = [("To", m.to)]
        if let service = m.messagingServiceSid?.nilIfBlank {
            form.append(("MessagingServiceSid", service))
        } else if let from = m.from?.nilIfBlank {
            form.append(("From", from))
        } else {
            throw ClientError.invalidInput("Choose a number to send from.")
        }
        if !m.body.isEmpty { form.append(("Body", m.body)) }
        for url in m.mediaURLs { form.append(("MediaUrl", url.absoluteString)) }
        if let sendAt = m.sendAt {
            guard m.messagingServiceSid?.nilIfBlank != nil else {
                throw ClientError.invalidInput("Scheduling requires a Messaging Service SID (Settings → Account).")
            }
            form.append(("ScheduleType", "fixed"))
            form.append(("SendAt", sendAt.ISO8601Format()))
        }
        return try await send("POST", "\(accountBase)/Messages.json", form: form)
    }

    func cancelScheduledMessage(sid: String) async throws -> TwilioMessage {
        try await send("POST", "\(accountBase)/Messages/\(sid).json", form: [("Status", "canceled")])
    }

    func deleteCall(sid: String) async throws {
        try await sendNoContent("DELETE", "\(accountBase)/Calls/\(sid).json")
    }

    func deleteMessage(sid: String) async throws {
        try await sendNoContent("DELETE", "\(accountBase)/Messages/\(sid).json")
    }

    func fetchMedia(messageSid: String) async throws -> [TwilioMedia] {
        struct Page: Decodable { let mediaList: [TwilioMedia] }
        let page: Page = try await get("\(accountBase)/Messages/\(messageSid)/Media.json")
        return page.mediaList
    }

    /// Downloads the binary content of an MMS attachment (requires auth).
    func downloadMedia(_ media: TwilioMedia) async throws -> Data {
        guard var uri = media.uri else { throw ClientError.invalidResponse }
        if uri.hasSuffix(".json") { uri.removeLast(5) }
        return try await rawData("\(Self.apiHost)\(uri)")
    }

    // MARK: Calls

    struct CallsPage: Decodable, Sendable { let calls: [TwilioCall]; let nextPageUri: String? }

    func fetchCalls(pageSize: Int = 100, to: String? = nil, from: String? = nil) async throws -> CallsPage {
        var q = [("PageSize", String(pageSize))]
        if let to { q.append(("To", to)) }
        if let from { q.append(("From", from)) }
        return try await get("\(accountBase)/Calls.json", query: q)
    }

    func fetchCall(sid: String) async throws -> TwilioCall {
        try await get("\(accountBase)/Calls/\(sid).json")
    }

    func fetchChildCalls(parentSid: String) async throws -> [TwilioCall] {
        let page: CallsPage = try await get("\(accountBase)/Calls.json", query: [("ParentCallSid", parentSid)])
        return page.calls
    }

    func placeCall(_ c: OutgoingCall) async throws -> TwilioCall {
        let twiml = try TwiML.build(for: c)
        let to: String
        switch c.mode {
        case .bridge:
            guard let me = c.personalPhone.nilIfBlank else {
                throw ClientError.invalidInput("Add your own phone number in Settings to place two-way calls.")
            }
            to = me
        default:
            to = c.destination
        }
        var form: [(String, String)] = [("To", to), ("From", c.from), ("Twiml", twiml), ("Timeout", String(c.timeout))]
        if c.record && c.mode != .bridge {
            form.append(("Record", "true"))
        }
        if c.machineDetection && c.mode != .bridge { form.append(("MachineDetection", "Enable")) }
        if let digits = c.sendDigits.nilIfBlank, c.mode != .bridge { form.append(("SendDigits", digits)) }
        return try await send("POST", "\(accountBase)/Calls.json", form: form)
    }

    /// Hangs up an in-progress call, or cancels a queued/ringing one.
    func endCall(sid: String, cancel: Bool = false) async throws -> TwilioCall {
        try await send("POST", "\(accountBase)/Calls/\(sid).json", form: [("Status", cancel ? "canceled" : "completed")])
    }

    /// Redirects a live call to speak something new (e.g. "Say" during a call).
    func updateCallTwiML(sid: String, twiml: String) async throws -> TwilioCall {
        try await send("POST", "\(accountBase)/Calls/\(sid).json", form: [("Twiml", twiml)])
    }

    // MARK: Recordings

    func fetchRecordings(callSid: String? = nil, pageSize: Int = 100) async throws -> [TwilioRecording] {
        struct Page: Decodable { let recordings: [TwilioRecording] }
        var q = [("PageSize", String(pageSize))]
        if let callSid { q.append(("CallSid", callSid)) }
        let page: Page = try await get("\(accountBase)/Recordings.json", query: q)
        return page.recordings
    }

    /// Downloads a recording as MP3 to a temporary file and returns its URL (playable with AVPlayer).
    func downloadRecording(sid: String) async throws -> URL {
        let data = try await rawData("\(accountBase)/Recordings/\(sid).mp3")
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("\(sid).mp3")
        try data.write(to: url, options: .atomic)
        return url
    }

    func deleteRecording(sid: String) async throws {
        try await sendNoContent("DELETE", "\(accountBase)/Recordings/\(sid).json")
    }

    // MARK: Lookup

    /// Twilio Lookup v2. Basic validation is free; `lineType` / `callerName` are paid add-ons.
    func lookup(_ number: String, lineType: Bool = false, callerName: Bool = false) async throws -> LookupResult {
        var fields: [String] = []
        if lineType { fields.append("line_type_intelligence") }
        if callerName { fields.append("caller_name") }
        let encoded = number.addingPercentEncoding(withAllowedCharacters: .alphanumerics) ?? number
        let q = fields.isEmpty ? [] : [("Fields", fields.joined(separator: ","))]
        return try await get("https://lookups.twilio.com/v2/PhoneNumbers/\(encoded)", query: q)
    }

    // MARK: - Transport

    private func get<T: Decodable>(_ url: String, query: [(String, String)] = []) async throws -> T {
        try await send("GET", url, query: query)
    }

    private func send<T: Decodable>(_ method: String, _ url: String, query: [(String, String)] = [], form: [(String, String)] = []) async throws -> T {
        let data = try await perform(method, url, query: query, form: form)
        do {
            return try Self.decoder().decode(T.self, from: data)
        } catch {
            #if DEBUG
            print("Decode error for \(url): \(error)\n\(String(data: data, encoding: .utf8) ?? "")")
            #endif
            throw error
        }
    }

    private func sendNoContent(_ method: String, _ url: String) async throws {
        _ = try await perform(method, url, query: [], form: [])
    }

    private func rawData(_ url: String) async throws -> Data {
        try await perform("GET", url, query: [], form: [])
    }

    private func perform(_ method: String, _ urlString: String, query: [(String, String)], form: [(String, String)]) async throws -> Data {
        guard var comps = URLComponents(string: urlString) else { throw ClientError.invalidResponse }
        if !query.isEmpty { comps.queryItems = query.map { URLQueryItem(name: $0.0, value: $0.1) } }
        guard let url = comps.url else { throw ClientError.invalidResponse }
        if credentials.accountSid == DemoBackend.accountSid {
            return try await DemoBackend.shared.handle(method: method, url: url, form: form)
        }

        var req = URLRequest(url: url, timeoutInterval: 30)
        req.httpMethod = method
        let token = Data("\(credentials.username):\(credentials.secret)".utf8).base64EncodedString()
        req.setValue("Basic \(token)", forHTTPHeaderField: "Authorization")
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        if !form.isEmpty {
            req.setValue("application/x-www-form-urlencoded; charset=utf-8", forHTTPHeaderField: "Content-Type")
            req.httpBody = Data(Self.formEncode(form).utf8)
        }

        let (data, response) = try await session.data(for: req)
        guard let http = response as? HTTPURLResponse else { throw ClientError.invalidResponse }
        guard (200..<300).contains(http.statusCode) else {
            if let apiError = try? Self.decoder().decode(TwilioAPIError.self, from: data) { throw apiError }
            throw ClientError.http(http.statusCode)
        }
        return data
    }

    private static func formEncode(_ pairs: [(String, String)]) -> String {
        var allowed = CharacterSet.alphanumerics
        allowed.insert(charactersIn: "-._~")
        return pairs.map { k, v in
            "\(k.addingPercentEncoding(withAllowedCharacters: allowed) ?? k)=\(v.addingPercentEncoding(withAllowedCharacters: allowed) ?? v)"
        }.joined(separator: "&")
    }

    static func decoder() -> JSONDecoder {
        let d = JSONDecoder()
        d.keyDecodingStrategy = .convertFromSnakeCase
        d.dateDecodingStrategy = .custom { decoder in
            let c = try decoder.singleValueContainer()
            let s = try c.decode(String.self)
            if let date = TwilioDate.parse(s) { return date }
            throw DecodingError.dataCorruptedError(in: c, debugDescription: "Unrecognized date: \(s)")
        }
        return d
    }
}

enum TwilioDate {
    /// Parses RFC 2822 (REST 2010 API) and ISO 8601 (v1/v2 APIs) dates.
    static func parse(_ s: String) -> Date? {
        let rfc = DateFormatter()
        rfc.locale = Locale(identifier: "en_US_POSIX")
        rfc.dateFormat = "EEE, dd MMM yyyy HH:mm:ss Z"
        if let d = rfc.date(from: s) { return d }
        if let d = try? Date(s, strategy: .iso8601) { return d }
        let iso = ISO8601DateFormatter()
        iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return iso.date(from: s)
    }
}

/// Builds inline TwiML so calls work with no webhook server.
enum TwiML {
    static let bridgeEchoURL = "https://twimlets.com/echo?Twiml="

    static func build(for c: OutgoingCall) throws -> String {
        let body: String
        switch c.mode {
        case .bridge:
            let record = c.record ? " record=\"record-from-answer-dual\"" : ""
            let dial = "<Dial callerId=\"\(escape(c.from))\" timeout=\"\(c.timeout)\"\(record) answerOnBridge=\"true\">"
                + "<Number\(c.sendDigits.nilIfBlank.map { " sendDigits=\"\(escape($0))\"" } ?? "")>\(escape(c.destination))</Number></Dial>"
            if c.confirmBeforeConnect {
                // Your phone is called first. The other person is only dialed after you press a key,
                // so voicemail, call screening or carrier "answers" can never leave them waiting on hold.
                // Without a webhook server, the follow-up TwiML is served by Twilio's Echo Twimlet.
                let next = "<Response><Say voice=\"Polly.Joanna-Neural\">Connecting.</Say>\(dial)</Response>"
                let action = bridgeEchoURL + (next.addingPercentEncoding(withAllowedCharacters: .alphanumerics) ?? "")
                let ending = String(c.destination.filter(\.isNumber).suffix(4)).map(String.init).joined(separator: " ")
                body = "<Gather numDigits=\"1\" timeout=\"8\" method=\"GET\" action=\"\(escape(action))\">"
                    + "<Say voice=\"Polly.Joanna-Neural\" loop=\"2\">Dialbubble call to the number ending \(ending). Press any key to connect.</Say>"
                    + "</Gather>"
                    + "<Say voice=\"Polly.Joanna-Neural\">No key pressed, so the call was cancelled. Goodbye.</Say><Hangup/>"
            } else {
                body = "<Say voice=\"Polly.Joanna-Neural\">Connecting your call.</Say>" + dial
            }
        case .say:
            guard let text = c.message.nilIfBlank else { throw ClientError.invalidInput("Enter a message to speak.") }
            body = say(text, voice: c.voice, loop: c.loop)
        case .play:
            guard let url = c.audioURL.nilIfBlank, URL(string: url)?.scheme?.hasPrefix("http") == true else {
                throw ClientError.invalidInput("Enter a valid public audio URL (https://…).")
            }
            body = "<Play loop=\"\(max(1, c.loop))\">\(escape(url))</Play>"
        case .twiml:
            guard let raw = c.customTwiML.nilIfBlank else { throw ClientError.invalidInput("Enter TwiML to run.") }
            if raw.contains("<Response") {
                guard raw.utf8.count <= 4000 else { throw ClientError.invalidInput("TwiML is too long (4,000 character limit).") }
                return raw
            }
            body = raw
        }
        let xml = "<Response>\(body)</Response>"
        guard xml.utf8.count <= 4000 else { throw ClientError.invalidInput("TwiML is too long (4,000 character limit).") }
        return xml
    }

    static func say(_ text: String, voice: VoiceOption, loop: Int = 1) -> String {
        "<Say voice=\"\(escape(voice.voice))\" language=\"\(voice.language)\" loop=\"\(max(1, loop))\">\(escape(text))</Say>"
    }

    static func escape(_ s: String) -> String {
        s.replacingOccurrences(of: "&", with: "&amp;")
            .replacingOccurrences(of: "<", with: "&lt;")
            .replacingOccurrences(of: ">", with: "&gt;")
            .replacingOccurrences(of: "\"", with: "&quot;")
            .replacingOccurrences(of: "'", with: "&apos;")
    }
}
