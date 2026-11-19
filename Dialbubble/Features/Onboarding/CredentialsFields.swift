import SwiftUI

/// Which credential input currently has focus (used to highlight the matching row in the Console guide).
enum OnboardingCredentialField: Hashable {
    case name, accountSid, apiKeySid, secret
}

/// Editable state for entering Twilio credentials. Shared by onboarding and "Add Account".
struct CredentialsDraft: Equatable {
    var name = ""
    var accountSid = ""
    var authToken = ""
    var useAPIKey = false
    var apiKeySid = ""
    var apiKeySecret = ""

    var trimmedSid: String { accountSid.trimmingCharacters(in: .whitespacesAndNewlines) }
    var trimmedKey: String { apiKeySid.trimmingCharacters(in: .whitespacesAndNewlines) }
    var trimmedSecret: String { (useAPIKey ? apiKeySecret : authToken).trimmingCharacters(in: .whitespacesAndNewlines) }

    // MARK: Validation

    var sidError: String? {
        guard !trimmedSid.isEmpty else { return nil }
        if !trimmedSid.hasPrefix("AC") { return "Account SID starts with “AC”." }
        if trimmedSid.count != 34 { return "Account SID is 34 characters — you've entered \(trimmedSid.count)." }
        if !Self.isHex(trimmedSid.dropFirst(2)) { return "After “AC”, the SID only contains numbers and letters a–f." }
        return nil
    }

    var sidValid: Bool { trimmedSid.count == 34 && sidError == nil }

    var keyError: String? {
        guard useAPIKey, !trimmedKey.isEmpty else { return nil }
        if !trimmedKey.hasPrefix("SK") { return "API Key SID starts with “SK”." }
        if trimmedKey.count != 34 { return "API Key SID is 34 characters — you've entered \(trimmedKey.count)." }
        return nil
    }

    var keyValid: Bool { trimmedKey.count == 34 && keyError == nil }

    var secretError: String? {
        let s = trimmedSecret
        guard !s.isEmpty else { return nil }
        if useAPIKey {
            return s.count == 32 ? nil : "API Key secrets are 32 characters — you've entered \(s.count)."
        }
        if s.count != 32 { return "Auth Token is 32 characters — you've entered \(s.count)." }
        if !Self.isHex(Substring(s)) { return "Auth Token only contains numbers and letters a–f." }
        return nil
    }

    var secretValid: Bool { trimmedSecret.count == 32 && secretError == nil }

    var isComplete: Bool { sidValid && secretValid && (!useAPIKey || keyValid) }

    /// One-line explanation of what's still missing (nil when ready).
    var missingHint: String? {
        if trimmedSid.isEmpty { return "Enter your Account SID to continue." }
        if let sidError { return sidError }
        if useAPIKey {
            if trimmedKey.isEmpty { return "Enter your API Key SID." }
            if let keyError { return keyError }
        }
        if trimmedSecret.isEmpty { return useAPIKey ? "Enter your API Key secret." : "Enter your Auth Token to continue." }
        return secretError
    }

    var credentials: TwilioCredentials {
        TwilioCredentials(
            accountSid: trimmedSid,
            apiKeySid: useAPIKey ? trimmedKey : nil,
            secret: trimmedSecret
        )
    }

    // MARK: Smart paste

    /// Scans arbitrary text (e.g. copied from the Twilio Console) for credentials and fills the matching fields.
    /// Returns human-readable names of the fields that were filled.
    @discardableResult
    mutating func applySmartPaste(_ text: String) -> [String] {
        var filled: [String] = []
        if let sid = Self.firstMatch(#"AC[0-9a-fA-F]{32}"#, in: text) {
            accountSid = sid
            filled.append("Account SID")
        }
        if let key = Self.firstMatch(#"SK[0-9a-fA-F]{32}"#, in: text) {
            useAPIKey = true
            apiKeySid = key
            filled.append("API Key SID")
            if let secret = Self.firstMatch(#"(?<![0-9A-Za-z])[0-9A-Za-z]{32}(?![0-9A-Za-z])"#, in: text) {
                apiKeySecret = secret
                filled.append("API Key secret")
            }
        } else if let token = Self.firstMatch(#"(?<![0-9A-Za-z])[0-9a-fA-F]{32}(?![0-9A-Za-z])"#, in: text) {
            authToken = token
            filled.append("Auth Token")
        }
        return filled
    }

    private static func firstMatch(_ pattern: String, in text: String) -> String? {
        guard let regex = try? NSRegularExpression(pattern: pattern),
              let match = regex.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)),
              let range = Range(match.range, in: text) else { return nil }
        return String(text[range])
    }

    private static func isHex(_ s: Substring) -> Bool {
        s.allSatisfy { $0.isHexDigit }
    }
}

