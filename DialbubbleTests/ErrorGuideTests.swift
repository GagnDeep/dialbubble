import XCTest
@testable import Dialbubble

final class ErrorGuideTests: XCTestCase {
    private func api(_ code: Int) -> TwilioAPIError {
        TwilioAPIError(code: code, message: "msg \(code)", moreInfo: nil, status: 400)
    }

    func testTwilioCodes() {
        let auth = FriendlyError(api(20003))
        XCTAssertEqual(auth.title, "Couldn't sign in")
        XCTAssertEqual(auth.helpURL?.host, "console.twilio.com")
        XCTAssertEqual(auth.code, 20003)

        let invalid = FriendlyError(api(21211))
        XCTAssertEqual(invalid.title, "Invalid phone number")
        XCTAssertNotEqual(invalid.message, "msg 21211", "Raw Twilio text must not be the main message")
        XCTAssertEqual(invalid.details, "msg 21211 (error 21211)")
        XCTAssertEqual(invalid.helpURL?.absoluteString, "https://www.twilio.com/docs/errors/21211")

        XCTAssertEqual(FriendlyError(api(21608)).title, "Trial account limit")
        XCTAssertEqual(FriendlyError(api(21610)).title, "Recipient opted out")
    }

    func testUnknownCode() {
        let e = FriendlyError(api(99999))
        XCTAssertEqual(e.title, "Twilio couldn't complete that")
        XCTAssertEqual(e.helpURL?.absoluteString, "https://www.twilio.com/docs/errors/99999")
        XCTAssertNotNil(e.suggestion)
    }

    func testNetworkAndClientErrors() {
        XCTAssertEqual(FriendlyError(URLError(.notConnectedToInternet)).title, "You're offline")
        XCTAssertEqual(FriendlyError(URLError(.timedOut)).title, "Request timed out")
        XCTAssertEqual(FriendlyError(ClientError.http(401)).title, "Couldn't sign in")
        XCTAssertEqual(FriendlyError(ClientError.invalidInput("Bad")).message, "Bad")
        XCTAssertEqual(FriendlyError(URLError(.cannotFindHost)).title, "Network problem")
        struct Other: Error {}
        XCTAssertEqual(FriendlyError(Other()).title, "Something went wrong")
    }

    func testRawMessageMovesToMaskedDetails() {
        let sid = "AC" + String(repeating: "0", count: 31) + "1"
        let e = FriendlyError(TwilioAPIError(code: 20003, message: "Authenticate: account \(sid) does not exist", moreInfo: nil, status: 401))
        XCTAssertFalse(e.message.contains(sid))
        XCTAssertFalse(e.details?.contains(sid) ?? true, "SIDs must be masked in details")
        XCTAssertTrue(e.details?.contains("AC…0001") ?? false)
        XCTAssertTrue(e.title.localizedCaseInsensitiveContains("sign in"))
    }

    func testContextAwareNotFound() {
        let notFound = TwilioAPIError(code: 20404, message: "not found", moreInfo: nil, status: 404)
        XCTAssertEqual(FriendlyError(notFound).title, "Not found")
        let onboarding = FriendlyError(notFound, context: .onboarding)
        XCTAssertEqual(onboarding.title, "Account not found")
        XCTAssertFalse(onboarding.suggestion?.contains("refresh") ?? true)
    }

    func testMaskSIDs() {
        XCTAssertEqual(FriendlyError.maskSIDs("key " + "SK" + String(repeating: "0", count: 28) + "cdef!"), "key SK…cdef!")
        XCTAssertEqual(FriendlyError.maskSIDs("no ids here"), "no ids here")
    }
}
