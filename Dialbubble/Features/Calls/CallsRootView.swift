import SwiftUI

struct CallsRootView: View {
    @Environment(AppStore.self) private var store

    enum Section: String, CaseIterable, Identifiable {
        case keypad = "Keypad", recents = "Recents"
        var id: String { rawValue }
        var symbol: String { self == .keypad ? "circle.grid.3x3.fill" : "clock.fill" }
    }

    @State private var section: Section = .keypad
    @State private var number = ""
    @State private var from: String?
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        NavigationStack {
            Group {
                switch section {
                case .keypad:
                    CallKeypadView(number: $number, from: $from)
                case .recents:
                    CallRecentsView()
                }
            }
            .navigationTitle("Calls")
            // A single, stable display mode: flipping inline/large between segments made the bar jump.
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Picker("Section", selection: $section.animation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion))) {
                        ForEach(Section.allCases) { s in
                            let missed = s == .recents ? store.unseenMissedCalls : 0
                            Text(missed > 0 ? "\(s.rawValue) (\(missed))" : s.rawValue).tag(s)
                        }
                    }
                    .pickerStyle(.segmented)
                    .frame(minWidth: 180, idealWidth: 240, maxWidth: 280)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityIdentifier("calls.modePicker")
                    .sensoryFeedback(.selection, trigger: section)
                }
            }
            .navigationDestination(for: TwilioCall.self) { call in
                CallDetailView(call: call)
            }
        }
        .onAppear(perform: consumeDraft)
        .onChange(of: store.dialDraft) { _, _ in consumeDraft() }
        .onAppear(perform: consumeRecentsRequest)
        .onChange(of: store.recentsRequested) { _, _ in consumeRecentsRequest() }
    }

    private func consumeRecentsRequest() {
        guard store.recentsRequested else { return }
        store.recentsRequested = false
        withAnimation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion)) { section = .recents }
    }

    private func consumeDraft() {
        guard let draft = store.dialDraft else { return }
        number = draft.to
        if let f = draft.from { from = f }
        withAnimation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion)) { section = .keypad }
        store.dialDraft = nil
    }
}
