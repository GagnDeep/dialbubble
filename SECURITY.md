# Security policy

Dialbubble holds Twilio credentials that can spend money, so security reports are taken seriously.

## Reporting a vulnerability

**Please don't open a public issue.** Report it privately through GitHub:
[Report a vulnerability](https://github.com/GagnDeep/dialbubble/security/advisories/new).

Include the version (Settings › About), your iOS version, steps to reproduce and the impact you see. You'll get a reply within a few days, and a fix or a plan as soon as the issue is confirmed. Please give a reasonable time to ship a fix before disclosing it publicly.

Never include real Account SIDs, Auth Tokens, API Key secrets or phone numbers in a report. Redacted values are enough.

## Scope

- The iOS app in this repository (credential storage, network requests, local data, App Intents, URL handling)
- The website in `website/`

Twilio's own platform is out of scope; report those issues to Twilio.

## How Dialbubble protects credentials

- Secrets live only in the iOS Keychain with `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`, so they never sync or restore to another device.
- Requests go directly to `api.twilio.com` and `lookups.twilio.com` over TLS. There is no Dialbubble server.
- No analytics, crash reporting or third-party SDKs are included.
- An optional Face ID lock and an app-switcher privacy screen protect the open app.

If a device is lost or a credential may have leaked, revoke the API Key or rotate the Auth Token in the Twilio Console.
