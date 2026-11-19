# Dialbubble design system — "Fresh Mint"

Dialbubble is a SwiftUI app for iOS 26+ (Liquid Glass) for calling and texting through Twilio.
The visual language is **calm, friendly and polished**: neutral glass on a quiet canvas, with a single mint brand accent.

## Tokens (`Dialbubble/DesignSystem/Theme.swift`)

### Color

| Token | Use |
|---|---|
| `Theme.Palette.brand` | The accent. Already set as the app-wide `.tint`, so plain buttons and toggles pick it up automatically. |
| `brandText` | Mint for **text and small glyphs** on page or glass backgrounds (≥ 4.5:1). Use this, not `brand`, for mint text. |
| `brandBright` | Glows, plus selected glyphs on dark surfaces. |
| `brandSecondary` | Blue. |
| `brandGradient` | Mint → teal → blue. For heroes and orbs only. |
| `bubbleGradient` | Outgoing message bubbles. |
| `success` | Green. |
| `warning` | Orange. |
| `danger` | Red. **Only** for hang-up, delete/remove, and failure or error states. |
| `info` | Blue. |
| `canvas` | Page base: near-black 0x050708 in dark, 0xF3F5F5 in light. |
| `surface`, `hairline` | Solid raised surface and separators. |
| `identity` | Avatar and icon-tile palette. It has no red or pink. |

### Layout and motion

| Token | Values |
|---|---|
| `Theme.Radius` | `sm` 12, `md` 18, `lg` 24, `xl` 30. Use these instead of literal corner radii. |
| `Theme.Space` | `xxs` 4, `xs` 8, `sm` 12, `md` 16, `lg` 24, `xl` 32. |
| `Theme.Motion` | `.snappy`, `.smooth`, `.bouncy`. |

Always gate animations on Reduce Motion:

```swift
@Environment(\.accessibilityReduceMotion) var reduceMotion
withAnimation(Theme.Motion.adaptive(Theme.Motion.bouncy, reduceMotion)) { ... }
```

### Store colors

- `store.tint` is the brand color. Prefer `Theme.Palette.brand` in new code.
- `store.profileColor` is the active account's identity color. Use it only for small markers: the account avatar and the switcher dot.
- Each number's `tint` stays as its identity dot.

### Fonts

- `.fontDesign(.rounded)` is applied at the root. Don't fight it.
- Use Dynamic Type styles (`.title2.weight(.bold)` and so on).
- Never use a fixed `.system(size:)` unless it is wrapped in `@ScaledMetric`.

## Components

### Existing components (`Dialbubble/DesignSystem/Components.swift`)

| Component | Notes |
|---|---|
| `relayBackground()` | Standard canvas plus a soft mint haze. The tint parameter is optional and defaults to brand. Pass a different tint only for the call screen's status glow. |
| `GlassCard(cornerRadius:tint:padding:) { }` | Default radius is `Theme.Radius.lg`. |
| `AvatarView(title:tint:size:)` | Use `AvatarView.color(for:)` for a stable person color. |
| `StatusPill`, `FromNumberPicker`, `ContactPickerButton`, `SectionHeader` | |

### New components (`Dialbubble/DesignSystem/Controls.swift`)

| Component | Notes |
|---|---|
| `PrimaryButton(title:symbol:isLoading:tint:action:)` | Full-width `.glassProminent` in brand. |
| `SecondaryButton(title:symbol:action:)` | Full-width `.glass`. |
| `.bottomCTA { ... }` | `safeAreaBar` at the bottom for primary and secondary buttons and a hint line. |
| `IconTile(symbol:color:size:)` | Tonal tile: colored glyph on a quiet tinted plate. Use a restrained palette (brandText, gray, semantic colors). |
| `ChipBar(items: [ChipItem<ID>], selection: $id)` | Morphing glass chips with a selection haptic and the `.isSelected` trait. `ChipItem` fields: `id`, `title`, `symbol`, `count`, `color`, `accessibilityID`. **Every chip copy in the app should use this.** |
| `ActionTile(title:symbol:color:accessibilityID:action:)` | Neutral glass quick-action tile with a mint glyph and a light haptic. Leave `color` at its default so a row of tiles stays uniform. |
| `Callout(style: .info/.tip/.warning/.success/.error, title:message:symbol:) { optional actions }` | |
| `Badge(text:color:symbol:)` | Small uppercase capsule ("Trial", "Demo", "Default"). |
| `SkeletonRows(count:showsAvatar:)` | Show while the first load is in flight. Never flash an empty state before data arrives. |
| `ToastCenter` | Global toasts. Use `@Environment(ToastCenter.self) var toast` and `toast.show("Saved", style: .success/.info/.warning/.error)`. It handles haptics and the VoiceOver announcement. Don't build local toasts. |

### Errors (`Dialbubble/Core/ErrorGuide.swift`)

- Build an error with `FriendlyError(error, context: .app | .onboarding)`.
- Show it with `FriendlyErrorView(error:retry:onDismiss:)`.
- `message` is our own wording. Raw Twilio text lives in `details` behind a "Technical details" disclosure.
- If your screen already shows a Retry button, pass `retry: nil` to the view so the action doesn't appear twice.

## Button roles

| Role | Style |
|---|---|
| Primary | `.glassProminent` with brand tint (or `PrimaryButton`) |
| Secondary | `.glass` |
| Destructive | `role: .destructive`, red. Only for hang-up and delete. |
| Neutral finish (Done, Close, Cancel) | `.glass`, never red |
| Call buttons | Brand mint. Hang-up is red. |

## Haptics

Use the `.sensoryFeedback` modifier.

- Error haptics must use the conditional form, so they don't fire when the error is cleared:
  ```swift
  .sensoryFeedback(.error, trigger: error) { _, new in new != nil }
  ```
- Add `.selection` for pickers and chips.
- Add `.success` for completed sends and saves.
- Add `.impact(weight: .light)` for primary taps where it is meaningful.

## Accessibility (required)

- **Reduce Motion:** no looping or decorative animation. Use `phaseAnimator`/`repeatForever` only when `!reduceMotion`.
- **Dynamic Type up to AX5:**
  - Horizontal rows that can crush need `ViewThatFits`, or must switch to a `VStack` when `dynamicTypeSize.isAccessibilitySize`.
  - Fixed frames and font sizes must be `@ScaledMetric`.
- **VoiceOver:**
  - Meaningful labels.
  - `.accessibilityElement(children: .contain)` on cards that have buttons. Never `.combine` there.
  - Announce async results.
- **Accessibility identifiers:** keep every existing one exactly. When you replace UI with shared components, pass the identifier through.

## Brand hygiene

- No `.pink` anywhere.
- No `.red` except danger cases.
- No red→pink gradients.
- Use `Theme.Palette.brand`/`brandGradient` for hero art.
- Neutral list rows use `IconTile` in brandText or gray. Use semantic colors only when they carry meaning. No rainbow sets.

## Calling

Two-way (Talk) calls ring your phone first. A voice asks you to press any key, and only then is the other person dialed (a `<Gather>` whose action is Twilio's Echo Twimlet, since there's no server). This can be turned off with the `relay.calls.confirmToConnect` setting.
