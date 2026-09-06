#!/usr/bin/env python3
"""A scale, when there is no scale.

Streams frames the way a real indicator does - continuously, unprompted, at its
own pace - so wsScale and the pages above it can be developed and tested
without a weighbridge. The Java emulator this replaces needed a GUI, a serial
cable and a second machine; this needs a terminal.

    ./emulate.py --protocol MICRO-A12E --weight 500.1
    ./emulate.py --protocol RICHTER --ramp 0:1200:5 --port /dev/ttyUSB0

With no --port it opens a pty and prints its name, which is what the tests use
and what lets two of these run at once for a terminal with two scales.

While it runs, type a weight and press enter to change it. That is the whole
interface, and it is the one thing the Java version was really for.

A copy. The original lives in linux-tty-ws-server, under
test/scale-emulator/python, where it is tested against wsScale's decoders.
It is duplicated here so a demonstration needs one repository rather than two -
if the two ever disagree, that one is right.

(C) 2017-2026 Radical Electronic Systems - www.radsys.io
"""

import argparse
import os
import pty
import sys
import termios
import threading
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import scales


class Emulator:
    def __init__(self, protocol, fd, kind, units):
        self.protocol = protocol
        self.fd = fd
        self.kind = kind
        self.units = units
        self.weight = 0.0
        self.running = True
        self.sent = 0

    def send_forever(self):
        while self.running:
            try:
                os.write(self.fd, self.protocol.frame(self.weight, self.kind, self.units))
                self.sent += 1
            except OSError:
                # The other end went away - a terminal restarting its service,
                # usually. Keep going: a real scale does not stop streaming
                # because nobody is listening, and neither should this.
                pass
            time.sleep(self.protocol.interval)

    def ramp(self, low, high, step):
        """Walks the weight up and down, for watching a page under load."""
        value, direction = low, 1
        while self.running:
            self.weight = round(value, 3)
            value += step * direction
            if value >= high:
                value, direction = high, -1
            elif value <= low:
                value, direction = low, 1
            time.sleep(self.protocol.interval)


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--protocol", default="MICRO-A12E",
                        help="which indicator to be: " +
                             ", ".join(p.name for p in scales.ALL))
    parser.add_argument("--port", help="serial port to write to; a pty is made if omitted")
    parser.add_argument("--weight", type=float, default=0.0, help="the weight to report")
    parser.add_argument("--kind", default=scales.NETT, choices=[scales.GROSS, scales.NETT],
                        help="G gross or N net")
    parser.add_argument("--units", default="kg",
                        help='units as the indicator reports them, e.g. kg. '
                             'MICRO-A12E uses OL and LO for over and under load')
    parser.add_argument("--ramp", metavar="LOW:HIGH:STEP",
                        help="walk the weight up and down instead of holding it")
    parser.add_argument("--seconds", type=float,
                        help="stop after this long; runs until interrupted otherwise")
    args = parser.parse_args()

    protocol = scales.by_name(args.protocol)

    if args.port:
        fd = os.open(args.port, os.O_RDWR | os.O_NOCTTY)
        where = args.port
    else:
        fd, slave = pty.openpty()
        where = os.ttyname(slave)
        # Raw, or the pty echoes and mangles what a scale would send.
        attrs = termios.tcgetattr(fd)
        termios.tcsetattr(fd, termios.TCSANOW, attrs)

    emulator = Emulator(protocol, fd, args.kind, args.units)
    emulator.weight = args.weight

    print(f"{protocol.name} on {where}, every {protocol.interval}s", flush=True)
    print(f"  frame: {protocol.frame(args.weight, args.kind, args.units)!r}", flush=True)

    threading.Thread(target=emulator.send_forever, daemon=True).start()

    if args.ramp:
        low, high, step = (float(x) for x in args.ramp.split(":"))
        threading.Thread(target=emulator.ramp, args=(low, high, step), daemon=True).start()

    started = time.time()
    try:
        if args.seconds:
            time.sleep(args.seconds)
        elif not sys.stdin.isatty():
            # Started from a script or a service rather than a terminal: there
            # is nobody to type a weight, and reading stdin would hit EOF at
            # once and stop the emulator a frame after it started. Run until
            # killed instead, which is what a scale does.
            print("  no terminal on stdin - running until stopped", flush=True)
            while True:
                time.sleep(3600)
        else:
            print("  type a weight and press enter to change it; ctrl-c to stop",
                  flush=True)
            for line in sys.stdin:
                line = line.strip()
                if not line:
                    continue
                try:
                    emulator.weight = float(line)
                    print(f"  weight is now {emulator.weight}", flush=True)
                except ValueError:
                    print(f"  '{line}' is not a weight", flush=True)
    except KeyboardInterrupt:
        pass

    emulator.running = False
    print(f"  sent {emulator.sent} frames in {time.time() - started:.1f}s", flush=True)


if __name__ == "__main__":
    main()
