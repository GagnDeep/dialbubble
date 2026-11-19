import XCTest
@testable import Dialbubble

@MainActor
final class PolishTests: XCTestCase {
    private func call(_ status: String, inbound: Bool) -> TwilioCall {
        TwilioCall(sid: "CA\(status)\(inbound)", from: "+1B", to: "+1A", status: status, direction: inbound ? "inbound" : "outbound-api",
                   duration: nil, startTime: .now, endTime: nil, dateCreated: nil, price: nil, priceUnit: nil, answeredBy: nil, parentCallSid: nil)
    }

    private func msg(_ sid: String, inbound: Bool, at: TimeInterval, status: String? = nil) -> TwilioMessage {
        let d = Date(timeIntervalSince1970: at)
        return TwilioMessage(sid: sid, from: "+1A", to: "+1B", body: sid, status: status ?? (inbound ? "received" : "delivered"),
                             direction: inbound ? "inbound" : "outbound-api", dateCreated: d, dateSent: d, dateUpdated: d,
                             numMedia: "0", numSegments: "1", price: nil, priceUnit: nil, errorCode: nil, errorMessage: nil,
                             messagingServiceSid: nil)
    }

    func testOnlyUnansweredIncomingCallsAreMissed() {
        XCTAssertTrue(call("no-answer", inbound: true).isMissed)
        XCTAssertFalse(call("no-answer", inbound: false).isMissed, "Outgoing calls nobody answered aren't 'missed'")
        XCTAssertTrue(call("busy", inbound: false).isUnanswered)
        XCTAssertFalse(call("completed", inbound: true).isMissed)
    }

    func testContactKeyIgnoresFormattingAndCountryCode() {
        XCTAssertEqual(ContactBook.key("+1 (415) 555-0123"), ContactBook.key("415.555.0123"))
        XCTAssertEqual(ContactBook.key("+14155550123"), "4155550123")
        XCTAssertEqual(ContactBook.key("123"), "", "Short codes never match a contact")
    }

    func testInitials() {
        XCTAssertEqual(ContactBook.initials("Dana Kim"), "DK")
        XCTAssertEqual(ContactBook.initials("cher"), "C")
        XCTAssertEqual(ContactBook.initials("Mary Ann Lee"), "MA")
        XCTAssertEqual(ContactBook.initials("+1 555"), "")
    }

    func testDemoNamesOnlyInDemo() {
        let book = ContactBook.shared
        let was = book.demoEnabled
        defer { book.demoEnabled = was }
        book.demoEnabled = true
        XCTAssertEqual(book.name(for: "+14155550123"), "Dana Kim")
        book.demoEnabled = false
        XCTAssertNotEqual(book.name(for: "+14155550123"), "Dana Kim")
    }

    func testListStamp() {
        let now = Date.now
        XCTAssertEqual(now.listStamp, now.formatted(date: .omitted, time: .shortened))
        XCTAssertEqual(Calendar.current.date(byAdding: .day, value: -1, to: now)!.listStamp, "Yesterday")
        let old = Calendar.current.date(byAdding: .day, value: -30, to: now)!
        XCTAssertEqual(old.listStamp, old.formatted(date: .numeric, time: .omitted))
    }

    func testMessageRuns() {
        let t: TimeInterval = 1_000_000
        let messages = [
            msg("a", inbound: true, at: t),
            msg("b", inbound: true, at: t + 30),       // same run as a
            msg("c", inbound: false, at: t + 60),      // side changes: new run
            msg("d", inbound: false, at: t + 60 + 600), // 10 min later: new run
        ]
        XCTAssertTrue(ConversationView.run(messages, 0).starts)
        XCTAssertFalse(ConversationView.run(messages, 0).ends)
        XCTAssertFalse(ConversationView.run(messages, 1).starts)
        XCTAssertTrue(ConversationView.run(messages, 1).ends)
        XCTAssertTrue(ConversationView.run(messages, 2).starts)
        XCTAssertTrue(ConversationView.run(messages, 2).ends)
        XCTAssertTrue(ConversationView.run(messages, 3).starts)
    }

    func testFailedMessageEndsItsRun() {
        let t: TimeInterval = 1_000_000
        let messages = [msg("a", inbound: false, at: t, status: "failed"), msg("b", inbound: false, at: t + 10)]
        XCTAssertTrue(ConversationView.run(messages, 0).ends, "A failed bubble keeps its own footer and retry")
    }

    func testDayTitle() {
        XCTAssertEqual(ConversationView.dayTitle(.now), "Today")
        XCTAssertEqual(ConversationView.dayTitle(Calendar.current.date(byAdding: .day, value: -1, to: .now)!), "Yesterday")
    }

    func testMarkUnreadRoundTrip() {
        AppStore.resetAllData()
        defer { AppStore.resetAllData() }
        let store = AppStore()
        let us = "+14155550101", them = "+14155550123"
        let d = Date.now.addingTimeInterval(-100)
        store.messages = [TwilioMessage(sid: "m1", from: them, to: us, body: "hi", status: "received", direction: "inbound",
                                        dateCreated: d, dateSent: d, dateUpdated: d, numMedia: "0", numSegments: "1", price: nil,
                                        priceUnit: nil, errorCode: nil, errorMessage: nil, messagingServiceSid: nil)]
        let c = store.conversation(our: us, counterpart: them)
        store.markRead(c)
        XCTAssertFalse(store.isUnread(c))
        XCTAssertTrue(store.canMarkUnread(c))
        store.markUnread(c)
        XCTAssertTrue(store.isUnread(c))
    }
}
