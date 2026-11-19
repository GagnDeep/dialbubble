// Regenerates Dialbubble's app icons (light, dark, tinted) into the asset catalog.
// Usage: swift scripts/make-icon.swift [outputDir]
//
// The mark: "Voice Bubble". A message bubble (a circle whose bottom-left corner is square, the tail) with a
// voice wave cut out of it: calls and texts in one shape. The wave is a hole, so every appearance only has
// to recolor one silhouette. Keep it in sync with `BrandMarkShape`.
import AppKit

let outPath = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "Dialbubble/Resources/Assets.xcassets/AppIcon.appiconset"
let out = URL(fileURLWithPath: outPath)
try? FileManager.default.createDirectory(at: out, withIntermediateDirectories: true)

let space = CGColorSpace(name: CGColorSpace.sRGB)!
func color(_ hex: UInt32, _ a: CGFloat = 1) -> CGColor {
    CGColor(srgbRed: CGFloat((hex >> 16) & 0xFF) / 255, green: CGFloat((hex >> 8) & 0xFF) / 255, blue: CGFloat(hex & 0xFF) / 255, alpha: a)
}
func gradient(_ colors: [CGColor], _ locations: [CGFloat]? = nil) -> CGGradient {
    CGGradient(colorsSpace: space, colors: colors as CFArray, locations: locations)!
}
let extend: CGGradientDrawingOptions = [.drawsBeforeStartLocation, .drawsAfterEndLocation]

// MARK: Geometry (1024 grid, y up) — mirrored in BrandMarkShape

let R: CGFloat = 317                       // bubble radius
let cx: CGFloat = 512, cy: CGFloat = 522   // bubble center (nudged up: the tail makes it bottom-heavy)
let barWidth: CGFloat = 45
let barStep: CGFloat = 76
let barHeights: [CGFloat] = [92, 184, 276, 174, 92]

func markPath() -> CGPath {
    let circle = CGPath(ellipseIn: CGRect(x: cx - R, y: cy - R, width: 2 * R, height: 2 * R), transform: nil)
    let tail = CGPath(rect: CGRect(x: cx - R, y: cy - R, width: R, height: R), transform: nil)   // the sharp corner
    var bubble = circle.union(tail)
    for (i, h) in barHeights.enumerated() {
        let x = cx + CGFloat(i - 2) * barStep - barWidth / 2
        let bar = CGPath(roundedRect: CGRect(x: x, y: cy - h / 2, width: barWidth, height: h),
                         cornerWidth: barWidth / 2, cornerHeight: barWidth / 2, transform: nil)
        bubble = bubble.subtracting(bar)
    }
    return bubble
}

enum Variant { case light, dark, tinted }

func render(_ variant: Variant, to file: String) {
    let ctx = CGContext(data: nil, width: 1024, height: 1024, bitsPerComponent: 8, bytesPerRow: 0, space: space,
                        bitmapInfo: variant == .light ? CGImageAlphaInfo.noneSkipLast.rawValue : CGImageAlphaInfo.premultipliedLast.rawValue)!
    let mark = markPath()
    let top = CGPoint(x: 0, y: cy + R), bottom = CGPoint(x: 0, y: cy - R)

    func fillMark(_ a: CGColor, _ b: CGColor) {
        ctx.saveGState()
        ctx.addPath(mark); ctx.clip()
        ctx.drawLinearGradient(gradient([a, b]), start: top, end: bottom, options: extend)
        ctx.restoreGState()
    }
    /// Liquid Glass edge: a bright rim on the inside of the shape, strongest where the light (top-left) hits.
    func innerEdge() {
        ctx.saveGState()
        ctx.addPath(mark); ctx.clip()
        ctx.addPath(mark); ctx.setLineWidth(22); ctx.replacePathWithStrokedPath(); ctx.clip()
        ctx.drawLinearGradient(gradient([color(0xFFFFFF, 0.9), color(0xFFFFFF, 0), color(0xFFFFFF, 0.25)], [0, 0.45, 1]),
                               start: CGPoint(x: cx - R, y: cy + R), end: CGPoint(x: cx + R * 0.2, y: cy - R), options: extend)
        ctx.restoreGState()
    }

    switch variant {
    case .light:
        // Deep teal, lit from the top-left: the "mint tinted" look.
        ctx.drawLinearGradient(gradient([color(0x173B35), color(0x04100E)]), start: CGPoint(x: 0, y: 1024), end: CGPoint(x: 560, y: 0), options: extend)
        ctx.drawRadialGradient(gradient([color(0x3EDBC4, 0.16), color(0x3EDBC4, 0)]),
                               startCenter: CGPoint(x: 190, y: 980), startRadius: 0, endCenter: CGPoint(x: 190, y: 980), endRadius: 820, options: [])
        ctx.saveGState()
        ctx.setShadow(offset: CGSize(width: 0, height: -18), blur: 50, color: color(0x000000, 0.5))
        ctx.addPath(mark); ctx.setFillColor(color(0x1FBFA8)); ctx.fillPath(using: .winding)
        ctx.restoreGState()
        fillMark(color(0x9AF7E8), color(0x1DB9A3))
        innerEdge()
    case .dark:
        // iOS supplies the dark backdrop.
        fillMark(color(0x8FF3E2), color(0x19B9A3))
    case .tinted:
        // Grayscale; iOS applies the user's tint.
        fillMark(color(0xFFFFFF), color(0xBDBDBD))
    }

    let rep = NSBitmapImageRep(cgImage: ctx.makeImage()!)
    try! rep.representation(using: .png, properties: [:])!.write(to: out.appendingPathComponent(file))
}

render(.light, to: "AppIcon.png")
render(.dark, to: "AppIcon-Dark.png")
render(.tinted, to: "AppIcon-Tinted.png")

if CommandLine.arguments.count <= 1 {
    let contents = """
    {
      "images" : [
        { "filename" : "AppIcon.png", "idiom" : "universal", "platform" : "ios", "size" : "1024x1024" },
        { "appearances" : [ { "appearance" : "luminosity", "value" : "dark" } ], "filename" : "AppIcon-Dark.png", "idiom" : "universal", "platform" : "ios", "size" : "1024x1024" },
        { "appearances" : [ { "appearance" : "luminosity", "value" : "tinted" } ], "filename" : "AppIcon-Tinted.png", "idiom" : "universal", "platform" : "ios", "size" : "1024x1024" }
      ],
      "info" : { "author" : "xcode", "version" : 1 }
    }
    """
    try! contents.write(to: out.appendingPathComponent("Contents.json"), atomically: true, encoding: .utf8)
}
print("Icons written to \(out.path)")
