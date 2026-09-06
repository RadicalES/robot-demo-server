<script setup>
// A terminal app, in one file.
//
// A terminal does three things: somebody signs on with a card, something is
// scanned, something is weighed. Each reads a device and posts to a server.
// Copy this and change it.
//
// It works with nothing plugged in - the "pretend" buttons feed the same code
// a real reader does.

import { ref, computed, watch, onMounted } from 'vue'

const config = ref({ name: '', transactionURL: '', type: 'TERMINAL' })
const connected = ref({ CARD: false, SCALE: false, SCAN: false })

// Whether the last thing said to the server got through. Null until something
// has been tried - an unlit lamp is not a claim either way.
const online = ref(null)
const operator = ref(null)
const barcode = ref('')
const onScale = ref(null)      // the reading itself, or null for nothing on the scale
const scaleState = ref(null)   // what wsScale said about it: NORMAL, OVER, UNDER, UNSTABLE
const scaleUnits = ref('kg')
const message = ref('')
const failed = ref(false)

// What this terminal was set up as, from the Application page, and which
// screens that function needs. One bundle carries every function and a
// terminal shows only its own - a scale is not a label printer.
//
// One screen at a time, because the smallest panel in the family is 800x480
// and the browser's toolbar takes some of that: everything on one page either
// scrolls or shrinks to the point where nobody standing at arm's length can
// read it. When a function needs more than one screen there are buttons to
// move between them.
const SCREENS = {
  TERMINAL:   ['scan'],
  SCANNER:    ['scan'],
  DUALSCAN:   ['scan'],
  BINTIP:     ['scan'],
  FORKLIFT:   ['scan'],
  SCALE:      ['scan', 'scale'],
  LABELPRINT: ['scan', 'label'],
}
const TITLES = { scan: 'Scan', scale: 'Scale', label: 'Label' }

const screens = computed(() => SCREENS[config.value.type] || SCREENS.TERMINAL)
const screen = ref('scan')

// A terminal that changes function mid-shift should not be left looking at a
// screen its function no longer has.
watch(screens, (list) => { if (!list.includes(screen.value)) screen.value = list[0] })

const label = ref({ kind: 'PALLET', printed: '' })

// A card nobody knows, waiting to be given to somebody.
const unknownCard = ref('')
const people = ref([])
const chosen = ref('')

// The terminal writes config.json next to the app. We are served from /<app>/,
// so it is one level up.
async function loadConfig() {
  try {
    const response = await fetch('../config.json', { cache: 'no-cache' })
    config.value = await response.json()
  } catch {
    // Without it the app knows neither its name nor where to post. Say so:
    // this used to throw inside onMounted and leave a screen that looked
    // finished and did nothing.
    say('No config.json beside the app. This terminal has not been set up.', true)
  }
}

// TRANSACT-API is at /api/v1/transact/ on whichever host the terminal was
// given. If that URL already contains /api/ - it is often the SCADA endpoint,
// http://host:8080/api/v1/scada/ - take just the host, or the paths join into
// a 404.
function apiUrl(endpoint) {
  const given = config.value.transactionURL.replace(/\/+$/, '')
  const base = new URL(given).pathname.includes('/api/') ? new URL(given).origin : given
  return `${base}/api/v1/transact/${endpoint}/`
}

// Two different failures, told apart on purpose.
//
// A REFUSAL is the server answering: the card is unknown, the weight is out of
// range. The operator can do something about it.
//
// UNREACHABLE is the server not answering at all - stopped, the wrong port, a
// cable out. Nothing the operator does at the screen will help, and showing
// them a refusal reads as "your card is wrong" when the truth is that nobody
// asked. fetch() rejects for this, and it is the only failure that does.
async function call(endpoint, options) {
  let response
  try {
    response = await fetch(apiUrl(endpoint), options)
  } catch {
    online.value = false
    throw Object.assign(new Error(`Cannot reach the server at ${config.value.transactionURL}`),
                        { unreachable: true })
  }

  let answer
  try {
    answer = await response.json()
  } catch {
    // A reply that is not JSON is not this API - most often something else is
    // listening on that port, which looks like the server working until you
    // read what it said.
    online.value = false
    throw Object.assign(new Error(`${config.value.transactionURL} answered, but not with JSON - is that the transaction server?`),
                        { unreachable: true })
  }

  online.value = true
  if (!response.ok) throw new Error(answer.message)   // a refusal says why
  return answer
}

