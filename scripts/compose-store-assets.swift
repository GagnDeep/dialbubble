// Builds every App Store image from the raw simulator captures in marketing/raw:
//   AppStore/screenshots/iphone-6.9/*.png   1320×2868  (APP_IPHONE_67, Apple scales it to smaller iPhones)
//   AppStore/screenshots/iphone-duo/*.png   2007×2853  (APP_IPHONE_DUO, two screens per image)
//   AppStore/creative/header.png            3840×1646  (product page header, 21:9)
//   AppStore/creative/search.png            3840×2560  (search results asset, 3:2)
// Usage: swift scripts/compose-store-assets.swift [rawDir] [outDir]
// Captions are indexed for App Store search, so each one carries a real search phrase.
import AppKit

let args = CommandLine.arguments
let rawDir = URL(fileURLWithPath: args.count > 1 ? args[1] : "marketing/raw")
let outDir = URL(fileURLWithPath: args.count > 2 ? args[2] : "AppStore")

// MARK: Brand

func rgb(_ hex: UInt32, _ a: CGFloat = 1) -> NSColor {
    NSColor(srgbRed: CGFloat((hex >> 16) & 0xFF) / 255, green: CGFloat((hex >> 8) & 0xFF) / 255, blue: CGFloat(hex & 0xFF) / 255, alpha: a)
}
let bgTop = rgb(0x173B35), bgBottom = rgb(0x04100E)
let mint = rgb(0x6EEBD6), mintDeep = rgb(0x1DB9A3), white = NSColor.white
let space = CGColorSpace(name: CGColorSpace.sRGB)!

struct Shot { let file: String; let eyebrow: String; let headline: String }

let shots: [Shot] = [
    Shot(file: "home-dark", eyebrow: "FREE · OPEN SOURCE", headline: "Your Twilio number, on your iPhone"),
    Shot(file: "keypad-dark", eyebrow: "BUSINESS CALLS", headline: "Call from your second line"),
    Shot(file: "messages-dark", eyebrow: "SMS & MMS", headline: "Every text, one inbox"),
    Shot(file: "active-call-dark", eyebrow: "CALLER ID", headline: "They see your business number"),
    Shot(file: "conversation-dark", eyebrow: "BUSINESS TEXTING", headline: "Reply in clean, threaded chats"),
    Shot(file: "voice-message-dark", eyebrow: "VOICE MESSAGES", headline: "Type it. The call speaks it."),
    Shot(file: "recents-dark", eyebrow: "CALL HISTORY", headline: "Every call, cost and recording"),
    Shot(file: "settings-dark", eyebrow: "PRIVATE BY DESIGN", headline: "No server. No tracking. No fees."),
    Shot(file: "onboarding-dark", eyebrow: "SET UP IN 2 MINUTES", headline: "Try the demo, no account needed"),
]

func image(_ name: String) -> CGImage {
    let url = rawDir.appendingPathComponent(name + ".png")
    guard let src = CGImageSourceCreateWithURL(url as CFURL, nil), let img = CGImageSourceCreateImageAtIndex(src, 0, nil) else {
        fatalError("missing \(url.path)")
    }
    return img
}

// MARK: Drawing

final class Canvas {
    let ctx: CGContext
    let w: CGFloat, h: CGFloat
    init(_ w: Int, _ h: Int) {
        self.w = CGFloat(w); self.h = CGFloat(h)
        ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0, space: space,
                        bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
        // Flip so y grows downward, like a layout.
        ctx.translateBy(x: 0, y: self.h); ctx.scaleBy(x: 1, y: -1)
        NSGraphicsContext.current = NSGraphicsContext(cgContext: ctx, flipped: true)
    }

    func background() {
        let g = CGGradient(colorsSpace: space, colors: [bgTop.cgColor, bgBottom.cgColor] as CFArray, locations: nil)!
        ctx.drawLinearGradient(g, start: .zero, end: CGPoint(x: w * 0.45, y: h), options: [.drawsBeforeStartLocation, .drawsAfterEndLocation])
        let glow = CGGradient(colorsSpace: space, colors: [rgb(0x3EDBC4, 0.26).cgColor, rgb(0x3EDBC4, 0).cgColor] as CFArray, locations: nil)!
        ctx.drawRadialGradient(glow, startCenter: CGPoint(x: w * 0.5, y: h * 0.02), startRadius: 0,
                               endCenter: CGPoint(x: w * 0.5, y: h * 0.02), endRadius: max(w, h) * 0.62, options: [])
    }

