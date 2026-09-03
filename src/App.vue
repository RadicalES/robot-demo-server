<script setup>
// A terminal app, in one file.
//
// A terminal does three things: somebody signs on with a card, something is
// scanned, something is weighed. Each reads a device and posts to a server.
// Copy this and change it.
//
// It works with nothing plugged in - the "pretend" buttons feed the same code
// a real reader does.

import { ref, onMounted } from 'vue'

const config = ref({ name: '', transactionURL: '' })
const connected = ref({ CARD: false, SCALE: false, SCAN: false })
const operator = ref(null)
const barcode = ref('')
const onScale = ref(null)
const message = ref('')
const failed = ref(false)

// A card nobody knows, waiting to be given to somebody.
const unknownCard = ref('')
const people = ref([])
const chosen = ref('')

// The terminal writes config.json next to the app. We are served from /<app>/,
// so it is one level up.
async function loadConfig() {
  const response = await fetch('../config.json', { cache: 'no-cache' })
  config.value = await response.json()
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

async function get(endpoint) {
  const response = await fetch(apiUrl(endpoint))
  return response.json()
}

async function post(endpoint, body) {
  const response = await fetch(apiUrl(endpoint), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ terminal: config.value.name, ...body }),
  })
  const answer = await response.json()
  if (!response.ok) throw new Error(answer.message)   // a refusal says why
  return answer
}

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
  // A reader may tag what it read - "[CARD]:8893..." - and says hello when its
  // port opens, which is not a card.
  const value = (/^\[[^\]]*\]:?\s*(.*)$/.exec(text) || [, text])[1]
  if (!value || /[\s<>]/.test(value)) return

  if (kind === 'SCALE') return (onScale.value = Number(value))
  if (kind === 'CARD') return signOn(value)
  return scan(value)
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
    // The commonest thing that happens with a real card is that nobody knows
    // it. Offer to give it to somebody rather than just saying no.
    unknownCard.value = card
    people.value = (await get('people')).people
    say(`Card ${card} is not known. Choose who it belongs to.`, true)
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
  try {
    say((await post('scale', { weight: onScale.value, units: 'kg' })).message)
  } catch (e) {
    say(`Weight refused: ${e.message}`, true)
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
    <!-- Said on the screen, not just in the repository: this gets installed on
         real terminals while somebody is learning, and a demonstration that
         looks like the production app is one somebody trusts with real work. -->
    <p class="demo">Robot Demonstration Web Application</p>

    <header>
      <h1>{{ config.name || 'Terminal' }}</h1>
      <span class="lamps">
        <i class="lamp" :class="{ on: connected.CARD }"></i> card
        <i class="lamp" :class="{ on: connected.SCAN }"></i> scanner
        <i class="lamp" :class="{ on: connected.SCALE }"></i> scale
      </span>
    </header>

    <section>
      <h2>Who is here</h2>
      <p class="big">{{ operator ? operator.name : 'Nobody signed on' }}</p>
      <button v-if="operator" @click="signOff">Sign off</button>
      <button v-else @click="signOn('8893004049623')">Pretend a card</button>

      <!-- Only after a card nobody knows. Enrolling picks somebody who already
           exists, rather than inventing a person per card. -->
      <div v-if="unknownCard && !operator" class="enrol">
        <p>Card {{ unknownCard }} belongs to:</p>
        <select v-model="chosen">
          <option value="">choose a person</option>
          <option v-for="p in people" :key="p.employee" :value="p.employee">
            {{ p.name }} ({{ p.employee }})
          </option>
        </select>
        <button :disabled="!chosen" @click="enrol">Enrol this card</button>
      </div>
    </section>

    <section>
      <h2>Last scan</h2>
      <p class="big">{{ barcode || 'Nothing scanned' }}</p>
      <button @click="scan('PALLET-4711')">Pretend a scan</button>
    </section>

    <section>
      <h2>Scale</h2>
      <p class="big">{{ onScale === null ? 'Nothing on the scale' : onScale + ' kg' }}</p>
      <button :disabled="onScale === null || !operator" @click="record">Record this weight</button>
      <button class="quiet" @click="onScale = 18.4">Pretend a weight</button>
    </section>

    <p v-if="message" :class="failed ? 'bad' : 'ok'">{{ message }}</p>
  </div>
</template>
