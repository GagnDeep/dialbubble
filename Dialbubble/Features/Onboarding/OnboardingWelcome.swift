import SwiftUI
import UIKit

// MARK: - Welcome hero

/// A live, miniature preview of what Dialbubble does: a call from one of your numbers and a text thread from another.
/// Shows the product instead of describing it. Static under Reduce Motion.
struct OnboardingWelcomePreview: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.colorScheme) private var scheme
    @State private var stage = 0
    @State private var seconds = 12
    @ScaledMetric(relativeTo: .body) private var avatar: CGFloat = 40

    private var showsMessages: Bool { FeatureFlags.messaging }

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Space.sm) {
            if stage >= 1 { callCard.transition(.move(edge: .top).combined(with: .opacity)) }
            if showsMessages {
                if stage >= 2 {
                    bubble("Can we move it to 3pm?", outgoing: false, caption: "To Support")
                        .transition(.move(edge: .leading).combined(with: .opacity))
                }
                if stage >= 3 {
                    bubble("3pm works. See you then!", outgoing: true, caption: stage >= 4 ? "Delivered" : "Sending…")
                        .transition(.move(edge: .trailing).combined(with: .opacity))
                }
            }
        }
        .frame(maxWidth: 360, minHeight: showsMessages ? 236 : 90, alignment: .top)
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(showsMessages
            ? "Preview: a call from your Main Line, and a text conversation from your Support number."
            : "Preview: a call from your Main Line.")
        .task { await play() }
    }

    private func play() async {
        if reduceMotion { stage = 4; return }
        for next in 1...4 {
            try? await Task.sleep(for: .milliseconds(next == 1 ? 250 : 650))
            withAnimation(.spring(duration: 0.5, bounce: 0.22)) { stage = next }
        }
        // Tick the call timer so the card feels alive.
        while !Task.isCancelled {
            try? await Task.sleep(for: .seconds(1))
            seconds += 1
        }
    }

    private var callCard: some View {
        HStack(spacing: Theme.Space.sm) {
            ZStack {
                Circle().fill(Theme.Palette.brand.gradient)
                Text("DK").font(.subheadline.weight(.bold)).foregroundStyle(.white)
            }
            .frame(width: avatar, height: avatar)
            .overlay(alignment: .bottomTrailing) {
                Circle().fill(Theme.Palette.success)
                    .frame(width: avatar * 0.3, height: avatar * 0.3)
                    .overlay { Circle().strokeBorder(Theme.Palette.canvas, lineWidth: 2) }
            }
            VStack(alignment: .leading, spacing: 2) {
                Text("Dana Kim").font(.subheadline.weight(.semibold))
                HStack(spacing: 5) {
                    Circle().fill(Color.blue).frame(width: 6, height: 6)
                    Text("From Main Line").font(.caption).foregroundStyle(.secondary)
                }
            }
            Spacer(minLength: 6)
            Text(Duration.seconds(seconds).formatted(.time(pattern: .minuteSecond)))
                .font(.subheadline.weight(.semibold).monospacedDigit())
                .foregroundStyle(Theme.Palette.brandText)
                .contentTransition(.numericText())
                .animation(.snappy, value: seconds)
            Image(systemName: "phone.down.fill")
                .font(.footnote.weight(.bold))
                .foregroundStyle(.white)
                .frame(width: 32, height: 32)
                .background(Theme.Palette.danger, in: .circle)
        }
        .padding(.horizontal, Theme.Space.md)
        .padding(.vertical, Theme.Space.sm)
        .glassEffect(.regular, in: .rect(cornerRadius: Theme.Radius.md))
    }

    private func bubble(_ text: String, outgoing: Bool, caption: String) -> some View {
        VStack(alignment: outgoing ? .trailing : .leading, spacing: 4) {
            Text(text)
                .font(.subheadline)
                .foregroundStyle(outgoing ? .white : .primary)
                .padding(.horizontal, 14)
                .padding(.vertical, 9)
                .background {
                    if outgoing {
                        UnevenRoundedRectangle(topLeadingRadius: 18, bottomLeadingRadius: 18, bottomTrailingRadius: 6, topTrailingRadius: 18)
                            .fill(Theme.Palette.bubbleGradient)
                    } else {
                        UnevenRoundedRectangle(topLeadingRadius: 18, bottomLeadingRadius: 6, bottomTrailingRadius: 18, topTrailingRadius: 18)
                            .fill(scheme == .dark ? Color.white.opacity(0.1) : Color.white)
                            .shadow(color: .black.opacity(scheme == .dark ? 0 : 0.05), radius: 6, y: 2)
                    }
                }
            HStack(spacing: 4) {
                if outgoing && caption == "Delivered" {
                    Image(systemName: "checkmark").font(.caption2.weight(.bold)).foregroundStyle(Theme.Palette.brandText)
                }
                Text(caption).font(.caption2.weight(.medium)).foregroundStyle(.secondary)
                    .contentTransition(.opacity)
            }
            .padding(.horizontal, 6)
        }
        .frame(maxWidth: .infinity, alignment: outgoing ? .trailing : .leading)
        .padding(outgoing ? .leading : .trailing, 48)
    }
}

/// Three short reasons to trust the app, as one quiet row (stacks at large text sizes).
struct OnboardingTrustRow: View {
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    private let items: [(String, String)] = [
        ("lock.shield.fill", "Keys stay on\nthis iPhone"),
        ("server.rack", "No server\nto run"),
        ("bolt.fill", "Set up in\n2 minutes"),
    ]

    var body: some View {
        let layout = dynamicTypeSize.isAccessibilitySize
            ? AnyLayout(VStackLayout(alignment: .leading, spacing: Theme.Space.sm))
            : AnyLayout(HStackLayout(alignment: .top, spacing: Theme.Space.xs))
        layout {
            ForEach(items, id: \.0) { symbol, title in
                let vertical = !dynamicTypeSize.isAccessibilitySize
                let item = vertical
                    ? AnyLayout(VStackLayout(spacing: 6))
                    : AnyLayout(HStackLayout(spacing: Theme.Space.sm))
                item {
                    Image(systemName: symbol)
                        .font(.body.weight(.semibold))
                        .foregroundStyle(Theme.Palette.brandText)
                        .frame(height: 22)
                        .accessibilityHidden(true)
                    Text(vertical ? title : title.replacingOccurrences(of: "\n", with: " "))
                        .font(.footnote.weight(.medium))
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(vertical ? .center : .leading)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .frame(maxWidth: vertical ? .infinity : nil, alignment: .leading)
                .accessibilityElement(children: .combine)
            }
        }
    }
}

#Preview("Welcome pieces") {
    VStack(spacing: 30) {
        BrandIconView(size: 88)
        OnboardingWelcomePreview()
        OnboardingTrustRow()
    }
    .padding()
    .relayBackground()
}
