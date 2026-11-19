import SwiftUI

/// Manage reusable message templates. When `onPick` is set, tapping a template inserts it.
struct TemplatesView: View {
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    var onPick: ((MessageTemplate) -> Void)?
    /// When presented in a sheet, shows a Close button. When pushed, the system back button is used.
    var isModal: Bool = false

    @State private var editing: MessageTemplate?

    var body: some View {
        List {
            if !store.templates.isEmpty {
                Section {
                    ForEach(store.templates) { t in
                        Button {
                            if let onPick { onPick(t); dismiss() } else { editing = t }
                        } label: {
                            VStack(alignment: .leading, spacing: 3) {
                                Text(t.title).font(.headline).foregroundStyle(.primary)
                                Text(t.body).font(.subheadline).foregroundStyle(.secondary).lineLimit(2)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.vertical, 4)
                            .contentShape(.rect)
                        }
                        .buttonStyle(.plain)
                        .accessibilityHint(onPick == nil ? "Edits this template" : "Inserts this template")
                        .swipeActions(edge: .leading) {
                            Button("Edit", systemImage: "pencil") { editing = t }.tint(Theme.Palette.info)
                        }
                    }
                    .onDelete { store.deleteTemplates(at: $0) }
                    .onMove { store.templates.move(fromOffsets: $0, toOffset: $1) }
                } footer: {
                    Text("Insert a template from the + button while texting.")
                }
            }
        }
        .relayBackground()
        .overlay {
            if store.templates.isEmpty {
                ContentUnavailableView {
                    Label("No Templates", systemImage: "text.badge.star")
                } description: {
                    Text("Save messages you send often, then insert them with one tap from the + menu while texting.")
                } actions: {
                    Button("Create Template", systemImage: "plus") { editing = MessageTemplate(title: "", body: "") }
                        .buttonStyle(.glassProminent)
                }
            }
        }
        .navigationTitle("Templates")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if isModal {
                ToolbarItem(placement: .topBarLeading) {
                    Button(role: .close) { dismiss() }
                }
            }
            if !store.templates.isEmpty {
                ToolbarItem(placement: .topBarTrailing) { EditButton() }
            }
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    editing = MessageTemplate(title: "", body: "")
                } label: {
                    Image(systemName: "plus")
                }
                .tint(.primary)
                .accessibilityLabel("New Template")
                .accessibilityIdentifier("templates.add")
            }
        }
        .sheet(item: $editing) { t in
            MsgTemplateEditor(template: t)
        }
    }
}

private struct MsgTemplateEditor: View {
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State var template: MessageTemplate
    @State private var saves = 0

    var body: some View {
        NavigationStack {
            Form {
                Section("Title") {
                    TextField("e.g. Running late", text: $template.title)
                }
                Section {
                    TextField("Message", text: $template.body, axis: .vertical)
                        .lineLimit(4...12)
                } header: {
                    Text("Message")
                } footer: {
                    let c = MsgSegmentCounter.count(template.body)
                    Text("\(c.units) characters · \(c.segments) part\(c.segments == 1 ? "" : "s")")
                        .monospacedDigit()
                        .contentTransition(.numericText())
                        .animation(Theme.Motion.adaptive(Theme.Motion.snappy, reduceMotion), value: c.units)
                }
            }
            .relayBackground()
            .navigationTitle(template.title.isEmpty ? "New Template" : template.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(role: .cancel) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(role: .confirm) {
                        store.saveTemplate(template)
                        saves += 1
                        dismiss()
                    }
                    .disabled(template.title.nilIfBlank == nil || template.body.nilIfBlank == nil)
                }
            }
            .sensoryFeedback(.success, trigger: saves)
        }
        .presentationDetents([.medium, .large])
    }
}

// MARK: - Shared template chips

/// Horizontal row of saved templates used by New Message and Broadcast. Tapping one hands it to `onPick`.
struct MsgTemplateChips: View {
    @Environment(AppStore.self) private var store
    var onPick: (MessageTemplate) -> Void
    @State private var picks = 0

    var body: some View {
        if !store.templates.isEmpty {
            ScrollView(.horizontal) {
                GlassEffectContainer(spacing: Theme.Space.xs) {
                    HStack(spacing: Theme.Space.xs) {
                        ForEach(store.templates) { t in
                            Button {
                                picks += 1
                                onPick(t)
                            } label: {
                                Label {
                                    Text(t.title).foregroundStyle(.primary)
                                } icon: {
                                    Image(systemName: "text.quote").foregroundStyle(Theme.Palette.brandText)
                                }
                                .font(.footnote.weight(.semibold))
                                .lineLimit(1)
                                .padding(.horizontal, Theme.Space.sm)
                                .padding(.vertical, 7)
                                .contentShape(.capsule)
                                .glassEffect(.regular.interactive(), in: .capsule)
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel("Insert template \(t.title)")
                        }
                    }
                    .padding(.vertical, 2)
                    .padding(.horizontal, 2)
                }
            }
            .scrollIndicators(.hidden)
            .scrollClipDisabled()
            .sensoryFeedback(.selection, trigger: picks)
            .accessibilityElement(children: .contain)
            .accessibilityLabel("Templates")
        }
    }
}