    @discardableResult
    func text(_ s: String, size: CGFloat, weight: NSFont.Weight, color: NSColor, in rect: CGRect,
              align: NSTextAlignment = .center, tracking: CGFloat = 0, lineHeight: CGFloat = 1.04) -> CGFloat {
        let p = NSMutableParagraphStyle()
        p.alignment = align
        p.lineBreakMode = .byWordWrapping
        p.maximumLineHeight = size * lineHeight; p.minimumLineHeight = size * lineHeight
        let font = NSFont.systemFont(ofSize: size, weight: weight)
        let attr = NSAttributedString(string: s, attributes: [.font: font, .foregroundColor: color, .paragraphStyle: p, .kern: tracking])
        let bounds = attr.boundingRect(with: CGSize(width: rect.width, height: 10_000), options: [.usesLineFragmentOrigin, .usesFontLeading])
        attr.draw(with: CGRect(x: rect.minX, y: rect.minY, width: rect.width, height: ceil(bounds.height) + 4), options: [.usesLineFragmentOrigin, .usesFontLeading])
        return ceil(bounds.height)
    }

    /// An iPhone: titanium rim, black bezel, the screenshot, and the Dynamic Island.
    func phone(_ img: CGImage, x: CGFloat, y: CGFloat, width: CGFloat, rotation: CGFloat = 0) {
        let aspect = CGFloat(img.height) / CGFloat(img.width)
        let bezel = width * 0.028
        let outer = CGRect(x: x, y: y, width: width, height: width * aspect)
        let screen = outer.insetBy(dx: bezel, dy: bezel)
        let rOuter = width * 0.155, rScreen = rOuter - bezel

        ctx.saveGState()
        if rotation != 0 {
            ctx.translateBy(x: outer.midX, y: outer.midY); ctx.rotate(by: rotation); ctx.translateBy(x: -outer.midX, y: -outer.midY)
        }
        // Shadow
        ctx.saveGState()
        ctx.setShadow(offset: CGSize(width: 0, height: width * 0.04), blur: width * 0.12, color: NSColor.black.withAlphaComponent(0.55).cgColor)
        ctx.addPath(CGPath(roundedRect: outer, cornerWidth: rOuter, cornerHeight: rOuter, transform: nil))
        ctx.setFillColor(rgb(0x0B0F0E).cgColor); ctx.fillPath()
        ctx.restoreGState()
        // Rim: a thin metallic edge, lighter at the top.
        ctx.saveGState()
        ctx.addPath(CGPath(roundedRect: outer, cornerWidth: rOuter, cornerHeight: rOuter, transform: nil))
        ctx.addPath(CGPath(roundedRect: outer.insetBy(dx: width * 0.006, dy: width * 0.006), cornerWidth: rOuter - width * 0.006, cornerHeight: rOuter - width * 0.006, transform: nil))
        ctx.clip(using: .evenOdd)
        let rim = CGGradient(colorsSpace: space, colors: [rgb(0x8A9894).cgColor, rgb(0x3A4442).cgColor, rgb(0x6B7774).cgColor] as CFArray, locations: [0, 0.5, 1])!
        ctx.drawLinearGradient(rim, start: CGPoint(x: outer.minX, y: outer.minY), end: CGPoint(x: outer.maxX, y: outer.maxY), options: [])
        ctx.restoreGState()
        // Screen
        ctx.saveGState()
        ctx.addPath(CGPath(roundedRect: screen, cornerWidth: rScreen, cornerHeight: rScreen, transform: nil)); ctx.clip()
        ctx.saveGState()
        ctx.translateBy(x: screen.minX, y: screen.maxY); ctx.scaleBy(x: 1, y: -1)
        ctx.interpolationQuality = .high
        ctx.draw(img, in: CGRect(x: 0, y: 0, width: screen.width, height: screen.height))
        ctx.restoreGState()
        ctx.restoreGState()
        // Dynamic Island
        let iw = screen.width * 0.30, ih = screen.width * 0.088
        let island = CGRect(x: screen.midX - iw / 2, y: screen.minY + screen.width * 0.03, width: iw, height: ih)
        ctx.addPath(CGPath(roundedRect: island, cornerWidth: ih / 2, cornerHeight: ih / 2, transform: nil))
        ctx.setFillColor(NSColor.black.cgColor); ctx.fillPath()
        ctx.restoreGState()
    }

