#!/bin/bash
#
# scale.sh - start the scale emulator from scale.conf.
#
# The emulator takes a handful of flags and they are the same every time on a
# given bench, so they live in scale.conf and this turns them into a command.
# Anything passed here is appended, so it wins:
#
#   ./scale.sh                          # what scale.conf says
#   ./scale.sh --port /dev/ttyUSB2      # that port instead
#   ./scale.sh --ramp 0:1200:5          # climb to a tonne
#
# Run it in your own terminal rather than in the background: typing a weight
# and pressing enter is how the scale is driven, and that needs a keyboard on
# its stdin.
#
# (C) 2017-2026 Radical Electronic Systems - www.radsys.io

set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
CONF="${SCALE_CONF:-$DIR/scale.conf}"

PORT=""; PROTOCOL="MICRO-A12E"; WEIGHT=""; RAMP=""; KIND=""; UNITS=""
# shellcheck source=/dev/null
[ -r "$CONF" ] && . "$CONF"

ARGS=(--protocol "$PROTOCOL")
[ -n "$PORT" ]   && ARGS+=(--port "$PORT")
[ -n "$RAMP" ]   && ARGS+=(--ramp "$RAMP")
[ -z "$RAMP" ] && [ -n "$WEIGHT" ] && ARGS+=(--weight "$WEIGHT")
[ -n "$KIND" ]   && ARGS+=(--kind "$KIND")
[ -n "$UNITS" ]  && ARGS+=(--units "$UNITS")

# A port that is not there is the commonest way this fails, and python's error
# for it names errno rather than the cable.
if [ -n "$PORT" ] && [ ! -e "$PORT" ]; then
    echo "No such port: $PORT" >&2
    echo "" >&2
    echo "What this machine has:" >&2
    found=""
    for candidate in /dev/ttyUSB* /dev/ttyACM*; do
        [ -e "$candidate" ] || continue          # an unmatched glob is the pattern itself
        echo "  $candidate" >&2
        found=yes
    done
    [ -n "$found" ] || echo "  no USB serial ports at all" >&2
    echo "" >&2
    echo "Set PORT in $CONF, or leave it empty to run on a pty." >&2
    exit 1
fi

echo "scale: $PROTOCOL on ${PORT:-a new pty}${RAMP:+, ramping $RAMP}"
exec python3 "$DIR/emulate.py" "${ARGS[@]}" "$@"
