import XCTest
@testable import Dialbubble

final class ModelTests: XCTestCase {
    func testStatusMapping() {
        XCTAssertEqual(CallStatus(rawValue: "in-progress"), .inProgress)
        XCTAssertEqual(CallStatus(rawValue: "no-answer"), .noAnswer)
        XCTAssertEqual(CallStatus.inProgress.label, "In Progress")
        XCTAssertEqual(CallStatus.noAnswer.label, "No Answer")
        for s in [CallStatus.queued, .initiated, .ringing, .inProgress] { XCTAssertTrue(s.isActive) }
        for s in [CallStatus.completed, .busy, .failed, .noAnswer, .canceled, .unknown] { XCTAssertFalse(s.isActive) }
        XCTAssertEqual(MessageStatus(rawValue: "delivered"), .delivered)
        XCTAssertNil(MessageStatus(rawValue: "weird"))
        XCTAssertTrue(MessageStatus.undelivered.isFailure)
        XCTAssertFalse(MessageStatus.sent.isFailure)
    }

    func testMessageParties() {
        let out = TwilioMessage(sid: "SM1", from: "+1A", to: "+1B", body: nil, status: "sent", direction: "outbound-api",
                                dateCreated: nil, dateSent: nil, dateUpdated: nil, numMedia: nil, numSegments: nil, price: nil,
                                priceUnit: nil, errorCode: nil, errorMessage: nil, messagingServiceSid: nil)
        XCTAssertEqual(out.ourNumber, "+1A"); XCTAssertEqual(out.counterpart, "+1B")
        XCTAssertEqual(out.mediaCount, 0); XCTAssertEqual(out.segments, 1)
        let call = TwilioCall(sid: "CA1", from: "+1B", to: "+1A", status: "garbage", direction: "inbound", duration: nil,
                              startTime: nil, endTime: nil, dateCreated: nil, price: nil, priceUnit: nil, answeredBy: nil, parentCallSid: nil)
        XCTAssertEqual(call.ourNumber, "+1A"); XCTAssertEqual(call.counterpart, "+1B")
        XCTAssertEqual(call.statusKind, .unknown); XCTAssertEqual(call.durationSeconds, 0)
    }

    private func number(_ p: String, voice: Bool, sms: Bool, enabled: Bool = true) -> ConfiguredNumber {
        ConfiguredNumber(phoneNumber: p, friendlyName: "", nickname: nil, tint: .blue, voice: voice, sms: sms, mms: false, source: .owned, isEnabled: enabled)
    }

    func testProfileFiltering() {
        var p = AccountProfile(name: "T", accountSid: "AC1")
        p.numbers = [
            number("+1", voice: true, sms: true),
            number("+2", voice: true, sms: false),
            number("+3", voice: false, sms: true),
            number("+4", voice: true, sms: true, enabled: false),
        ]
        XCTAssertEqual(p.enabledNumbers.map(\.phoneNumber), ["+1", "+2", "+3"])
        XCTAssertEqual(p.callerNumbers.map(\.phoneNumber), ["+1", "+2"])
        XCTAssertEqual(p.smsNumbers.map(\.phoneNumber), ["+1", "+3"])
    }

    func testDisplayName() {
        var n = number("+14155550100", voice: true, sms: true)
        XCTAssertEqual(n.displayName, "+1 (415) 555-0100")
        n.friendlyName = "Main"
        XCTAssertEqual(n.displayName, "Main")
        n.nickname = "  "
        XCTAssertEqual(n.displayName, "Main")
        n.nickname = "Work"
        XCTAssertEqual(n.displayName, "Work")
    }

    func testCredentialsUsername() {
        XCTAssertEqual(TwilioCredentials(accountSid: "AC1", apiKeySid: nil, secret: "s").username, "AC1")
        XCTAssertEqual(TwilioCredentials(accountSid: "AC1", apiKeySid: "  ", secret: "s").username, "AC1")
        XCTAssertEqual(TwilioCredentials(accountSid: "AC1", apiKeySid: "SK1", secret: "s").username, "SK1")
    }

    func testProfileCodableRoundTrip() throws {
        var p = AccountProfile(name: "Work", accountSid: "AC1", apiKeySid: "SK1")
        p.personalPhone = "+14155550199"
        p.messagingServiceSid = "MG1"
        p.numbers = [number("+1", voice: true, sms: false)]
        p.tint = .purple
        let data = try JSONEncoder().encode([p])
        let back = try JSONDecoder().decode([AccountProfile].self, from: data)
        XCTAssertEqual(back, [p])
    }

    func testVoiceOptionIDsUnique() {
        XCTAssertEqual(Set(VoiceOption.all.map(\.id)).count, VoiceOption.all.count)
    }
}
