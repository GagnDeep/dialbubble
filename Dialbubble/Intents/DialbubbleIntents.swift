import AppIntents
import Foundation

/// Sends an SMS through Twilio straight from Shortcuts / Siri — no server, no app launch.
struct SendSMSIntent: AppIntent {
    static let title: LocalizedStringResource = "Send Text with Twilio"
    static let description = IntentDescription("Sends an SMS from one of your Twilio numbers.")
    /// Follows FeatureFlags.messaging: hidden from the Shortcuts library when texting is disabled.
    static let isDiscoverable = FeatureFlags.messaging

    @Parameter(title: "To", description: "Recipient phone number")
    var to: String

    @Parameter(title: "Message", inputOptions: String.IntentInputOptions(multiline: true))
    var message: String

    @Parameter(title: "From", description: "Your Twilio number (optional — uses your default)")
    var from: String?

    static var parameterSummary: some ParameterSummary {
        Summary("Text \(\.$message) to \(\.$to)") {
            \.$from
        }
    }

    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog {
        guard FeatureFlags.messaging else { throw ClientError.invalidInput("Texting is currently unavailable in Dialbubble.") }
        let store = AppStore.shared
        guard store.client != nil, let profile = store.activeProfile else { throw ClientError.missingCredentials }
        let sender = from.map(store.normalize) ?? profile.defaultSMSNumber ?? profile.smsNumbers.first?.phoneNumber
        guard let sender else { throw ClientError.invalidInput("No SMS-capable number is configured.") }
        let sent = try await store.sendMessage(OutgoingMessage(from: sender, to: to, body: message))
        return .result(dialog: "Message to \(PhoneFormat.display(sent.to ?? to)) is \(sent.statusKind.label.lowercased()).")
    }
}

/// Calls someone and speaks a text-to-speech message.
struct CallWithVoiceMessageIntent: AppIntent {
    static let title: LocalizedStringResource = "Call with Voice Message"
    static let description = IntentDescription("Calls a number from your Twilio account and speaks a message.")

    @Parameter(title: "To", description: "Phone number to call")
    var to: String

    @Parameter(title: "Message", inputOptions: String.IntentInputOptions(multiline: true))
    var message: String

    static var parameterSummary: some ParameterSummary {
        Summary("Call \(\.$to) and say \(\.$message)")
    }

    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog {
        let store = AppStore.shared
        guard store.client != nil, let profile = store.activeProfile else { throw ClientError.missingCredentials }
        guard let caller = profile.defaultCallerNumber ?? profile.callerNumbers.first?.phoneNumber else {
            throw ClientError.invalidInput("No voice-capable number is configured.")
        }
        let call = try await store.placeCall(OutgoingCall(from: caller, destination: to, mode: .say, message: message))
        // Intents run headless — don't leave a live call sheet queued for the next app launch.
        store.liveCall = nil
        return .result(dialog: "Calling \(PhoneFormat.display(call.to ?? to)) from \(PhoneFormat.display(caller)).")
    }
}

/// Opens Dialbubble on the dialer, optionally prefilled.
struct OpenDialerIntent: AppIntent {
    static let title: LocalizedStringResource = "Open Dialbubble Dialer"
    static let description = IntentDescription("Opens the Dialbubble keypad, optionally with a number filled in.")
    static let openAppWhenRun = true

    @Parameter(title: "Number")
    var number: String?

    @MainActor
    func perform() async throws -> some IntentResult {
        AppStore.shared.openDialer(to: number ?? "")
        return .result()
    }
}

struct RelayShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        // FeatureFlags.messaging: AppShortcutsBuilder can't branch on a flag (only #available),
        // so comment this one out if messaging is ever disabled again.
        AppShortcut(
            intent: SendSMSIntent(),
            phrases: ["Send a text with \(.applicationName)", "Text someone with \(.applicationName)"],
            shortTitle: "Send Text",
            systemImageName: "message.fill"
        )
        AppShortcut(
            intent: CallWithVoiceMessageIntent(),
            phrases: ["Call with a voice message in \(.applicationName)"],
            shortTitle: "Voice Message Call",
            systemImageName: "phone.bubble.fill"
        )
        AppShortcut(
            intent: OpenDialerIntent(),
            phrases: ["Open \(.applicationName) dialer", "Make a call with \(.applicationName)"],
            shortTitle: "Open Dialer",
            systemImageName: "circle.grid.3x3.fill"
        )
    }
}
