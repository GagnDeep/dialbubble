import XCTest
@testable import Dialbubble

@MainActor
final class PolishThreeTests: XCTestCase {
    private func msg(_ sid: String, from: String, to: String, inbound: Bool, ago: TimeInterval, body: String = "hi") -> TwilioMessage {
        let d = Date.now.addingTimeInterval(-ago)
        return TwilioMessage(sid: sid, from: from, to: to, body: body, status: inbound ? "received" : "delivered",
                             direction: inbound ? "inbound" : "outbound-api", dateCreated: d, dateSent: d, dateUpdated: d,
                             numMedia: "0", numSegments: "1", price: "-0.0079", priceUnit: "USD", errorCode: nil, errorMessage: nil,
                             messagingServiceSid: nil)
    }

    private func call(_ sid: String, status: String = "completed", inbound: Bool = false) -> TwilioCall {
        TwilioCall(sid: sid, from: "+14155550101", to: "+14155550123", status: status, direction: inbound ? "inbound" : "outbound-api",
                   duration: "42", startTime: .now, endTime: nil, dateCreated: nil, price: nil, priceUnit: nil, answeredBy: nil, parentCallSid: nil)
    }

    func testHistoryCacheRoundTrip() {
        let profile = UUID()
        defer { HistoryCache.delete(profile: profile) }
        let messages = [msg("SM1", from: "+1A", to: "+1B", inbound: true, ago: 60, body: "Hello, \"world\"")]
        HistoryCache.save(messages: messages, calls: [call("CA1")], profile: profile)
        let loaded = HistoryCache.load(profile: profile)
        XCTAssertEqual(loaded?.messages, messages)
        XCTAssertEqual(loaded?.calls.first?.sid, "CA1")
        XCTAssertGreaterThan(HistoryCache.size, 0)
        HistoryCache.delete(profile: profile)
        XCTAssertNil(HistoryCache.load(profile: profile))
    }

    func testCSVQuotesAndDefusesFormulas() {
        XCTAssertEqual(HistoryExport.line(["a", "b,c", "say \"hi\""]), "a,\"b,c\",\"say \"\"hi\"\"\"")
        XCTAssertEqual(HistoryExport.line(["=SUM(A1)"]), "'=SUM(A1)", "Spreadsheet formulas are neutralized")
        XCTAssertEqual(HistoryExport.line(["+14155550123", "-0.0079"]), "+14155550123,-0.0079", "Numbers stay numbers")
    }

    func testCSVHasOneRowPerItem() {
        AppStore.resetAllData()
        defer { AppStore.resetAllData() }
        let store = AppStore()
        store.messages = [msg("SM1", from: "+1A", to: "+1B", inbound: true, ago: 60), msg("SM2", from: "+1B", to: "+1A", inbound: false, ago: 30)]
        store.calls = [call("CA1")]
        let lines = HistoryExport(store: store).csv().split(separator: "\r\n")
        XCTAssertEqual(lines.count, 4)
        XCTAssertTrue(lines[0].hasPrefix("Type,Date,Direction"))
    }

    func testCountryFlags() {
        XCTAssertEqual(PhoneFormat.region(of: "+447700900456"), "GB")
        XCTAssertEqual(PhoneFormat.region(of: "+971501234567"), "AE", "Three-digit codes win over shorter ones")
        XCTAssertEqual(PhoneFormat.foreignFlag("+447700900456", homeCountryCode: "1"), "🇬🇧")
        XCTAssertNil(PhoneFormat.foreignFlag("+14155550123", homeCountryCode: "1"), "No flag for home-country numbers")
        XCTAssertEqual(PhoneFormat.foreignFlag("+14155550123", homeCountryCode: "44"), "🇺🇸")
        XCTAssertNil(PhoneFormat.region(of: "4155550123"), "Only E.164 numbers have a known country")
    }

    func testNameSearch() {
        let pool = [ContactBook.Person(name: "Dana Kim", number: "+14155550123"),
                    ContactBook.Person(name: "Zoë Adams", number: "+12125550188")]
        XCTAssertEqual(ContactBook.search("da", in: pool, limit: 4).map(\.name), ["Dana Kim"])
        XCTAssertEqual(ContactBook.search("kim", in: pool, limit: 4).map(\.name), ["Dana Kim"], "Last names match too")
        XCTAssertEqual(ContactBook.search("zoe", in: pool, limit: 4).map(\.name), ["Zoë Adams"], "Accents don't matter")
        XCTAssertEqual(ContactBook.search("0188", in: pool, limit: 4).map(\.name), ["Zoë Adams"])
        XCTAssertTrue(ContactBook.search("an", in: pool, limit: 4).isEmpty, "Only the start of a word matches")
    }

    func testMinimizeAndResumeCall() {
        let store = AppStore()
        let session = LiveCallSession(call: call("CA9", status: "in-progress"), destination: "+14155550123", from: "+14155550101", mode: .bridge)
        store.liveCall = session
        store.minimizeCall()
        XCTAssertNil(store.liveCall)
        XCTAssertEqual(store.minimizedCall?.id, "CA9")
        store.resumeCall()
        XCTAssertEqual(store.liveCall?.id, "CA9")
        XCTAssertNil(store.minimizedCall)
    }

    func testIsReadFollowsReadMarker() {
        AppStore.resetAllData()
        defer { AppStore.resetAllData() }
        let store = AppStore()
        let m = msg("SM1", from: "+1B", to: "+1A", inbound: true, ago: 60)
        store.messages = [m]
        XCTAssertFalse(store.isRead(m))
        store.markRead(store.conversation(our: "+1A", counterpart: "+1B"))
        XCTAssertTrue(store.isRead(m))
    }

    func testGapTimestampThreshold() {
        XCTAssertEqual(ConversationView.gapForTimestamp, 3600)
    }
}