/// Glass-styled credential inputs with live validation, focus chaining and per-field paste.
struct CredentialsFields: View {
    @Binding var draft: CredentialsDraft
    var showsName = false
    var showsConsoleLink = true
    var onFocusChange: ((OnboardingCredentialField?) -> Void)? = nil
    var onSubmit: (() -> Void)? = nil

    @State private var revealSecret = false

    private var secretBinding: Binding<String> {
        draft.useAPIKey ? $draft.apiKeySecret : $draft.authToken
    }
    @FocusState private var focus: OnboardingCredentialField?

    private var order: [OnboardingCredentialField] {
        var o: [OnboardingCredentialField] = []
        if showsName { o.append(.name) }
        o.append(.accountSid)
        if draft.useAPIKey { o.append(.apiKeySid) }
        o.append(.secret)
        return o
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            if showsName {
                OnboardingField(title: "Account Name", symbol: "tag.fill", hint: nil) {
                    TextField("e.g. Work, Personal", text: $draft.name)
                        .textInputAutocapitalization(.words)
                        .focused($focus, equals: .name)
                        .submitLabel(.next)
                        .onSubmit { advance(from: .name) }
                }
            }

            OnboardingField(title: "Account SID", symbol: "person.text.rectangle.fill", hint: draft.sidError,
                            isValid: draft.sidValid) {
                HStack(spacing: 10) {
                    TextField("AC followed by 32 characters", text: $draft.accountSid)
                        .font(.body.monospaced())
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .keyboardType(.asciiCapable)
                        .textContentType(nil)
                        .focused($focus, equals: .accountSid)
                        .submitLabel(.next)
                        .onSubmit { advance(from: .accountSid) }
                        .accessibilityIdentifier("onboarding.accountSid")
                    OnboardingFieldPaste { draft.accountSid = $0 }
                }
            }

            OnboardingDisclosure(isExpanded: $draft.useAPIKey.animation(Theme.Motion.snappy)) {
                if draft.useAPIKey {
                    OnboardingField(title: "API Key SID", symbol: "key.horizontal.fill", hint: draft.keyError,
                                    isValid: draft.keyValid) {
                        HStack(spacing: 10) {
                            TextField("SK followed by 32 characters", text: $draft.apiKeySid)
                                .font(.body.monospaced())
                                .textInputAutocapitalization(.never)
                                .autocorrectionDisabled()
                                .keyboardType(.asciiCapable)
                                .focused($focus, equals: .apiKeySid)
                                .submitLabel(.next)
                                .onSubmit { advance(from: .apiKeySid) }
                            OnboardingFieldPaste { draft.apiKeySid = $0 }
                        }
                    }
                    .transition(.move(edge: .top).combined(with: .opacity))
                }
            }

            OnboardingField(title: draft.useAPIKey ? "API Key Secret" : "Auth Token", symbol: "lock.fill",
                            hint: draft.secretError, isValid: draft.secretValid) {
                HStack(spacing: 10) {
                    // A plain TextField masked with bullets: behaves like a secure field visually, but
                    // doesn't make iOS offer "Save Password?" for what is really an API credential.
                    TextField("", text: secretBinding)
                    .foregroundStyle(revealSecret ? Color.primary : Color.clear)
                    .overlay(alignment: .leading) {
                        if secretBinding.wrappedValue.isEmpty {
                            Text("32 characters").foregroundStyle(.tertiary).allowsHitTesting(false)
                        } else if !revealSecret {
                            Text(String(repeating: "•", count: secretBinding.wrappedValue.count))
                                .lineLimit(1)
                                .truncationMode(.head)
                                .allowsHitTesting(false)
                        }
                    }
                    .accessibilityValue(revealSecret || secretBinding.wrappedValue.isEmpty ? "" : "Hidden, \(secretBinding.wrappedValue.count) characters")
                    .font(.body.monospaced())
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .keyboardType(.asciiCapable)
                    .textContentType(nil)
                    .focused($focus, equals: .secret)
                    .submitLabel(.go)
                    .onSubmit { advance(from: .secret) }
                    .accessibilityIdentifier("onboarding.authToken")

                    Button {
                        revealSecret.toggle()
                    } label: {
                        Image(systemName: revealSecret ? "eye.slash.fill" : "eye.fill")
                            .contentTransition(.symbolEffect(.replace))
                            .frame(width: 28, height: 28)
                    }
                    .buttonStyle(.plain)
                    .foregroundStyle(.secondary)
                    .accessibilityLabel(revealSecret ? "Hide secret" : "Show secret")

                    OnboardingFieldPaste {
                        if draft.useAPIKey { draft.apiKeySecret = $0 } else { draft.authToken = $0 }
                    }
                }
            }

            if showsConsoleLink {
                Link(destination: URL(string: "https://console.twilio.com")!) {
                    Label("Find these in the Twilio Console", systemImage: "arrow.up.forward.app.fill")
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(Theme.Palette.brandText)
                }
                .padding(.horizontal, 6)
            }
        }
        .onChange(of: focus) { _, new in onFocusChange?(new) }
        .toolbar {
            ToolbarItemGroup(placement: .keyboard) {
                if let focus, let i = order.firstIndex(of: focus), i > 0 {
                    Button("Previous", systemImage: "chevron.up") { self.focus = order[i - 1] }
                }
                if let focus, let i = order.firstIndex(of: focus), i < order.count - 1 {
                    Button("Next", systemImage: "chevron.down") { self.focus = order[i + 1] }
                }
                Spacer()
                Button("Done") { focus = nil }
                    .fontWeight(.semibold)
            }
        }
    }

    private func advance(from field: OnboardingCredentialField) {
        guard let i = order.firstIndex(of: field) else { return }
        if i < order.count - 1 {
            focus = order[i + 1]
        } else {
            focus = nil
            if draft.isComplete { onSubmit?() }
        }
    }
}

