import CoreTransferable
import Foundation
import UniformTypeIdentifiers

/// Calls and texts as a spreadsheet-friendly CSV, built only when the person actually shares it.
struct HistoryExport: Transferable, Sendable {
    let messages: [TwilioMessage]
    let calls: [TwilioCall]
    /// Counterpart → contact name, captured on the main actor when the share sheet is set up.
    let names: [String: String]
    let accountName: String

    @MainActor
    init(store: AppStore) {
        messages = store.messages
        calls = store.calls.filter { $0.parentCallSid == nil }
        var names: [String: String] = [:]
        for n in Set(messages.map(\.counterpart) + calls.map(\.counterpart)) {
            if let name = ContactBook.shared.name(for: n) { names[n] = name }
        }
        self.names = names
        accountName = store.activeProfile?.name ?? "Dialbubble"
    }

    var isEmpty: Bool { messages.isEmpty && calls.isEmpty }

    static var transferRepresentation: some TransferRepresentation {
        FileRepresentation(exportedContentType: .commaSeparatedText) { export in
            let stamp = Date.now.formatted(.iso8601.year().month().day())
            let safeName = export.accountName.replacingOccurrences(of: "/", with: "-")
            let url = FileManager.default.temporaryDirectory.appendingPathComponent("\(safeName) history \(stamp).csv")
            try export.csv().write(to: url, atomically: true, encoding: .utf8)
            return SentTransferredFile(url)
        }
    }

    static let header = ["Type", "Date", "Direction", "From", "To", "Contact", "Status", "Duration (s)", "Text", "Price", "Currency"]

    func csv() -> String {
        let iso = ISO8601DateFormatter()
        var rows: [(Date, [String])] = []
        for m in messages {
            rows.append((m.date, ["Text", iso.string(from: m.date), m.isInbound ? "Incoming" : "Outgoing", m.from ?? "", m.to ?? "",
                                  names[m.counterpart] ?? "", m.statusKind.label, "", m.body ?? "", m.price ?? "", m.priceUnit ?? ""]))
        }
        for c in calls {
            rows.append((c.date, ["Call", iso.string(from: c.date), c.isInbound ? "Incoming" : "Outgoing", c.from ?? "", c.to ?? "",
                                  names[c.counterpart] ?? "", c.statusKind.label, String(c.durationSeconds), "", c.price ?? "", c.priceUnit ?? ""]))
        }
        let body = rows.sorted { $0.0 > $1.0 }.map { Self.line($0.1) }
        return ([Self.line(Self.header)] + body).joined(separator: "\r\n") + "\r\n"
    }

    /// RFC 4180 quoting, plus a leading apostrophe on cells a spreadsheet would run as a formula.
    static func line(_ cells: [String]) -> String {
        cells.map { cell in
            var value = cell
            if let first = value.first, "=+-@".contains(first), !value.allSatisfy({ $0.isNumber || "+-.".contains($0) }) {
                value = "'" + value
            }
            let needsQuotes = value.contains(where: { ",\"\n\r".contains($0) })
            value = value.replacingOccurrences(of: "\"", with: "\"\"")
            return needsQuotes ? "\"\(value)\"" : value
        }.joined(separator: ",")
    }
}
