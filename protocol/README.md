# The ROBOT-API, as code

A Robot posts JSON to one URL and the server answers. Every message is a single
named object — the name is the command, its contents are the parameters:

```json
{ "requestPing": { "MAC": "AA:BB:CC:00:11:22" } }
```

So the server is: read the name, look it up, answer.

## Three files

| | |
|---|---|
| `packets.js` | one entry per command, with a sentence saying what it is for and a function returning the answer |
| `index.js` | the dispatcher: reads the name, calls the entry, wraps the reply. 70 lines, and nothing about any particular command is in it |
| `state.js` | what the demo server remembers — terminals, people, pallet spaces. All invented, all in memory |

Adding a command means adding an entry to `packets.js`. Nothing else changes.

## An entry

```js
requestPing: {
  summary: 'The Robot checks the server is still there, every few seconds.',
  responseName: 'responsePong',
  reply: ({ MAC }, { robot }) => (robot ? ok({ MAC }) : null),
},
```

`reply` is given the packet's own contents and a context — the robot it came
from, and the server. It returns a plain object; the dispatcher wraps it in
`responseName`. Returning `null` says nothing at all, which is different from
saying it failed.

## Running it

```sh
npm install
npm run robot-server        # port 8086, or PORT=8499 npm run robot-server
```

`GET /` lists every command the server understands, generated from the same
table that implements them — so the list cannot describe a command the server
does not have. It also shows each configured Robot and what it has reported
about itself.

```sh
curl -s -X POST http://localhost:8086/robot/api/ \
  -H 'Content-Type: application/json' \
  -d '{"requestPing":{"MAC":"00:60:35:14:29:72"}}'
```

Which Robots exist comes from `config.json`. A Robot that is not in it is told
`DISABLED` rather than guessed at.

## Things it does on purpose

**An unrecognised card is an answer, not an error.** It is the commonest thing
that happens at a terminal, and a server that treats it as a fault teaches an
app to treat it as one too.

**A message with two commands in it is refused.** That is a bug at the other
end, and guessing which was meant is how a terminal does something nobody asked
for.

**A fault in one packet does not end the conversation.** The Robot will ask
again in a few seconds; a server that stops answering is harder to diagnose
than one that says what went wrong.

**A version that was not reported is left alone.** Absent means "not reported",
which is not the same as empty — writing an empty string over a known version
loses it.

The protocol itself is documented in [`../api/robot-api.md`](../api/robot-api.md),
with the packet shapes in [`../api/packet.json`](../api/packet.json).

(C) 2020-2026 Radical Electronic Systems - www.radsys.io
