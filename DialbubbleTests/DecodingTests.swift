import XCTest
@testable import Dialbubble

final class DecodingTests: XCTestCase {
    private func decode<T: Decodable>(_ type: T.Type, _ json: String) throws -> T {
        try TwilioClient.decoder().decode(T.self, from: Data(json.utf8))
    }

    func testMessage() throws {
        let m = try decode(TwilioMessage.self, """
        {"sid":"SM123","from":"+14155550123","to":"+14155550101","body":"Hi","status":"received","direction":"inbound",
         "date_created":"Wed, 18 Aug 2010 20:01:40 +0000","date_sent":"Wed, 18 Aug 2010 20:01:41 +0000","date_updated":null,
         "num_media":"2","num_segments":"3","price":null,"price_unit":"USD","error_code":null,"error_message":null,
         "messaging_service_sid":null,"subresource_uris":{"media":"/x"},"api_version":"2010-04-01"}
        """)
        XCTAssertEqual(m.sid, "SM123")
        XCTAssertTrue(m.isInbound)
        XCTAssertEqual(m.mediaCount, 2)
        XCTAssertEqual(m.segments, 3)
        XCTAssertEqual(m.statusKind, .received)
        XCTAssertEqual(m.ourNumber, "+14155550101")
        XCTAssertEqual(m.counterpart, "+14155550123")
        XCTAssertEqual(m.date, Date(timeIntervalSince1970: 1282161701))
        XCTAssertNil(m.dateUpdated)
    }

    func testMessageWithError() throws {
        let m = try decode(TwilioMessage.self, """
        {"sid":"SM1","from":"+1","to":"+2","body":null,"status":"undelivered","direction":"outbound-api","date_created":null,
         "date_sent":null,"date_updated":null,"num_media":"0","num_segments":"1","price":"-0.0079","price_unit":"USD",
         "error_code":30006,"error_message":"Landline","messaging_service_sid":"MG1"}
        """)
        XCTAssertEqual(m.errorCode, 30006)
        XCTAssertTrue(m.statusKind.isFailure)
        XCTAssertEqual(m.date, .distantPast)
    }

    func testCall() throws {
        let c = try decode(TwilioCall.self, """
        {"sid":"CA1","from":"+14155550101","to":"+14155550123","status":"in-progress","direction":"outbound-api",
         "duration":"125","start_time":"Thu, 08 Oct 2026 12:00:00 +0000","end_time":null,
         "date_created":"Thu, 08 Oct 2026 11:59:55 +0000","price":null,"price_unit":"USD","answered_by":"human","parent_call_sid":null}
        """)
        XCTAssertEqual(c.statusKind, .inProgress)
        XCTAssertTrue(c.statusKind.isActive)
        XCTAssertEqual(c.durationSeconds, 125)
        XCTAssertEqual(c.counterpart, "+14155550123")
        XCTAssertNotNil(c.startTime)
        XCTAssertEqual(c.date, c.startTime)
    }

    func testIncomingNumbersCapabilitiesBothCases() throws {
        struct Page: Decodable { let incomingPhoneNumbers: [IncomingPhoneNumber] }
        let page = try decode(Page.self, """
        {"incoming_phone_numbers":[
          {"sid":"PN1","phone_number":"+14155550101","friendly_name":"Main","capabilities":{"voice":true,"sms":true,"mms":false,"fax":false}},
          {"sid":"PN2","phone_number":"+14155550102","friendly_name":"Upper","capabilities":{"voice":false,"SMS":true,"MMS":true}}
        ]}
        """)
        XCTAssertEqual(page.incomingPhoneNumbers.count, 2)
        let a = page.incomingPhoneNumbers[0].capabilities
        XCTAssertEqual(a?.voice, true); XCTAssertEqual(a?.sms, true); XCTAssertEqual(a?.mms, false)
        let b = page.incomingPhoneNumbers[1].capabilities
        XCTAssertEqual(b?.voice, false); XCTAssertEqual(b?.sms, true); XCTAssertEqual(b?.mms, true)
    }

    func testBalance() throws {
        let b = try decode(TwilioBalance.self, #"{"balance":"18.42","currency":"USD","account_sid":"AC1"}"#)
        XCTAssertEqual(b.amount, 18.42, accuracy: 0.0001)
        XCTAssertFalse(b.formatted.isEmpty)
    }

    func testUsageRecord() throws {
        let u = try decode(UsageRecord.self, """
        {"category":"sms-outbound","description":"Outbound SMS","usage":"184","usage_unit":"count","count":"184",
         "count_unit":"count","price":"1.43","price_unit":"usd","start_date":"2026-10-01"}
        """)
        XCTAssertEqual(u.id, "sms-outbound")
        XCTAssertEqual(u.priceValue, 1.43, accuracy: 0.001)
        XCTAssertEqual(u.usageValue, 184)
    }

    func testLookup() throws {
        let l = try decode(LookupResult.self, """
        {"calling_country_code":"1","country_code":"US","phone_number":"+14155550100","national_format":"(415) 555-0100",
         "valid":true,"validation_errors":[],"caller_name":null,
         "line_type_intelligence":{"type":"mobile","carrier_name":"T-Mobile","mobile_country_code":"310","mobile_network_code":"160","error_code":null},
         "url":"https://lookups.twilio.com/v2/PhoneNumbers/+14155550100"}
        """)
        XCTAssertEqual(l.valid, true)
        XCTAssertEqual(l.countryCode, "US")
        XCTAssertEqual(l.lineTypeIntelligence?.type, "mobile")
        XCTAssertEqual(l.lineTypeIntelligence?.carrierName, "T-Mobile")
        XCTAssertNil(l.callerName)
    }

    func testAPIError() throws {
        let e = try decode(TwilioAPIError.self, """
        {"code":21211,"message":"The 'To' number is not valid.","more_info":"https://www.twilio.com/docs/errors/21211","status":400}
        """)
        XCTAssertEqual(e.code, 21211)
        XCTAssertEqual(e.status, 400)
        XCTAssertEqual(e.errorDescription, "The 'To' number is not valid. (Twilio 21211)")
    }

    func testTwilioDateParse() {
        XCTAssertEqual(TwilioDate.parse("Wed, 18 Aug 2010 20:01:40 +0000"), Date(timeIntervalSince1970: 1282161700))
        XCTAssertEqual(TwilioDate.parse("2010-08-18T20:01:40Z"), Date(timeIntervalSince1970: 1282161700))
        let frac = TwilioDate.parse("2010-08-18T20:01:40.500Z")
        XCTAssertNotNil(frac)
        XCTAssertEqual(frac?.timeIntervalSince1970 ?? 0, 1282161700.5, accuracy: 0.01)
        XCTAssertNil(TwilioDate.parse("yesterday"))
    }
}
