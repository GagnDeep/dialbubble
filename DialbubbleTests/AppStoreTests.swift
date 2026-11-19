import XCTest
@testable import Dialbubble

@MainActor
final class AppStoreTests: XCTestCase {
    private var store: AppStore!

    override func setUp() async throws {
        AppStore.resetAllData()
        await DemoBackend.shared.reset()
        store = AppStore()
    }

    override func tearDown() async throws {
        store = nil
        AppStore.resetAllData()
    }

    private func msg(_ sid: String, from: String, to: String, inbound: Bool, ago: TimeInterval) -> TwilioMessage {
        let d = Date.now.addingTimeInterval(-ago)
        return TwilioMessage(sid: sid, from: from, to: to, body: sid, status: inbound ? "received" : "delivered",
                             direction: inbound ? "inbound" : "outbound-api", dateCreated: d, dateSent: d, dateUpdated: d,
                             numMedia: "0", numSegments: "1", price: nil, priceUnit: nil, errorCode: nil, errorMessage: nil,
                             messagingServiceSid: nil)
    }

    func testConversationGroupingAndOrder() {
        let us = "+14155550101", a = "+14155550123", b = "+14155550145"
        store.messages = [
            msg("b1", from: b, to: us, inbound: true, ago: 5000),
            msg("a2", from: us, to: a, inbound: false, ago: 100),
            msg("a1", from: a, to: us, inbound: true, ago: 200),
            msg("x", from: us, to: "", inbound: false, ago: 10),
        ]
        let convos = store.conversations
        XCTAssertEqual(convos.count, 2)
        XCTAssertEqual(convos[0].id, "\(us)|\(a)")
        XCTAssertEqual(convos[0].messages.map(\.sid), ["a1", "a2"])
        XCTAssertEqual(convos[0].lastMessage?.sid, "a2")
        XCTAssertEqual(convos[1].counterpart, b)
        XCTAssertEqual(store.conversation(our: us, counterpart: a).messages.count, 2)
        XCTAssertTrue(store.conversation(our: us, counterpart: "+1999").messages.isEmpty)
    }

    func testUnreadTracking() {
        let us = "+14155550101", a = "+14155550123", c = "+14155550177"
        store.messages = [
            msg("a1", from: a, to: us, inbound: true, ago: 60),
            msg("c1", from: us, to: c, inbound: false, ago: 30),
        ]
        let convA = store.conversation(our: us, counterpart: a)
        let convC = store.conversation(our: us, counterpart: c)
        XCTAssertTrue(store.isUnread(convA))
        XCTAssertFalse(store.isUnread(convC), "outbound-only threads are never unread")
        XCTAssertEqual(store.unreadCount, 1)
        store.markRead(convA)
        XCTAssertFalse(store.isUnread(convA))
        XCTAssertEqual(store.unreadCount, 0)
    }

    func testNoProfileState() {
        XCTAssertFalse(store.hasAccount)
        XCTAssertNil(store.client)
        XCTAssertTrue(store.setupTasks.isEmpty)
        XCTAssertFalse(store.isDemo)
    }

