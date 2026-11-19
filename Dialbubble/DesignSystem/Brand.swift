import SwiftUI
import UIKit

// MARK: - Brand mark

/// Dialbubble's mark, "Voice Bubble": a message bubble (a circle whose bottom-left corner is square, the tail)
/// with a voice wave cut out of it. Calls and texts in one shape. Same geometry as `scripts/make-icon.swift`.
struct BrandMarkShape: Shape {
    // Mark space: the 1024 icon grid, y up. The bubble's bounding box is 634 × 634.
    private static let r: CGFloat = 317, cx: CGFloat = 512, cy: CGFloat = 522
    private static let barWidth: CGFloat = 45, barStep: CGFloat = 76
    private static let barHeights: [CGFloat] = [92, 184, 276, 174, 92]
    static let aspect: CGFloat = 1
    /// The mark's height as a fraction of the icon, and its upward nudge (the tail makes it bottom-heavy).
    static let iconHeightRatio: CGFloat = (r * 2) / 1024
    static let iconLift: CGFloat = 10 / 1024

    private static let cgPath: CGPath = {
        let circle = CGPath(ellipseIn: CGRect(x: cx - r, y: cy - r, width: 2 * r, height: 2 * r), transform: nil)
        let tail = CGPath(rect: CGRect(x: cx - r, y: cy - r, width: r, height: r), transform: nil)
        var bubble = circle.union(tail)
        for (i, h) in barHeights.enumerated() {
            let x = cx + CGFloat(i - 2) * barStep - barWidth / 2
            let bar = CGPath(roundedRect: CGRect(x: x, y: cy - h / 2, width: barWidth, height: h),
                             cornerWidth: barWidth / 2, cornerHeight: barWidth / 2, transform: nil)
            bubble = bubble.subtracting(bar)
        }
        return bubble
    }()

    func path(in rect: CGRect) -> Path {
        let side = Self.r * 2
        let s = min(rect.width, rect.height) / side
        // Mark space (y up) → view space (y down), centered in `rect`.
        let t = CGAffineTransform(translationX: rect.midX, y: rect.midY)
            .scaledBy(x: s, y: -s)
            .translatedBy(x: -Self.cx, y: -Self.cy)
        var tt = t
        return Path(Self.cgPath.copy(using: &tt) ?? Self.cgPath)
    }
}

/// The mark at a given height, in any fill.
struct BrandMark<Fill: ShapeStyle>: View {
    var height: CGFloat
    var fill: Fill

    var body: some View {
        BrandMarkShape()
            .fill(fill, style: FillStyle(eoFill: true))
            .frame(width: height * BrandMarkShape.aspect, height: height)
            .accessibilityHidden(true)
    }
}

/// The app icon, drawn live: crisp at any size and identical to the home-screen icon.
struct BrandIconView: View {
    var size: CGFloat
    var showsShadow = true

    static let background = LinearGradient(colors: [Color(uiColor: UIColor(hex: 0x173B35)), Color(uiColor: UIColor(hex: 0x04100E))],
                                           startPoint: .topLeading, endPoint: UnitPoint(x: 0.55, y: 1))
    static let markFill = LinearGradient(colors: [Color(uiColor: UIColor(hex: 0x9AF7E8)), Color(uiColor: UIColor(hex: 0x1DB9A3))],
                                         startPoint: .top, endPoint: .bottom)

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: size * 0.225, style: .continuous)
        ZStack {
            shape.fill(Self.background)
            RadialGradient(colors: [Color(uiColor: UIColor(hex: 0x3EDBC4)).opacity(0.16), .clear],
                           center: UnitPoint(x: 0.18, y: 0.04), startRadius: 0, endRadius: size * 0.8)
            BrandMark(height: size * BrandMarkShape.iconHeightRatio, fill: Self.markFill)
                .shadow(color: .black.opacity(0.45), radius: size * 0.025, y: size * 0.018)
                .offset(y: -size * BrandMarkShape.iconLift)
        }
        .frame(width: size, height: size)
        .clipShape(shape)
        .overlay { shape.strokeBorder(.white.opacity(0.14), lineWidth: 0.5) }
        .shadow(color: showsShadow ? Theme.Palette.brand.opacity(0.25) : .clear, radius: size * 0.12, y: size * 0.06)
        .accessibilityHidden(true)
    }
}

#Preview("Brand") {
    HStack(spacing: 24) {
        BrandIconView(size: 120)
        BrandIconView(size: 60)
        BrandMark(height: 60, fill: Theme.Palette.brandText)
    }
    .padding()
}
