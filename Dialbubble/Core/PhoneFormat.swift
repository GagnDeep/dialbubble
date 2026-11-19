import Foundation

enum PhoneFormat {
    /// Normalizes user input into E.164 (e.g. "(415) 555-0100" → "+14155550100").
    static func e164(_ raw: String, defaultCountryCode: String = "1") -> String {
        var trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.hasPrefix("whatsapp:") || trimmed.hasPrefix("client:") || trimmed.hasPrefix("sip:") { return trimmed }
        // "+44 (0) 7700…" — drop the bracketed trunk zero used in some international formats.
        trimmed = trimmed.replacingOccurrences(of: "(0)", with: "")
        let digits = trimmed.filter(\.isNumber)
        guard !digits.isEmpty else { return "" }
        if trimmed.hasPrefix("+") { return "+" + digits }
        if trimmed.hasPrefix("00") { return "+" + digits.dropFirst(2) }
        let cc = defaultCountryCode.filter(\.isNumber)
        if cc == "1", digits.count == 11, digits.hasPrefix("1") { return "+" + digits }
        // Strip national trunk prefix "0" for non-NANP countries.
        let national = (cc != "1" && digits.hasPrefix("0")) ? String(digits.dropFirst()) : digits
        return "+" + cc + national
    }

    static func isPlausible(_ raw: String) -> Bool {
        let digits = raw.filter(\.isNumber)
        return digits.count >= 7 && digits.count <= 15
    }

    /// Human-friendly display of an E.164 number.
    static func display(_ number: String) -> String {
        var n = number
        var prefix = ""
        for p in ["whatsapp:", "client:", "sip:"] where n.hasPrefix(p) {
            n.removeFirst(p.count)
            prefix = p == "whatsapp:" ? "WhatsApp " : ""
        }
        guard n.hasPrefix("+") else { return prefix + n }
        let digits = n.filter(\.isNumber)
        if digits.count == 11, digits.hasPrefix("1") {
            let d = Array(digits)
            return prefix + "+1 (\(String(d[1...3]))) \(String(d[4...6]))-\(String(d[7...10]))"
        }
        if digits.count == 12, digits.hasPrefix("91") {
            let d = Array(digits)
            return prefix + "+91 \(String(d[2...6])) \(String(d[7...11]))"
        }
        if digits.count == 12, digits.hasPrefix("44") {
            let d = Array(digits)
            return prefix + "+44 \(String(d[2...5])) \(String(d[6...11]))"
        }
        // Generic grouping: country code (guess 1–3 digits) then groups of 3–4.
        let d = Array(digits)
        let ccLen = d.count > 11 ? 3 : 2
        let cc = String(d.prefix(ccLen))
        let rest = Array(d.dropFirst(ccLen))
        var groups: [String] = []
        var i = 0
        while i < rest.count {
            let len = (rest.count - i) == 4 ? 4 : min(3, rest.count - i)
            groups.append(String(rest[i..<(i + len)]))
            i += len
        }
        return prefix + "+\(cc) " + groups.joined(separator: " ")
    }

    /// Very short label (e.g. last 4 digits) for chips.
    static func short(_ number: String) -> String {
        let digits = number.filter(\.isNumber)
        return digits.count > 4 ? "••\(digits.suffix(4))" : number
    }
}

extension Int {
    /// "1:05" / "12:03:09"
    var durationString: String {
        let h = self / 3600, m = (self % 3600) / 60, s = self % 60
        return h > 0 ? String(format: "%d:%02d:%02d", h, m, s) : String(format: "%d:%02d", m, s)
    }

}

extension PhoneFormat {
    // MARK: Countries

    /// Calling code → region, for the countries people most often text or call. Longest codes are tried first.
    private static let regions: [String: String] = [
        "1": "US", "7": "RU", "20": "EG", "27": "ZA", "30": "GR", "31": "NL", "32": "BE", "33": "FR", "34": "ES",
        "36": "HU", "39": "IT", "40": "RO", "41": "CH", "43": "AT", "44": "GB", "45": "DK", "46": "SE", "47": "NO",
        "48": "PL", "49": "DE", "51": "PE", "52": "MX", "54": "AR", "55": "BR", "56": "CL", "57": "CO", "58": "VE",
        "60": "MY", "61": "AU", "62": "ID", "63": "PH", "64": "NZ", "65": "SG", "66": "TH", "81": "JP", "82": "KR",
        "84": "VN", "86": "CN", "90": "TR", "91": "IN", "92": "PK", "93": "AF", "94": "LK", "95": "MM", "98": "IR",
        "212": "MA", "234": "NG", "254": "KE", "351": "PT", "353": "IE", "354": "IS", "358": "FI", "380": "UA",
        "420": "CZ", "852": "HK", "880": "BD", "886": "TW", "966": "SA", "971": "AE", "972": "IL", "977": "NP",
    ]

    /// The region of an E.164 number ("+44…" → "GB"), or nil when unknown or not E.164.
    static func region(of number: String) -> String? {
        guard number.hasPrefix("+") else { return nil }
        let digits = number.filter(\.isNumber)
        for length in [3, 2, 1] where digits.count > length {
            if let region = regions[String(digits.prefix(length))] { return region }
        }
        return nil
    }

    /// A flag for numbers from another country than `homeCountryCode` ("1" → US/Canada), else nil.
    static func foreignFlag(_ number: String, homeCountryCode: String) -> String? {
        let cc = homeCountryCode.filter(\.isNumber)
        guard let region = region(of: number), !number.filter(\.isNumber).hasPrefix(cc) || cc.isEmpty else { return nil }
        return flag(region)
    }

    static func flag(_ region: String) -> String {
        String(String.UnicodeScalarView(region.uppercased().unicodeScalars.compactMap { UnicodeScalar(127397 + $0.value) }))
    }

    /// "United Kingdom" for VoiceOver.
    static func countryName(of number: String) -> String? {
        region(of: number).flatMap { Locale.current.localizedString(forRegionCode: $0) }
    }
}