    func testDemoLifecycle() async throws {
        await store.startDemo()
        XCTAssertTrue(store.isDemo)
        XCTAssertEqual(store.profiles.count, 1)
        XCTAssertNotNil(store.client)
        let profile = try XCTUnwrap(store.activeProfile)
        XCTAssertEqual(profile.numbers.count, 4)
        XCTAssertEqual(profile.numbers.filter { $0.source == .verified }.count, 1)
        let verified = try XCTUnwrap(profile.numbers.first { $0.source == .verified })
        XCTAssertTrue(verified.voice); XCTAssertFalse(verified.sms)
        XCTAssertEqual(profile.personalPhone, DemoBackend.verifiedNumber)
        XCTAssertEqual(profile.messagingServiceSid, "MG00000000000000000000000000000001")
        XCTAssertEqual(profile.defaultCallerNumber, DemoBackend.mainNumber)
        XCTAssertEqual(store.callerNumbers.count, 4)
        XCTAssertEqual(store.smsNumbers.count, 3)
        // FeatureFlags.messaging: messages aren't fetched while texting is hidden.
        XCTAssertEqual(store.messages.isEmpty, !FeatureFlags.messaging)
        XCTAssertFalse(store.calls.isEmpty)
        XCTAssertEqual(store.balance?.amount ?? 0, 18.42, accuracy: 0.001)

        let tasks = store.setupTasks
        XCTAssertTrue(tasks.first { $0.kind == .numbers }?.isDone == true)
        XCTAssertTrue(tasks.first { $0.kind == .personalPhone }?.isDone == true)
        if FeatureFlags.messaging {
            XCTAssertEqual(tasks.count, 6)
            XCTAssertTrue(tasks.first { $0.kind == .messagingService }?.isDone == true)
        } else {
            XCTAssertEqual(tasks.count, 4, "texting tasks are hidden while messaging is disabled")
            XCTAssertFalse(tasks.contains { $0.kind == .firstMessage || $0.kind == .messagingService })
        }
        XCTAssertTrue(tasks.first { $0.kind == .personalPhone }?.isOptional == true, "Your phone is optional, matching onboarding")
        XCTAssertGreaterThan(store.setupProgress, 0.5)

        // Starting again re-uses the same demo profile.
        await store.startDemo()
        XCTAssertEqual(store.profiles.count, 1)

        store.exitDemo()
        XCTAssertFalse(store.isDemo)
        XCTAssertTrue(store.profiles.isEmpty)
        XCTAssertFalse(store.hasAccount)
    }

    func testSendAndCallThroughStore() async throws {
        await store.startDemo()
        let sent = try await store.sendMessage(OutgoingMessage(from: DemoBackend.mainNumber, to: "(415) 555-0188", body: "Hi"))
        XCTAssertEqual(sent.to, "+14155550188", "store normalizes recipients to E.164")
        XCTAssertEqual(store.messages.first?.sid, sent.sid)

        let call = try await store.placeCall(OutgoingCall(from: DemoBackend.mainNumber, destination: "415 555 0123", mode: .bridge))
        XCTAssertEqual(call.to, DemoBackend.verifiedNumber, "bridge uses profile.personalPhone when not supplied")
        XCTAssertEqual(store.liveCall?.call.sid, call.sid)
        XCTAssertEqual(store.liveCall?.destination, "+14155550123")
        XCTAssertEqual(store.calls.first?.sid, call.sid)
        store.exitDemo()
    }

    func testTrialAccountsCannotPlaceTalkCalls() async throws {
        await store.startDemo()
        var profile = try XCTUnwrap(store.activeProfile)
        profile.isTrial = true
        store.updateProfile(profile)
        do {
            _ = try await store.placeCall(OutgoingCall(from: DemoBackend.mainNumber, destination: "415 555 0123", mode: .bridge))
            XCTFail("Talk must not be placed on a trial account")
        } catch ClientError.invalidInput(let reason) {
            XCTAssertEqual(reason, AppStore.trialTalkMessage)
        }
        var say = OutgoingCall(from: DemoBackend.mainNumber, destination: "415 555 0123", mode: .say)
        say.message = "Hello"
        _ = try await store.placeCall(say)
        store.exitDemo()
    }

    func testTemplatesAndRouting() {
        let before = store.templates.count
        let t = MessageTemplate(title: "T", body: "B")
        store.saveTemplate(t)
        XCTAssertEqual(store.templates.count, before + 1)
        var edited = t; edited.body = "B2"
        store.saveTemplate(edited)
        XCTAssertEqual(store.templates.count, before + 1)
        XCTAssertEqual(store.templates.last?.body, "B2")

        store.openMessage(to: "+1", from: "+2", body: "x")
        if FeatureFlags.messaging {
            XCTAssertEqual(store.selectedTab, .messages)
            XCTAssertEqual(store.messageDraft?.to, "+1")
        } else {
            XCTAssertNotEqual(store.selectedTab, .messages, "openMessage is a no-op while messaging is disabled")
            XCTAssertNil(store.messageDraft)
        }
        store.openDialer(to: "+3")
        XCTAssertEqual(store.selectedTab, .calls)
        XCTAssertEqual(store.dialDraft?.to, "+3")
    }
}
