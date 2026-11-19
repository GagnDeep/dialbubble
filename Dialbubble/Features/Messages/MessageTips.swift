import SwiftUI
import TipKit

struct MessageComposeTip: Tip {
    var title: Text { Text("Start a new text") }
    var message: Text? { Text("Pick any of your Twilio numbers to send from, and text anyone.") }
    var image: Image? { Image(systemName: "square.and.pencil") }
}

struct MessageBubbleTip: Tip {
    var title: Text { Text("Touch and hold a message") }
    var message: Text? { Text("Copy or select its text, see delivery details and cost, resend, or delete it.") }
    var image: Image? { Image(systemName: "hand.tap.fill") }
}

struct MessagePlusMenuTip: Tip {
    var title: Text { Text("Templates, media and scheduling") }
    var message: Text? { Text("Tap + to insert a saved template, attach a picture link, or schedule the message for later.") }
    var image: Image? { Image(systemName: "plus.circle.fill") }
}

/// Plain-language explanations for message delivery codes (30xxx) shown on failed bubbles.
/// `message` is always our own wording; the carrier's raw text lives in `details`.
enum MessageDeliveryHelp {
    static func friendly(for m: TwilioMessage) -> FriendlyError {
        let docs = m.errorCode.flatMap { URL(string: "https://www.twilio.com/docs/errors/\($0)") }
        let raw = m.errorMessage.map(FriendlyError.maskSIDs)
        func make(_ title: String, _ message: String, _ symbol: String) -> FriendlyError {
            FriendlyError(title: title, message: message, symbol: symbol, color: Theme.Palette.danger,
                          helpURL: docs, code: m.errorCode, details: raw)
        }
        switch m.errorCode {
        case 30003: return make("Phone unreachable", "The phone may be off or out of coverage. Try again later.", "antenna.radiowaves.left.and.right.slash")
        case 30004: return make("Message blocked", "The recipient or their carrier blocked this message.", "hand.raised.fill")
        case 30005: return make("Unknown number", "This number doesn't exist or is no longer in service. Check it and try again.", "person.crop.circle.badge.questionmark")
        case 30006: return make("Can't receive texts", "This looks like a landline or an unsupported carrier. Try calling instead.", "phone.down.fill")
        case 30007: return make("Filtered by carrier", "Carriers flagged this as spam. In the US, register for A2P 10DLC to improve delivery.", "shield.slash.fill")
        case 30008: return make("Delivery failed", "The carrier couldn't deliver it. Retry in a few minutes.", "exclamationmark.bubble.fill")
        case nil: return make("Not delivered", "This message didn't reach the phone. Check the number and try again.", "exclamationmark.bubble.fill")
        default:
            let api = TwilioAPIError(code: m.errorCode, message: m.errorMessage ?? "This message wasn't delivered.", moreInfo: nil, status: nil)
            var f = FriendlyError(api)
            f.color = Theme.Palette.danger
            f.helpURL = f.helpURL ?? docs
            return f
        }
    }
}
