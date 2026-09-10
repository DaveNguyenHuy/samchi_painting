#!/usr/bin/env bash
#
# Builds an unsigned Release .ipa.
# Install it on the iPad with AltStore / Sideloadly (they re-sign with your
# free Apple ID). Re-run this whenever you change the app.
#
#   ./scripts/build-ipa.sh              → the base app (app.json)
#   ./scripts/build-ipa.sh chi          → the "chi" family
#   → ios/build/<Scheme>[-<family>].ipa
#
# Add a family first with:  ./scripts/new-family.sh chi "Bé Chi Tập Tô"
#
set -euo pipefail
cd "$(dirname "$0")/.."

FAMILY="${1:-default}"
export APP_FAMILY="$FAMILY"
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

echo "▸ family: ${FAMILY}"

echo "▸ 1/4  Sync app config → native project (prebuild --clean)…"
npx expo prebuild -p ios --clean

cd ios
# prebuild names the Xcode project after expo.name, which changes per family.
SCHEME="$(basename "$(ls -d ./*.xcworkspace | head -1)" .xcworkspace)"
echo "▸ scheme: ${SCHEME}"

ARCHIVE="build/${SCHEME}.xcarchive"
if [[ "$FAMILY" == "default" ]]; then IPA="${SCHEME}.ipa"; else IPA="${SCHEME}-${FAMILY}.ipa"; fi
rm -rf "${ARCHIVE}" "build/Payload" "build/${IPA}"

echo "▸ 2/4  Archiving Release (unsigned)…  (~10 min the first time)"
xcodebuild \
  -workspace "${SCHEME}.xcworkspace" \
  -scheme "${SCHEME}" \
  -configuration Release \
  -sdk iphoneos \
  -archivePath "${ARCHIVE}" \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  archive

echo "▸ 3/4  Packaging .ipa…"
mkdir -p build/Payload
cp -R "${ARCHIVE}/Products/Applications/${SCHEME}.app" build/Payload/
( cd build && zip -qr "${IPA}" Payload )
rm -rf build/Payload

echo "▸ 4/4  Done."
ls -lh "build/${IPA}"
echo
echo "Next: open AltStore/Sideloadly → add  ios/build/${IPA}  → sign with your Apple ID."
