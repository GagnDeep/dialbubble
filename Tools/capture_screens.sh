#!/bin/bash
# Captures raw 6.9" screens (1320×2868) into marketing/raw and copies them to website/public/screens.
set -euo pipefail
cd "$(dirname "$0")/.."
SIM=0DC95AD1-6A74-4C74-B53D-5630AD968F4D   # iPhone 17 Pro Max
RESULT=build/screens.xcresult
xcrun simctl boot "$SIM" 2>/dev/null || true
xcrun simctl bootstatus "$SIM" -b >/dev/null
xcrun simctl status_bar "$SIM" override --time "9:41" --dataNetwork wifi --wifiMode active --wifiBars 3 --cellularMode active --cellularBars 4 --batteryState discharging --batteryLevel 100
/bin/rm -rf "$RESULT" marketing/raw/_export
xcodebuild -project Dialbubble.xcodeproj -scheme Dialbubble -destination "platform=iOS Simulator,id=$SIM" \
  -derivedDataPath build/sim -resultBundlePath "$RESULT" test \
  -only-testing:DialbubbleUITests/StoreScreenshotsUITests 2>&1 | grep -E "error:|Executed .* tests|TEST (SUCC|FAIL)|failed \(" | tail -8
mkdir -p marketing/raw website/public/screens
xcrun xcresulttool export attachments --path "$RESULT" --output-path marketing/raw/_export >/dev/null
python3 - <<'PY'
import json, shutil, os
m = json.load(open('marketing/raw/_export/manifest.json'))
n = 0
for t in m:
    for a in t.get('attachments', []):
        name = a['suggestedHumanReadableName'].split('_0_')[0]
        src = 'marketing/raw/_export/' + a['exportedFileName']
        shutil.copy(src, f'marketing/raw/{name}.png'); n += 1
print(n, 'screens')
PY
/bin/rm -rf marketing/raw/_export
/bin/cp marketing/raw/*.png website/public/screens/
sips -g pixelWidth -g pixelHeight marketing/raw/home-dark.png | tail -2