    func icon(at rect: CGRect) {
        let url = URL(fileURLWithPath: "Dialbubble/Resources/Assets.xcassets/AppIcon.appiconset/AppIcon.png")
        guard let src = CGImageSourceCreateWithURL(url as CFURL, nil), let img = CGImageSourceCreateImageAtIndex(src, 0, nil) else { return }
        ctx.saveGState()
        ctx.setShadow(offset: CGSize(width: 0, height: rect.width * 0.05), blur: rect.width * 0.18, color: NSColor.black.withAlphaComponent(0.5).cgColor)
        let r = rect.width * 0.225
        ctx.addPath(CGPath(roundedRect: rect, cornerWidth: r, cornerHeight: r, transform: nil)); ctx.setFillColor(bgTop.cgColor); ctx.fillPath()
        ctx.restoreGState()
        ctx.saveGState()
        ctx.addPath(CGPath(roundedRect: rect, cornerWidth: r, cornerHeight: r, transform: nil)); ctx.clip()
        ctx.translateBy(x: rect.minX, y: rect.maxY); ctx.scaleBy(x: 1, y: -1)
        ctx.draw(img, in: CGRect(origin: .zero, size: rect.size))
        ctx.restoreGState()
        ctx.saveGState()
        ctx.addPath(CGPath(roundedRect: rect.insetBy(dx: 1, dy: 1), cornerWidth: r, cornerHeight: r, transform: nil))
        ctx.setStrokeColor(NSColor.white.withAlphaComponent(0.16).cgColor); ctx.setLineWidth(2); ctx.strokePath()
        ctx.restoreGState()
    }

    /// Small pills ("Free", "Open source"…) centered on `centerX`, or starting at `startX`.
    func pills(_ items: [String], y: CGFloat, size: CGFloat, centerX: CGFloat? = nil, startX: CGFloat? = nil) {
        let font = NSFont.systemFont(ofSize: size, weight: .semibold)
        let padX = size * 0.9, gap = size * 0.6, hgt = size * 2.1
        let widths = items.map { ceil(($0 as NSString).size(withAttributes: [.font: font]).width) + padX * 2 }
        let total = widths.reduce(0, +) + gap * CGFloat(items.count - 1)
        var x = startX ?? ((centerX ?? w / 2) - total / 2)
        for (i, s) in items.enumerated() {
            let r = CGRect(x: x, y: y, width: widths[i], height: hgt)
            ctx.addPath(CGPath(roundedRect: r, cornerWidth: hgt / 2, cornerHeight: hgt / 2, transform: nil))
            ctx.setFillColor(rgb(0x6EEBD6, 0.12).cgColor); ctx.fillPath()
            ctx.addPath(CGPath(roundedRect: r.insetBy(dx: 1, dy: 1), cornerWidth: hgt / 2, cornerHeight: hgt / 2, transform: nil))
            ctx.setStrokeColor(rgb(0x6EEBD6, 0.35).cgColor); ctx.setLineWidth(2); ctx.strokePath()
            text(s, size: size, weight: .semibold, color: mint, in: CGRect(x: r.minX, y: r.minY + (hgt - size * 1.2) / 2, width: r.width, height: hgt), lineHeight: 1.2)
            x += widths[i] + gap
        }
    }

    func save(_ url: URL) {
        try? FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        let rep = NSBitmapImageRep(cgImage: ctx.makeImage()!)
        try! rep.representation(using: .png, properties: [:])!.write(to: url)
        print("✓ \(url.path)  \(Int(w))×\(Int(h))")
    }
}

// MARK: iPhone 6.9"

