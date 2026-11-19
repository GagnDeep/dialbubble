import SwiftUI

// MARK: - Buttons

/// Full-width primary action (brand Liquid Glass). Shows a spinner while `isLoading`.
struct PrimaryButton: View {
    var title: String
    var symbol: String?
    var isLoading = false
    var tint: Color = Theme.Palette.brand
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if isLoading {
                    ProgressView().tint(.white)
                }
                Text(title)
                if let symbol, !isLoading {
                    Image(systemName: symbol)
                }
            }
            .font(.headline)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 6)
            .contentTransition(.opacity)
        }
        .buttonStyle(.glassProminent)
        .tint(tint)
        .controlSize(.large)
        .disabled(isLoading)
    }
}

/// Full-width secondary action (clear glass).
struct SecondaryButton: View {
    var title: String
    var symbol: String?
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            Label {
                Text(title)
            } icon: {
                if let symbol { Image(systemName: symbol) }
            }
            .font(.headline)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 6)
        }
        .buttonStyle(.glass)
        .controlSize(.large)
    }
}

extension View {
    /// Pins call-to-action buttons to the bottom in a glass bar with a soft scroll edge.
    /// At accessibility text sizes the content stays readable because the scroll view above keeps scrolling under it.
    func bottomCTA<Content: View>(@ViewBuilder _ content: () -> Content) -> some View {
        safeAreaBar(edge: .bottom) {
            VStack(spacing: 10) { content() }
                .padding(.horizontal, Theme.Space.md)
                .padding(.top, Theme.Space.xs)
                .padding(.bottom, Theme.Space.xs)
        }
    }
}

// MARK: - Icon tile

/// Rounded colored square with a white SF Symbol — used for list rows and feature lists.
struct IconTile: View {
    var symbol: String
    var color: Color = Theme.Palette.brand
    var size: CGFloat = 30

    @ScaledMetric private var scale: CGFloat = 1
    @Environment(\.colorScheme) private var scheme

    /// Tonal tile: the glyph carries the color on a quiet tinted plate — calmer than a saturated square.
    var body: some View {
        let s = size * min(scale, 1.6)
        Image(systemName: symbol)
            .font(.system(size: s * 0.46, weight: .semibold))
            .foregroundStyle(color)
            .symbolRenderingMode(.monochrome)
            .frame(width: s, height: s)
            .background(color.opacity(scheme == .dark ? 0.18 : 0.12), in: .rect(cornerRadius: s * 0.3))
            .accessibilityHidden(true)
    }
}

// MARK: - Chip bar

struct ChipItem<ID: Hashable & Sendable>: Identifiable {
    var id: ID
    var title: String
    var symbol: String?
    var count: Int?
    var color: Color = Theme.Palette.brand
    var accessibilityID: String?
}

/// Horizontal, morphing glass filter chips with selection haptics and VoiceOver traits.
struct ChipBar<ID: Hashable & Sendable>: View {
    var items: [ChipItem<ID>]
    @Binding var selection: ID
    @Namespace private var ns
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        ScrollView(.horizontal) {
            GlassEffectContainer(spacing: 8) {
                HStack(spacing: 8) {
                    ForEach(items) { item in
                        chip(item)
                    }
                }
                .padding(.horizontal, 2)
                .padding(.vertical, 6)
            }
        }
        .scrollIndicators(.hidden)
        .scrollEdgeEffectHidden(true, for: .all)
        // Clip to the bar's own bounds (so chips never slide under neighbouring buttons)
        // and fade the edges to hint that more chips scroll into view.
        .mask {
            HStack(spacing: 0) {
                LinearGradient(colors: [.clear, .black], startPoint: .leading, endPoint: .trailing).frame(width: 10)
                Rectangle()
                LinearGradient(colors: [.black, .clear], startPoint: .leading, endPoint: .trailing).frame(width: 18)
            }
        }
        .padding(.vertical, -4)
        .sensoryFeedback(.selection, trigger: selection)
    }

    private func chip(_ item: ChipItem<ID>) -> some View {
        let selected = item.id == selection
        return Button {
            withAnimation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion)) { selection = item.id }
        } label: {
            HStack(spacing: 6) {
                if let symbol = item.symbol {
                    Image(systemName: symbol).font(.subheadline.weight(.semibold))
                }
                Text(item.title).font(.subheadline.weight(.semibold))
                if let count = item.count, count > 0 {
                    Text("\(count)")
                        .font(.caption.weight(.bold).monospacedDigit())
                        .padding(.horizontal, 6)
                        .padding(.vertical, 1)
                        .background(selected ? Color.white.opacity(0.25) : item.color.opacity(0.15), in: .capsule)
                        .contentTransition(.numericText())
                }
            }
            .foregroundStyle(selected ? Color.white : Color.primary)
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .contentShape(.capsule)
            .glassEffect(selected ? .regular.tint(item.color).interactive() : .regular.interactive(), in: .capsule)
            .glassEffectID(item.id, in: ns)
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(selected ? .isSelected : [])
        .accessibilityLabel(item.count.map { "\(item.title), \($0)" } ?? item.title)
        .accessibilityIdentifier(item.accessibilityID ?? "")
    }
}

