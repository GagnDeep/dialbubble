#!/bin/bash
# Archives a Release build and, with --upload, sends it to App Store Connect using the API key of the
# asc profile in appstore.json (cloud signing: no certificates or Xcode account login needed).
# Signing needs an unlocked login keychain in the *same* session (over SSH, run it inside the tmux session
# where you ran `security unlock-keychain`).
#   Tools/archive.sh            # archive + checks
#   Tools/archive.sh --upload   # archive, then upload to App Store Connect
set -euo pipefail
cd "$(dirname "$0")/.."
PROFILE=$(python3 -c "import json;print(json.load(open('appstore.json'))['profile'])")
read -r KEY_ID ISSUER KEY_PATH < <(python3 -c "import json,os;d=json.load(open(os.path.expanduser('~/.appstoreconnect/profiles/$PROFILE.meta.json')));print(d['key_id'],d['issuer_id'],os.path.expanduser(d['key_filepath']))")
AUTH=(-allowProvisioningUpdates -authenticationKeyPath "$KEY_PATH" -authenticationKeyID "$KEY_ID" -authenticationKeyIssuerID "$ISSUER")
BUILD=${BUILD:-$(date +%Y%m%d%H%M)}
ARCHIVE=build/Dialbubble.xcarchive
/bin/rm -rf "$ARCHIVE" build/export
xcodegen generate >/dev/null
xcodebuild -project Dialbubble.xcodeproj -scheme Dialbubble -configuration Release -destination 'generic/platform=iOS' \
  -archivePath "$ARCHIVE" CURRENT_PROJECT_VERSION="$BUILD" "${AUTH[@]}" archive > build/archive.log 2>&1 || { grep -E "error:|failed|FAILED" build/archive.log | head; echo "✗ archive failed (build/archive.log)"; exit 1; }
APP=$ARCHIVE/Products/Applications/Dialbubble.app
# Guards: screenshot hooks must be compiled out, and the privacy manifest must ship.
if strings -a "$APP/Dialbubble" | grep -q -- "-marketing"; then echo "✗ -marketing hook present in Release"; exit 1; fi
test -f "$APP/PrivacyInfo.xcprivacy"
echo "archived $(plutil -extract CFBundleIdentifier raw "$APP/Info.plist") $(plutil -extract CFBundleShortVersionString raw "$APP/Info.plist") ($BUILD)"
if [[ "${1:-}" == "--upload" ]]; then
  xcodebuild -exportArchive -archivePath "$ARCHIVE" -exportPath build/export \
    -exportOptionsPlist Tools/ExportOptions.plist "${AUTH[@]}" > build/export.log 2>&1 || { grep -iE "error|failed" build/export.log | head; echo "✗ export failed (build/export.log)"; exit 1; }
  grep -E "Upload succeeded|EXPORT SUCCEEDED|Progress 100" build/export.log | tail -2
fi
