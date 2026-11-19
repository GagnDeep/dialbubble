import XCTest
@testable import Dialbubble

final class PhoneFormatTests: XCTestCase {
    func testE164USFormats() {
        for input in ["(415) 555-0100", "415.555.0100", "1 415 555 0100", "+1 415 555 0100", "415-555-0100"] {
            XCTAssertEqual(PhoneFormat.e164(input), "+14155550100", "input: \(input)")
        }
    }

    func testE164InternationalWithTrunkPrefix() {
        XCTAssertEqual(PhoneFormat.e164("07700 900123", defaultCountryCode: "44"), "+447700900123")
        XCTAssertEqual(PhoneFormat.e164("098765 43210", defaultCountryCode: "91"), "+919876543210")
        XCTAssertEqual(PhoneFormat.e164("98765 43210", defaultCountryCode: "+91"), "+919876543210")
    }

    func testE164DoubleZeroPrefix() {
        XCTAssertEqual(PhoneFormat.e164("00 44 7700 900123"), "+447700900123")
    }

    func testE164Passthrough() {
        XCTAssertEqual(PhoneFormat.e164("whatsapp:+14155550100"), "whatsapp:+14155550100")
        XCTAssertEqual(PhoneFormat.e164("client:alice"), "client:alice")
        XCTAssertEqual(PhoneFormat.e164("  "), "")
        XCTAssertEqual(PhoneFormat.e164(""), "")
    }

    func testE164UKParenthesisedTrunkZero() {
        XCTAssertEqual(PhoneFormat.e164("+44 (0) 7700 900123"), "+447700900123")
    }

    func testDisplay() {
        XCTAssertEqual(PhoneFormat.display("+14155550100"), "+1 (415) 555-0100")
        XCTAssertEqual(PhoneFormat.display("+447700900123"), "+44 7700 900123")
        XCTAssertEqual(PhoneFormat.display("+919876543210"), "+91 98765 43210")
        XCTAssertEqual(PhoneFormat.display("+33612345678"), "+33 612 345 678")
        XCTAssertEqual(PhoneFormat.display("whatsapp:+14155550100"), "WhatsApp +1 (415) 555-0100")
        XCTAssertEqual(PhoneFormat.display("client:alice"), "alice")
        XCTAssertEqual(PhoneFormat.display("12345"), "12345")
    }

    func testIsPlausible() {
        XCTAssertFalse(PhoneFormat.isPlausible("123456"))
        XCTAssertTrue(PhoneFormat.isPlausible("1234567"))
        XCTAssertTrue(PhoneFormat.isPlausible("+123456789012345"))
        XCTAssertFalse(PhoneFormat.isPlausible("+1234567890123456"))
        XCTAssertFalse(PhoneFormat.isPlausible("abc"))
    }

    func testShort() {
        XCTAssertEqual(PhoneFormat.short("+14155550100"), "••0100")
        XCTAssertEqual(PhoneFormat.short("123"), "123")
    }

    func testDurationString() {
        XCTAssertEqual(0.durationString, "0:00")
        XCTAssertEqual(65.durationString, "1:05")
        XCTAssertEqual(600.durationString, "10:00")
        XCTAssertEqual(3729.durationString, "1:02:09")
    }
}
