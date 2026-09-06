"""Scale protocols, as the scales themselves send them.

Ported from the Java scale emulator (RadicalES/scale-emulator), which is the
only written record of what these indicators actually put on the wire. The
frame layouts here are taken from its txWeight() methods rather than from a
datasheet, because the emulator is what was used to develop and test the
terminals against.

Each protocol turns a weight into the bytes a scale would send. That makes them
useful twice: to emulate a scale that is not on the bench, and to test the
parsers in wsScale against frames nobody hand-typed.

(C) 2017-2026 Radical Electronic Systems - www.radsys.io
"""

STX = 0x02
ETX = 0x03

GROSS = "G"
NETT = "N"


class Protocol:
    """A scale protocol: a name, and a way to render a reading as bytes."""

    name = "unnamed"
    #: How often the real indicator sends a frame, unprompted, in seconds.
    interval = 0.5

    def frame(self, weight, kind=NETT, units="kg"):
        raise NotImplementedError


class MicroA12e(Protocol):
    """W G/N, sign, six characters of weight, two of units, two of checksum.

        WN 500.10kg  \\r\\n

    The units field carries more than units: "OL" and "LO" are how this
    indicator reports overload and underload, which is why a reader cannot
    treat the field as decoration.
    """

    name = "MICRO-A12E"

    def frame(self, weight, kind=NETT, units="kg"):
        # Seven characters for the sign and the weight together, not a sign
        # plus six. The Java emulator wrote the sign at one position and six
        # characters after it, so anything over 999.99 ran into the units
        # field and produced a frame no reader accepts - which is why weights
        # above a tonne appeared to do nothing at all.
        value = f"{'-' if weight < 0 else ''}{abs(weight):2.2f}".rjust(7)
        return f"W{kind}{value}{units:<2}  \r\n".encode()


class XK3118T1(Protocol):
    """An equals sign, seven characters of sign and weight, units in brackets.

        =+0500.1(kg)\r\n

    The old Java emulator sent this model a Micro A12E frame instead. The two
    cannot both be right, and the T201 firmware - which has been reading real
    Keli indicators for years - expects the frame above, so that is what this
    sends. If a site ever turns up an XK3118T1 that speaks the other format,
    that is a new protocol and not a change to this one.

    It carries no status field whatever: no stability, no overload, not even
    gross against net. A frame that arrives is a good reading and that is all
    it will say, so `kind` is accepted and ignored.
    """

    name = "XK3118T1"

    def frame(self, weight, kind=NETT, units="kg"):
        sign = "-" if weight < 0 else "+"
        value = f"{abs(weight):06.1f}"[:6]
        return f"={sign}{value}({units:<2})\r\n".encode()


class Richter(Protocol):
    """Status and mode, then a signed weight.

        GS,NT,+  500.1kg\\r\\n

    Status is the pair this indicator leads with - "ST" stable, "US" unstable,
    "OL" overload - and it is the only one of these protocols that says whether
    the reading has settled, which is why it is worth having.
    """

    name = "RICHTER"

    #: What the indicator leads with. ST stable, US unstable, OL overload.
    STABLE, UNSTABLE, OVERLOAD = "ST", "US", "OL"
    #: Gross or net, in this protocol's own spelling.
    GROSS_MODE, NET_MODE = "GS", "NT"

    def frame(self, weight, kind=NETT, units="kg", status=STABLE, mode=None):
        if mode is None:
            mode = self.GROSS_MODE if kind == GROSS else self.NET_MODE
        sign = "-" if weight < 0 else "+"
        value = f"{abs(weight):2.1f}".rjust(7)
        return f"{status:<2},{mode:<2},{sign}{value}{units:<2}\r\n".encode()


class Massamatic(Protocol):
    """STX, sign, weight with a comma for a decimal point, units.

        <STX>+00500,1kg\\r\\n

    The comma is not a typo: this indicator is configured for a European
    decimal separator, and a parser that expects a point reads every weight as
    a whole number.
    """

    name = "MASSAMATIC"

    def frame(self, weight, kind=NETT, units="kg"):
        # The sign is always '+'. The firmware rejects a frame without one
        # there, so this indicator as fitted cannot report a negative weight -
        # sending one would be testing against a frame no terminal accepts.
        value = f"{abs(weight):.2f}".replace(".", ",").rjust(7, "0")[-7:]
        return bytes([STX]) + f"+{value}{units:<2}\r\n".encode()


class Rinstrum(Protocol):
    """STX, sign, weight, a status character, ETX.

        <STX> 500.1  G<ETX>

    Shorter than the others and framed by control characters rather than a line
    ending, so a reader that splits on newlines never sees a complete frame.
    """

    name = "RINSTRUM"

    #: The status character, which on this indicator carries more than the
    #: others': gross, net, and three ways for the reading to be no good.
    GROSS_STATUS, NET_STATUS = "G", "N"
    UNDERLOAD, OVERLOAD, MOTION, FAULT = "U", "O", "M", "E"

    def frame(self, weight, kind=NETT, units="kg", status=None):
        if status is None:
            status = self.GROSS_STATUS if kind == GROSS else self.NET_STATUS
        sign = "-" if weight < 0 else " "
        value = f"{abs(weight)}"[:7].rjust(7)
        return bytes([STX]) + f"{sign}{value}{status}".encode() + bytes([ETX])


ALL = [MicroA12e, XK3118T1, Richter, Massamatic, Rinstrum]


def by_name(name):
    """Finds a protocol by the name the SCADA server uses for it."""
    for protocol in ALL:
        if protocol.name.lower() == name.lower():
            return protocol()
    raise KeyError(f"unknown scale protocol {name!r}; "
                   f"known: {', '.join(p.name for p in ALL)}")
