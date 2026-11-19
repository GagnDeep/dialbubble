import SwiftUI
import TipKit

// MARK: - Tips

struct CallFromNumberTip: Tip {
    var title: Text { Text("Choose your caller ID") }
    var message: Text? { Text("Tap here to pick which of your Twilio numbers the other person sees.") }
    var image: Image? { Image(systemName: "person.crop.circle.badge.checkmark") }
}

struct CallModesTip: Tip {
    var title: Text { Text("Pick how to call") }
    var message: Text? { Text("Talk rings your own phone first. Voice Message and Play Audio let Twilio speak for you. Tap ⓘ for details.") }
    var image: Image? { Image(systemName: "phone.connection.fill") }
}

struct CallRecentsSwipeTip: Tip {
    var title: Text { Text("Swipe for quick actions") }
    var message: Text? {
        Text(FeatureFlags.messaging ? "Swipe left on a call to call back, or right to send a message." : "Swipe left on a call to call back.")
    }
    var image: Image? { Image(systemName: "hand.draw.fill") }
}

// MARK: - How calling works

/// Illustrated explanation of every call mode, reachable from the keypad's info button.
struct CallModesGuideSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(AppStore.self) private var store
    @ScaledMetric(relativeTo: .title2) private var modeIconSize: CGFloat = 44
    @ScaledMetric(relativeTo: .title3) private var diagramIconSize: CGFloat = 44

    private struct Item: Identifiable {
        let mode: CallMode
        let color: Color
        let howItWorks: String
        let whenToUse: String
        let cost: String
        var id: String { mode.id }
    }

    private let items: [Item] = [
        Item(mode: .bridge, color: Theme.Palette.brandText,
             howItWorks: AppStore.confirmBeforeConnect
                ? "Twilio rings your own phone first. Answer, press any key when asked, and Dialbubble dials the other person. They see your Twilio number."
                : "Twilio rings your own phone first. When you answer, it dials the other person and connects you. They see your Twilio number.",
             whenToUse: "Real two-way conversations from a business or second number.",
             cost: "Two call legs are billed: one to you and one to them."),
        Item(mode: .say, color: Theme.Palette.brandText,
             howItWorks: "Twilio calls the person and reads your text aloud in a natural voice. You can repeat it several times.",
             whenToUse: "Reminders, alerts, and announcements.",
             cost: "One outbound call. Text-to-speech is included."),
        Item(mode: .play, color: Theme.Palette.brandText,
             howItWorks: "Twilio calls and plays an MP3 or WAV file from a public link.",
             whenToUse: "Pre-recorded messages, hold music, or your own voice.",
             cost: "One outbound call."),
        Item(mode: .twiml, color: Theme.Palette.brandText,
             howItWorks: "Twilio runs your own TwiML instructions, like menus, pauses, or keypad input.",
             whenToUse: "Advanced call flows, built without a server.",
             cost: "One outbound call, plus any paid features you use."),
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Dialbubble places calls through Twilio's API, so no server or VoIP setup is needed. Choose the style that fits.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .padding(.horizontal, 4)

                    ForEach(items) { item in
                        GlassCard {
                            VStack(alignment: .leading, spacing: 12) {
                                HStack(spacing: 12) {
                                    IconTile(symbol: item.mode.symbol, color: item.color, size: modeIconSize)
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(item.mode.title).font(.headline)
                                            .accessibilityAddTraits(.isHeader)
                                        Text(item.mode.subtitle).font(.caption).foregroundStyle(.secondary)
                                            .fixedSize(horizontal: false, vertical: true)
                                    }
                                }
                                if item.mode == .bridge { bridgeDiagram }
                                guideLine("gearshape.2.fill", "How it works", item.howItWorks)
                                guideLine("lightbulb.fill", "Best for", item.whenToUse)
                                guideLine("dollarsign.circle.fill", "Cost", item.cost)
                            }
                        }
                    }

                    Callout(style: .info,
                            title: "Using a trial account?",
                            message: "Trial accounts can only call numbers you've verified in the Twilio Console, and calls start with a short trial message.")

                    Link(destination: URL(string: "https://www.twilio.com/en-us/voice/pricing")!) {
                        Label("See Twilio voice pricing", systemImage: "safari")
                            .font(.subheadline.weight(.semibold))
                    }
                    .padding(.horizontal, 4)
                }
                .padding()
            }
            .relayBackground()
            .navigationTitle("How Calling Works")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close", systemImage: "xmark") { dismiss() }
                }
            }
            .bottomCTA {
                PrimaryButton(title: "Got It", symbol: "checkmark") { dismiss() }
                    .accessibilityIdentifier("callGuide.done")
            }
        }
        .presentationDetents([.large])
    }

    private var bridgeDiagram: some View {
        HStack(alignment: .top, spacing: 6) {
            diagramStep("iphone.gen3.radiowaves.left.and.right", "Twilio calls you")
            Image(systemName: "arrow.right").foregroundStyle(.secondary).padding(.top, 14)
            diagramStep("hand.tap.fill", AppStore.confirmBeforeConnect ? "You answer and press a key" : "You answer")
            Image(systemName: "arrow.right").foregroundStyle(.secondary).padding(.top, 14)
            diagramStep("person.wave.2.fill", "They see your Twilio number")
        }
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(AppStore.confirmBeforeConnect
            ? "Twilio calls you, you answer and press a key, then Dialbubble dials them. They see your Twilio number."
            : "Twilio calls you, you answer, then they see your Twilio number.")
    }

    private func diagramStep(_ symbol: String, _ text: String) -> some View {
        VStack(spacing: 6) {
            Image(systemName: symbol)
                .font(.title3)
                .foregroundStyle(Theme.Palette.brandText)
                .frame(width: min(diagramIconSize, 64), height: min(diagramIconSize, 64))
                .background(Theme.Palette.brand.opacity(0.14), in: .circle)
            Text(text).font(.caption).multilineTextAlignment(.center).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }

    private func guideLine(_ symbol: String, _ title: String, _ text: String) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 10) {
            Image(systemName: symbol).foregroundStyle(.secondary).frame(minWidth: 20)
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.caption.weight(.semibold)).foregroundStyle(.secondary)
                Text(text).font(.subheadline)
            }
        }
    }
}

