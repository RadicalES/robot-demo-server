<script setup>
// The server, watched.
//
// Three things worth seeing while demonstrating a Robot: which terminals the
// server knows and what they have reported about themselves, what the protocol
// can be asked to do, and what has just been said. All three come from the
// server, so the page cannot describe a command that is not implemented or a
// terminal that is not configured.

import { ref, onMounted, onUnmounted } from 'vue'

const robots = ref([])
const commands = ref([])
const recent = ref([])
const reachable = ref(true)

async function load(what, into) {
  try {
    const response = await fetch(`/api/${what}`, { cache: 'no-cache' })
    into.value = (await response.json())[what === 'recent' ? 'recent' : what]
    reachable.value = true
  } catch {
    reachable.value = false
  }
}

// The traffic changes constantly and the command list never does, so they are
// not asked for at the same rate.
let ticker
onMounted(() => {
  load('commands', commands)
  const poll = () => { load('robots', robots); load('recent', recent) }
  poll()
  ticker = setInterval(poll, 2000)
})
onUnmounted(() => clearInterval(ticker))

const versionsOf = (r) =>
  Object.entries(r.versions || {}).map(([k, v]) => `${k} ${v}`).join('  ')
</script>

<template>
  <div class="page">
    <header>
      <h1>Robot Demonstration Server</h1>
      <span class="state" :class="{ bad: !reachable }">
        {{ reachable ? 'listening' : 'not reachable' }}
      </span>
    </header>

    <section>
      <h2>Terminals</h2>
      <p class="hint">
        Configured in <code>config.json</code>. A Robot that is not here is told
        DISABLED rather than guessed at.
      </p>
      <table>
        <tr v-for="r in robots" :key="r.mac">
          <td class="mac">{{ r.mac }}</td>
          <td>{{ r.name }}</td>
          <td class="quiet">{{ r.type }}</td>
          <td class="quiet">{{ versionsOf(r) || 'nothing reported' }}</td>
          <td>{{ r.operator || '' }}</td>
        </tr>
        <tr v-if="!robots.length"><td colspan="5" class="quiet">none configured</td></tr>
      </table>
    </section>

    <section>
      <h2>What it understands</h2>
      <p class="hint">
        Generated from the table that implements the protocol, so it cannot list
        a command the server does not have.
      </p>
      <table>
        <tr v-for="c in commands" :key="c.name">
          <td class="cmd">{{ c.name }}</td>
          <td class="quiet">&rarr; {{ c.answers || 'nothing' }}</td>
          <td>{{ c.summary }}</td>
        </tr>
      </table>
    </section>

    <section>
      <h2>Just now</h2>
      <div v-if="!recent.length" class="quiet">nothing yet</div>
      <div v-for="(line, i) in recent" :key="i" class="line">
        <span class="quiet">{{ line.at }}</span> {{ line.line }}
      </div>
    </section>
  </div>
</template>
