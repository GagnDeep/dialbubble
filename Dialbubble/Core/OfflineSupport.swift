import Foundation
import Network
import Observation

/// The last calls and texts per account, kept on this iPhone so Dialbubble opens instantly with your history
/// (and still shows it offline). Stored in Application Support with file protection; never synced anywhere.
enum HistoryCache {
    struct Snapshot: Codable {
        var messages: [TwilioMessage]
        var calls: [TwilioCall]
        var savedAt: Date
    }

    private static var directory: URL? {
        guard let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first else { return nil }
        let dir = base.appendingPathComponent("History", isDirectory: true)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir
    }

    private static func file(for profile: UUID) -> URL? {
        directory?.appendingPathComponent("\(profile.uuidString).json")
    }

    static func save(messages: [TwilioMessage], calls: [TwilioCall], profile: UUID) {
        guard let url = file(for: profile) else { return }
        let snapshot = Snapshot(messages: Array(messages.prefix(300)), calls: Array(calls.prefix(150)), savedAt: .now)
        guard let data = try? JSONEncoder().encode(snapshot) else { return }
        try? data.write(to: url, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
    }

    static func load(profile: UUID) -> Snapshot? {
        guard let url = file(for: profile), let data = try? Data(contentsOf: url) else { return nil }
        return try? JSONDecoder().decode(Snapshot.self, from: data)
    }

    static func delete(profile: UUID) {
        guard let url = file(for: profile) else { return }
        try? FileManager.default.removeItem(at: url)
    }

    static func clearAll() {
        guard let dir = directory else { return }
        try? FileManager.default.removeItem(at: dir)
    }

    /// Bytes on disk, for Settings.
    static var size: Int64 {
        guard let dir = directory,
              let files = try? FileManager.default.contentsOfDirectory(at: dir, includingPropertiesForKeys: [.fileSizeKey]) else { return 0 }
        return files.reduce(0) { $0 + Int64((try? $1.resourceValues(forKeys: [.fileSizeKey]).fileSize) ?? 0) }
    }
}

/// Whether the iPhone has a network path, so Dialbubble can say "You're offline" instead of showing errors,
/// and refresh by itself the moment the connection is back.
@MainActor
@Observable
final class Connectivity {
    static let shared = Connectivity()

    private(set) var isOnline = true
    /// Bumped each time the connection comes back after being lost.
    private(set) var reconnects = 0

    private let monitor = NWPathMonitor()

    private init() {
        monitor.pathUpdateHandler = { path in
            let online = path.status == .satisfied
            Task { @MainActor in Connectivity.shared.update(online) }
        }
        monitor.start(queue: DispatchQueue(label: "dialbubble.connectivity"))
    }

    private func update(_ online: Bool) {
        guard online != isOnline else { return }
        isOnline = online
        if online { reconnects += 1 }
    }
}
