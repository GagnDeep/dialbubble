import Contacts
import Foundation
import UIKit
import Observation

/// Resolves phone numbers to names from the iPhone's Contacts, so lists show "Dana Kim" instead of "(415) 555-0123".
/// Read-only, on-device, and opt-in: nothing loads until the user grants access. Demo Mode uses built-in names.
@MainActor
@Observable
final class ContactBook {
    static let shared = ContactBook()

    enum Access: Equatable { case notDetermined, granted, denied }

    private(set) var access: Access = .notDetermined
    /// Last-10-digit key → display name.
    private var names: [String: String] = [:]
    /// Every (name, number) pair, for keypad suggestions.
    private var people: [Person] = []
    /// Last-10-digit key → contact thumbnail (small JPEG/PNG data from Contacts).
    private var photoData: [String: Data] = [:]
    @ObservationIgnored private var photoCache: [String: UIImage] = [:]

    struct Person: Equatable, Sendable {
        let name: String
        let number: String
    }
    /// Names for Demo Mode's sample numbers, so the demo looks like a real phone.
    var demoEnabled = false

    private static let demoNames: [String: String] = [
        "4155550123": "Dana Kim",
        "4155550145": "Marco Ruiz",
        "2125550188": "Priya Shah",
        "6505550110": "Sam Okafor",
        "7700900456": "Olivia Bennett",
        "3105550177": "Leo Martin",
    ]

    private var changeObserver: NSObjectProtocol?

    private init() {
        refreshAccess()
        // Stay current when Contacts change while Dialbubble is open (iCloud sync, edits in another app).
        changeObserver = NotificationCenter.default.addObserver(forName: .CNContactStoreDidChange, object: nil, queue: .main) { _ in
            Task { @MainActor in await ContactBook.shared.load() }
        }
    }

    func refreshAccess() {
        switch CNContactStore.authorizationStatus(for: .contacts) {
        case .authorized, .limited: access = .granted
        case .notDetermined: access = .notDetermined
        default: access = .denied
        }
    }

    /// Asks for Contacts access (only prompts once; iOS remembers the answer) and loads names.
    @discardableResult
    func requestAccess() async -> Bool {
        let granted = (try? await CNContactStore().requestAccess(for: .contacts)) ?? false
        refreshAccess()
        if granted { await load() }
        return granted
    }

    /// Loads (or reloads) the name index off the main thread. No-op without access.
    func load() async {
        refreshAccess()
        guard access == .granted else { names = [:]; people = []; photoData = [:]; return }
        let index = await Task.detached(priority: .utility) { Self.buildIndex() }.value
        if names != index.names { names = index.names }
        people = index.people
        if photoData != index.photos {
            photoCache = [:]
            photoData = index.photos
        }
    }

    nonisolated private static func buildIndex() -> (names: [String: String], people: [Person], photos: [String: Data]) {
        let store = CNContactStore()
        let keys: [CNKeyDescriptor] = [
            CNContactFormatter.descriptorForRequiredKeys(for: .fullName),
            CNContactPhoneNumbersKey as CNKeyDescriptor,
            CNContactOrganizationNameKey as CNKeyDescriptor,
            CNContactThumbnailImageDataKey as CNKeyDescriptor,
        ]
        var index: [String: String] = [:]
        var people: [Person] = []
        var photos: [String: Data] = [:]
        let request = CNContactFetchRequest(keysToFetch: keys)
        request.sortOrder = .userDefault
        try? store.enumerateContacts(with: request) { contact, _ in
            let full = CNContactFormatter.string(from: contact, style: .fullName)?.nilIfBlank
            guard let name = full ?? contact.organizationName.nilIfBlank else { return }
            for number in contact.phoneNumbers {
                let key = Self.key(number.value.stringValue)
                if !key.isEmpty, index[key] == nil {
                    index[key] = name
                    people.append(Person(name: name, number: number.value.stringValue))
                    if let thumb = contact.thumbnailImageData { photos[key] = thumb }
                }
            }
        }
        return (index, people, photos)
    }

    /// Matching key: the last 10 digits, which ignores country-code and formatting differences.
    nonisolated static func key(_ phone: String) -> String {
        let digits = phone.filter(\.isNumber)
        guard digits.count >= 7 else { return "" }
        return String(digits.suffix(10))
    }

