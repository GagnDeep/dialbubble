import SwiftUI
import UIKit

/// Single source of truth for Dialbubble's visual language ("Fresh Mint").
/// Views should reach for these tokens instead of literal colors, radii and spacing.
enum Theme {
    // MARK: Palette

    enum Palette {
        /// Brand mint for filled surfaces that carry white labels (buttons, call button).
        /// Tuned to stay vivid while keeping white bold text ≈ 3:1 in both appearances.
        static let brand = Color(uiColor: brandUIColor)
        static let brandUIColor = UIColor { traits in
            traits.userInterfaceStyle == .dark ? UIColor(hex: 0x0EA592) : UIColor(hex: 0x0E9C8A)
        }
        /// Luminous mint for glows, glyphs and selected states on dark surfaces.
        static let brandBright = Color(uiColor: UIColor { traits in
            traits.userInterfaceStyle == .dark ? UIColor(hex: 0x3EDBC4) : UIColor(hex: 0x14B8A6)
        })
        /// Mint for text and small glyphs on page/glass backgrounds (≥ 4.5:1 against the canvas).
        static let brandText = Color(uiColor: brandTextUIColor)
        static let brandTextUIColor = UIColor { traits in
            traits.userInterfaceStyle == .dark ? UIColor(hex: 0x3EDBC4) : UIColor(hex: 0x0B7D71)
        }
        static let brandSecondary = Color(uiColor: UIColor(hex: 0x3B82F6))
        static let brandGradient = LinearGradient(
            colors: [Color(uiColor: UIColor(hex: 0x2CCFB6)), Color(uiColor: UIColor(hex: 0x10A896)), Color(uiColor: UIColor(hex: 0x2F80ED))],
            startPoint: .topLeading, endPoint: .bottomTrailing
        )
        /// Gradient for outgoing message bubbles (white text stays readable).
        static let bubbleGradient = LinearGradient(
            colors: [Color(uiColor: UIColor(hex: 0x12A893)), Color(uiColor: UIColor(hex: 0x0D8C7C))],
            startPoint: .top, endPoint: .bottom
        )

        static let success = Color.green
        static let warning = Color.orange
        /// Reserved for hang-up, delete and errors only.
        static let danger = Color.red
        static let info = Color.blue

        /// Calm page base underneath glass.
        static let canvas = Color(uiColor: UIColor { traits in
            traits.userInterfaceStyle == .dark ? UIColor(hex: 0x050708) : UIColor(hex: 0xF3F5F5)
        })

        /// Raised surface for solid (non-glass) cards and fields.
        static let surface = Color(uiColor: UIColor { traits in
            traits.userInterfaceStyle == .dark ? UIColor(hex: 0x111517) : UIColor.white
        })
        /// Hairline separators on cards.
        static let hairline = Color(uiColor: UIColor { traits in
            traits.userInterfaceStyle == .dark ? UIColor(white: 1, alpha: 0.08) : UIColor(white: 0, alpha: 0.06)
        })

        /// Icon-tile / avatar palette — friendly hues, no red or pink.
        static let identity: [Color] = [.mint, .teal, .blue, .indigo, .purple, .orange, .cyan, .green]
    }

    // MARK: Metrics

    enum Radius {
        static let sm: CGFloat = 12
        static let md: CGFloat = 18
        static let lg: CGFloat = 24
        static let xl: CGFloat = 30
    }

    enum Space {
        static let xxs: CGFloat = 4
        static let xs: CGFloat = 8
        static let sm: CGFloat = 12
        static let md: CGFloat = 16
        static let lg: CGFloat = 24
        static let xl: CGFloat = 32
    }

    // MARK: Motion

    enum Motion {
        static let snappy = Animation.snappy(duration: 0.3)
        static let smooth = Animation.smooth(duration: 0.4)
        static let bouncy = Animation.spring(duration: 0.5, bounce: 0.25)

        /// Returns `nil` when Reduce Motion is on so callers can write `withAnimation(Theme.Motion.adaptive(.bouncy, reduce))`.
        static func adaptive(_ animation: Animation, _ reduceMotion: Bool) -> Animation? {
            reduceMotion ? nil : animation
        }
    }

    // MARK: Contrast (used by tests and to validate palette choices)

    static func contrastRatio(_ a: UIColor, _ b: UIColor) -> Double {
        func luminance(_ c: UIColor) -> Double {
            var r: CGFloat = 0, g: CGFloat = 0, bl: CGFloat = 0, al: CGFloat = 0
            c.getRed(&r, green: &g, blue: &bl, alpha: &al)
            func lin(_ v: CGFloat) -> Double {
                let v = Double(v)
                return v <= 0.03928 ? v / 12.92 : pow((v + 0.055) / 1.055, 2.4)
            }
            return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(bl)
        }
        let la = luminance(a), lb = luminance(b)
        return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)
    }
}

extension UIColor {
    convenience init(hex: UInt32, alpha: CGFloat = 1) {
        self.init(
            red: CGFloat((hex >> 16) & 0xFF) / 255,
            green: CGFloat((hex >> 8) & 0xFF) / 255,
            blue: CGFloat(hex & 0xFF) / 255,
            alpha: alpha
        )
    }
}
