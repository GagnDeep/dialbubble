import XCTest

/// Captures the raw screens used for the App Store listing and dialbubble.com.
/// Run through Tools/capture_screens.sh, which picks the simulator and exports the attachments.
final class StoreScreenshotsUITests: XCTestCase {
    override func setUp() { continueAfterFailure = false }

    func testCaptureDark() { capture(dark: true) }
    func testCaptureLight() { capture(dark: false) }

    private func launch(_ dark: Bool, tab: String? = nil, demo: Bool = true) -> XCUIApplication {
        let app = XCUIApplication()
        var args = ["-uiTesting", "-uiTestReset", "-marketing"]
        if demo { args.append("-demo") }
        if let tab { args += ["-tab", tab] }
        args += ["-relay.appearance", dark ? "dark" : "light"]
        app.launchArguments = args
        app.launch()
        return app
    }

    private func el(_ app: XCUIApplication, _ id: String) -> XCUIElement { app.descendants(matching: .any)[id].firstMatch }
    private func tap(_ app: XCUIApplication, _ id: String) {
        let e = el(app, id)
        XCTAssertTrue(e.waitForExistence(timeout: 12), "Missing \(id)")
        e.tap()
    }
    private func snap(_ app: XCUIApplication, _ name: String, _ dark: Bool) {
        let a = XCTAttachment(screenshot: app.screenshot())
        a.name = "\(name)-\(dark ? "dark" : "light")"
        a.lifetime = .keepAlways
        add(a)
    }

    private func capture(dark: Bool) {
        var app = launch(dark, demo: false)
        XCTAssertTrue(el(app, "onboarding.start").waitForExistence(timeout: 15) || app.buttons.firstMatch.waitForExistence(timeout: 5))
        sleep(1)
        snap(app, "onboarding", dark)
        app.terminate()

        app = launch(dark, tab: "home")
        sleep(4)
        snap(app, "home", dark)
        app.terminate()

        app = launch(dark, tab: "calls")
        XCTAssertTrue(el(app, "keypad.key.4").waitForExistence(timeout: 15))
        tap(app, "keypad.mode.bridge")
        for d in "4155550123" { tap(app, "keypad.key.\(d)") }
        sleep(1)
        snap(app, "keypad", dark)
        tap(app, "keypad.call")
        XCTAssertTrue(el(app, "activeCall.status").waitForExistence(timeout: 10))
        sleep(7)
        snap(app, "active-call", dark)
        tap(app, "activeCall.hangup")
        sleep(2)
        tap(app, "activeCall.done")
        app.terminate()

        app = launch(dark, tab: "calls")
        XCTAssertTrue(el(app, "keypad.key.4").waitForExistence(timeout: 15))
        for d in "4155550145" { tap(app, "keypad.key.\(d)") }
        tap(app, "keypad.mode.say")
        tap(app, "keypad.call")
        let message = el(app, "composer.message")
        XCTAssertTrue(message.waitForExistence(timeout: 6))
        message.tap()
        message.typeText("Hi, your order is ready for pickup today until 6 PM. Thanks for choosing us.")
        tap(app, "composer.doneEditing")
        sleep(2)
        snap(app, "voice-message", dark)
        app.terminate()

        app = launch(dark, tab: "calls")
        XCTAssertTrue(el(app, "keypad.key.4").waitForExistence(timeout: 15))
        app.segmentedControls.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Recents")).firstMatch.tap()
        sleep(3)
        snap(app, "recents", dark)
        let firstCall = app.descendants(matching: .any).matching(NSPredicate(format: "label CONTAINS %@ OR label CONTAINS %@", "Marco Ruiz", "555-0145")).firstMatch
        if firstCall.waitForExistence(timeout: 5) {
            firstCall.tap()
            sleep(2)
            snap(app, "call-detail", dark)
        }
        app.terminate()

        app = launch(dark, tab: "messages")
        sleep(4)
        snap(app, "messages", dark)
        let thread = app.descendants(matching: .any).matching(NSPredicate(format: "label CONTAINS %@ OR label CONTAINS %@", "Dana Kim", "555-0123")).firstMatch
        XCTAssertTrue(thread.waitForExistence(timeout: 6))
        thread.tap()
        sleep(3)
        snap(app, "conversation", dark)
        app.terminate()

        app = launch(dark, tab: "settings")
        sleep(3)
        snap(app, "settings", dark)
        app.terminate()
    }
}
