# Robot Demonstration Web Application

A starting point for writing your own terminal application, and a test server
to point it at. It says so on its own screen, because it gets installed on real
terminals while somebody is learning and a demonstration that looks like the
production app is one somebody trusts with real work. Everything a terminal app does is here once — read a card, read
a barcode, read a scale, post to a business system, tell the operator what
happened — and nothing else is.

It runs with no hardware attached, because the first day of writing one of
these you have none on the desk.

## Try it

Two terminals:

```sh
npm install
npm run server        # the business system, on 8099
npm run dev           # the app, on 5173
```

If 8099 is already taken — it often is, a transaction service is a common thing
to have running — the server says so and suggests another:

```sh
PORT=8399 npm run server
```

Set the terminal's Transaction URL to whichever port you used.

Open the app, press **Pretend a card**, then **Pretend a scan** and **Pretend a
weight**. The server prints what it receives. `http://localhost:8099/` lists the
cards it knows and what it has been told.

## A scale, when there is no scale

`tools/scale-emulator/` streams the frames a real indicator sends, so the scale
screen has something to show on a bench with no weighbridge on it.

```sh
npm run scale                    # what tools/scale-emulator/scale.conf says
npm run scale -- --ramp 0:25:0.5 # anything you add wins over the file
```

`scale.conf` holds the port, the protocol and the starting weight, because
they are the same every time on a given bench:

```sh
PORT=/dev/ttyUSB0        # empty makes a pty instead - no hardware needed
PROTOCOL=MICRO-A12E
WEIGHT=0
RAMP=                    # LOW:HIGH:STEP to make it climb on its own
```

A port that is not there is the usual way this fails, so it lists the ports the
machine does have — by name and description — rather than passing on an errno.

**On Windows** it is the same command. `npm run scale` finds python (`py -3`,
then `python`), and the port in `scale.conf` is a COM port:

```sh
PORT=COM3
```

It needs pyserial: `py -m pip install -r tools/scale-emulator/requirements.txt`.
A virtual environment is honoured — an activated one first, then `.venv/` or
`venv/` in this repository, then the PATH. Windows' `py` launcher is tried
last, because it ignores a venv and preferring it is how a machine with a
working environment gets told pyserial is missing. Both launchers print which
python they used. Leaving `PORT` empty
makes a pty, which is Linux and macOS only — Windows has no such thing, and the
emulator says so rather than failing at import.

`scale.bat` in the repository root does the same from a double-click: it reads
`scale.conf`, finds python, and stops with a message you can read rather than a
window that closes. Or skip all of it and run the emulator directly, which is
the same program:

```
py tools\scale-emulator\emulate.py --protocol MICRO-A12E --port COM3
```

Run it in your own terminal: **type a weight, press enter, and that is what the
scale reads.** That is the whole interface, and it is why this is worth having
in front of an audience.

It speaks the protocols wsScale decodes — `MICRO-A12E` (the default here),
`RICHTER`, `XK3118T1`, `MASSAMATIC`, `RINSTRUM` — and `--kind G` sends gross
instead of nett. Needs `pyserial` for a real port &mdash; `tools/scale-emulator/requirements.txt`,
or `sudo apt install python3-serial`.

**Where to plug it in.** The emulator writes; the terminal's `wsScale` reads.
So the serial port you give it must be cabled to the port the terminal has its
scale on — or, with a loopback plug on the terminal's own connector, run the
emulator *on the terminal* against that same port and it comes straight back
in. Both were used to bring up a T430: the second proves the software without
proving the wiring.

A copy: the original is in `linux-tty-ws-server`, under
`test/scale-emulator/python`, where it is tested against the decoders it feeds.
If they ever disagree, that one is right.

## Put it on a terminal

```sh
npm run bundle        # → dist-bundle.tar.gz
```

Then on the terminal's web UI: **Application → Device Web App → Upload a
bundle**. The bundle carries `manifest.json`, so nothing has to be typed —
it says which app it is, which version, and which functions it supports.
Installed exactly as an app sent by a SCADA server is.

Set **Application → Transaction URL** to wherever this server runs
(`http://<your machine>:8099/`), and **Startup Application** to *Device Web
App*.

## Cards

The test server knows ten people and, to start with, two cards. Present a card
it does not know and the app offers to enrol it: choose whose it is, and it
signs them on. Enrolled cards are kept in `test-server/cards.json`, so one
enrolled at four o'clock still works after a restart — delete that file to
start again.

Enrolling picks somebody who already exists rather than typing a name. A system
that invents a person for every unknown card ends up with four of everybody.

A real system would ask who is allowed to enrol a card. This one takes
anybody's word for it, which is most of the difference between a demonstration
and a business system.

## Where the app posts

TRANSACT-API lives at a fixed path on whichever server the terminal was given:

```
<transaction URL>/api/v1/transact/logon/
                              .../scan/
                              .../scale/
```

The terminal supplies the host; the path belongs to the API. So the same app
talks to this test server or to a real SCADA server by changing one field on
the terminal.

One case is worth knowing about, because it produces a 404 that reads as the
endpoint not existing. A terminal's transaction URL is frequently the SCADA
endpoint itself — `http://host:8080/api/v1/scada/` — since that is what the
server records for the embedded-robot protocol. Joined naively that gives
`…/api/v1/scada/api/v1/transact/logon/`. `transactBase()` in `src/lib/post.js`
takes the origin of any URL that already carries an `/api/` path, and leaves a
bare host or a mount prefix alone:

