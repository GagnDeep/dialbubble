import XCTest

/// End-to-end walkthroughs driven against Demo Mode. Each test attaches screenshots for visual review.
final class WalkthroughUITests: XCTestCase {
    /// Mirrors `FeatureFlags.messaging` in the app (UI tests can't read it). Keep the two in sync.
    private static let messagingEnabled = true

    override func setUp() {
        continueAfterFailure = false
    }

    // MARK: Helpers

    private func launch(reset: Bool = true, demo: Bool = false, dark: Bool = false, tab: String? = nil) -> XCUIApplication {
        let app = XCUIApplication()
        var args = ["-uiTesting"]
        if reset { args.append("-uiTestReset") }
        if demo { args.append("-demo") }
        if let tab { args += ["-tab", tab] }
        args += ["-relay.appearance", dark ? "dark" : "light"]
        app.launchArguments = args
        app.launch()
        return app
    }

    private func snap(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = name
        shot.lifetime = .keepAlways
        add(shot)
    }

    @discardableResult
    private func tap(_ app: XCUIApplication, _ id: String, timeout: TimeInterval = 8, file: StaticString = #filePath, line: UInt = #line) -> XCUIElement {
        let el = app.descendants(matching: .any)[id].firstMatch
        XCTAssertTrue(el.waitForExistence(timeout: timeout), "Missing element \(id)", file: file, line: line)
        el.tap()
        return el
    }

    private func element(_ app: XCUIApplication, _ id: String) -> XCUIElement {
        app.descendants(matching: .any)[id].firstMatch
    }

    private func tabButton(_ app: XCUIApplication, _ label: String) -> XCUIElement {
        app.tabBars.buttons[label].firstMatch
    }

    /// The iOS 26 tab bar minimizes on scroll; scroll back up to reveal it before switching tabs.
    private func goTab(_ app: XCUIApplication, _ label: String) {
        let button = tabButton(app, label)
        for _ in 0..<3 where !button.isHittable { app.swipeDown() }
        button.tap()
    }

    private func text(_ app: XCUIApplication, _ label: String) -> XCUIElement {
        app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", label)).firstMatch
    }

    // MARK: Onboarding

    func testOnboardingGuidedFlowAndValidation() {
        let app = launch()
        snap(app, "01-welcome")

        // New to Twilio → in-app sign-up guide.
        tap(app, "onboarding.noAccount")
        XCTAssertTrue(element(app, "onboarding.guideDone").waitForExistence(timeout: 5))
        snap(app, "02-signup-guide")
        tap(app, "onboarding.guideDone")
        let sid = element(app, "onboarding.accountSid")
        XCTAssertTrue(sid.waitForExistence(timeout: 5))
        snap(app, "03-credentials-empty")

        let submit = element(app, "onboarding.submitCredentials")
        XCTAssertTrue(submit.exists)
        XCTAssertFalse(submit.isEnabled, "Connect must be disabled until credentials are valid")

        // The field can sit just under the bottom button bar; scroll it clear before tapping.
        app.swipeUp()
        sid.tap()
        sid.typeText("AC123")
        snap(app, "04-credentials-invalid")
        XCTAssertFalse(submit.isEnabled)

        // Help is reachable from every step.
        tap(app, "onboarding.help")
        snap(app, "05-credentials-help")
        app.swipeDown(velocity: .fast)

        // Back walks out one step at a time, all the way to Welcome.
        for _ in 0..<4 where !element(app, "onboarding.tryDemo").exists {
            tap(app, "onboarding.back")
            sleep(1)
        }
        XCTAssertTrue(element(app, "onboarding.tryDemo").waitForExistence(timeout: 5))
    }

