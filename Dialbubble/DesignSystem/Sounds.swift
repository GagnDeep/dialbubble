import AudioToolbox
import Foundation

/// Short system sounds, like Messages and Phone. They follow the ring/silent switch, and the
/// Settings › Sounds switch turns all of them off (keypad tones included).
enum Sounds {
    enum Effect {
        case sent, received
        var id: SystemSoundID { self == .sent ? 1004 : 1003 }
    }

    /// Stored under the original keypad-tones key so people who turned tones off keep everything quiet.
    static let key = "relay.keypadTones"

    static var isEnabled: Bool { UserDefaults.standard.object(forKey: key) as? Bool ?? true }

    static func play(_ effect: Effect) {
        guard isEnabled, !ProcessInfo.processInfo.arguments.contains("-uiTesting") else { return }
        AudioServicesPlaySystemSound(effect.id)
    }
}