// MARK: - Action tile

/// Square-ish glass tile with an icon and a short label (quick actions).
struct ActionTile: View {
    var title: String
    var symbol: String
    var color: Color = Theme.Palette.brandText
    var accessibilityID: String?
    var action: () -> Void
    @State private var taps = 0

    var body: some View {
        Button {
            taps += 1
            action()
        } label: {
            VStack(spacing: 8) {
                Image(systemName: symbol)
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(color)
                    .frame(height: 28)
                    .accessibilityHidden(true)
                Text(title)
                    .font(.footnote.weight(.medium))
                    .foregroundStyle(.primary)
                    .lineLimit(2)
                    .multilineTextAlignment(.center)
                    .minimumScaleFactor(0.85)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .padding(.horizontal, 6)
            .contentShape(.rect(cornerRadius: Theme.Radius.md))
            .glassEffect(.regular.interactive(), in: .rect(cornerRadius: Theme.Radius.md))
        }
        .buttonStyle(.plain)
        .sensoryFeedback(.impact(weight: .light), trigger: taps)
        .accessibilityIdentifier(accessibilityID ?? "")
    }
}

// MARK: - Callout

/// Tinted glass card for tips, warnings and confirmations.
struct Callout<Actions: View>: View {
    enum Style {
        case info, tip, warning, success, error

        var color: Color {
            switch self {
            case .info: Theme.Palette.info
            case .tip: Theme.Palette.brand
            case .warning: Theme.Palette.warning
            case .success: Theme.Palette.success
            case .error: Theme.Palette.danger
            }
        }

        var symbol: String {
            switch self {
            case .info: "info.circle.fill"
            case .tip: "lightbulb.fill"
            case .warning: "exclamationmark.triangle.fill"
            case .success: "checkmark.circle.fill"
            case .error: "xmark.octagon.fill"
            }
        }
    }

    var style: Style = .info
    var title: String
    var message: String?
    var symbol: String?
    @ViewBuilder var actions: Actions

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .firstTextBaseline, spacing: 10) {
                Image(systemName: symbol ?? style.symbol)
                    .font(.headline)
                    .foregroundStyle(style.color)
                    .symbolRenderingMode(.hierarchical)
                    .accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 3) {
                    Text(title).font(.subheadline.weight(.semibold))
                    if let message {
                        Text(message)
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                Spacer(minLength: 0)
            }
            actions
                .padding(.leading, 30)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .glassEffect(.regular.tint(style.color.opacity(0.12)), in: .rect(cornerRadius: Theme.Radius.md))
        .accessibilityElement(children: .contain)
    }
}

extension Callout where Actions == EmptyView {
    init(style: Style = .info, title: String, message: String? = nil, symbol: String? = nil) {
        self.init(style: style, title: title, message: message, symbol: symbol) { EmptyView() }
    }
}

// MARK: - Badge

/// Small rounded label, e.g. "Trial", "Demo", "Default".
struct Badge: View {
    var text: String
    var color: Color = Theme.Palette.brand
    var symbol: String?

    var body: some View {
        HStack(spacing: 3) {
            if let symbol { Image(systemName: symbol) }
            Text(text)
        }
        .font(.caption2.weight(.bold))
        .textCase(.uppercase)
        .foregroundStyle(color)
        .padding(.horizontal, 7)
        .padding(.vertical, 3)
        .background(color.opacity(0.14), in: .capsule)
    }
}

