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
const path = require('path')
const fs = require('fs')
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
  res.json(protocol.handle(req.body, server))
})

// The same handler on the paths Robots were configured with years ago.
//
// The path never carried any meaning: a Robot posted to /scale.cgi and the
// server read the command out of the message anyway. They are mounted here so
// a Robot in a packhouse, holding a URL somebody typed into it once, keeps
// working - not because there is anything behind them.
for (const legacy of ['/setup.cgi', '/scale.cgi', '/term.cgi', '/scan.cgi',
                      '/label.cgi', '/forklift.cgi', '/forklift-sss.cgi']) {
  app.post(legacy, (req, res) => {
    res.json(protocol.handle(req.body, server))
  })
}

// What the dashboard reads. Three small answers rather than one big one, so a
// page can ask for the part that changes without re-reading the part that does
// not.
app.get('/api/robots', (req, res) => res.json({ robots: server.summary() }))
app.get('/api/commands', (req, res) => res.json({ commands: protocol.describe() }))
app.get('/api/recent', (req, res) => res.json({ recent: server.recent }))

// The dashboard itself, when it has been built. Without it the server still
// works and still answers Robots - a front end that has not been built is not
// a reason for a terminal to stop being able to sign somebody on.
const dashboard = path.join(__dirname, 'web', 'dist')
if (fs.existsSync(path.join(dashboard, 'index.html'))) {
  app.use(express.static(dashboard))
} else {
  console.log('No dashboard built (npm run web:build) - the API still works.')
}

// What this server understands, from the same table that implements it - so
// the list cannot describe a command the server does not have.
app.get('/plain', (req, res) => {
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
