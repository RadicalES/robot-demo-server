/*
 * What the demo server remembers.
 *
 * Everything is in memory and invented. A real server has a database, people
 * who exist, and pallets that are somewhere - this has enough of each to show
 * a terminal working, and loses all of it when you stop the process.
 *
 * Kept apart from the packets so that reading the protocol does not mean
 * reading a store as well.
 *
 * (C) 2020-2026 Radical Electronic Systems - www.radsys.io
 */

'use strict'

class DemoServer {
  constructor(config = {}) {
    this.name = 'Robot Demonstration Server'
    this.version = '2.0.0'

    // The terminals this server knows, by MAC. A Robot that is not here is
    // told DISABLED rather than guessed at.
    this.robots = new Map()
    for (const entry of config.robots || []) {
      this.robots.set(normalise(entry.macAddress), {
        mac: normalise(entry.macAddress),
        setup: {
          name: entry.tagName,
          type: entry.type,
          protocol: entry.protocol,
          message: entry.message,
          security: entry.security || 'OPEN',
          ...(entry.config || {}),
        },
        // Filled in from what the terminal reports about itself.
        versions: {},
        operator: null,
      })
    }

    this.people = [
      { userid: 'EMP005', code: '8893004049623', name: 'Milton de Bruin' },
      { userid: 'EMP011', code: '1865530413', name: 'Sarah Adams' },
      { userid: 'EMP023', code: '1234', name: 'Johan Steyn' },
    ]

    // Somewhere to put pallets: a name, and what is in it.
    this.locations = new Map(['A01', 'A02', 'A03', 'B01', 'B02'].map((n) => [n, null]))

    this.rpcs = {
      reboot: (mac) => ({ status: 'OK', message: `${mac} would reboot` }),
      identify: (mac) => ({ status: 'OK', message: `${mac} would flash its LEDs` }),
    }

    this.sessions = 0
  }

  log(line) {
    console.log(`${new Date().toTimeString().slice(0, 8)}  ${line}`)
  }

  findRobot(mac) {
    return mac ? this.robots.get(normalise(mac)) : undefined
  }

  newSession() {
    this.sessions += 1
    return this.sessions.toString(16).padStart(16, '0')
  }

  // What the terminal says it is running. A field that was not sent is left
  // alone: absent means "not reported", and writing an empty string over a
  // known version loses it.
  recordVersions(robot, reported) {
    for (const [field, value] of Object.entries(reported)) {
      if (value === undefined || value === null || value === '') continue
      if (robot.versions[field] !== value) {
        this.log(`version ${robot.mac}  ${field} = ${value}`)
      }
      robot.versions[field] = value
    }
  }

  findUser(code) {
    return this.people.find((p) => p.code === String(code || '').trim())
  }

  signOn(mac, user) {
    const robot = this.findRobot(mac)
    if (robot) robot.operator = user
    this.log(`logon   ${mac}  ${user.name}`)
  }

  signOff(mac) {
    const robot = this.findRobot(mac)
    if (robot) robot.operator = null
    this.log(`logoff  ${mac}`)
  }

  findSpaceFor(barcode) {
    for (const [name, held] of this.locations) {
      if (held === null) {
        this.locations.set(name, barcode)
        this.log(`store   ${barcode} -> ${name}`)
        return name
      }
    }
    return null
  }

  movePallet(barcode, location) {
    if (!this.locations.has(location) || this.locations.get(location) !== null) return false
    for (const [name, held] of this.locations) {
      if (held === barcode) this.locations.set(name, null)
    }
    this.locations.set(location, barcode)
    this.log(`move    ${barcode} -> ${location}`)
    return true
  }

  rpcNames() {
    return Object.keys(this.rpcs)
  }

  runRpc(mac, name, params) {
    const rpc = this.rpcs[name]
    if (!rpc) return { MAC: mac, status: 'FAILED', message: `No such RPC: ${name}` }
    return { MAC: mac, ...rpc(mac, params) }
  }
}

// Robots are configured with colons and report without them, or the other way
// about, depending on the firmware. One spelling here or every lookup misses.
const normalise = (mac) => String(mac || '').toUpperCase().replace(/[^0-9A-F]/g, '')

module.exports = { DemoServer }
