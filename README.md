# Robot demonstration server — TypeScript

A ROBOT-API server, written the way a real one should be: layered, typed, and
small enough to read in a sitting.

If you want the shortest possible working example, `master` has the same server
in plain JavaScript in four files. This one is the same protocol arranged for a
codebase that has to grow.

## Run it

```sh
npm install
npm run dev          # watch and restart, on 8086
npm start            # build, then run
npm run typecheck    # tsc --noEmit
```

```sh
curl -s -X POST http://localhost:8086/robot/api/ \
  -H 'Content-Type: application/json' \
  -d '{"requestPing":{"MAC":"E4:5F:01:50:EC:E0"}}'
```

## The layers

Each depends only on the ones below it. Nothing below knows how it is reached.

```
controllers/   HTTP. Turns a request into a call and a call into a response.
protocol/      The wire: what a packet looks like, and which handler answers it.
service/       The rules. Who may sign on, where a pallet goes.
repository/    Where things are kept, behind an interface.
domain/        What a Robot, a User and a Location are. Depends on nothing.
```

| File | |
|---|---|
| [`src/protocol/packets.ts`](src/protocol/packets.ts) | **start here.** One entry per command, with a sentence saying what it is for. This is the whole API surface. |
| [`src/protocol/messages.ts`](src/protocol/messages.ts) | the packet shapes on the wire |
| [`src/protocol/dispatcher.ts`](src/protocol/dispatcher.ts) | reads the name, calls the entry, wraps the reply |
| [`src/service/RobotService.ts`](src/service/RobotService.ts) | the rules, knowing nothing of HTTP |
| [`src/repository/RobotRepository.ts`](src/repository/RobotRepository.ts) | interfaces, and in-memory implementations of them |

Swapping the in-memory repositories for a database is a change in
[`src/index.ts`](src/index.ts), where they are constructed, and nowhere else.
That is the only reason to have a repository layer.

## Adding a command

```ts
requestPing: define<RequestPing>({
  summary: 'The Robot checks the server is still there, every few seconds.',
  responseName: 'responsePong',
  reply: (packet, { robot, service }) => {
    if (!robot) return null
    service.recordVersions(robot, versionsIn(packet))
    return ok({ MAC: packet.MAC })
  },
}),
```

`define<T>()` is where the packet's type is applied — the dispatcher only knows
it has *a* packet, the handler knows which one. Returning `null` answers
nothing at all, which is not the same as answering that it failed.

## Which URL

`POST /robot/api/`. The old `.cgi` paths answer identically, because the path
never carried any meaning: a Robot posted to `/scale.cgi` and the server read
the command out of the message anyway. They are mounted so a terminal holding a
URL somebody typed into it years ago keeps working.

## Which Robots

[`config/robots.json`](config/robots.json). A Robot that is not in it is told
`DISABLED` rather than guessed at — a terminal nobody has configured should not
be handed a configuration.

## Four things worth copying

**An unrecognised card is an answer, not an error.** The commonest thing that
happens at a terminal. A server that throws teaches every app built against it
to treat a stranger as a fault.

**A message with two commands is refused.** That is a bug at the other end, and
guessing which was meant is how a terminal does something nobody asked for.

**A fault in one packet does not end the conversation.** The Robot asks again in
a few seconds; a server that goes quiet is harder to diagnose than one that says
what went wrong.

**A version the Robot did not report is left alone.** Absent means "not
reported", which is not the same as empty — writing an empty string over a known
version loses it. `versionsIn()` exists because passing the whole packet
recorded the MAC as a version.

## The protocol

[`api/robot-api.md`](api/robot-api.md) describes every packet and when it is
sent; [`api/packet.json`](api/packet.json) is the same as machine-readable
shapes.

(C) 2020-2026 Radical Electronic Systems - www.radsys.io