// MARK: - Skeleton loading

/// Placeholder rows shown while the first page of data loads (instead of an empty state flash).
struct SkeletonRows: View {
    var count: Int = 6
    var showsAvatar = true
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var pulse = false

    var body: some View {
        VStack(spacing: 18) {
            ForEach(0..<count, id: \.self) { i in
                HStack(spacing: 12) {
                    if showsAvatar {
                        Circle().fill(.quaternary).frame(width: 44, height: 44)
                    }
                    VStack(alignment: .leading, spacing: 8) {
                        RoundedRectangle(cornerRadius: 5).fill(.quaternary)
                            .frame(width: [150, 190, 130, 170][i % 4], height: 13)
                        RoundedRectangle(cornerRadius: 5).fill(.quaternary.opacity(0.7))
                            .frame(maxWidth: .infinity).frame(height: 11)
                    }
                    Spacer(minLength: 0)
                }
            }
        }
        .opacity(pulse ? 0.45 : 1)
        .animation(reduceMotion ? nil : .easeInOut(duration: 0.9).repeatForever(autoreverses: true), value: pulse)
        .onAppear { pulse = true }
        .accessibilityElement()
        .accessibilityLabel("Loading")
    }
}

// MARK: - Toasts

struct Toast: Equatable, Identifiable {
    enum Style { case success, info, warning, error }
    let id = UUID()
    var text: String
    var style: Style = .success

    var symbol: String {
        switch style {
        case .success: "checkmark.circle.fill"
        case .info: "info.circle.fill"
        case .warning: "exclamationmark.triangle.fill"
        case .error: "xmark.octagon.fill"
        }
    }

    var color: Color {
        switch style {
        case .success: Theme.Palette.success
        case .info: Theme.Palette.info
        case .warning: Theme.Palette.warning
        case .error: Theme.Palette.danger
        }
    }
}

/// App-wide toast presenter. Inject with `.environment(ToastCenter.shared)` and host with `.toastHost()`.
@Observable @MainActor
final class ToastCenter {
    static let shared = ToastCenter()
    var current: Toast?
    private var dismissTask: Task<Void, Never>?

    func show(_ text: String, style: Toast.Style = .success) {
        let toast = Toast(text: text, style: style)
        withAnimation(Theme.Motion.bouncy) { current = toast }
        AccessibilityNotification.Announcement(text).post()
        dismissTask?.cancel()
        dismissTask = Task { [weak self] in
            try? await Task.sleep(for: .seconds(style == .error ? 4 : 2.6))
            guard !Task.isCancelled else { return }
            withAnimation(Theme.Motion.smooth) { if self?.current?.id == toast.id { self?.current = nil } }
        }
    }
}

private struct ToastHost: ViewModifier {
    @Environment(ToastCenter.self) private var center

    func body(content: Content) -> some View {
        content
            .overlay(alignment: .top) {
                if let toast = center.current {
                    Label(toast.text, systemImage: toast.symbol)
                        .font(.subheadline.weight(.semibold))
                        .labelStyle(ToastLabelStyle(color: toast.color))
                        .padding(.horizontal, 16)
                        .padding(.vertical, 11)
                        .glassEffect(.regular.tint(toast.color.opacity(0.14)), in: .capsule)
                        .padding(.top, 8)
                        .padding(.horizontal, 24)
                        .transition(.move(edge: .top).combined(with: .opacity))
                        .onTapGesture { withAnimation { center.current = nil } }
                        .id(toast.id)
                        .accessibilityHidden(true)
                }
            }
            .sensoryFeedback(trigger: center.current) { _, new in
                switch new?.style {
                case .success: .success
                case .warning: .warning
                case .error: .error
                case .info: .selection
                case nil: nil
                }
            }
    }
}

private struct ToastLabelStyle: LabelStyle {
    var color: Color
    func makeBody(configuration: Configuration) -> some View {
        HStack(spacing: 8) {
            configuration.icon.foregroundStyle(color)
            configuration.title.lineLimit(2)
        }
    }
}

extension View {
    func toastHost() -> some View { modifier(ToastHost()) }
}
