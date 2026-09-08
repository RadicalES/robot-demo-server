#!/bin/bash
#
# publish2cdn.sh - build this web app and put it on the CDN.
#
# One command, because the alternative is three in two repositories and a
# search through the notes for which they were:
#
#   ./publish2cdn.sh              build, stage, show what would upload, ask
#   ./publish2cdn.sh --yes        no question - for a script calling this
#   ./publish2cdn.sh --stage-only build and stage, upload nothing
#
# What it does:
#   npm run bundle                     -> dist-bundle.tar.gz
#   publish-webapp.sh <bundle>         -> private/robots/webapps/ + catalogue
#   sync-to-r2.sh --live               -> cdn.radsys.io
#
# The bundle names itself. Slug and version come from the manifest.json inside
# it, so bump the version in package.json before publishing or this replaces
# the version that is already there.
#
# Env:
#   PACKAGE_REPO   the package repository checkout
#                  (default: ~/data/package-repository)
#
# (C) 2017-2026 Radical Electronic Systems - www.radsys.io

set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
PACKAGE_REPO="${PACKAGE_REPO:-$HOME/data/package-repository}"
BUNDLE="$HERE/dist-bundle.tar.gz"

ASK=yes
UPLOAD=yes
for arg in "$@"; do
    case "$arg" in
        --yes|-y)     ASK=no ;;
        --stage-only) UPLOAD=no ;;
        -h|--help)    sed -n '2,26p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
        *) echo "Unknown option: $arg" >&2; exit 2 ;;
    esac
done

if [ ! -x "$PACKAGE_REPO/scripts/publish-webapp.sh" ]; then
    echo "No package repository at $PACKAGE_REPO" >&2
    echo "Clone it, or point PACKAGE_REPO at it:" >&2
    echo "  PACKAGE_REPO=/path/to/package-repository $0" >&2
    exit 1
fi

echo "=== [1/3] Building the bundle ==="
( cd "$HERE" && npm run bundle )
[ -f "$BUNDLE" ] || { echo "npm run bundle produced no $BUNDLE" >&2; exit 1; }

# Say what is about to be published, from the bundle itself - the version in
# package.json is only what it was built from, and this is what a terminal sees.
tar xzOf "$BUNDLE" ./manifest.json 2>/dev/null | python3 -c '
import json, sys
doc = json.load(sys.stdin)
supports = ", ".join(doc.get("supports") or []) or "nothing declared"
print("  {} {} - {}".format(doc["slug"], doc["version"], doc.get("name", "")))
print("  supports: " + supports)
' || echo "  (this bundle carries no manifest.json - it will be refused)"

echo "=== [2/3] Staging in the package repository ==="
"$PACKAGE_REPO/scripts/publish-webapp.sh" "$BUNDLE"

if [ "$UPLOAD" = "no" ]; then
    echo ""
    echo "Staged, not uploaded. Publish with:"
    echo "  cd $PACKAGE_REPO && ./scripts/sync-to-r2.sh --live"
    exit 0
fi

echo "=== [3/3] Publishing ==="
( cd "$PACKAGE_REPO" && ./scripts/sync-to-r2.sh 2>&1 | grep -iE "webapps/" || true )

if [ "$ASK" = "yes" ]; then
    printf "Upload the above to cdn.radsys.io? [y/N] "
    read -r answer </dev/tty
    case "$answer" in
        y|Y|yes|YES) ;;
        *) echo "Left staged. Nothing uploaded."; exit 0 ;;
    esac
fi

( cd "$PACKAGE_REPO" && ./scripts/sync-to-r2.sh --live >/dev/null 2>&1 ) && echo "  uploaded"

echo ""
echo "=== On the CDN ==="
curl -fsSL --max-time 30 https://cdn.radsys.io/private/robots/webapps/catalogue.json |
    python3 -c '
import json, sys
for app in json.load(sys.stdin)["apps"]:
    print(f"  {app[\"slug\"]:26} {app[\"version\"]:9} {app[\"size\"]//1024:>4} KB")
' || echo "  (could not read the catalogue back)"
