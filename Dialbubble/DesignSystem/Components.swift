import SwiftUI
import ContactsUI

// MARK: - Ambient background

/// Calm canvas with a soft brand haze that gives Liquid Glass something gentle to refract.
/// Static (no per-frame animation) and solid under Reduce Transparency.
struct AmbientBackground: View {
    var tint: Color = Theme.Palette.brand
    @Environment(\.colorScheme) private var scheme
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency

    var body: some View {
        ZStack {
            Theme.Palette.canvas
            if !reduceTransparency {
                GeometryReader { geo in
                    let w = geo.size.width, h = geo.size.height
                    ZStack {
                        Circle()
                            .fill(tint.opacity(scheme == .dark ? 0.12 : 0.09))
                            .frame(width: w * 1.3, height: w * 1.3)
                            .blur(radius: 90)
                            .offset(x: -w * 0.45, y: -h * 0.42)
                        Circle()
                            .fill(Theme.Palette.brandSecondary.opacity(scheme == .dark ? 0.05 : 0.04))
                            .frame(width: w * 1.1, height: w * 1.1)
                            .blur(radius: 100)
                            .offset(x: w * 0.5, y: h * 0.45)
                    }
                    .frame(width: w, height: h)
                }
            }
        }
        .ignoresSafeArea()
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}

// MARK: - Glass card

struct GlassCard<Content: View>: View {
    var cornerRadius: CGFloat = Theme.Radius.lg
    var tint: Color?
    var padding: CGFloat = 16
    @ViewBuilder var content: Content

    var body: some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .glassEffect(tint.map { Glass.regular.tint($0.opacity(0.18)) } ?? .regular, in: .rect(cornerRadius: cornerRadius))
    }
}

// MARK: - Avatar

struct AvatarView: View {
    var title: String
    var tint: Color = .accentColor
    var size: CGFloat = 44

    var body: some View {
        ZStack {
            Circle().fill(tint.gradient)
            if let initials {
                Text(initials)
                    .font(.system(size: size * 0.38, weight: .semibold, design: .rounded))
                    .foregroundStyle(.white)
            } else {
                Image(systemName: "person.fill")
                    .font(.system(size: size * 0.42, weight: .medium))
                    .foregroundStyle(.white.opacity(0.95))
            }
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true)
    }

    private var initials: String? {
        let words = title.split(separator: " ").filter { $0.first?.isLetter == true }
        guard !words.isEmpty else { return nil }
        return words.prefix(2).compactMap { $0.first.map(String.init) }.joined().uppercased()
    }

    /// Stable color for a phone number so the same person always gets the same avatar color.
    static func color(for key: String) -> Color {
        let palette = Theme.Palette.identity
        let hash = key.unicodeScalars.reduce(0) { ($0 &* 31 &+ Int($1.value)) & 0x7fffffff }
        return palette[hash % palette.count]
    }
}

// MARK: - Status pill

struct StatusPill: View {
    var text: String
    var symbol: String
    var color: Color

    var body: some View {
        Label(text, systemImage: symbol)
            .font(.caption.weight(.semibold))
            .foregroundStyle(color)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .glassEffect(.regular.tint(color.opacity(0.15)), in: .capsule)
    }
}

// MARK: - From-number picker

/// A glass capsule menu to choose which configured number to call/message from.
struct FromNumberPicker: View {
    enum Capability { case voice, sms }

    @Environment(AppStore.self) private var store
    @Binding var selection: String?
    var capability: Capability

    private var options: [ConfiguredNumber] {
        capability == .voice ? store.callerNumbers : store.smsNumbers
    }

    private var current: ConfiguredNumber? {
        options.first { $0.phoneNumber == selection } ?? options.first
    }

    var body: some View {
        Menu {
            Section(capability == .voice ? "Call from" : "Send from") {
                ForEach(options) { n in
                    Button {
                        selection = n.phoneNumber
                    } label: {
                        Label {
                            Text(n.displayName)
                            Text(PhoneFormat.display(n.phoneNumber))
                        } icon: {
                            Image(systemName: n.phoneNumber == current?.phoneNumber ? "checkmark.circle.fill" : "circle.fill")
                        }
                    }
                    .tint(n.tint.color)
                }
            }
        } label: {
            HStack(spacing: 8) {
                Circle().fill(current?.tint.color ?? .secondary).frame(width: 9, height: 9)
                VStack(alignment: .leading, spacing: 0) {
                    Text(current?.displayName ?? "No number")
                        .font(.subheadline.weight(.semibold))
                        .lineLimit(1)
                    if let current {
                        Text(PhoneFormat.display(current.phoneNumber))
                            .font(.caption2.monospacedDigit())
                            .foregroundStyle(.secondary)
                    }
                }
                Image(systemName: "chevron.up.chevron.down")
                    .font(.caption2.weight(.bold))
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .contentShape(.capsule)
            .glassEffect(.regular.interactive(), in: .capsule)
        }
        .buttonStyle(.plain)
        .disabled(options.isEmpty)
        .onAppear {
            if selection == nil || !options.contains(where: { $0.phoneNumber == selection }) {
                let preferred = capability == .voice ? store.activeProfile?.defaultCallerNumber : store.activeProfile?.defaultSMSNumber
                selection = options.first { $0.phoneNumber == preferred }?.phoneNumber ?? options.first?.phoneNumber
            }
        }
        .accessibilityLabel("From number: \(current?.displayName ?? "none")")
    }
}

// MARK: - Contact picker (no Contacts permission needed)

@MainActor
enum ContactPicker {
    private static var delegate: Delegate?

