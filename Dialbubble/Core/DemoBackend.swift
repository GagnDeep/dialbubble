import Foundation

/// An in-memory simulation of the Twilio REST API used by Demo Mode.
/// Lets people explore every screen before connecting a real account (and powers UI tests).
actor DemoBackend {
    static let shared = DemoBackend()
    static let accountSid = "AC00000000000000000000000000000000"
    static let secret = "demo"

    static let mainNumber = "+14155550101"
    static let supportNumber = "+14155550102"
    static let ukNumber = "+447700900123"
    static let verifiedNumber = "+14155550199"

    private var messages: [[String: Any]] = []
    private var calls: [String: [String: Any]] = [:]   // sid → call
    private var callCreated: [String: Date] = [:]
    private var callEnded: [String: Date] = [:]
    private var messageCreated: [String: Date] = [:]
    private var seeded = false

    // MARK: Routing

    func handle(method: String, url: URL, form: [(String, String)]) async throws -> Data {
        seedIfNeeded()
        try await Task.sleep(for: .milliseconds(Int.random(in: 250...600)))
        let path = url.path
        let query = Dictionary(URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems?.map { ($0.name, $0.value ?? "") } ?? [], uniquingKeysWith: { a, _ in a })
        let params = Dictionary(form, uniquingKeysWith: { a, _ in a })

        if url.host == "lookups.twilio.com" { return json(lookup(path: path, query: query)) }
        if url.host == "messaging.twilio.com" {
            return json(["services": [["sid": "MG00000000000000000000000000000001", "friendly_name": "Demo Messaging Service"]]])
        }

        let base = "/2010-04-01/Accounts/\(Self.accountSid)"
        let sub = path.hasPrefix(base) ? String(path.dropFirst(base.count)) : path

        switch (method, sub) {
        case ("GET", ".json"): return json(account)
        case ("GET", "/Balance.json"): return json(["balance": "18.42", "currency": "USD", "account_sid": Self.accountSid])
        case ("GET", "/IncomingPhoneNumbers.json"): return json(["incoming_phone_numbers": incomingNumbers])
        case ("GET", "/OutgoingCallerIds.json"):
            return json(["outgoing_caller_ids": [["sid": "PN00000000000000000000000000000099", "phone_number": Self.verifiedNumber, "friendly_name": "My Mobile"]]])
        case ("GET", let p) where p.hasPrefix("/Usage/Records/"): return json(["usage_records": usage])
        case ("GET", "/Messages.json"): return json(["messages": listMessages(query), "next_page_uri": NSNull()])
        case ("POST", "/Messages.json"): return try json(createMessage(params))
        case ("GET", "/Calls.json"):
            if let parent = query["ParentCallSid"] { return json(["calls": childCalls(parent), "next_page_uri": NSNull()]) }
            return json(["calls": listCalls(), "next_page_uri": NSNull()])
        case ("POST", "/Calls.json"): return try json(createCall(params))
        case ("GET", "/Recordings.json"): return json(["recordings": [[String: Any]]()])
        default: break
        }

        let parts = sub.split(separator: "/").map(String.init)
        if parts.count == 2, parts[0] == "Messages", parts[1].hasSuffix(".json") {
            let sid = String(parts[1].dropLast(5))
            if method == "DELETE" { messages.removeAll { $0["sid"] as? String == sid }; return Data() }
            if method == "POST", params["Status"] == "canceled" { updateMessage(sid) { $0["status"] = "canceled" } }
            guard let m = messages.first(where: { $0["sid"] as? String == sid }) else { throw notFound }
            return json(resolveMessage(m))
        }
        if parts.count == 3, parts[0] == "Messages", parts[2] == "Media.json" { return json(["media_list": [[String: Any]]()]) }
        if parts.count == 2, parts[0] == "Calls", parts[1].hasSuffix(".json") {
            let sid = String(parts[1].dropLast(5))
            if method == "DELETE" { calls[sid] = nil; return Data() }
            if method == "POST", let status = params["Status"] { callEnded[sid] = .now; calls[sid]?["final"] = status }
            guard let c = calls[sid] else { throw notFound }
            return json(resolveCall(c))
        }
        throw notFound
    }

    private var notFound: TwilioAPIError {
        TwilioAPIError(code: 20404, message: "The requested resource was not found", moreInfo: "https://www.twilio.com/docs/errors/20404", status: 404)
    }

    // MARK: Fixtures

    private var account: [String: Any] {
        ["sid": Self.accountSid, "friendly_name": LaunchOptions.marketing ? "Northside Studio" : "Demo Workspace", "status": "active", "type": LaunchOptions.trialDemo ? "Trial" : "Full", "date_created": rfc(.now.addingTimeInterval(-86400 * 200))]
    }

    private var incomingNumbers: [[String: Any]] {
        [
            ["sid": "PN01", "phone_number": Self.mainNumber, "friendly_name": "Main Line", "capabilities": ["voice": true, "sms": true, "mms": true, "fax": false]],
            ["sid": "PN02", "phone_number": Self.supportNumber, "friendly_name": "Support", "capabilities": ["voice": true, "sms": true, "mms": false, "fax": false]],
            ["sid": "PN03", "phone_number": Self.ukNumber, "friendly_name": "London Office", "capabilities": ["voice": true, "sms": true, "mms": false, "fax": false]],
        ]
    }

    private var usage: [[String: Any]] {
        [
            usageRecord("sms-outbound", "Outbound SMS", 184, 1.43),
            usageRecord("sms-inbound", "Inbound SMS", 96, 0.76),
            usageRecord("calls-outbound", "Outbound Voice Minutes", 73, 1.02),
            usageRecord("calls-inbound", "Inbound Voice Minutes", 21, 0.18),
            usageRecord("phonenumbers", "Phone Numbers", 3, 3.45),
            usageRecord("recordings", "Recordings", 12, 0.03),
            usageRecord("lookups", "Lookups", 9, 0.0),
        ]
    }

    private func usageRecord(_ cat: String, _ desc: String, _ usage: Int, _ price: Double) -> [String: Any] {
        ["category": cat, "description": desc, "usage": String(usage), "usage_unit": cat.hasPrefix("calls") ? "minutes" : "count",
         "count": String(usage), "count_unit": "count", "price": String(format: "%.2f", price), "price_unit": "usd"]
    }

    private func seedIfNeeded() {
        guard !seeded else { return }
        seeded = true
        let people: [(String, String, [(Bool, String, TimeInterval)])] = [
            ("+14155550123", Self.mainNumber, [
                (true, "Hey! Are we still on for lunch tomorrow?", 3600 * 26),
                (false, "Yes! 12:30 at the usual place 🍜", 3600 * 25.8),
                (true, "Perfect, see you then", 3600 * 25.7),
                (false, "👍", 3600 * 25.6),
                (true, "Running 5 min late, sorry!", 1800),
            ]),
            ("+14155550145", Self.supportNumber, [
                (true, "Hi, my order #4821 hasn't arrived yet.", 3600 * 5),
                (false, "Sorry about that! It's out for delivery and should arrive by 6pm today. Track it at https://example.com/track/4821", 3600 * 4.9),
                (true, "Great, thank you so much!", 3600 * 4.5),
            ]),
            ("+12125550188", Self.mainNumber, [
                (false, "Reminder: your appointment is tomorrow at 9:00 AM. Reply to confirm, or call (212) 555-0100 to reschedule.", 86400 * 2),
                (true, "Confirmed, see you at 9!", 86400 * 2 - 600),
                (false, "Thanks, you're confirmed ✅", 86400 * 2 - 590),
            ]),
            ("+447700900456", Self.ukNumber, [
                (false, "Morning! Quick update on the London project — slides attached in email.", 86400 * 3),
                (true, "Cheers, will review this afternoon.", 86400 * 3 - 3000),
            ]),
            ("+13105550177", Self.supportNumber, [
                (false, "Your verification code is 482913", 86400 * 4),
            ]),
            ("+18885550134", Self.mainNumber, [
                (true, "Your Acme sign-in code is 730 194. Don't share it with anyone.", 86400 * 3.5),
            ]),
        ]
        var n = 0
        for (them, us, thread) in people {
            for (inbound, body, ago) in thread {
                n += 1
                let date = Date.now.addingTimeInterval(-ago)
                messages.append(message(sid: String(format: "SM%032d", n), from: inbound ? them : us, to: inbound ? us : them,
                                        body: body, inbound: inbound, status: inbound ? "received" : "delivered", date: date))
            }
        }
        // One failed message to show error handling.
        n += 1
        var failed = message(sid: String(format: "SM%032d", n), from: Self.mainNumber, to: "+15005550001", body: "Testing a bad number",
                             inbound: false, status: "undelivered", date: .now.addingTimeInterval(-86400 * 5))
        failed["error_code"] = 30006
        failed["error_message"] = "Landline or unreachable carrier"
        messages.append(failed)

        let callSeeds: [(String, String, Bool, String, Int, TimeInterval)] = [
            ("+14155550123", Self.mainNumber, false, "completed", 312, 3600 * 2),
            ("+14155550145", Self.supportNumber, true, "completed", 95, 3600 * 6),
            ("+12125550188", Self.mainNumber, false, "no-answer", 0, 86400),
            ("+16505550110", Self.mainNumber, true, "completed", 47, 86400 * 1.5),
            ("+447700900456", Self.ukNumber, false, "completed", 624, 86400 * 3),
            ("+13105550177", Self.supportNumber, false, "busy", 0, 86400 * 4),
            ("+14155550123", Self.mainNumber, true, "no-answer", 0, 86400 * 5),
        ]
        for (i, s) in callSeeds.enumerated() {
            let sid = String(format: "CA%032d", i + 1)
            let start = Date.now.addingTimeInterval(-s.5)
            calls[sid] = [
                "sid": sid, "from": s.2 ? s.0 : s.1, "to": s.2 ? s.1 : s.0, "status": s.3,
                "direction": s.2 ? "inbound" : "outbound-api", "duration": String(s.4),
                "start_time": rfc(start), "end_time": rfc(start.addingTimeInterval(TimeInterval(s.4))),
                "date_created": rfc(start), "price": s.4 > 0 ? "-0.0140" : NSNull(), "price_unit": "USD",
                "answered_by": NSNull(), "parent_call_sid": NSNull(), "seed": true,
            ]
        }
    }

    private func message(sid: String, from: String, to: String, body: String, inbound: Bool, status: String, date: Date) -> [String: Any] {
        [
            "sid": sid, "from": from, "to": to, "body": body, "status": status,
            "direction": inbound ? "inbound" : "outbound-api", "date_created": rfc(date), "date_sent": rfc(date),
            "date_updated": rfc(date), "num_media": "0", "num_segments": "1",
            "price": inbound ? "-0.0079" : "-0.0079", "price_unit": "USD", "error_code": NSNull(), "error_message": NSNull(),
            "messaging_service_sid": NSNull(),
        ]
    }

    // MARK: Messages

    private func listMessages(_ query: [String: String]) -> [[String: Any]] {
        messages
            .filter(visible)
            .map(resolveMessage)
            .filter { m in
                (query["To"].map { m["to"] as? String == $0 } ?? true) && (query["From"].map { m["from"] as? String == $0 } ?? true)
            }
            .sorted { Self.created($0) > Self.created($1) }
    }

    private func createMessage(_ p: [String: String]) throws -> [String: Any] {
        guard let to = p["To"], PhoneFormat.isPlausible(to) else {
            throw TwilioAPIError(code: 21211, message: "The 'To' number \(p["To"] ?? "") is not a valid phone number.", moreInfo: nil, status: 400)
        }
        let from = p["From"] ?? Self.mainNumber
        let sid = "SM" + UUID().uuidString.replacingOccurrences(of: "-", with: "").lowercased()
        var m = message(sid: sid, from: from, to: to, body: p["Body"] ?? "", inbound: false, status: "queued", date: .now)
        let body = p["Body"] ?? ""
        m["num_segments"] = String(max(1, Int(ceil(Double(body.count) / 153))))
        if p["ScheduleType"] == "fixed" {
            m["status"] = "scheduled"
            m["messaging_service_sid"] = p["MessagingServiceSid"] ?? NSNull()
            if let at = p["SendAt"].flatMap(TwilioDate.parse) { m["date_sent"] = rfc(at); m["date_created"] = rfc(.now) }
        }
        if let media = p["MediaUrl"], !media.isEmpty { m["num_media"] = "1" }
        messageCreated[sid] = .now
        messages.append(m)

        // Simulate a friendly auto-reply for regular messages.
        if m["status"] as? String == "queued" {
            let reply = message(sid: "SM" + UUID().uuidString.replacingOccurrences(of: "-", with: "").lowercased(),
                                from: to, to: from, body: Self.replies.randomElement()!, inbound: true, status: "received",
                                date: .now.addingTimeInterval(6))
            messages.append(reply.merging(["pending_until": rfc(.now.addingTimeInterval(6))]) { $1 })
        }
        return m
    }

    private static let replies = ["Got it, thanks! 👍", "Sounds good!", "On my way 🚗", "Thanks for the update.", "Perfect 🙌"]

    private func resolveMessage(_ m: [String: Any]) -> [String: Any] {
        var m = m
        if let sid = m["sid"] as? String, let created = messageCreated[sid], m["status"] as? String != "scheduled", m["status"] as? String != "canceled" {
            let age = Date.now.timeIntervalSince(created)
            m["status"] = age < 1.5 ? "queued" : age < 3 ? "sent" : "delivered"
        }
        m.removeValue(forKey: "pending_until")
        return m
    }

    private func updateMessage(_ sid: String, _ change: (inout [String: Any]) -> Void) {
        guard let i = messages.firstIndex(where: { $0["sid"] as? String == sid }) else { return }
        change(&messages[i])
        messageCreated[sid] = nil
    }

    // Hide auto-replies until their simulated arrival time.
    private func visible(_ m: [String: Any]) -> Bool {
        guard let until = (m["pending_until"] as? String).flatMap(TwilioDate.parse) else { return true }
        return Date.now >= until
    }

    // MARK: Calls

    private func listCalls() -> [[String: Any]] {
        calls.values
            .filter { $0["parent_call_sid"] is NSNull }
            .map(resolveCall)
            .sorted { Self.created($0) > Self.created($1) }
    }

    private func createCall(_ p: [String: String]) throws -> [String: Any] {
        guard let to = p["To"], PhoneFormat.isPlausible(to) else {
            throw TwilioAPIError(code: 21211, message: "The 'To' number is not a valid phone number.", moreInfo: nil, status: 400)
        }
        let sid = "CA" + UUID().uuidString.replacingOccurrences(of: "-", with: "").lowercased()
        let call: [String: Any] = [
            "sid": sid, "from": p["From"] ?? Self.mainNumber, "to": to, "status": "queued", "direction": "outbound-api",
            "duration": NSNull(), "start_time": NSNull(), "end_time": NSNull(), "date_created": rfc(.now),
            "price": NSNull(), "price_unit": "USD", "answered_by": NSNull(), "parent_call_sid": NSNull(),
            "twiml": p["Twiml"] ?? "",
        ]
        calls[sid] = call
        callCreated[sid] = .now
        // A bridge call dials a second leg once the user answers.
        // With "press a key to connect", the Dial lives URL-encoded inside the Gather's Echo action.
        let rawTwiml = p["Twiml"].map { $0.replacingOccurrences(of: "&amp;", with: "&").removingPercentEncoding ?? $0 }
        if let twiml = rawTwiml, twiml.contains("<Dial"),
           let dest = twiml.range(of: "<Number[^>]*>([^<]+)</Number>", options: .regularExpression).map({ String(twiml[$0]) }) {
            let number = dest.replacingOccurrences(of: "<[^>]+>", with: "", options: .regularExpression)
            let child = "CA" + UUID().uuidString.replacingOccurrences(of: "-", with: "").lowercased()
            calls[child] = [
                "sid": child, "from": p["From"] ?? Self.mainNumber, "to": number, "status": "queued", "direction": "outbound-dial",
                "duration": NSNull(), "start_time": NSNull(), "end_time": NSNull(), "date_created": rfc(.now.addingTimeInterval(4)),
                "price": NSNull(), "price_unit": "USD", "answered_by": NSNull(), "parent_call_sid": sid,
            ]
            callCreated[child] = .now.addingTimeInterval(4)
        }
        return resolveCall(call)
    }

    private func childCalls(_ parent: String) -> [[String: Any]] {
        calls.values.filter { $0["parent_call_sid"] as? String == parent }
            .filter { (callCreated[$0["sid"] as? String ?? ""] ?? .distantPast) <= .now }
            .map(resolveCall)
    }

    /// Advances a simulated call: queued → ringing (1.5s) → in-progress (5s) → completed (after ~45s or when ended).
    private func resolveCall(_ c: [String: Any]) -> [String: Any] {
        var c = c
        c.removeValue(forKey: "twiml")
        if c["seed"] != nil { c.removeValue(forKey: "seed"); return c }
        guard let sid = c["sid"] as? String, let created = callCreated[sid] else { return c }
        let parent = (c["parent_call_sid"] as? String)
        let endedAt = callEnded[sid] ?? parent.flatMap { callEnded[$0] }
        let now = Date.now
        let age = now.timeIntervalSince(created)
        let answerAt = created.addingTimeInterval(5)
        let autoEnd = created.addingTimeInterval(45)

        if let endedAt = endedAt ?? (now >= autoEnd ? autoEnd : nil) {
            let answered = endedAt > answerAt
            c["status"] = answered ? "completed" : ((c["final"] as? String) == "canceled" ? "canceled" : "no-answer")
            if answered {
                c["start_time"] = rfc(answerAt)
                c["end_time"] = rfc(endedAt)
                c["duration"] = String(Int(endedAt.timeIntervalSince(answerAt)))
                c["price"] = "-0.0140"
            }
        } else if age < 1.5 {
            c["status"] = "queued"
        } else if age < 5 {
            c["status"] = "ringing"
        } else {
            c["status"] = "in-progress"
            c["start_time"] = rfc(answerAt)
        }
        c.removeValue(forKey: "final")
        return c
    }

    // MARK: Lookup

    private func lookup(path: String, query: [String: String]) -> [String: Any] {
        let raw = (path.components(separatedBy: "/").last ?? "").removingPercentEncoding ?? ""
        let digits = raw.filter(\.isNumber)
        let valid = digits.count >= 8 && digits.count <= 15
        let fields = query["Fields"] ?? ""
        var r: [String: Any] = [
            "phone_number": "+" + digits, "national_format": PhoneFormat.display("+" + digits),
            "country_code": digits.hasPrefix("44") ? "GB" : digits.hasPrefix("91") ? "IN" : "US",
            "calling_country_code": digits.hasPrefix("44") ? "44" : digits.hasPrefix("91") ? "91" : "1",
            "valid": valid, "validation_errors": valid ? [String]() : ["TOO_SHORT"],
        ]
        if fields.contains("line_type_intelligence") {
            r["line_type_intelligence"] = ["type": "mobile", "carrier_name": "Demo Wireless", "mobile_country_code": "310", "mobile_network_code": "260", "error_code": NSNull()]
        }
        if fields.contains("caller_name") {
            r["caller_name"] = ["caller_name": "JANE APPLESEED", "caller_type": "CONSUMER", "error_code": NSNull()]
        }
        return r
    }

    // MARK: Helpers

    private static func created(_ m: [String: Any]) -> Date {
        guard let s = m["date_created"] as? String else { return .distantPast }
        return TwilioDate.parse(s) ?? .distantPast
    }

    private func json(_ object: Any) -> Data {
        return (try? JSONSerialization.data(withJSONObject: object)) ?? Data("{}".utf8)
    }

    private func rfc(_ date: Date) -> String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = TimeZone(identifier: "UTC")
        f.dateFormat = "EEE, dd MMM yyyy HH:mm:ss Z"
        return f.string(from: date)
    }

    /// Clears simulated activity (used when leaving demo mode).
    func reset() {
        messages = []; calls = [:]; callCreated = [:]; callEnded = [:]; messageCreated = [:]; seeded = false
    }
}
