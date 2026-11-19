import XCTest
@testable import Dialbubble

final class TwiMLTests: XCTestCase {
    private func call(_ mode: CallMode) -> OutgoingCall {
        OutgoingCall(from: "+14155550101", destination: "+14155550123", mode: mode, personalPhone: "+14155550199")
    }

    func testBridgeConfirmsBeforeDialing() throws {
        let c = call(.bridge)
        XCTAssertTrue(c.confirmBeforeConnect)
        let xml = try TwiML.build(for: c)
        // The other person must not be dialed directly — only from the Gather action after a key press.
        XCTAssertFalse(xml.contains("<Dial"))
        XCTAssertTrue(xml.contains("<Gather numDigits=\"1\""))
        XCTAssertTrue(xml.contains("ending 0 1 2 3"))
        XCTAssertTrue(xml.contains("<Hangup/>"))
        let action = try XCTUnwrap(xml.range(of: "action=\"[^\"]+\"", options: .regularExpression).map { String(xml[$0]) })
        XCTAssertTrue(action.contains(TwiML.bridgeEchoURL))
        let decoded = try XCTUnwrap(action.replacingOccurrences(of: "&amp;", with: "&").removingPercentEncoding)
        XCTAssertTrue(decoded.contains("<Dial callerId=\"+14155550101\""))
        XCTAssertTrue(decoded.contains("<Number>+14155550123</Number>"))
        XCTAssertLessThanOrEqual(xml.utf8.count, 4000)
    }

    func testBridge() throws {
        var c = call(.bridge)
        c.confirmBeforeConnect = false
        let xml = try TwiML.build(for: c)
        XCTAssertTrue(xml.hasPrefix("<Response>") && xml.hasSuffix("</Response>"))
        XCTAssertTrue(xml.contains("<Dial callerId=\"+14155550101\""))
        XCTAssertTrue(xml.contains("answerOnBridge=\"true\""))
        XCTAssertTrue(xml.contains("<Number>+14155550123</Number>"))
        XCTAssertFalse(xml.contains("record="))

        c.record = true
        c.sendDigits = "1w2"
        let recorded = try TwiML.build(for: c)
        XCTAssertTrue(recorded.contains("record=\"record-from-answer-dual\""))
        XCTAssertTrue(recorded.contains("<Number sendDigits=\"1w2\">+14155550123</Number>"))
    }

    func testSayEscapesAndAttributes() throws {
        var c = call(.say)
        c.message = "Tom & \"Jerry\" <3 it's"
        c.loop = 2
        let xml = try TwiML.build(for: c)
        XCTAssertTrue(xml.contains("Tom &amp; &quot;Jerry&quot; &lt;3 it&apos;s"), xml)
        XCTAssertTrue(xml.contains("voice=\"Polly.Joanna-Neural\""))
        XCTAssertTrue(xml.contains("language=\"en-US\""))
        XCTAssertTrue(xml.contains("loop=\"2\""))
    }

    func testSayEmptyThrows() {
        var c = call(.say)
        c.message = "   "
        XCTAssertThrowsError(try TwiML.build(for: c))
    }

    func testPlay() throws {
        var c = call(.play)
        c.audioURL = "ftp://example.com/a.mp3"
        XCTAssertThrowsError(try TwiML.build(for: c))
        c.audioURL = "not a url"
        XCTAssertThrowsError(try TwiML.build(for: c))
        c.audioURL = "https://example.com/a.mp3"
        XCTAssertEqual(try TwiML.build(for: c), "<Response><Play loop=\"1\">https://example.com/a.mp3</Play></Response>")
    }

    func testCustomTwiML() throws {
        var c = call(.twiml)
        c.customTwiML = "<Response><Hangup/></Response>"
        XCTAssertEqual(try TwiML.build(for: c), "<Response><Hangup/></Response>")
        c.customTwiML = "<Hangup/>"
        XCTAssertEqual(try TwiML.build(for: c), "<Response><Hangup/></Response>")
        c.customTwiML = ""
        XCTAssertThrowsError(try TwiML.build(for: c))
    }

    func testTooLongThrows() {
        var c = call(.say)
        c.message = String(repeating: "a", count: 5000)
        XCTAssertThrowsError(try TwiML.build(for: c))
    }

    func testRawResponseOverLimitIsRejected() {
        var c = call(.twiml)
        c.customTwiML = "<Response><Say>\(String(repeating: "a", count: 5000))</Say></Response>"
        XCTAssertThrowsError(try TwiML.build(for: c))
    }
}
