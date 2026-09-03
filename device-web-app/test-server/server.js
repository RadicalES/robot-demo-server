/**
 * A transaction server, small enough to read in one sitting.
 *
 * A terminal posts what it captures to a "transaction URL" - a business system
 * that is neither the terminal nor the SCADA server. Writing an app against a
 * real one means waiting for somebody else's system to be ready, and debugging
 * two things at once. This is that system, reduced to what a terminal needs
 * from it: it accepts a sign-on, a scan and a weight, and answers.
 *
 *   npm run server            listens on 8099
 *   PORT=9000 npm run server
 *
 * Then set the terminal's Transaction URL to http://<this machine>:8099/ on
 * the Application page, and the app posts here.
 *
 * The endpoints are where TRANSACT-API puts them - /api/v1/transact/<name>/ -
 * because an app written against a different shape has to be rewritten before
 * it can talk to a real server, which is the opposite of what a template is
 * for. The terminal supplies the host; the path is the API\'s.
 *
 * It answers slowly enough to be visible (150ms) and refuses a card it does
 * not know, because an app that has only ever seen success handles failure the
 * first time in a packhouse.
 *
 * (C) 2017-2026 Radical Electronic Systems - www.radsys.io
 */
import express from 'express'
import { readFileSync, writeFileSync } from 'node:fs'

const app = express()
const PORT = Number(process.env.PORT || 8099)

app.use(express.json({ limit: '256kb' }))

// The terminal is on another machine, so the browser will ask first.
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Headers', 'Content-Type')
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

// The people this pretend system knows, and which card belongs to whom.
//
// Two lists, not one: a person exists whether or not they are carrying a card,
// and a card that is lost is reassigned rather than a person being invented.
// That is also why enrolling picks a person rather than typing a name - a
// system that makes a new person for every unknown card ends up with four of
// everybody.
//
// Cards enrolled while testing are kept in cards.json beside this file, so one
// enrolled at four o'clock still works after a restart. Delete it to start
// again.
const CARDS_FILE = new URL('./cards.json', import.meta.url)

const PEOPLE = [
  { employee: 'EMP005', name: 'Milton de Bruin' },
  { employee: 'EMP011', name: 'Sarah Adams' },
  { employee: 'EMP023', name: 'Johan Steyn' },
  { employee: 'EMP041', name: 'Thandi Nkosi' },
  { employee: 'EMP052', name: 'Pieter van Wyk' },
  { employee: 'EMP063', name: 'Nomsa Dlamini' },
  { employee: 'EMP074', name: 'Riaan Botha' },
  { employee: 'EMP085', name: 'Lerato Mokoena' },
  { employee: 'EMP096', name: 'Andre du Toit' },
  { employee: 'EMP107', name: 'Zanele Khumalo' },
]

// card number -> employee
const CARDS = { '8893004049623': 'EMP005', '1865530413': 'EMP011' }

try {
  Object.assign(CARDS, JSON.parse(readFileSync(CARDS_FILE, 'utf8')))
} catch { /* none enrolled yet */ }

function remember() {
  try {
    writeFileSync(CARDS_FILE, JSON.stringify(CARDS, null, 2) + '\n')
  } catch (e) {
    console.log(`  (could not save cards.json: ${e.message})`)
  }
}

const personOf = (card) => PEOPLE.find((p) => p.employee === CARDS[String(card || '').trim()])

const captured = []
const sessions = new Map()

const slow = (res, body, status = 200) =>
  setTimeout(() => res.status(status).json(body), 150)

app.post('/api/v1/transact/logon/', (req, res) => {
  const { card, terminal } = req.body || {}
  const person = personOf(card)
  if (!person) {
    // Logged, because "not known" is the first thing that happens when
    // somebody tries a real card, and the number is what they need in order to
    // add it. A refusal nobody can act on is just an obstacle.
    console.log(`logon   ${terminal || '?'}  REFUSED unknown card ${card}`)
    console.log(`        the app will offer to enrol it to somebody`)
    return slow(res, { status: 'REFUSED', message: `Card ${card} is not known here` }, 403)
  }
  sessions.set(terminal || 'unknown', person)
  console.log(`logon   ${terminal || '?'}  ${person.name} (${card})`)
  slow(res, { status: 'OK', operator: { ...person, card } })
})

// Who this system knows, for the page to choose from when a card is not
// recognised.
app.get('/api/v1/transact/people/', (req, res) => {
  res.json({
    status: 'OK',
    people: PEOPLE.map((p) => ({
      ...p,
      cards: Object.entries(CARDS).filter(([, e]) => e === p.employee).map(([c]) => c),
    })),
  })
})