    func testOnboardingRejectsBadCredentialsWithGuidance() throws {
        let app = launch()
        tap(app, "onboarding.connect")
        let sid = element(app, "onboarding.accountSid")
        XCTAssertTrue(sid.waitForExistence(timeout: 5))
        // The field can sit just under the bottom button bar; scroll it clear before tapping.
        app.swipeUp()
        sid.tap()
        sid.typeText("AC" + String(repeating: "0", count: 31) + "1")
        // Return moves focus to the Auth Token field (guided keyboard flow).
        sid.typeText("\n")
        app.typeText(String(repeating: "a", count: 32))
        let submit = element(app, "onboarding.submitCredentials")
        XCTAssertTrue(submit.isEnabled)
        submit.tap()
        // Real network: expect a friendly authentication error (or an offline message).
        let predicate = NSPredicate(format: "label CONTAINS[c] 'sign in' OR label CONTAINS[c] 'offline' OR label CONTAINS[c] 'credentials' OR label CONTAINS[c] 'network'")
        let message = app.descendants(matching: .any).matching(predicate).firstMatch
        XCTAssertTrue(message.waitForExistence(timeout: 25), "Expected a friendly error after bad credentials")
        snap(app, "06-credentials-error")
    }

    func testDemoModeFromWelcome() {
        let app = launch()
        tap(app, "onboarding.tryDemo")
        XCTAssertTrue(tabButton(app, "Home").waitForExistence(timeout: 15))
        XCTAssertTrue(element(app, "home.demoBanner").waitForExistence(timeout: 10))
        snap(app, "07-home-demo")
    }

    // MARK: Tour

    func testTourAllTabsLight() { tour(dark: false) }
    func testTourAllTabsDark() { tour(dark: true) }

    private func tour(dark: Bool) {
        let suffix = dark ? "dark" : "light"
        let app = launch(demo: true, dark: dark)
        XCTAssertTrue(tabButton(app, "Home").waitForExistence(timeout: 15))
        sleep(3)
        snap(app, "tour-home-\(suffix)")
        app.swipeUp()
        snap(app, "tour-home-scrolled-\(suffix)")

        goTab(app, "Calls")
        sleep(1)
        snap(app, "tour-calls-keypad-\(suffix)")
        let picker = element(app, "calls.modePicker")
        if picker.waitForExistence(timeout: 3) {
            let recents = NSPredicate(format: "label BEGINSWITH %@", "Recents")
            let inPicker = picker.buttons.matching(recents).firstMatch
            if inPicker.exists { inPicker.tap() } else { app.buttons.matching(recents).firstMatch.tap() }
            sleep(1)
            snap(app, "tour-calls-recents-\(suffix)")
        }

        if Self.messagingEnabled {
            goTab(app, "Messages")
            sleep(2)
            snap(app, "tour-messages-\(suffix)")
            let firstThread = app.descendants(matching: .any).matching(NSPredicate(format: "label CONTAINS %@ OR label CONTAINS %@", "Dana Kim", "555-0123")).firstMatch
            if firstThread.waitForExistence(timeout: 5) {
                firstThread.tap()
                sleep(2)
                snap(app, "tour-conversation-\(suffix)")
                app.navigationBars.buttons.firstMatch.tap()
            }
        } else {
            XCTAssertFalse(tabButton(app, "Messages").exists, "Messages tab is hidden while FeatureFlags.messaging is off")
        }

        goTab(app, "Settings")
        sleep(1)
        snap(app, "tour-settings-\(suffix)")
        let help = element(app, "settings.help")
        for _ in 0..<6 where !help.isHittable { app.swipeUp() }
        if help.waitForExistence(timeout: 3) {
            help.tap()
            sleep(1)
            snap(app, "tour-help-\(suffix)")
        }
    }

    // MARK: Polish round two

    private func thread(_ app: XCUIApplication, _ needles: String...) -> XCUIElement {
        let preds = needles.map { NSPredicate(format: "label CONTAINS %@", $0) }
        return app.descendants(matching: .any).matching(NSCompoundPredicate(orPredicateWithSubpredicates: preds)).firstMatch
    }