const get = (endpoint) => call(endpoint)

const post = (endpoint, body) => call(endpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ terminal: config.value.name, ...body }),
})

// One websocket per device. A device that is not fitted never connects, and
// one that is unplugged comes back on its own.
function listen(kind, port) {
  const socket = new WebSocket(`ws://localhost:${port}`)
  socket.onopen = () => (connected.value[kind] = true)
  socket.onmessage = (event) => read(kind, String(event.data).trim())
  socket.onclose = () => {
    connected.value[kind] = false
    setTimeout(() => listen(kind, port), 3000)
  }
}

async function read(kind, text) {
  // The scale is not a reader. wsScale decodes the indicator's protocol and
  // sends a JSON reading - weight, units, and whether it has settled - because
  // "11.5" on its own does not say whether the operator may act on it. The
  // other two send the characters they read.
  if (kind === 'SCALE') return readScale(text)

  // A reader may tag what it read - "[CARD]:8893..." - and says hello when its
  // port opens, which is not a card.
  const value = (/^\[[^\]]*\]:?\s*(.*)$/.exec(text) || [, text])[1]
  if (!value || /[\s<>]/.test(value)) return

  if (kind === 'CARD') return signOn(value)
  return scan(value)
}

// {"weight":11.000,"units":"kg","type":"N","status":"NORMAL","stable":true}
//
// status is NORMAL, OVER, UNDER or UNSTABLE; stable says the reading has
// settled. A weight nobody may act on is still worth showing - an operator
// watching a blank screen while the pallet swings does not know whether the
// scale is broken or just moving.
function readScale(text) {
  let reading
  try {
    reading = JSON.parse(text)
  } catch {
    return   // wsScale says hello when the socket opens; that is not a reading
  }
  if (typeof reading.weight !== 'number') return

  onScale.value = reading.weight
  scaleUnits.value = reading.units || 'kg'
  scaleState.value = reading.stable === false ? 'UNSTABLE' : (reading.status || 'NORMAL')
}

function say(text, isFailure = false) {
  message.value = text
  failed.value = isFailure
}

async function signOn(card) {
  try {
    operator.value = (await post('logon', { card })).operator
    unknownCard.value = ''
    say(`Signed on: ${operator.value.name}`)
  } catch (e) {
    // Only the server refusing means the card is unknown. This used to treat
    // every failure that way, so a stopped server told the operator their card
    // was not known - and then the fetch for the list of people failed too,
    // with nothing on the screen at all.
    if (e.unreachable) return say(e.message, true)

    // The commonest thing that happens with a real card is that nobody knows
    // it. Offer to give it to somebody rather than just saying no.
    try {
      people.value = (await get('people')).people
      unknownCard.value = card
      say(`Card ${card} is not known. Choose who it belongs to.`, true)
    } catch (listFailed) {
      say(listFailed.message, true)
    }
  }
}

// Give the unknown card to the person chosen, then sign them on with it.
async function enrol() {
  try {
    const answer = await post('enrol', { card: unknownCard.value, employee: chosen.value })
    say(answer.message)
    signOn(unknownCard.value)
  } catch (e) {
    say(`Could not enrol that card: ${e.message}`, true)
  }
}

async function scan(value) {
  if (!operator.value) return say('Present a card before scanning.', true)
  try {
    say((await post('scan', { barcode: value })).message)
    barcode.value = value
  } catch (e) {
    say(`Scan refused: ${e.message}`, true)
  }
}

// The scale sends a reading whenever there is weight on it. Which one counts
// is a person's decision, so it is a button.
async function record() {
  // Refused here rather than by the server: a reading that is still moving, or
  // over the indicator's range, is not a weight anybody should be recording,
  // and the operator finds that out faster from the screen in front of them.
  if (scaleState.value !== 'NORMAL') {
    return say(`The scale is ${(scaleState.value || 'not reading').toLowerCase()} - wait for a steady weight.`, true)
  }
  try {
    say((await post('scale', { weight: onScale.value, units: scaleUnits.value })).message)
  } catch (e) {
    say(`Weight refused: ${e.message}`, true)
  }
}