/// "Advanced: use an API Key instead" toggle row with an explanation.
private struct OnboardingDisclosure<Content: View>: View {
    @Binding var isExpanded: Bool
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Toggle(isOn: $isExpanded) {
                Label {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Use an API Key instead").font(.subheadline.weight(.semibold))
                        Text("Advanced. Revocable without changing your Auth Token.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                } icon: {
                    Image(systemName: "key.horizontal.fill").foregroundStyle(Theme.Palette.brandText)
                }
            }
            .padding(.horizontal, 6)
            content
        }
    }
}

struct OnboardingField<Content: View>: View {
    var title: String
    var symbol: String
    var hint: String?
    var isValid: Bool = false
    @ViewBuilder var content: Content
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    init(title: String, symbol: String, hint: String?, isValid: Bool = false, @ViewBuilder content: () -> Content) {
        self.title = title
        self.symbol = symbol
        self.hint = hint
        self.isValid = isValid
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 6) {
                Label(title, systemImage: symbol)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
                Spacer()
                if isValid {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.caption)
                        .foregroundStyle(Theme.Palette.success)
                        .transition(.scale.combined(with: .opacity))
                        .accessibilityLabel("Valid")
                }
            }
            .padding(.horizontal, 6)

            content
                .padding(.horizontal, 16)
                .padding(.vertical, 13)
                .glassEffect(isValid ? .regular.tint(Theme.Palette.success.opacity(0.08)) : .regular, in: .rect(cornerRadius: Theme.Radius.md))

            if let hint {
                // Orange glyph flags the problem; the words stay high-contrast.
                Label {
                    Text(hint).foregroundStyle(.primary)
                } icon: {
                    Image(systemName: "exclamationmark.circle.fill").foregroundStyle(Theme.Palette.warning)
                }
                .font(.footnote)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.horizontal, 6)
                .transition(.opacity)
            }
        }
        .animation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion), value: hint)
        .animation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion), value: isValid)
    }
}

/// Small per-field paste button. Uses the system PasteButton so iOS doesn't show a paste permission alert.
private struct OnboardingFieldPaste: View {
    var onPaste: (String) -> Void
    @State private var pasted = 0

    var body: some View {
        PasteButton(payloadType: String.self) { strings in
            guard let s = strings.first?.trimmingCharacters(in: .whitespacesAndNewlines), !s.isEmpty else { return }
            Task { @MainActor in
                onPaste(s)
                pasted += 1
            }
        }
        .labelStyle(.iconOnly)
        .buttonBorderShape(.circle)
        .controlSize(.small)
        .tint(Theme.Palette.brand)
        .sensoryFeedback(.success, trigger: pasted)
        .accessibilityLabel("Paste")
    }
}

/// Capability badges for a configured number.
struct NumberCapabilityBadges: View {
    var number: ConfiguredNumber

    var body: some View {
        HStack(spacing: 4) {
            badge("phone.fill", on: number.voice, label: "Voice")
            if FeatureFlags.messaging {
                badge("message.fill", on: number.sms, label: "SMS")
                badge("photo.fill", on: number.mms, label: "MMS")
            }
        }
    }

    private func badge(_ symbol: String, on: Bool, label: String) -> some View {
        Image(systemName: symbol)
            .font(.caption2.weight(.semibold))
            .foregroundStyle(on ? AnyShapeStyle(number.tint.color) : AnyShapeStyle(.quaternary))
            .frame(width: 22, height: 22)
            .background(Circle().fill(on ? number.tint.color.opacity(0.15) : .clear))
            .accessibilityLabel("\(label) \(on ? "supported" : "not supported")")
    }
}