    /// Presents the system contact picker and returns the chosen phone number and contact name.
    static func pickPhone(_ completion: @escaping (_ phone: String, _ name: String) -> Void) {
        let picker = CNContactPickerViewController()
        picker.displayedPropertyKeys = [CNContactPhoneNumbersKey]
        picker.predicateForEnablingContact = NSPredicate(format: "phoneNumbers.@count > 0")
        picker.predicateForSelectionOfContact = NSPredicate(format: "phoneNumbers.@count == 1")
        let d = Delegate(completion: completion)
        delegate = d
        picker.delegate = d
        topViewController()?.present(picker, animated: true)
    }

    /// Opens the system "New Contact" card with the number filled in. Dialbubble shows the name as soon as it's saved.
    @MainActor
    static func addContact(phone: String) {
        let contact = CNMutableContact()
        contact.phoneNumbers = [CNLabeledValue(label: CNLabelPhoneNumberMobile, value: CNPhoneNumber(stringValue: phone))]
        let editor = CNContactViewController(forNewContact: contact)
        let d = NewContactDelegate()
        newContactDelegate = d
        editor.delegate = d
        let nav = UINavigationController(rootViewController: editor)
        topViewController()?.present(nav, animated: true)
    }

    private static var newContactDelegate: NewContactDelegate?

    private final class NewContactDelegate: NSObject, CNContactViewControllerDelegate {
        func contactViewController(_ viewController: CNContactViewController, didCompleteWith contact: CNContact?) {
            viewController.dismiss(animated: true)
            guard contact != nil else { return }
            Task { @MainActor in
                if ContactBook.shared.access == .notDetermined { await ContactBook.shared.requestAccess() } else { await ContactBook.shared.load() }
            }
        }
    }

    private static func topViewController() -> UIViewController? {
        let scene = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .first { $0.activationState == .foregroundActive } ?? UIApplication.shared.connectedScenes.first as? UIWindowScene
        var top = scene?.keyWindow?.rootViewController
        while let presented = top?.presentedViewController { top = presented }
        return top
    }

    private final class Delegate: NSObject, CNContactPickerDelegate {
        let completion: (String, String) -> Void
        init(completion: @escaping (String, String) -> Void) { self.completion = completion }

        func contactPicker(_ picker: CNContactPickerViewController, didSelect contact: CNContact) {
            guard let phone = contact.phoneNumbers.first?.value.stringValue else { return }
            completion(phone, CNContactFormatter.string(from: contact, style: .fullName) ?? "")
        }

        func contactPicker(_ picker: CNContactPickerViewController, didSelect contactProperty: CNContactProperty) {
            guard let phone = (contactProperty.value as? CNPhoneNumber)?.stringValue else { return }
            completion(phone, CNContactFormatter.string(from: contactProperty.contact, style: .fullName) ?? "")
        }
    }
}

struct ContactPickerButton: View {
    var onPick: (_ phone: String, _ name: String) -> Void

    var body: some View {
        Button {
            ContactPicker.pickPhone(onPick)
        } label: {
            Image(systemName: "person.crop.circle.badge.plus")
                .font(.title3)
        }
        .buttonStyle(.glass)
        .buttonBorderShape(.circle)
        .accessibilityLabel("Choose from Contacts")
    }
}

// MARK: - Section header

struct SectionHeader: View {
    var title: String
    var symbol: String?
    var action: (title: String, run: () -> Void)?

    var body: some View {
        HStack {
            if let symbol { Image(systemName: symbol).foregroundStyle(.secondary) }
            Text(title).font(.title3.weight(.bold))
            Spacer()
            if let action {
                Button(action.title, action: action.run)
                    .font(.subheadline.weight(.semibold))
            }
        }
        .padding(.horizontal, 4)
    }
}

extension View {
    /// Applies the standard screen chrome: ambient background behind a transparent list/scroll view.
    func relayBackground(_ tint: Color = Theme.Palette.brand) -> some View {
        self
            .scrollContentBackground(.hidden)
            .background { AmbientBackground(tint: tint) }
    }
}