for (i, s) in shots.enumerated() {
    let c = Canvas(1320, 2868)
    c.background()
    c.text(s.eyebrow, size: 40, weight: .bold, color: mint, in: CGRect(x: 80, y: 150, width: 1160, height: 60), tracking: 4)
    c.text(s.headline, size: 108, weight: .bold, color: white, in: CGRect(x: 90, y: 222, width: 1140, height: 260), tracking: -1.5)
    c.phone(image(s.file), x: (1320 - 1060) / 2, y: 620, width: 1060)
    c.save(outDir.appendingPathComponent(String(format: "screenshots/iphone-6.9/%02d-%@.png", i + 1, s.file.replacingOccurrences(of: "-dark", with: ""))))
}

// MARK: iPhone Duo (two screens each)

let duo: [(String, String, String, String)] = [
    ("home-dark", "keypad-dark", "FREE · OPEN SOURCE", "Your Twilio number, on your iPhone"),
    ("messages-dark", "conversation-dark", "SMS & MMS", "Every text, one inbox"),
    ("active-call-dark", "voice-message-dark", "BUSINESS CALLS", "Call from your second line"),
    ("recents-dark", "settings-dark", "PRIVATE BY DESIGN", "No server. No tracking. No fees."),
]
for (i, d) in duo.enumerated() {
    let c = Canvas(2007, 2853)
    c.background()
    c.text(d.2, size: 52, weight: .bold, color: mint, in: CGRect(x: 120, y: 170, width: 1767, height: 70), tracking: 5)
    c.text(d.3, size: 132, weight: .bold, color: white, in: CGRect(x: 140, y: 255, width: 1727, height: 300), tracking: -2)
    let pw: CGFloat = 860
    c.phone(image(d.0), x: 2007 / 2 - pw - 30, y: 700, width: pw)
    c.phone(image(d.1), x: 2007 / 2 + 30, y: 780, width: pw)
    c.save(outDir.appendingPathComponent(String(format: "screenshots/iphone-duo/%02d-%@.png", i + 1, d.0.replacingOccurrences(of: "-dark", with: ""))))
}

// MARK: Product page header (21:9) — text left, three phones right

do {
    let c = Canvas(3840, 1646)
    c.background()
    c.icon(at: CGRect(x: 260, y: 300, width: 220, height: 220))
    c.text("Dialbubble", size: 84, weight: .bold, color: mint, in: CGRect(x: 520, y: 360, width: 1200, height: 110), align: .left, tracking: -1)
    c.text("Your Twilio number,\non your iPhone", size: 168, weight: .bold, color: white, in: CGRect(x: 260, y: 600, width: 1700, height: 420), align: .left, tracking: -3)
    c.pills(["Free", "Open source", "No subscription", "No server"], y: 1080, size: 46, startX: 262)
    let pw: CGFloat = 640
    c.phone(image("messages-dark"), x: 2050, y: 360, width: pw, rotation: -0.06)
    c.phone(image("keypad-dark"), x: 2950, y: 360, width: pw, rotation: 0.06)
    c.phone(image("home-dark"), x: 2490, y: 220, width: pw + 40)
    c.save(outDir.appendingPathComponent("creative/header.png"))
}

// MARK: Search results asset (3:2) — headline top, three phones below

do {
    let c = Canvas(3840, 2560)
    c.background()
    c.icon(at: CGRect(x: 3840 / 2 - 110, y: 150, width: 220, height: 220))
    c.text("Your Twilio number, on your iPhone", size: 170, weight: .bold, color: white, in: CGRect(x: 200, y: 430, width: 3440, height: 220), tracking: -3)
    c.pills(["Free", "Open source", "Calls · SMS · MMS", "No server"], y: 690, size: 54)
    let pw: CGFloat = 900
    c.phone(image("messages-dark"), x: 3840 / 2 - pw * 1.5 - 60, y: 1000, width: pw, rotation: -0.05)
    c.phone(image("keypad-dark"), x: 3840 / 2 + pw * 0.5 + 60, y: 1000, width: pw, rotation: 0.05)
    c.phone(image("home-dark"), x: 3840 / 2 - (pw + 60) / 2, y: 900, width: pw + 60)
    c.save(outDir.appendingPathComponent("creative/search.png"))
}
