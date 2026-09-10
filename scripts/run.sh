#!/usr/bin/env bash
#
# Prebuild + install a signed Release build straight onto an iPad over USB.
#
#   ./scripts/run.sh                    → base app, pick device from a list
#   ./scripts/run.sh mo                 → the "mo" family, its mapped device
#   ./scripts/run.sh mo "iPad của Mỡ"  → …override the device
#
# Switching family? This always runs `prebuild --clean`, so it's safe.
#
# Signing: `expo run:ios` auto-signs with your Apple account and creates a
# provisioning profile for each family's bundle id on the fly. Requirements:
#   • Xcode ▸ Settings ▸ Accounts — signed in to your Apple ID
#   • first build of a new family asks you to pick your team once, then remembers
#     it (writes ios.appleTeamId back into app.json)
#
set -euo pipefail
cd "$(dirname "$0")/.."

# Which iPad each family goes to. Leave a family out to get a device picker.
device_for() {
  case "$1" in
    default) echo "Bún" ;;
    # mo)    echo "iPad của Mỡ" ;;
    *)       echo "" ;;
  esac
}

FAMILY="${1:-default}"
DEVICE="${2:-$(device_for "$FAMILY")}"
export APP_FAMILY="$FAMILY"
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

echo "▸ family: ${FAMILY}   device: ${DEVICE:-<pick from list>}"
npx expo prebuild -p ios --clean

# Clear any team baked into the project so `expo run:ios` takes over signing —
# that's the only path where it passes -allowProvisioningUpdates and can mint a
# profile for a brand-new bundle id. It re-reads the team from app.json.
perl -i -pe 's/\bDEVELOPMENT_TEAM = "?[A-Za-z0-9]+"?;/DEVELOPMENT_TEAM = "";/g' \
  ios/*.xcodeproj/project.pbxproj

if [[ -n "$DEVICE" ]]; then
  npx expo run:ios --device "$DEVICE" --configuration Release
else
  npx expo run:ios --device --configuration Release
fi