```
http://host:8399/                ->  http://host:8399/api/v1/transact/logon/
http://host:8080/api/v1/scada/   ->  http://host:8080/api/v1/transact/logon/
http://host/mount/               ->  http://host/mount/api/v1/transact/logon/
```

## The whole thing

```
src/App.vue          the app - config, the three readers, the four posts
src/style.css        big text, big buttons, one screen at a time
manifest.js          what the bundle calls itself
test-server/         a business system to post to
tools/scale-emulator/  a scale, when there is no scale (scale.conf, scale.mjs)
```

`src/App.vue` is 150 lines including the screen. Read it top to bottom: it
loads the terminal's config, opens one websocket per device, and posts what it
reads. There is no framework of ours underneath it and nothing to trace
through.

This is a starting point, not our application. The device web app we ship does
sessions, operator input, labelling, offline queueing and a dozen screens - none
of which belongs in the first thing you read.

## How a terminal talks to this app

**Configuration** arrives in `/var/www/apps/config.json` on the terminal, which
the app reads as `../config.json` — one level up from the directory it is
served out of. The terminal writes it: `robot-scada-client` when a SCADA server
provisions the terminal, or the terminal's own web UI when it runs standalone.
The same file either way, so an app cannot tell which configured it.

### Where the config comes from

On the terminal:

```
/var/www/apps/                            served by nginx on 127.0.0.1:8081
├── config.json                           the file this app reads
├── device-webapp-template -> .versions/device-webapp-template/1.0.1
└── .versions/
    └── device-webapp-template/
        ├── 1.0.0/                        still here, and still selectable
        └── 1.0.1/  index.html  assets/  manifest.json
```

The app is served from `/<slug>/`, so `http://127.0.0.1:8081/device-webapp-template/`
fetches `http://127.0.0.1:8081/config.json` — the same file for every app on
the terminal, because a terminal is one thing however many apps it holds. That
is also why the bundle must not contain a `config.json` of its own: it would
sit one directory too deep, never be read, and look like it was.

Two other files behind it, if you are chasing a value that looks wrong:

```
/etc/robot/app.conf                       what the Application page saved
/etc/ttysocket/scale.conf                 what the Communications page saved
```

In development there is no terminal, so `npm run dev` reads `public/config.json`
from this repo instead. `manifest.js` deletes it from `dist/` at bundle time.

Press **Save Settings** on the terminal's **Application** page and `setapp.sh`
writes `/etc/robot/app.conf`, then calls `webapp-config config`, which writes
`config.json` through `robot-scada-client`'s own writer. That is deliberate: a
standalone terminal produces the same file, in the same shape, at the same
path, as one a SCADA server provisions.

What each field is set by:

| `config.json` | Set on | From |
|---|---|---|
| `name` | Application page | Tag Name — the terminal's hostname |
| `type` | Application page | Function — one of the app's `supports` |
| `protocol` | Application page | Protocol |
| `serverURL` | Application page | Server URL |
| `transactionURL` | Application page | Transaction URL, **or the Server URL when left empty** |
| `scale` | **Communications** page | the wsScale model, `TTYSCALE_MODEL` in `/etc/ttysocket/scale.conf` |
| `deviceWebAppVersion` | — | the version being served right now |
| `MAC`, `security`, `units`, `lowLimit`, `highLimit`, `signOn*`, `mqtt*` | — | a SCADA server only |

Two of those are worth knowing about before copying this app.

**An empty transaction URL means the server URL.** Most sites run one host, and
the terminal's browser has always read a blank that way. The app is handed the
resolved value, never an empty string, so it does not need the rule.

**The scale model is not the Application page's to set.** It belongs to the
bridge that reads the scale, on the Communications page. wsScale reads
`config.json` *after* `scale.conf` and the config wins, so a value published
here would silently override the page that owns it.

Nothing rereads the file. A terminal that is re-provisioned rewrites
`config.json` and the page picks it up on its next load — which is why
`deviceWebAppVersion` is in there: an app that watches it can notice it is a
version behind and reload itself.

**Devices** arrive over websockets on the terminal, one port per kind:

| Port | |
|---|---|
| 8100 | card reader |
| 8101 | scale |
| 8102 | barcode scanner |

They are bridged from serial by `wsRobot` and `wsScale`, configured on the
terminal's **Communications** page. A reader that is not set up never connects,
which is why the app shows what is connected rather than assuming.

A read may arrive tagged: `[CARD]:8893…` says what it is, `[0]8893…` says which
of two readers read it. `parseRead()` handles both. It also ignores anything
carrying spaces or angle brackets — a reader announces itself when its port is
opened, and `<ITPC200 READER 0, Version 1.3>` sent on as a credential reads as
a card that was refused.

## Things worth copying

**Nothing invents a URL.** An app that quietly posts to localhost because it
was not configured looks like it is working while the data goes nowhere. This
one says it has no transaction URL and stops.

**The failure path is written first.** The test server refuses an unknown card,
a scan with nobody signed on, and a weight outside its limits — because an app
that has only ever seen success handles failure for the first time in a
packhouse.

**A weight is taken, not streamed.** The scale sends a reading whenever there
is weight on it. Which of those readings is *the* reading is a person's
decision.

(C) 2012-2026 Radical Electronic Systems - www.radsys.io
