import Foundation

/// Compile-time switches for features that are temporarily hidden from the UI.
/// Nothing behind a flag is deleted — flipping a flag back on restores the feature everywhere.
enum FeatureFlags {
    /// SMS/MMS texting (Messages tab, compose, templates, scheduling, broadcasts, message stats…).
    /// To hide texting again, set this to `false`, comment out the Send Text shortcut in `DialbubbleShortcuts`
    /// and set `messagingEnabled` in `WalkthroughUITests`.
    static let messaging = true
}