// MARK: - Personal phone setup

/// Inline sheet for adding the user's own phone (needed for Talk calls).
struct CallPersonalPhoneSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(AppStore.self) private var store
    var onSaved: () -> Void = {}

    @State private var phone = ""
    @FocusState private var focused: Bool
    @State private var saved = 0
    @ScaledMetric(relativeTo: .largeTitle) private var heroIconSize: CGFloat = 40

    private var isValid: Bool { PhoneFormat.isPlausible(phone) }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    VStack(alignment: .leading, spacing: 8) {
                        Image(systemName: "iphone.gen3.radiowaves.left.and.right")
                            .font(.system(size: min(heroIconSize, 72)))
                            .foregroundStyle(Theme.Palette.brandText)
                            .symbolRenderingMode(.hierarchical)
                            .accessibilityHidden(true)
                        Text("Add your phone").font(.title.bold())
                            .accessibilityAddTraits(.isHeader)
                        Text("For Talk calls, Twilio rings this phone first, then connects you to the person you're calling. They see your Twilio number, not this one.")
                            .foregroundStyle(.secondary)
                    }

                    VStack(alignment: .leading, spacing: 6) {
                        Label("My mobile number", systemImage: "iphone")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(.secondary)
                            .padding(.horizontal, 6)
                        HStack {
                            TextField("+1 415 555 0100", text: $phone)
                                .keyboardType(.phonePad)
                                .textContentType(.telephoneNumber)
                                .focused($focused)
                                .font(.title3.monospacedDigit())
                            ContactPickerButton { p, _ in phone = p }
                                .controlSize(.small)
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .glassEffect(.regular, in: .rect(cornerRadius: Theme.Radius.md))
                        if !phone.isEmpty {
                            Label(isValid ? "Will be saved as \(PhoneFormat.display(store.normalize(phone)))" : "Include your country code, like +1.",
                                  systemImage: isValid ? "checkmark.circle.fill" : "exclamationmark.circle")
                                .font(.caption)
                                .foregroundStyle(isValid ? Theme.Palette.success : Theme.Palette.warning)
                                .padding(.horizontal, 6)
                        }
                    }

                    Label("You can change this any time in Settings → Accounts.", systemImage: "gearshape")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
                .padding(24)
            }
            .relayBackground()
            .scrollDismissesKeyboard(.interactively)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel", systemImage: "xmark", role: .cancel) { dismiss() }
                }
            }
            .bottomCTA {
                PrimaryButton(title: "Save & Continue", symbol: "checkmark", action: save)
                    .disabled(!isValid)
                    .accessibilityIdentifier("personalPhone.save")
            }
        }
        .presentationDetents([.medium, .large])
        .sensoryFeedback(.success, trigger: saved)
        .onAppear {
            phone = store.activeProfile?.personalPhone ?? ""
            focused = true
        }
    }

    private func save() {
        guard var p = store.activeProfile, isValid else { return }
        p.personalPhone = store.normalize(phone)
        store.updateProfile(p)
        saved += 1
        dismiss()
        onSaved()
    }
}