// Ask the server for a label and say what came back. A real terminal would
// send this to a printer; the demonstration shows the number it was given.
async function print() {
  try {
    const answer = await post('label', { kind: label.value.kind })
    label.value.printed = answer.label
    say(answer.message)
  } catch (e) {
    say(`Label refused: ${e.message}`, true)
  }
}

function signOff() {
  operator.value = null
  barcode.value = ''
  say('Signed off.')
}

onMounted(async () => {
  await loadConfig()
  listen('CARD', 8100)
  listen('SCALE', 8101)
  listen('SCAN', 8102)
})
</script>

<template>
  <div class="app">
    <header>
      <h1>{{ config.name || 'Terminal' }}</h1>
      <!-- Said on the screen, not just in the repository: this gets installed
           on real terminals while somebody is learning, and a demonstration
           that looks like the production app is one somebody trusts with real
           work. -->
      <p class="demo">Robot Demonstration Web Application</p>
      <!-- Named, not just coloured. A terminal has no pointer, so a tooltip is
           a label nobody can read, and "which dot is the scale" is not
           something to work out while the queue waits. -->
      <span class="lamps">
        <span class="lamp-item"><i class="lamp" :class="{ on: connected.CARD }"></i>card</span>
        <span class="lamp-item"><i class="lamp" :class="{ on: connected.SCAN }"></i>scanner</span>
        <span class="lamp-item"><i class="lamp" :class="{ on: connected.SCALE }"></i>scale</span>
        <span class="lamp-item"><i class="lamp" :class="{ on: online === true, unknown: online === null }"></i>server</span>
      </span>
    </header>

    <!-- Nobody signed on: the whole screen asks for a card. There is nothing
         else to do until somebody does, so there is nothing else on it. -->
    <main v-if="!operator" class="one">
      <section>
        <h2>Present your card</h2>
        <p class="big">{{ unknownCard ? 'Card ' + unknownCard + ' is not known' : 'Waiting for a card' }}</p>

        <!-- Enrolling picks somebody who already exists, rather than
             inventing a person per card. -->
        <div v-if="unknownCard" class="enrol">
          <select v-model="chosen">
            <option value="">choose a person</option>
            <option v-for="p in people" :key="p.employee" :value="p.employee">
              {{ p.name }} ({{ p.employee }})
            </option>
          </select>
          <button :disabled="!chosen" @click="enrol">Enrol this card</button>
        </div>

        <div class="actions">
          <button class="quiet" @click="signOn('8893004049623')">Pretend a card</button>
        </div>
      </section>
    </main>

    <!-- Signed on: who, where to go, and the way out. -->
    <template v-else>
      <nav>
        <span class="who">{{ operator.name }}</span>
        <button
          v-for="s in screens"
          :key="s"
          :class="{ here: screen === s }"
          @click="screen = s">{{ TITLES[s] }}</button>
        <button class="quiet" @click="signOff">Sign off</button>
      </nav>

      <main class="one">
        <section v-if="screen === 'scan'">
          <h2>Last scan</h2>
          <p class="big">{{ barcode || 'Nothing scanned' }}</p>
          <div class="actions">
            <button class="quiet" @click="scan('PALLET-4711')">Pretend a scan</button>
          </div>
        </section>

        <section v-if="screen === 'scale'">
          <h2>Weight</h2>
          <p class="big weight">
            {{ onScale === null ? 'Nothing on the scale' : onScale.toFixed(2) + ' ' + scaleUnits }}
            <span v-if="scaleState && scaleState !== 'NORMAL'" class="state">{{ scaleState.toLowerCase() }}</span>
          </p>
          <div class="actions">
            <button :disabled="onScale === null || scaleState !== 'NORMAL'" @click="record">Record this weight</button>
            <button class="quiet" @click="onScale = 18.4; scaleState = 'NORMAL'">Pretend a weight</button>
          </div>
        </section>

        <section v-if="screen === 'label'">
          <h2>Label</h2>
          <p class="big">{{ label.printed || 'Nothing printed' }}</p>
          <div class="actions">
            <select v-model="label.kind">
              <option value="PALLET">Pallet</option>
              <option value="CARTON">Carton</option>
              <option value="BIN">Bin</option>
            </select>
            <button @click="print">Print label</button>
          </div>
        </section>
      </main>
    </template>

    <p class="message" :class="{ bad: failed, ok: message && !failed }">{{ message || '&nbsp;' }}</p>
  </div>
</template>
