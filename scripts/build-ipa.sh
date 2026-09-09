#!/usr/bin/env bash
#
# Builds an unsigned Release .ipa of Sam&Chi Painting.
# Install it on the iPad with AltStore / Sideloadly (they re-sign with your
# free Apple ID). Re-run this whenever you change the app.
#
#   ./scripts/build-ipa.sh
#   → ios/build/SamChiPainting.ipa
#
set -euo pipefail
cd "$(dirname "$0")/.."

SCHEME="SamChiPainting"
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

echo "▸ 1/4  Sync app.json → native project (prebuild --clean)…"
npx expo prebuild -p ios --clean

cd ios
ARCHIVE="build/${SCHEME}.xcarchive"
rm -rf "${ARCHIVE}" "build/Payload" "build/${SCHEME}.ipa"

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
( cd build && zip -qr "${SCHEME}.ipa" Payload )
rm -rf build/Payload

echo "▸ 4/4  Done."
ls -lh "build/${SCHEME}.ipa"
echo
echo "Next: open AltStore/Sideloadly → add  ios/build/${SCHEME}.ipa  → sign with your Apple ID."
