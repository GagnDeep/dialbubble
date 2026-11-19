#!/bin/bash
# Builds the website as static files and publishes them to the gh-pages branch (GitHub Pages, legacy source).
# Use this when GitHub Actions isn't available; .github/workflows/pages.yml does the same in CI.
#   Tools/publish_site.sh
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT=$PWD
(cd website && rm -rf out .next && NEXT_PUBLIC_BASE_PATH=/dialbubble pnpm build >/dev/null)
TMP=$(mktemp -d)
cp -R website/out/. "$TMP/"
touch "$TMP/.nojekyll"
cd "$TMP"
git init -q -b gh-pages
git add -A
git -c user.name="$(git -C "$ROOT" config user.name)" -c user.email="$(git -C "$ROOT" config user.email)" commit -q -m "Publish website $(date -u +%Y-%m-%dT%H:%MZ)"
git push -f -q "$(git -C "$ROOT" remote get-url origin)" gh-pages
rm -rf "$TMP"
echo "published to gh-pages"
