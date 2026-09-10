#!/usr/bin/env bash
#
# Start a new "family" – a build variant with its own name, icon/splash and
# Home greeting.
#
#   ./scripts/new-family.sh chi "Bé Chi Tập Tô"
#
# It copies a starter image to families/<key>.png and prints the entry to paste
# into the FAMILIES object in app.config.ts. Replace the image, edit the
# greeting, then:
#
#   ./scripts/build-ipa.sh chi
#
set -euo pipefail
cd "$(dirname "$0")/.."

RAW_KEY="${1:-}"
NAME="${2:-}"
if [[ -z "$RAW_KEY" || -z "$NAME" ]]; then
  echo "usage: ./scripts/new-family.sh <key> \"<App Name>\"" >&2
  exit 1
fi

KEY="$(printf '%s' "$RAW_KEY" | tr '[:upper:] _' '[:lower:]--' | tr -cd 'a-z0-9-')"
SUFFIX="$(printf '%s' "$KEY" | tr -cd 'a-z0-9')"
IMG="families/${KEY}.png"

if [[ -z "$SUFFIX" ]]; then
  echo "key must contain a letter or digit" >&2
  exit 1
fi
if [[ -e "$IMG" ]]; then
  echo "$IMG already exists" >&2
  exit 1
fi

cp assets/logo.png "$IMG"

cat <<EOF

▸ copied a starter image to  $IMG   (replace it with a 1024×1024 PNG)

▸ add this to the FAMILIES object in app.config.ts:

  ${KEY}: {
    name: '${NAME}',
    bundleId: 'com.davenguyenhuy.paint.${SUFFIX}',
    welcome: 'Chào ...!',
    image: './${IMG}',
  },

▸ then build:  ./scripts/build-ipa.sh ${KEY}
EOF
