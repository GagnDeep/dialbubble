# Contributing to Dialbubble

Thanks for helping. Dialbubble is a small, focused app: a native iPhone client for your own Twilio account, with no server. Contributions that keep it fast, private and simple are the most welcome.

## Ground rules

- **No server, no tracking.** Don't add analytics, crash reporters, ad SDKs or any network destination other than Twilio. A feature that needs a backend is out of scope for the main app.
- **Credentials stay in the Keychain.** Never log, print, persist elsewhere or send secrets anywhere but Twilio.
- **Demo Mode must keep working** for every feature, since it's how people (and App Review) try the app.
- **Plain English.** User-facing text is short, friendly and specific. Explain errors with the fix.
- Never commit real Twilio credentials, phone numbers or `.p8` keys.

## Getting started

```bash
brew install xcodegen
xcodegen generate
open Dialbubble.xcodeproj
```

`project.yml` is the source of truth; the `.xcodeproj` is generated, so edit `project.yml` and rerun `xcodegen generate` for project changes. Set your own Team under Signing & Capabilities to run on a device.

Run with `-demo` to start in Demo Mode, and `-uiTestReset` to wipe all data.

## Before you open a pull request

1. Run the unit tests and UI walkthroughs:
   ```bash
   xcodebuild test -project Dialbubble.xcodeproj -scheme Dialbubble \
     -destination 'platform=iOS Simulator,name=iPhone 17 Pro'
   ```
2. Check your change in light and dark mode, with large Dynamic Type and with VoiceOver.
3. Keep the design consistent with [`docs/DESIGN.md`](docs/DESIGN.md) (use `Theme` tokens, not raw colors).
4. Describe what changed and why, with screenshots for UI changes.

## Website

The site in `website/` is a Next.js static export deployed to GitHub Pages. See [`website/CONTRIBUTING.md`](website/CONTRIBUTING.md).

## Reporting bugs

Open an [issue](https://github.com/GagnDeep/dialbubble/issues) with your iPhone model, iOS version, the app version and steps to reproduce. Issues are public: leave out credentials, phone numbers and message content. Security problems go through [SECURITY.md](SECURITY.md) instead.

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
