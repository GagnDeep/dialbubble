import SwiftUI

/// Searchable library of guides. Push it from a NavigationStack, or present it with `showsDone: true`.
struct HelpCenterView: View {
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    var showsDone = false

    @State private var query = ""

    private var results: [HelpGuide] { HelpGuide.visible.filter { $0.matches(query) } }

    var body: some View {
        List {
            if query.isEmpty {
                Section {
                    header
                }
                .listRowBackground(Color.clear)
                .listRowInsets(EdgeInsets(top: 4, leading: 0, bottom: 8, trailing: 0))
            }

            if results.isEmpty {
                ContentUnavailableView {
                    Label("No Guides Found", systemImage: "questionmark.text.page")
                } description: {
                    Text(FeatureFlags.messaging ? "Try words like “token”, “schedule”, “trial” or an error code such as 21608." : "Try words like “token”, “trial” or an error code such as 21608.")
                }
                .listRowBackground(Color.clear)
            } else {
                ForEach(HelpGuide.Category.allCases) { category in
                    let guides = results.filter { $0.category == category }
                    if !guides.isEmpty {
                        Section {
                            ForEach(guides) { guide in
                                NavigationLink(value: guide) {
                                    HelpGuideRow(guide: guide)
                                }
                                .accessibilityIdentifier("help.guide.\(guide.id)")
                            }
                        } header: {
                            Text(category.rawValue)
                        }
                        .relayListRow()
                    }
                }
            }

            if query.isEmpty {
                Section {
                    ReplayTipsButton(subtitle: "Show the in-app hints again", accessibilityID: "help.replayTips")
                    Link(destination: URL(string: "https://help.twilio.com")!) {
                        SettingsRowLabel("Contact Twilio Support", symbol: "lifepreserver", color: .gray,
                                         subtitle: "help.twilio.com")
                    }
                    Link(destination: URL(string: "https://status.twilio.com")!) {
                        SettingsRowLabel("Twilio System Status", symbol: "waveform.path.ecg", color: .gray,
                                         subtitle: "Check for outages")
                    }
                } header: {
                    Text("More Help")
                } footer: {
                    Text("Twilio Support can help with account, number and billing questions.")
                }
                .relayListRow()
            }
        }
        .relayBackground()
        .navigationTitle("Help & Guides")
        .navigationDestination(for: HelpGuide.self) { HelpGuideView(guide: $0) }
        .searchable(text: $query, placement: .navigationBarDrawer(displayMode: .always), prompt: "Search guides or error codes")
        .toolbar {
            if showsDone {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done", systemImage: "checkmark") { dismiss() }
                        .buttonStyle(.glass)
                        .accessibilityLabel("Close Help")
                }
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: Theme.Space.xxs) {
            Text("How can we help?")
                .font(.title2.bold())
                .accessibilityAddTraits(.isHeader)
            Text(FeatureFlags.messaging ? "Guides for setup, calling, messaging and fixing errors." : "Guides for setup, calling and fixing errors.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.horizontal, Theme.Space.md)
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// A list row for a guide.
struct HelpGuideRow: View {
    var guide: HelpGuide

    var body: some View {
        HStack(spacing: 12) {
            SettingsIcon(symbol: guide.symbol, color: guide.color, size: 34)
            VStack(alignment: .leading, spacing: 2) {
                Text(guide.title).font(.body.weight(.medium)).foregroundStyle(.primary)
                Text(guide.summary).font(.footnote).foregroundStyle(.secondary).lineLimit(2)
            }
        }
        .padding(.vertical, 2)
        .accessibilityElement(children: .combine)
    }
}

/// The detail page for a single guide.
struct HelpGuideView: View {
    @Environment(AppStore.self) private var store
    var guide: HelpGuide
    @ScaledMetric(relativeTo: .largeTitle) private var heroIconSize: CGFloat = 52
    @ScaledMetric(relativeTo: .subheadline) private var stepBadgeSize: CGFloat = 28

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                hero

                if !guide.steps.isEmpty {
                    VStack(alignment: .leading, spacing: 10) {
                        sectionTitle("Steps", symbol: "list.number")
                        GlassEffectContainer(spacing: 8) {
                            VStack(spacing: 8) {
                                ForEach(Array(guide.steps.enumerated()), id: \.offset) { index, step in
                                    stepRow(index + 1, step)
                                }
                            }
                        }
                    }
                }

                if !guide.errors.isEmpty {
                    VStack(alignment: .leading, spacing: 10) {
                        sectionTitle("Error Codes", symbol: "exclamationmark.bubble.fill")
                        VStack(spacing: 8) {
                            ForEach(guide.errors) { errorRow($0) }
                        }
                    }
                }

                if !guide.tips.isEmpty {
                    GlassCard(cornerRadius: Theme.Radius.md) {
                        VStack(alignment: .leading, spacing: 10) {
                            Label("Good to know", systemImage: "lightbulb.fill")
                                .font(.headline)
                                .foregroundStyle(Theme.Palette.brandText)
                                .accessibilityAddTraits(.isHeader)
                            ForEach(guide.tips, id: \.self) { tip in
                                HStack(alignment: .firstTextBaseline, spacing: 8) {
                                    Text("•").font(.subheadline.weight(.bold)).foregroundStyle(.secondary)
                                        .accessibilityHidden(true)
                                    Text(tip).font(.subheadline)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                            }
                        }
                    }
                }

                if !guide.links.isEmpty {
                    VStack(alignment: .leading, spacing: 10) {
                        sectionTitle("Open in Twilio", symbol: "arrow.up.right.square.fill")
                        VStack(spacing: 8) {
                            ForEach(guide.links, id: \.self) { link in
                                SwiftUI.Link(destination: link.url) {
                                    HStack(spacing: 12) {
                                        Image(systemName: link.symbol)
                                            .foregroundStyle(guide.color)
                                            .frame(width: 26)
                                        Text(link.title).font(.body.weight(.medium)).foregroundStyle(.primary)
                                        Spacer()
                                        Image(systemName: "arrow.up.right")
                                            .font(.caption.weight(.bold))
                                            .foregroundStyle(.tertiary)
                                    }
                                    .padding(14)
                                    .contentShape(.rect(cornerRadius: Theme.Radius.md))
                                }
                                .buttonStyle(.plain)
                                .glassEffect(.regular.interactive(), in: .rect(cornerRadius: Theme.Radius.md))
                                .accessibilityHint("Opens in Safari")
                            }
                        }
                    }
                }
            }
            .padding()
            .padding(.bottom, 24)
            .frame(maxWidth: 700)
            .frame(maxWidth: .infinity)
        }
        .relayBackground()
        .navigationTitle(guide.title)
        .navigationBarTitleDisplayMode(.inline)
    }

    private var hero: some View {
        let icon = min(heroIconSize, 110)
        return VStack(alignment: .leading, spacing: 12) {
            IconTile(symbol: guide.symbol, color: guide.color, size: icon)
            Text(guide.title)
                .font(.title.bold())
                .accessibilityAddTraits(.isHeader)
            Text(guide.intro.isEmpty ? guide.summary : guide.intro)
                .font(.body)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.horizontal, Theme.Space.xxs)
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func sectionTitle(_ title: String, symbol: String) -> some View {
        Text(title)
            .font(.headline)
            .accessibilityAddTraits(.isHeader)
            .padding(.horizontal, 4)
    }

    private func stepRow(_ number: Int, _ step: HelpGuide.Step) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Text("\(number)")
                .font(.subheadline.bold().monospacedDigit())
                .foregroundStyle(guide.color)
                .frame(minWidth: stepBadgeSize, minHeight: stepBadgeSize)
                .background(guide.color.opacity(0.15), in: .circle)
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 6) {
                Text(step.text)
                    .font(.subheadline)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .glassEffect(.regular, in: .rect(cornerRadius: Theme.Radius.md))
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Step \(number). \(step.text)")
    }

    private func errorRow(_ e: HelpGuide.ErrorRow) -> some View {
        SwiftUI.Link(destination: e.docsURL) {
            HStack(alignment: .top, spacing: 12) {
                Text(String(e.code))
                    .font(.caption.bold().monospacedDigit())
                    .foregroundStyle(.primary)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Theme.Palette.warning.opacity(0.2), in: .capsule)
                VStack(alignment: .leading, spacing: 3) {
                    Text(e.title).font(.subheadline.weight(.semibold)).foregroundStyle(.primary)
                    Text(e.fix)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
                Spacer(minLength: 0)
                Image(systemName: "arrow.up.right").font(.caption.weight(.bold)).foregroundStyle(.tertiary)
            }
            .padding(14)
            .contentShape(.rect(cornerRadius: Theme.Radius.md))
        }
        .buttonStyle(.plain)
        .glassEffect(.regular.interactive(), in: .rect(cornerRadius: Theme.Radius.md))
        .accessibilityLabel("Error \(e.code): \(e.title). \(e.fix)")
        .accessibilityHint("Opens Twilio documentation")
    }
}
