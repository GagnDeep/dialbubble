import SwiftUI

// MARK: - Offline

/// Quiet capsule while the iPhone has no connection. Dialbubble keeps showing saved history and refreshes
/// by itself when the connection is back.
struct OfflineBar: View {
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "wifi.slash")
                .foregroundStyle(Theme.Palette.warning)
            Text("You're offline")
                .fontWeight(.semibold)
            Text("Showing saved history")
                .foregroundStyle(.secondary)
                .lineLimit(1)
        }
        .font(.footnote)
        .padding(.horizontal, 14)
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("status.offline")
    }
}

// MARK: - Return to call

/// Shown while a call continues with its screen minimized, like the green call pill on iPhone.
/// It keeps checking the call so it can show the live time, and goes away when the call ends.
struct CallReturnBar: View {
    @Environment(AppStore.self) private var store
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let session: LiveCallSession
    @State private var call: TwilioCall

    init(session: LiveCallSession) {
        self.session = session
        _call = State(initialValue: session.call)
    }

    private var ended: Bool { !call.statusKind.isActive && call.statusKind != .unknown }

    var body: some View {
        Button {
            store.resumeCall()
        } label: {
            HStack(spacing: 10) {
                Image(systemName: ended ? "phone.down.fill" : "phone.fill")
                    .font(.footnote.weight(.bold))
                    .foregroundStyle(.white)
                    .frame(width: 28, height: 28)
                    .background(ended ? Color.gray : Theme.Palette.brand, in: .circle)
                    .symbolEffect(.pulse, isActive: !reduceMotion && !ended)
                VStack(alignment: .leading, spacing: 0) {
                    Text(ContactBook.shared.label(for: session.destination))
                        .font(.subheadline.weight(.semibold))
                        .lineLimit(1)
                    status
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer(minLength: Theme.Space.xs)
                Text("Return to Call")
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(Theme.Palette.brandText)
                Image(systemName: "chevron.up")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(Theme.Palette.brandText)
            }
            .padding(.leading, 8)
            .padding(.trailing, 14)
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .combine)
        .accessibilityHint("Opens the call screen")
        .accessibilityIdentifier("status.returnToCall")
        .task(id: session.id) { await poll() }
    }

    @ViewBuilder
    private var status: some View {
        if call.statusKind == .inProgress, let start = call.startTime {
            TimelineView(.periodic(from: start, by: 1)) { ctx in
                Text("\(session.mode.title) · \(max(0, Int(ctx.date.timeIntervalSince(start))).durationString)")
                    .monospacedDigit()
            }
        } else {
            Text(ended ? "Call ended" : call.statusKind.label)
        }
    }

    private func poll() async {
        guard let client = store.client else { return }
        while !Task.isCancelled {
            if let updated = try? await client.fetchCall(sid: call.sid) {
                call = updated
                store.updateCallInList(updated)
            }
            if ended {
                try? await Task.sleep(for: .seconds(3))
                withAnimation(Theme.Motion.adaptive(Theme.Motion.smooth, reduceMotion)) {
                    if store.minimizedCall?.id == session.id { store.minimizedCall = nil }
                }
                return
            }
            try? await Task.sleep(for: .seconds(3))
        }
    }
}

// MARK: - New text banner

/// A new text that arrived while you were elsewhere in Dialbubble. Tap to open it; swipe up or wait to dismiss.
struct IncomingTextBanner: View {
    let message: TwilioMessage
    var onOpen: () -> Void
    var onDismiss: () -> Void
    @State private var drag: CGFloat = 0

    var body: some View {
        let name = ContactBook.shared.label(for: message.counterpart)
        let body = message.body?.nilIfBlank ?? (message.mediaCount > 0 ? "Attachment" : "New message")
        Button(action: onOpen) {
            HStack(spacing: Theme.Space.sm) {
                MsgTonalAvatar(key: message.counterpart, size: 40)
                VStack(alignment: .leading, spacing: 1) {
                    HStack {
                        Text(name).font(.subheadline.weight(.semibold)).lineLimit(1)
                        Spacer(minLength: 4)
                        Text("now").font(.caption).foregroundStyle(.secondary)
                    }
                    Text(body)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                }
            }
            .padding(Theme.Space.sm)
            .contentShape(.rect(cornerRadius: Theme.Radius.lg))
        }
        .buttonStyle(.plain)
        .glassEffect(.regular.interactive(), in: .rect(cornerRadius: Theme.Radius.lg))
        .offset(y: min(0, drag))
        .gesture(DragGesture(minimumDistance: 8)
            .onChanged { drag = $0.translation.height }
            .onEnded { value in
                if value.translation.height < -24 { onDismiss() } else { withAnimation(.snappy) { drag = 0 } }
            })
        .sensoryFeedback(.impact(weight: .light), trigger: message.sid)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("New message from \(name): \(body)")
        .accessibilityHint("Opens the conversation")
        .accessibilityAction(named: "Dismiss", onDismiss)
        .accessibilityIdentifier("status.incomingText")
        .task(id: message.sid) {
            AccessibilityNotification.Announcement("New message from \(name)").post()
            try? await Task.sleep(for: .seconds(5))
            if !Task.isCancelled { onDismiss() }
        }
    }
}
