import SwiftUI
import TipKit
import LocalAuthentication

/// iOS Settings-style icon: a tonal glyph on a softly tinted plate. Thin wrapper over the design-system `IconTile`.
struct SettingsIcon: View {
    var symbol: String
    var color: Color
    var size: CGFloat = 30

    var body: some View {
        IconTile(symbol: symbol, color: color, size: size)
    }
}

/// A settings row: icon, title, optional subtitle and trailing detail.
/// At accessibility text sizes the detail moves under the title so nothing gets crushed.
struct SettingsRowLabel: View {
    var title: String
    var symbol: String
    var color: Color
    var subtitle: String?
    var detail: String?
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    init(_ title: String, symbol: String, color: Color, subtitle: String? = nil, detail: String? = nil) {
        self.title = title
        self.symbol = symbol
        self.color = color
        self.subtitle = subtitle
        self.detail = detail
    }

    var body: some View {
        HStack(spacing: Theme.Space.sm) {
            SettingsIcon(symbol: symbol, color: color)
            VStack(alignment: .leading, spacing: 1) {
                Text(title).foregroundStyle(.primary)
                if let subtitle {
                    // Explicit Color: inside a Button, `.secondary` takes the tint and turns into low-contrast mint.
                    Text(subtitle).font(.caption).foregroundStyle(Color.secondary)
                }
                if let detail, dynamicTypeSize.isAccessibilitySize {
                    Text(detail).font(.caption).foregroundStyle(.secondary)
                }
            }
            if let detail, !dynamicTypeSize.isAccessibilitySize {
                Spacer(minLength: Theme.Space.xs)
                Text(detail)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
        }
        .accessibilityElement(children: .combine)
    }
}

extension View {
    /// Consistent row surface for Dialbubble's lists: a soft translucent fill over the ambient background,
    /// matching the glass cards on Home instead of the heavier default material.
    func relayListRow() -> some View {
        listRowBackground(RelayRowSurface())
    }
}

private struct RelayRowSurface: View {
    @Environment(\.colorScheme) private var scheme
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency

    /// A solid raised surface reads cleaner (and with more contrast) than thin material over the near-black canvas.
    var body: some View {
        if reduceTransparency {
            Rectangle().fill(Color(.secondarySystemGroupedBackground))
        } else {
            Rectangle().fill(Theme.Palette.surface.opacity(scheme == .dark ? 1 : 0.92))
        }
    }
}

// MARK: - Biometry

/// Which biometric the device offers, resolved once per launch (creating an `LAContext` every render is expensive).
enum Biometry {
    case faceID, touchID, opticID, none

    static let current: Biometry = {
        let ctx = LAContext()
        _ = ctx.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: nil)
        switch ctx.biometryType {
        case .faceID: return .faceID
        case .touchID: return .touchID
        case .opticID: return .opticID
        default: return .none
        }
    }()

    var name: String {
        switch self {
        case .faceID: "Face ID"
        case .touchID: "Touch ID"
        case .opticID: "Optic ID"
        case .none: "Passcode"
        }
    }

    var symbol: String {
        switch self {
        case .faceID: "faceid"
        case .touchID: "touchid"
        case .opticID: "opticid"
        case .none: "lock.fill"
        }
    }
}

// MARK: - Replay tips

/// Re-showing TipKit tips requires resetting the tips datastore before `Tips.configure`,
/// so we flag it and it takes effect on the next launch.
enum SettingsTipsReset {
    static let flagKey = "relay.resetTipsOnNextLaunch"

    static func schedule() {
        UserDefaults.standard.set(true, forKey: flagKey)
        // Best effort: works if tips aren't configured yet in this session.
        try? Tips.resetDatastore()
    }
}

/// The single "Replay Tips" action shared by Settings and Help.
struct ReplayTipsButton: View {
    var subtitle: String?
    var accessibilityID: String
    @Environment(ToastCenter.self) private var toast

    var body: some View {
        Button {
            SettingsTipsReset.schedule()
            toast.show("Tips will show again next time you open Dialbubble", style: .info)
        } label: {
            SettingsRowLabel("Replay Tips", symbol: "lightbulb", color: .gray, subtitle: subtitle)
        }
        .accessibilityIdentifier(accessibilityID)
    }
}

// MARK: - Quiet number sync

extension AppStore {
    /// Syncs numbers and hands back any error instead of raising the global error banner,
    /// so the caller can report the result once (via `ToastCenter`).
    func syncNumbersReportingResult() async -> FriendlyError? {
        do {
            try await syncNumbersThrowing()
            return nil
        } catch {
            if (error as? URLError)?.code == .cancelled || error is CancellationError { return nil }
            return FriendlyError(error)
        }
    }
}
