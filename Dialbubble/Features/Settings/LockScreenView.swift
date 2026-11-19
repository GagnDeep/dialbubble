import SwiftUI
import LocalAuthentication

/// Opaque privacy/lock screen shown when app lock is on and the app is locked or inactive.
struct LockScreenView: View {
    @Binding var isLocked: Bool
    @Environment(\.scenePhase) private var scenePhase
    @State private var failed = 0
    @State private var isAuthenticating = false
    @ScaledMetric(relativeTo: .largeTitle) private var orbSize: CGFloat = 96

    private let biometry = Biometry.current

    var body: some View {
        ZStack {
            Theme.Palette.canvas.ignoresSafeArea()
            AmbientBackground()

            ScrollView {
                VStack(spacing: Theme.Space.xl) {
                    // The app's own icon with a small lock badge: clearly "this app, locked", and on-brand.
                    BrandIconView(size: min(orbSize, 140))
                        .overlay(alignment: .bottomTrailing) {
                            Image(systemName: "lock.fill")
                                .font(.system(size: min(orbSize, 140) * 0.17, weight: .bold))
                                .foregroundStyle(Theme.Palette.brandText)
                                .frame(width: min(orbSize, 140) * 0.36, height: min(orbSize, 140) * 0.36)
                                .background(Theme.Palette.surface, in: .circle)
                                .overlay { Circle().strokeBorder(Theme.Palette.hairline, lineWidth: 1) }
                                .offset(x: min(orbSize, 140) * 0.1, y: min(orbSize, 140) * 0.1)
                        }
                        .accessibilityHidden(true)

                    VStack(spacing: Theme.Space.xs) {
                        Text("Dialbubble is Locked")
                            .font(.title.bold())
                            .multilineTextAlignment(.center)
                            .accessibilityAddTraits(.isHeader)
                        Text(FeatureFlags.messaging ? "Unlock to see your calls and messages." : "Unlock to see your calls.")
                            .font(.body)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                            .fixedSize(horizontal: false, vertical: true)
                    }

                    if isLocked {
                        Button {
                            authenticate()
                        } label: {
                            Label(biometry == .none ? "Unlock" : "Unlock with \(biometry.name)", systemImage: biometry.symbol)
                                .font(.headline)
                                .padding(.horizontal, Theme.Space.lg)
                                .padding(.vertical, 6)
                        }
                        .buttonStyle(.glassProminent)
                        .tint(Theme.Palette.brand)
                        .controlSize(.large)
                        .symbolEffect(.wiggle, value: failed)
                        .disabled(isAuthenticating)
                    }
                }
                .padding(Theme.Space.lg)
                .frame(maxWidth: .infinity)
                .containerRelativeFrame(.vertical, alignment: .center)
            }
            .scrollBounceBehavior(.basedOnSize)
        }
        .sensoryFeedback(.error, trigger: failed) { _, new in new > 0 }
        .onAppear { if scenePhase == .active { authenticate() } }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active, isLocked { authenticate() }
        }
    }

    private func authenticate() {
        guard isLocked, !isAuthenticating else { return }
        let ctx = LAContext()
        var err: NSError?
        guard ctx.canEvaluatePolicy(.deviceOwnerAuthentication, error: &err) else {
            // No passcode/biometrics on device: don't trap the user.
            withAnimation { isLocked = false }
            return
        }
        isAuthenticating = true
        Task {
            defer { isAuthenticating = false }
            do {
                if try await ctx.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: "Unlock Dialbubble") {
                    withAnimation(.smooth) { isLocked = false }
                }
            } catch let e as LAError where [.userCancel, .appCancel, .systemCancel].contains(e.code) {
                // The person backed out (or the system interrupted) — no error feedback.
            } catch {
                failed += 1
            }
        }
    }
}
