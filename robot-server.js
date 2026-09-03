/*
 * A ROBOT-API server, small enough to read.
 *
 * Robots post JSON to one URL and the server answers. That is the whole
 * protocol, so that is the whole server:
 *
 *     POST /robot/api/     everything a Robot sends
 *     GET  /              what this server understands
 *
 * The commands live in protocol/packets.js, one entry each. This file only
 * puts an HTTP server around them.
 *
 *   npm run robot-server
 *   PORT=8086 npm run robot-server
 *
 * (C) 2020-2026 Radical Electronic Systems - www.radsys.io
 */

'use strict'

const express = require('express')
const protocol = require('./protocol')
const { DemoServer } = require('./protocol/state')

let config = { robots: [] }
try {
  config = require('./config.json')
} catch {
  console.log('No config.json - starting with no Robots configured.')
}

const server = new DemoServer(config)
const app = express()
const PORT = Number(process.env.PORT || (config.server && config.server.port) || 8086)

app.use(express.json({ limit: '256kb' }))

// The Robots are on the packhouse floor and this is not, so the browser asks
// first when anything is opened from a laptop.
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

// One URL. The command is in the message, not in the path - which is what
// lets a Robot with one configured URL do everything it does.
app.post('/robot/api/', (req, res) => {
  const answer = protocol.handle(req.body, server)
  res.json(answer)
})

// What this server understands, from the same table that implements it - so
// the list cannot describe a command the server does not have.
app.get('/', (req, res) => {
  const rows = protocol
    .describe()
    .map((p) => `  ${p.name.padEnd(22)} -> ${(p.answers || '(nothing)').padEnd(22)} ${p.summary}`)

  res.type('text/plain').send(
    [
      `${server.name} ${server.version}`,
      '',
      `listening on ${PORT}`,
      `POST /robot/api/`,
      '',
      `Robots configured: ${server.robots.size}`,
      ...[...server.robots.values()].map(
        (r) =>
          `  ${r.mac}  ${(r.setup.name || '').padEnd(20)}` +
          `${Object.entries(r.versions).map(([k, v]) => `${k}=${v}`).join(' ') || '(nothing reported)'}`,
      ),
      '',
      'Commands:',
      ...rows,
    ].join('\n'),
  )
})

const listening = app.listen(PORT, () => {
  console.log(`${server.name} on http://0.0.0.0:${PORT}`)
  console.log(`POST /robot/api/  -  ${protocol.describe().length} commands`)
})

listening.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\nPort ${PORT} is already in use.\n\n  PORT=8086 npm run robot-server\n`)
    process.exit(1)
  }
  throw e
})