    /// The contact name for a number, or nil when unknown.
    func name(for phone: String?) -> String? {
        guard let phone else { return nil }
        let key = Self.key(phone)
        guard !key.isEmpty else { return nil }
        if demoEnabled, let demo = Self.demoNames[key] { return demo }
        return names[key]
    }

    /// The contact's photo for a number, when they have one in Contacts.
    func photo(for phone: String?) -> UIImage? {
        guard let phone else { return nil }
        let key = Self.key(phone)
        guard !key.isEmpty, let data = photoData[key] else { return nil }
        if let hit = photoCache[key] { return hit }
        let image = UIImage(data: data)
        photoCache[key] = image
        return image
    }

    /// The best label for a number: the contact name, else the formatted number.
    func label(for phone: String) -> String {
        name(for: phone) ?? PhoneFormat.display(phone)
    }

    // MARK: Keypad suggestions

    /// People matching what's typed on the keypad: by number ("555 01…") or by spelling a name (3-2-6-2 → "Dana").
    func matches(forDigits typed: String, limit: Int = 3) -> [Person] {
        var pool = people
        if demoEnabled {
            pool = Self.demoNames.map { Person(name: $1, number: "+1" + $0) }.sorted { $0.name < $1.name } + pool
        }
        return Self.match(typed, in: pool, limit: limit)
    }

    /// People whose name has a word starting with `text` ("da" → Dana Kim), or whose number contains its digits.
    func search(_ text: String, limit: Int = 4) -> [Person] {
        var pool = people
        if demoEnabled {
            pool = Self.demoNames.map { Person(name: $1, number: "+1" + $0) }.sorted { $0.name < $1.name } + pool
        }
        return Self.search(text, in: pool, limit: limit)
    }

    nonisolated static func search(_ text: String, in pool: [Person], limit: Int) -> [Person] {
        let query = text.trimmingCharacters(in: .whitespaces).folding(options: [.caseInsensitive, .diacriticInsensitive], locale: nil)
        guard !query.isEmpty else { return [] }
        let digits = query.filter(\.isNumber)
        let hasLetters = query.contains(where: \.isLetter)
        var seen = Set<String>()
        return Array(pool.filter { p in
            let hit: Bool
            if hasLetters {
                let name = p.name.folding(options: [.caseInsensitive, .diacriticInsensitive], locale: nil)
                hit = name.hasPrefix(query) || name.split(separator: " ").contains { $0.hasPrefix(query) }
            } else {
                hit = digits.count >= 3 && p.number.filter(\.isNumber).contains(digits)
            }
            return hit && seen.insert(key(p.number)).inserted
        }.prefix(limit))
    }

    nonisolated static func match(_ typed: String, in pool: [Person], limit: Int) -> [Person] {
        let digits = typed.filter(\.isNumber)
        guard digits.count >= 2, digits.count == typed.count else { return [] }
        var byName: [Person] = [], byNumber: [Person] = []
        for p in pool {
            if digits.count >= 2, !digits.contains("0"), !digits.contains("1"), t9Matches(name: p.name, digits) {
                byName.append(p)
            } else if digits.count >= 3, p.number.filter(\.isNumber).contains(digits) {
                byNumber.append(p)
            }
            if byName.count >= limit { break }
        }
        return Array((byName + byNumber).prefix(limit))
    }

    private nonisolated static let t9: [Character: Character] = {
        var map: [Character: Character] = [:]
        for (digit, letters) in ["2": "abc", "3": "def", "4": "ghi", "5": "jkl", "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz"] {
            for l in letters { map[l] = Character(digit) }
        }
        return map
    }()

    /// True when any word of the name (or the whole name run together) starts with the typed key sequence.
    nonisolated static func t9Matches(name: String, _ digits: String) -> Bool {
        let folded = name.folding(options: [.diacriticInsensitive, .caseInsensitive], locale: nil).lowercased()
        func keys(_ s: Substring) -> String { String(s.compactMap { t9[$0] }) }
        let words = folded.split(whereSeparator: { !$0.isLetter })
        if words.contains(where: { keys($0).hasPrefix(digits) }) { return true }
        return keys(Substring(words.joined())).hasPrefix(digits)
    }

    /// Up to two initials for an avatar ("Dana Kim" → "DK").
    static func initials(_ name: String) -> String {
        let parts = name.split(separator: " ").filter { $0.first?.isLetter == true }
        let letters = parts.prefix(2).compactMap(\.first).map { String($0).uppercased() }
        return letters.joined()
    }
}
