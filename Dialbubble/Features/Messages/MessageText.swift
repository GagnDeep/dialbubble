import Foundation
import SwiftUI

/// Reads message bodies the way Messages does: tappable links and phone numbers, one-time codes, big emoji.
enum MessageText {
    // MARK: Links and phone numbers

    private static let detector = try? NSDataDetector(types: NSTextCheckingResult.CheckingType.link.rawValue
                                                      | NSTextCheckingResult.CheckingType.phoneNumber.rawValue)

    /// Detected links (web, email) and phone numbers, as tappable URLs. Phone numbers become `tel:` URLs.
    static func detections(in body: String) -> [(range: Range<String.Index>, url: URL)] {
        guard let detector else { return [] }
        let ns = NSRange(body.startIndex..., in: body)
        return detector.matches(in: body, range: ns).compactMap { match in
            guard let range = Range(match.range, in: body) else { return nil }
            if match.resultType == .phoneNumber, let phone = match.phoneNumber {
                let digits = phone.filter { $0.isNumber || $0 == "+" }
                guard digits.filter(\.isNumber).count >= 7, let url = URL(string: "tel:\(digits)") else { return nil }
                return (range, url)
            }
            guard let url = match.url else { return nil }
            return (range, url)
        }
    }

    @MainActor private static var cache: [String: AttributedString] = [:]

    /// The body with links underlined and tappable. Cached, because bubbles re-render often.
    @MainActor
    static func attributed(_ body: String) -> AttributedString {
        if let hit = cache[body] { return hit }
        var result = AttributedString(body)
        for found in detections(in: body) {
            guard let lower = AttributedString.Index(found.range.lowerBound, within: result),
                  let upper = AttributedString.Index(found.range.upperBound, within: result) else { continue }
            result[lower..<upper].link = found.url
            result[lower..<upper].underlineStyle = .single
        }
        if cache.count > 500 { cache.removeAll() }
        cache[body] = result
        return result
    }

    /// The number in a `tel:` URL, for routing into Dialbubble's own keypad.
    static func phone(from url: URL) -> String? {
        guard url.scheme?.lowercased() == "tel" else { return nil }
        let raw = url.absoluteString.dropFirst(4).removingPercentEncoding ?? String(url.absoluteString.dropFirst(4))
        let cleaned = raw.filter { $0.isNumber || $0 == "+" }
        return cleaned.isEmpty ? nil : cleaned
    }

    // MARK: One-time codes

    /// Whole words only, so "shopping" never counts as "pin".
    private static let codeWords = try? NSRegularExpression(
        pattern: #"\b(code|codes|otp|passcode|verification|verify|pin|one-time|security)\b"#, options: [.caseInsensitive])

    /// The verification code in a message like "Your verification code is 482913", or nil.
    /// Needs a code-ish word, then a standalone 4–8 digit token (dashes or spaces inside, like "482-913", are fine).
    static func oneTimeCode(in body: String) -> String? {
        guard let codeWords, codeWords.firstMatch(in: body, range: NSRange(body.startIndex..., in: body)) != nil else { return nil }
        let pattern = #"(?<![\d+\-/.:$])(\d{3}[- ]\d{3}|\d{4,8})(?!\d|[/:%]|\.\d|\s?(?:am|pm)\b)"#
        guard let regex = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive]) else { return nil }
        let phoneRanges = detections(in: body).filter { $0.url.scheme == "tel" }.map(\.range)
        for match in regex.matches(in: body, range: NSRange(body.startIndex..., in: body)) {
            guard let range = Range(match.range(at: 1), in: body) else { continue }
            if phoneRanges.contains(where: { $0.overlaps(range) }) { continue }
            let code = body[range].filter(\.isNumber)
            if (4...8).contains(code.count) { return String(code) }
        }
        return nil
    }

    // MARK: Emoji

    /// 1–3 emoji and nothing else: shown large, without a bubble.
    static func isBigEmoji(_ body: String) -> Bool {
        let trimmed = body.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, trimmed.count <= 3 else { return false }
        return trimmed.allSatisfy { ch in
            guard let first = ch.unicodeScalars.first else { return false }
            return first.properties.isEmojiPresentation
                || (first.properties.isEmoji && ch.unicodeScalars.count > 1)
        }
    }
}
