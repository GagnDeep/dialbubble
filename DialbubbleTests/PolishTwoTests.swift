import XCTest
@testable import Dialbubble

@MainActor
final class PolishTwoTests: XCTestCase {
    private func msg(_ sid: String, from: String, to: String, inbound: Bool, ago: TimeInterval, body: String = "hi") -> TwilioMessage {
        let d = Date.now.addingTimeInterval(-ago)
        return TwilioMessage(sid: sid, from: from, to: to, body: body, status: inbound ? "received" : "delivered",
                             direction: inbound ? "inbound" : "outbound-api", dateCreated: d, dateSent: d, dateUpdated: d,
                             numMedia: "0", numSegments: "1", price: nil, priceUnit: nil, errorCode: nil, errorMessage: nil,
                             messagingServiceSid: nil)
    }

    // MARK: Message text

    func testOneTimeCodes() {
        XCTAssertEqual(MessageText.oneTimeCode(in: "Your verification code is 482913"), "482913")
        XCTAssertEqual(MessageText.oneTimeCode(in: "Your Acme sign-in code is 730 194. Don't share it."), "730194")
        XCTAssertEqual(MessageText.oneTimeCode(in: "G-123456 is your Google verification code."), nil,
                       "Prefixed codes are left alone rather than guessed")
        XCTAssertEqual(MessageText.oneTimeCode(in: "Use PIN 4821 to unlock"), "4821")
        XCTAssertNil(MessageText.oneTimeCode(in: "Hi, my order #4821 hasn't arrived yet."), "No code word, no code")
        XCTAssertNil(MessageText.oneTimeCode(in: "Your code: call (212) 555-0100"), "Phone numbers aren't codes")
        XCTAssertNil(MessageText.oneTimeCode(in: "Your code expires at 10:30"), "Times aren't codes")
    }

    func testDetectsLinksAndPhoneNumbers() {
        let body = "Track it at https://example.com/track/4821 or call (212) 555-0100."
        let urls = MessageText.detections(in: body).map(\.url)
        XCTAssertTrue(urls.contains { $0.host?.contains("dialbubble.app") == true })
        let tel = urls.first { $0.scheme == "tel" }
        XCTAssertNotNil(tel)
        XCTAssertEqual(tel.flatMap(MessageText.phone(from:))?.filter(\.isNumber), "2125550100")
        XCTAssertTrue(MessageText.detections(in: "Running 5 min late, sorry!").isEmpty)
    }

    func testBigEmoji() {
        XCTAssertTrue(MessageText.isBigEmoji("👍"))
        XCTAssertTrue(MessageText.isBigEmoji("🎉🎉"))
        XCTAssertTrue(MessageText.isBigEmoji("👍🏽"))
        XCTAssertFalse(MessageText.isBigEmoji("ok 👍"))
        XCTAssertFalse(MessageText.isBigEmoji("123"), "Digits are technically emoji-capable but never big")
        XCTAssertFalse(MessageText.isBigEmoji("🎉🎉🎉🎉"))
    }

    // MARK: Keypad matching

    func testT9() {
        XCTAssertTrue(ContactBook.t9Matches(name: "Dana Kim", "3262"))    // D-A-N-A
        XCTAssertTrue(ContactBook.t9Matches(name: "Dana Kim", "546"))     // K-I-M
        XCTAssertTrue(ContactBook.t9Matches(name: "Zoë Ng", "963"))       // accents folded
        XCTAssertFalse(ContactBook.t9Matches(name: "Dana Kim", "999"))
    }

    func testKeypadMatchPrefersNamesThenNumbers() {
        let pool = [ContactBook.Person(name: "Leo Martin", number: "+13105550177"),
                    ContactBook.Person(name: "Dana Kim", number: "+14155550123")]
        XCTAssertEqual(ContactBook.match("536", in: pool, limit: 3).first?.name, "Leo Martin")
        XCTAssertEqual(ContactBook.match("0123", in: pool, limit: 3).first?.name, "Dana Kim", "Digits inside a number")
        XCTAssertTrue(ContactBook.match("5", in: pool, limit: 3).isEmpty, "One key is too vague")
    }

    // MARK: Store

    func testDraftsPersistAndClear() {
        AppStore.resetAllData()
        defer { AppStore.resetAllData() }
        let store = AppStore()
        store.setDraft("See you at 6", for: "+1A|+1B")
        XCTAssertEqual(AppStore().draft(for: "+1A|+1B"), "See you at 6", "Survives a relaunch")
        store.setDraft("   ", for: "+1A|+1B")
        XCTAssertNil(store.draft(for: "+1A|+1B"), "Blank text removes the draft")
    }

    func testPinnedConversationsSortFirst() {
        AppStore.resetAllData()
        defer { AppStore.resetAllData() }
        let store = AppStore()
        let us = "+14155550101"
        store.messages = [msg("1", from: "+1A", to: us, inbound: true, ago: 10),
                          msg("2", from: "+1B", to: us, inbound: true, ago: 100),
                          msg("3", from: "+1C", to: us, inbound: true, ago: 1000)]
        let list = store.conversations
        XCTAssertEqual(list.map(\.counterpart), ["+1A", "+1B", "+1C"])
        store.togglePin(list[2])
        XCTAssertEqual(store.sortedForList(list).map(\.counterpart), ["+1C", "+1A", "+1B"])
        store.togglePin(list[2])
        XCTAssertEqual(store.sortedForList(list).map(\.counterpart), ["+1A", "+1B", "+1C"])
    }

    func testConversationCacheRefreshesWhenMessagesChange() {
        AppStore.resetAllData()
        defer { AppStore.resetAllData() }
        let store = AppStore()
        let us = "+14155550101"
        store.messages = [msg("1", from: "+1A", to: us, inbound: true, ago: 10)]
        XCTAssertEqual(store.conversations.count, 1)
        store.messages.insert(msg("2", from: "+1B", to: us, inbound: true, ago: 1), at: 0)
        XCTAssertEqual(store.conversations.count, 2)
        XCTAssertEqual(store.conversation(our: us, counterpart: "+1B").messages.count, 1)
        store.messages.removeAll()
        XCTAssertTrue(store.conversations.isEmpty)
    }

    func testRecentPeopleForQuickActions() {
        AppStore.resetAllData()
        defer { AppStore.resetAllData() }
        let store = AppStore()
        let us = "+14155550101"
        store.messages = [msg("1", from: "+14155550123", to: us, inbound: true, ago: 10),
                          msg("2", from: us, to: "+14155550123", inbound: false, ago: 20),
                          msg("3", from: "+12125550188", to: us, inbound: true, ago: 30)]
        let people = QuickAction.recentPeople(store: store)
        XCTAssertEqual(people.map(\.number), ["+14155550123", "+12125550188"], "One entry per person, newest first")
        XCTAssertTrue(people.allSatisfy(\.lastWasMessage))
    }
}
