import XCTest
import UIKit
@testable import Dialbubble

final class ThemeTests: XCTestCase {
    func testBrandContrastWithWhiteText() {
        for style in [UIUserInterfaceStyle.light, .dark] {
            let brand = Theme.Palette.brandUIColor.resolvedColor(with: UITraitCollection(userInterfaceStyle: style))
            XCTAssertGreaterThanOrEqual(Theme.contrastRatio(brand, .white), 3.0, "White bold text on brand must be ≥ 3:1 in \(style == .dark ? "dark" : "light") mode")
        }
    }

    func testNoRedOrPinkInAutomaticPalettes() {
        XCTAssertFalse(AppTint.rotation.contains(.red))
        XCTAssertFalse(AppTint.rotation.contains(.pink))
        XCTAssertEqual(AppTint.rotation.first, .mint)
        XCTAssertEqual(AccountProfile(name: "x", accountSid: "AC").tint, .mint)
    }

    func testMigrationMovesPinkAndRedProfilesToMint() {
        let defaults = UserDefaults(suiteName: "ThemeTests-\(UUID().uuidString)")!
        var red = AccountProfile(name: "Red", accountSid: "AC1"); red.tint = .red
        var pink = AccountProfile(name: "Pink", accountSid: "AC2"); pink.tint = .pink
        var blue = AccountProfile(name: "Blue", accountSid: "AC3"); blue.tint = .blue
        var profiles = [red, pink, blue]
        XCTAssertTrue(AppStore.migrateTheme(&profiles, defaults: defaults))
        XCTAssertEqual(profiles.map(\.tint), [.mint, .mint, .blue])
        // Runs only once.
        profiles[2].tint = .red
        XCTAssertFalse(AppStore.migrateTheme(&profiles, defaults: defaults))
        XCTAssertEqual(profiles[2].tint, .red)
    }
}
