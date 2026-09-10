#!/usr/bin/env bash
#
# Builds a Release Android .apk you can sideload onto any device.
# Signed with the local debug keystore (fine for sideloading, not for Play Store).
#
#   ./scripts/build-apk.sh          → base app        → dist/app.apk
#   ./scripts/build-apk.sh mo       → the "mo" family → dist/app-mo.apk
#
# Needs a JDK (17+) and the Android SDK on PATH (ANDROID_HOME). To install
# straight onto a plugged-in phone instead, use:  APP_FAMILY=mo npx expo run:android
#
set -euo pipefail
cd "$(dirname "$0")/.."

FAMILY="${1:-default}"
export APP_FAMILY="$FAMILY"
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

echo "▸ family: ${FAMILY}"
echo "▸ 1/3  prebuild --clean…"
npx expo prebuild -p android --clean

echo "▸ 2/3  gradlew assembleRelease…  (~10 min the first time)"
( cd android && ./gradlew assembleRelease )

echo "▸ 3/3  copying apk…"
mkdir -p dist
if [[ "$FAMILY" == "default" ]]; then DEST="dist/app.apk"; else DEST="dist/app-${FAMILY}.apk"; fi
cp android/app/build/outputs/apk/release/app-release.apk "$DEST"

echo "▸ done."
ls -lh "$DEST"
