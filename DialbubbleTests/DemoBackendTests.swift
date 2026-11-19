import XCTest
@testable import Dialbubble

final class DemoBackendTests: XCTestCase {
    private let client = TwilioClient(credentials: TwilioCredentials(accountSid: DemoBackend.accountSid, apiKeySid: nil, secret: DemoBackend.secret))

    override func setUp() async throws {
        await DemoBackend.shared.reset()
    }

    func testAccountAndBalance() async throws {
        let account = try await client.fetchAccount()
        XCTAssertEqual(account.sid, DemoBackend.accountSid)
        XCTAssertEqual(account.friendlyName, "Demo Workspace")
        XCTAssertFalse(account.isTrial)
        let balance = try await client.fetchBalance()
        XCTAssertEqual(balance.amount, 18.42, accuracy: 0.001)
        XCTAssertEqual(balance.currency, "USD")
    }

    func testNumbersAndUsage() async throws {
        let numbers = try await client.fetchIncomingNumbers()
        XCTAssertEqual(numbers.map(\.phoneNumber), [DemoBackend.mainNumber, DemoBackend.supportNumber, DemoBackend.ukNumber])
        XCTAssertTrue(numbers.allSatisfy { $0.capabilities?.voice == true })
        let verified = try await client.fetchVerifiedCallerIds()
        XCTAssertEqual(verified.map(\.phoneNumber), [DemoBackend.verifiedNumber])
        let usage = try await client.fetchUsage()
        XCTAssertFalse(usage.isEmpty)
        let services = try await client.fetchMessagingServices()
        XCTAssertEqual(services.count, 1)
    }

    func testMessagesSortedNewestFirst() async throws {
        let page = try await client.fetchMessages()
        XCTAssertGreaterThan(page.messages.count, 10)
        let dates = page.messages.compactMap(\.dateCreated)
        XCTAssertEqual(dates.count, page.messages.count)
        XCTAssertEqual(dates, dates.sorted(by: >))
        XCTAssertTrue(page.messages.contains { $0.statusKind.isFailure && $0.errorCode == 30006 })
    }

    func testSendMessageProgressesToDelivered() async throws {
        let sent = try await client.sendMessage(OutgoingMessage(from: DemoBackend.mainNumber, to: "+14155550123", body: "Hello"))
        XCTAssertEqual(sent.statusKind, .queued)
        XCTAssertFalse(sent.isInbound)
        try await Task.sleep(for: .seconds(3.5))
        let later = try await client.fetchMessage(sid: sent.sid)
        XCTAssertEqual(later.statusKind, .delivered)
    }

    func testScheduledMessageAndCancel() async throws {
        let sent = try await client.sendMessage(OutgoingMessage(from: nil, messagingServiceSid: "MG00000000000000000000000000000001",
                                                                to: "+14155550123", body: "Later", sendAt: .now.addingTimeInterval(3600)))
        XCTAssertEqual(sent.statusKind, .scheduled)
        let canceled = try await client.cancelScheduledMessage(sid: sent.sid)
        XCTAssertEqual(canceled.statusKind, .canceled)
    }

    func testInvalidRecipient() async {
        do {
            _ = try await client.sendMessage(OutgoingMessage(from: DemoBackend.mainNumber, to: "12", body: "x"))
            XCTFail("expected error")
        } catch let e as TwilioAPIError {
            XCTAssertEqual(e.code, 21211)
        } catch {
            XCTFail("unexpected \(error)")
        }
    }

    func testDeleteMessage() async throws {
        let first = try await client.fetchMessages().messages[0]
        try await client.deleteMessage(sid: first.sid)
        let after = try await client.fetchMessages().messages
        XCTAssertFalse(after.contains { $0.sid == first.sid })
    }

    func testBridgeCallLifecycle() async throws {
        let request = OutgoingCall(from: DemoBackend.mainNumber, destination: "+14155550123", mode: .bridge, personalPhone: DemoBackend.verifiedNumber)
        let placed = try await client.placeCall(request)
        XCTAssertEqual(placed.to, DemoBackend.verifiedNumber, "bridge rings the user's own phone first")
        XCTAssertEqual(placed.statusKind, .queued)

        try await Task.sleep(for: .seconds(1.5))
        let ringing = try await client.fetchCall(sid: placed.sid)
        XCTAssertEqual(ringing.statusKind, .ringing)
        let noChildYet = try await client.fetchChildCalls(parentSid: placed.sid)
        XCTAssertTrue(noChildYet.isEmpty)

        try await Task.sleep(for: .seconds(3))
        let live = try await client.fetchCall(sid: placed.sid)
        XCTAssertEqual(live.statusKind, .inProgress)
        let children = try await client.fetchChildCalls(parentSid: placed.sid)
        XCTAssertEqual(children.count, 1)
        XCTAssertEqual(children.first?.to, "+14155550123")
        XCTAssertEqual(children.first?.parentCallSid, placed.sid)

        try await Task.sleep(for: .seconds(1.2))
        let ended = try await client.endCall(sid: placed.sid)
        XCTAssertEqual(ended.statusKind, .completed)
        XCTAssertGreaterThanOrEqual(ended.durationSeconds, 1)

        let list = try await client.fetchCalls().calls
        XCTAssertTrue(list.contains { $0.sid == placed.sid })
        XCTAssertFalse(list.contains { $0.parentCallSid != nil }, "child legs are not listed at top level")
    }

    func testCancelBeforeAnswer() async throws {
        var request = OutgoingCall(from: DemoBackend.mainNumber, destination: "+14155550123", mode: .say)
        request.message = "Hello there"
        let placed = try await client.placeCall(request)
        XCTAssertEqual(placed.to, "+14155550123")
        let canceled = try await client.endCall(sid: placed.sid, cancel: true)
        XCTAssertEqual(canceled.statusKind, .canceled)
    }

    func testLookup() async throws {
        let basic = try await client.lookup("+14155550100")
        XCTAssertEqual(basic.valid, true)
        XCTAssertEqual(basic.countryCode, "US")
        XCTAssertNil(basic.lineTypeIntelligence)
        let rich = try await client.lookup("+447700900123", lineType: true, callerName: true)
        XCTAssertEqual(rich.countryCode, "GB")
        XCTAssertEqual(rich.lineTypeIntelligence?.type, "mobile")
        XCTAssertNotNil(rich.callerName?.callerName)
    }
}