// Enrolling a card.
//
// The first thing that happens with a real card is that nobody knows it, and
// the answer should not be "edit a file and restart the server". The card is
// given to somebody who already exists: a system that invents a person for
// every unknown card ends up with four of everybody.
//
// A real one would ask who is allowed to do this. This one takes anybody's
// word for it, which is most of the difference between a demonstration and a
// business system.
app.post('/api/v1/transact/enrol/', (req, res) => {
  const card = String((req.body || {}).card || '').trim()
  const employee = String((req.body || {}).employee || '').trim()
  const person = PEOPLE.find((p) => p.employee === employee)

  if (!card) return slow(res, { status: 'REFUSED', message: 'No card to enrol' }, 400)
  if (!person) return slow(res, { status: 'REFUSED', message: 'No such person' }, 404)

  const held = personOf(card)
  if (held) {
    return slow(res, { status: 'REFUSED', message: `That card is already ${held.name}` }, 409)
  }

  CARDS[card] = employee
  remember()
  console.log(`enrol   ${req.body.terminal || '?'}  ${card} -> ${person.name}`)
  slow(res, { status: 'OK', message: `Card enrolled to ${person.name}`, operator: { ...person, card } })
})

app.post('/api/v1/transact/logoff/', (req, res) => {
  const { terminal } = req.body || {}
  sessions.delete(terminal || 'unknown')
  console.log(`logoff  ${terminal || '?'}`)
  slow(res, { status: 'OK' })
})

app.post('/api/v1/transact/scan/', (req, res) => {
  const { barcode, terminal } = req.body || {}
  if (!sessions.has(terminal || 'unknown')) {
    return slow(res, { status: 'REFUSED', message: 'Nobody is signed on at this terminal' }, 409)
  }
  if (!barcode) {
    return slow(res, { status: 'REFUSED', message: 'No barcode in that scan' }, 400)
  }
  captured.push({ kind: 'scan', ...req.body })
  console.log(`scan    ${terminal || '?'}  ${barcode}`)
  slow(res, { status: 'OK', message: `Accepted ${barcode}`, barcode })
})

app.post('/api/v1/transact/scale/', (req, res) => {
  const { weight, units, barcode, terminal } = req.body || {}
  if (!sessions.has(terminal || 'unknown')) {
    return slow(res, { status: 'REFUSED', message: 'Nobody is signed on at this terminal' }, 409)
  }
  if (typeof weight !== 'number' || Number.isNaN(weight)) {
    return slow(res, { status: 'REFUSED', message: 'That is not a weight' }, 400)
  }
  // A limit, so there is something to see when a reading is wrong. A real
  // system's limits come from the product being weighed.
  if (weight <= 0 || weight > 1500) {
    return slow(res, { status: 'REFUSED', message: `${weight} ${units || ''} is outside what this station accepts` }, 422)
  }
  captured.push({ kind: 'weight', ...req.body })
  console.log(`weight  ${terminal || '?'}  ${weight} ${units || ''}${barcode ? '  ' + barcode : ''}`)
  slow(res, { status: 'OK', message: `Recorded ${weight} ${units || ''}`.trim(), weight })
})

// What it has been told, for looking at while testing.
app.get('/api/v1/transact/captured/', (req, res) => res.json({ status: 'OK', captured }))

app.get('/', (req, res) => {
  res.type('text/plain').send(
    [
      'Terminal test server',
      '',
      `listening on ${PORT}`,
      `signed on:   ${sessions.size}`,
      `captured:    ${captured.length}`,
      '',
      'POST /api/v1/transact/logon/   {card}',
      'GET  /api/v1/transact/people/',
      'POST /api/v1/transact/enrol/   {card, employee}',
      'POST /api/v1/transact/logoff/  {}',
      'POST /api/v1/transact/scan/    {barcode}',
      'POST /api/v1/transact/scale/   {weight, units, barcode}',
      'GET  /api/v1/transact/captured/',
      '',
      'Known cards:',
      ...PEOPLE.map((p) => {
        const cards = Object.entries(CARDS).filter(([, e]) => e === p.employee).map(([c]) => c)
        return `  ${p.employee}  ${p.name.padEnd(18)}${cards.join(', ') || '(no card)'}`
      }),
    ].join('\n'),
  )
})

const server = app.listen(PORT, () => {
  console.log(`Terminal test server on http://0.0.0.0:${PORT}`)
  console.log("Set that as the terminal's Transaction URL.")
})

// A port in use is the most likely way this fails, and a stack trace is a poor
// greeting for the first thing somebody runs. 8099 is a common choice for a
// transaction service, so on a machine that already has one this happens
// immediately - say what is wrong and how to move, rather than fourteen lines
// of node internals.
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\nPort ${PORT} is already in use on this machine.`)
    console.error(`Something else is listening there - often another transaction`)
    console.error(`service, or a second copy of this one.\n`)
    console.error(`  PORT=8399 npm run server\n`)
    console.error(`Then set the terminal's Transaction URL to that port too.`)
    process.exit(1)
  }
  if (e.code === 'EACCES') {
    console.error(`\nNot allowed to listen on port ${PORT}.`)
    console.error(`Ports below 1024 need root; pick a higher one:\n`)
    console.error(`  PORT=8399 npm run server`)
    process.exit(1)
  }
  throw e
})