    func testPolishTwoInDemo() throws {
        try XCTSkipUnless(Self.messagingEnabled, "Messaging disabled (FeatureFlags.messaging)")
        let app = launch(demo: true)
        XCTAssertTrue(tabButton(app, "Home").waitForExistence(timeout: 15))
        sleep(3)
        snap(app, "p2-01-home-attention")

        // Home chip jumps to Messages, filtered to Unread.
        tap(app, "home.attention.unread")
        sleep(1)
        snap(app, "p2-02-unread-filter")
        tap(app, "messages.filter.all")

        // A sign-in code gets a one-tap copy chip.
        let codeThread = thread(app, "555-0134")
        XCTAssertTrue(codeThread.waitForExistence(timeout: 5))
        codeThread.tap()
        tap(app, "conversation.copyCode")
        snap(app, "p2-03-code-copied")
        app.navigationBars.buttons.firstMatch.tap()

        // Phone numbers in a message open Dialbubble's keypad.
        let priya = thread(app, "Priya Shah", "555-0188")
        XCTAssertTrue(priya.waitForExistence(timeout: 5))
        priya.tap()
        sleep(1)
        snap(app, "p2-04-links")
        let phoneLink = app.links.matching(NSPredicate(format: "label CONTAINS %@", "555-0100")).firstMatch
        if phoneLink.waitForExistence(timeout: 3) {
            phoneLink.tap()
            let display = element(app, "keypad.display")
            XCTAssertTrue(display.waitForExistence(timeout: 5), "Tapping a number should open the keypad")
            snap(app, "p2-05-link-to-keypad")
            goTab(app, "Messages")
            sleep(1)
        } else {
            XCTFail("Phone number in message should be a link")
        }
        if app.navigationBars.buttons.firstMatch.exists, !element(app, "messages.compose").isHittable {
            app.navigationBars.buttons.firstMatch.tap()
        }

        // Drafts survive leaving the thread and show in the list.
        let dana = thread(app, "Dana Kim", "555-0123")
        XCTAssertTrue(dana.waitForExistence(timeout: 5))
        dana.tap()
        let input = element(app, "conversation.input")
        XCTAssertTrue(input.waitForExistence(timeout: 5))
        input.tap()
        input.typeText("See you at noon")
        snap(app, "p2-06-dana-thread")
        app.navigationBars.buttons.firstMatch.tap()
        XCTAssertTrue(thread(app, "See you at noon").waitForExistence(timeout: 5), "Draft preview in the list")

        // Pin by swiping right.
        let marco = thread(app, "Marco Ruiz", "555-0145")
        marco.swipeRight()
        let pin = app.buttons["Pin"].firstMatch
        if pin.waitForExistence(timeout: 3) { pin.tap() }
        sleep(1)
        snap(app, "p2-07-pinned-and-draft")

        // Keypad spells names: 3-2-6 → Dana.
        goTab(app, "Calls")
        let delete = element(app, "keypad.delete")
        if delete.waitForExistence(timeout: 2), delete.isHittable { delete.press(forDuration: 1.0) }
        for key in ["3", "2", "6"] { tap(app, "keypad.key.\(key)") }
        let suggestion = element(app, "keypad.suggestion")
        XCTAssertTrue(suggestion.waitForExistence(timeout: 3), "Keypad should suggest a contact")
        snap(app, "p2-08-keypad-suggest")
        suggestion.tap()
        sleep(1)
        snap(app, "p2-09-keypad-picked")

        // Call details show history with the person.
        let picker = element(app, "calls.modePicker")
        let recents = picker.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Recents")).firstMatch
        if recents.exists { recents.tap() } else { app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Recents")).firstMatch.tap() }
        let danaCall = thread(app, "Dana Kim")
        XCTAssertTrue(danaCall.waitForExistence(timeout: 5))
        danaCall.tap()
        sleep(1)
        snap(app, "p2-10-call-detail")
        app.swipeUp()
        snap(app, "p2-11-call-detail-scrolled")

        // Activity chart: touch a day.
        goTab(app, "Home")
        app.swipeUp()
        let chart = app.descendants(matching: .any).matching(NSPredicate(format: "label CONTAINS %@", "over the last 7 days")).firstMatch
        if chart.waitForExistence(timeout: 3) {
            chart.coordinate(withNormalizedOffset: CGVector(dx: 0.85, dy: 0.6)).press(forDuration: 0.6)
            snap(app, "p2-12-chart")
        }
    }

    // MARK: Polish round three

    func testPolishThreeInDemo() throws {
        try XCTSkipUnless(Self.messagingEnabled, "Messaging disabled (FeatureFlags.messaging)")
        let app = launch(demo: true, tab: "messages")
        XCTAssertTrue(element(app, "messages.compose").waitForExistence(timeout: 15))
        sleep(2)

        // Pinned threads move into the avatar grid.
        let marco = thread(app, "Marco Ruiz", "555-0145")
        XCTAssertTrue(marco.waitForExistence(timeout: 5))
        marco.swipeRight()
        app.buttons["Pin"].firstMatch.tap()
        XCTAssertTrue(element(app, "messages.pinned").waitForExistence(timeout: 3), "Pinned grid should appear")
        snap(app, "p3-01-pinned-grid")

        // Delete a conversation (with confirmation).
        let leo = thread(app, "Leo Martin", "555-0177")
        XCTAssertTrue(leo.waitForExistence(timeout: 5))
        leo.swipeLeft()
        app.buttons["Delete"].firstMatch.tap()
        let confirm = app.buttons["Delete 1 Message"].firstMatch
        XCTAssertTrue(confirm.waitForExistence(timeout: 3))
        snap(app, "p3-02-delete-confirm")
        confirm.tap()
        sleep(3)
        XCTAssertFalse(thread(app, "Leo Martin").exists, "Deleted conversation should be gone")
        snap(app, "p3-03-deleted")

        // New Message: type a name, pick the suggestion.
        tap(app, "messages.compose")
        let to = element(app, "newMessage.to")
        XCTAssertTrue(to.waitForExistence(timeout: 5))
        to.tap()
        to.typeText("Pri")
        let suggestion = element(app, "newMessage.suggestion")
        XCTAssertTrue(suggestion.waitForExistence(timeout: 3), "Typing a name suggests the contact")
        snap(app, "p3-04-name-suggest")
        suggestion.tap()
        sleep(1)
        snap(app, "p3-05-name-picked")
        app.buttons["Cancel"].firstMatch.tap()
        if app.buttons["Discard"].waitForExistence(timeout: 2) { app.buttons["Discard"].tap() }

        // Open a thread: header card and day/time headers.
        let priya = thread(app, "Priya Shah", "555-0188")
        XCTAssertTrue(priya.waitForExistence(timeout: 5))
        priya.tap()
        sleep(1)
        app.swipeDown()
        snap(app, "p3-06-thread-header")
        app.navigationBars.buttons.firstMatch.tap()

        // Talk call → minimize → Return to Call bar.
        goTab(app, "Calls")
        let delete = element(app, "keypad.delete")
        if delete.waitForExistence(timeout: 2), delete.isHittable { delete.press(forDuration: 1.0) }
        tap(app, "keypad.mode.bridge")
        for d in "2125550188" { tap(app, "keypad.key.\(d)") }
        tap(app, "keypad.call")
        XCTAssertTrue(element(app, "activeCall.status").waitForExistence(timeout: 10))
        sleep(3)
        tap(app, "activeCall.minimize")
        let bar = element(app, "status.returnToCall")
        XCTAssertTrue(bar.waitForExistence(timeout: 5), "Minimized call shows a Return to Call bar")
        snap(app, "p3-07-return-bar")
        bar.tap()
        XCTAssertTrue(element(app, "activeCall.status").waitForExistence(timeout: 5))
        tap(app, "activeCall.hangup")
        sleep(2)
        snap(app, "p3-08-call-ended")
        tap(app, "activeCall.done")

        // Settings: notifications and your data.
        goTab(app, "Settings")
        let export = element(app, "settings.export")
        for _ in 0..<8 where !export.isHittable { app.swipeUp() }
        snap(app, "p3-09-settings-data")
    }

    // MARK: Messaging

    func testSendMessageInDemo() throws {
        try XCTSkipUnless(Self.messagingEnabled, "Messaging disabled (FeatureFlags.messaging)")
        let app = launch(demo: true, tab: "messages")
        tap(app, "messages.compose", timeout: 15)
        let to = element(app, "newMessage.to")
        XCTAssertTrue(to.waitForExistence(timeout: 5))
        to.tap()
        to.typeText("4155550142")
        let body = element(app, "newMessage.body")
        body.tap()
        body.typeText("Hello from the UI test 👋")
        snap(app, "msg-01-compose")
        tap(app, "newMessage.send")
        let sent = text(app, "Hello from the UI test 👋")
        XCTAssertTrue(sent.waitForExistence(timeout: 10), "Sent message should appear in the conversation")
        sleep(4)
        snap(app, "msg-02-sent")

        // Reply in the thread via the composer.
        let input = element(app, "conversation.input")
        if input.waitForExistence(timeout: 5) {
            input.tap()
            input.typeText("Second message")
            tap(app, "conversation.send")
            XCTAssertTrue(text(app, "Second message").waitForExistence(timeout: 10))
            snap(app, "msg-03-thread")
        }
    }

    // MARK: Calling

    func testVoiceMessageCallInDemo() {
        let app = launch(demo: true, tab: "calls")
        XCTAssertTrue(element(app, "keypad.key.4").waitForExistence(timeout: 15))
        for d in "4155550199" { tap(app, "keypad.key.\(d)") }
        tap(app, "keypad.mode.say")
        snap(app, "call-01-keypad")
        tap(app, "keypad.call")
        let message = element(app, "composer.message")
        XCTAssertTrue(message.waitForExistence(timeout: 5))
        message.tap()
        message.typeText("This is a test call from Dialbubble.")
        snap(app, "call-02-composer")
        tap(app, "composer.doneEditing")
        tap(app, "composer.place")

        let status = element(app, "activeCall.status")
        XCTAssertTrue(status.waitForExistence(timeout: 10), "Active call screen should appear")
        snap(app, "call-03-active")
        sleep(6)
        snap(app, "call-04-in-progress")
        tap(app, "activeCall.hangup")
        sleep(3)
        snap(app, "call-05-ended")
        tap(app, "activeCall.done")
    }

    func testTalkCallInDemo() {
        let app = launch(demo: true, tab: "calls")
        XCTAssertTrue(element(app, "keypad.key.4").waitForExistence(timeout: 15))
        tap(app, "keypad.mode.bridge")
        for d in "2125550188" { tap(app, "keypad.key.\(d)") }
        tap(app, "keypad.call")
        XCTAssertTrue(element(app, "activeCall.status").waitForExistence(timeout: 10))
        sleep(7)
        snap(app, "talk-01-connecting")
        tap(app, "activeCall.hangup")
        sleep(2)
        tap(app, "activeCall.done")
    }

    /// Twilio blocks Talk on trial accounts, so the keypad must steer people to Voice Message instead of placing it.
    func testTrialAccountSteersTalkToVoiceMessage() {
        let app = XCUIApplication()
        app.launchArguments = ["-uiTesting", "-uiTestReset", "-demo", "-trialDemo", "-tab", "calls"]
        app.launch()
        let key = app.descendants(matching: .any)["keypad.key.4"].firstMatch
        XCTAssertTrue(key.waitForExistence(timeout: 15))
        let talk = app.descendants(matching: .any)["keypad.mode.bridge"].firstMatch
        XCTAssertTrue(talk.waitForExistence(timeout: 5))
        talk.tap()
        let hint = app.descendants(matching: .any)["keypad.trialTalkHint"].firstMatch
        XCTAssertTrue(hint.waitForExistence(timeout: 10), "Trial accounts see why Talk is unavailable")
        snap(app, "trial-keypad")
        for d in "4155550123" { app.descendants(matching: .any)["keypad.key.\(d)"].firstMatch.tap() }
        app.descendants(matching: .any)["keypad.call"].firstMatch.tap()
        XCTAssertFalse(app.descendants(matching: .any)["activeCall.status"].firstMatch.waitForExistence(timeout: 2), "Talk must not be placed")
        snap(app, "trial-blocked")
        hint.tap()
        XCTAssertFalse(hint.waitForExistence(timeout: 2), "Choosing Voice Message clears the hint")
        snap(app, "trial-voice-message")
    }
}
