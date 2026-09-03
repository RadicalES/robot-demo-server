/*
 * The ROBOT-API, as a table.
 *
 * Every message is one JSON object with a single named key. The name is the
 * command; its contents are the parameters:
 *
 *     { "requestPing": { "MAC": "AA:BB:CC:00:11:22" } }
 *
 * So the whole protocol is: read the name, look it up here, answer. That is
 * what this file is - one entry per packet a Robot can send, in the order the
 * document describes them. Adding a packet means adding an entry, and nothing
 * else.
 *
 * Each entry has:
 *
 *   summary   what the packet is for, in a sentence
 *   reply     what to send back, or null to say nothing
 *
 * A reply is given the packet's own contents and a context: the robot this
 * came from, and the server's state. It returns a plain object, and the
 * dispatcher wraps it in its response name.
 *
 * (C) 2020-2026 Radical Electronic Systems - www.radsys.io
 */

'use strict'

// Reply helpers, so an entry says what it means rather than how to spell it.
const ok = (fields = {}) => ({ status: 'OK', ...fields })
const nothing = () => null

module.exports = {

  // -------------------------------------------------------------------------
  // Keeping in touch
  // -------------------------------------------------------------------------

  requestPing: {
    summary: 'The Robot checks the server is still there, every few seconds.',
    responseName: 'responsePong',
    reply: ({ MAC }, { robot }) => (robot ? ok({ MAC }) : null),
  },

  requestDateTime: {
    summary: 'The Robot has no clock of its own and asks for the time.',
    responseName: 'responseDateTime',
    reply: ({ MAC }) => {
      const now = new Date()
      return ok({
        MAC,
        date: now.toISOString().slice(0, 10),
        time: now.toTimeString().slice(0, 8),
      })
    },
  },

  requestInformation: {
    summary: 'What the server is, for a person looking at a terminal.',
    responseName: 'responseInformation',
    reply: ({ MAC }, { server }) => ok({ MAC, name: server.name, version: server.version }),
  },

  // -------------------------------------------------------------------------
  // Becoming a terminal
  // -------------------------------------------------------------------------

  requestSetup: {
    summary:
      'A Robot asks what it is. Sent on boot, and again whenever it has lost ' +
      'the answer. Everything except MAC is optional: an embedded Robot sends ' +
      'what it always sent, and a Linux terminal also says what it is running.',
    responseName: 'responseSetup',
    reply: (packet, { robot, server }) => {
      if (!robot) {
        // A Robot the server has never been told about. Answering DISABLED is
        // the honest reply: it exists, and nobody has said what it should do.
        return { MAC: packet.MAC, status: 'DISABLED', message: 'Not configured' }
      }

      // What the terminal reports it is running. Absent means "not reported",
      // which is not the same as empty - so a field that is not sent leaves
      // the last known version alone rather than erasing it.
      server.recordVersions(robot, {
        firmware: packet.firmware,
        deviceWebApp: packet.deviceWebApp,
        rootfs: packet.rootfs,
      })

      return { MAC: packet.MAC, status: 'ENABLED', session: server.newSession(), ...robot.setup }
    },
  },

  // -------------------------------------------------------------------------
  // What the Robot has to say
  //
  // A publish is the Robot telling the server something happened. The server
  // acknowledges; it does not reply with a command.
  // -------------------------------------------------------------------------

  publishStatus: {
    summary: 'READY or not, sent when the Robot has finished starting up.',
    responseName: 'responseStatus',
    reply: ({ MAC, status }, { server }) => {
      server.log(`status  ${MAC}  ${status}`)
      return ok({ MAC })
    },
  },

  publishLogon: {
    summary: 'Somebody presented a card, a badge or a code.',
    responseName: 'responseUser',
    reply: ({ MAC, code }, { server }) => {
      const user = server.findUser(code)
      // An unrecognised card is an answer, not a fault: it is the commonest
      // thing that happens at a terminal.
      if (!user) return { MAC, status: 'FAILED', message: 'Card not recognised' }
      server.signOn(MAC, user)
      return ok({ MAC, name: user.name, userid: user.userid })
    },
  },

  publishLogoff: {
    summary: 'The operator signed off, or was signed off by a timeout.',
    responseName: 'responseUser',
    reply: ({ MAC }, { server }) => {
      server.signOff(MAC)
      return ok({ MAC })
    },
  },

  publishBarcodeScan: {
    summary: 'A barcode was scanned. Which scanner, when a Robot has two, is in the packet.',
    responseName: 'responseStation',
    reply: ({ MAC, barcode }, { server }) => {
      server.log(`scan    ${MAC}  ${barcode}`)
      return ok({ MAC, LCD1: 'Scanned', LCD2: barcode })
    },
  },

  publishScaleWeight: {
    summary: 'A weight was taken. The Robot decides when a reading is the reading.',
    responseName: 'responseStation',
    reply: ({ MAC, barcode, weight, units }, { server }) => {
      server.log(`weight  ${MAC}  ${weight}${units || ''}  ${barcode || ''}`)
      return ok({ MAC, LCD1: 'Weight recorded', LCD2: `${weight} ${units || ''}`.trim() })
    },
  },

  publishButton: {
    summary: 'A button on the Robot was pressed.',
    responseName: 'responseStation',
    reply: ({ MAC, button }, { server }) => {
      server.log(`button  ${MAC}  ${button}`)
      return ok({ MAC, LCD1: `Button ${button}` })
    },
  },

  publishKeypadCode: {
    summary: 'A code was keyed in.',
    responseName: 'responseKeypad',
    reply: ({ MAC, code }) => ok({ MAC, LCD1: 'Code accepted', code }),
  },

  publishPrintLabel: {
    summary: 'A label was printed, and this is what was on it.',
    responseName: 'responseStation',
    reply: ({ MAC, barcode }, { server }) => {
      server.log(`label   ${MAC}  ${barcode}`)
      return ok({ MAC, LCD1: 'Label printed' })
    },
  },

  publishRootfsUpdate: {
    summary:
      'The terminal answering a release install: STARTED, or REFUSED with a ' +
      'reason. A courtesy - what settles which release a terminal is on is ' +
      'the rootfs field in its next requestSetup, after the reboot.',
    responseName: 'responseStatus',
    reply: ({ MAC, manifest, status, reason }, { server }) => {
      server.log(`rootfs  ${MAC}  ${manifest} ${status}${reason ? '  ' + reason : ''}`)
      return ok({ MAC })
    },
  },

  // -------------------------------------------------------------------------
  // Asking the server for something
  // -------------------------------------------------------------------------

  requestPalletStore: {
    summary: 'Where should this pallet go?',
    responseName: 'responseStation',
    reply: ({ MAC, barcode }, { server }) => {
      const location = server.findSpaceFor(barcode)
      if (!location) return { MAC, status: 'FAILED', message: 'Nowhere to put it' }
      return ok({ MAC, LCD1: 'Store at', LCD2: location })
    },
  },

  requestPalletMove: {
    summary: 'Moving a pallet from where it is to somewhere else.',
    responseName: 'responseStation',
    reply: ({ MAC, barcode, location }, { server }) => {
      const moved = server.movePallet(barcode, location)
      return moved
        ? ok({ MAC, LCD1: 'Moved', LCD2: location })
        : { MAC, status: 'FAILED', message: 'That space is taken' }
    },
  },

  requestRpcList: {
    summary: 'Which remote procedures does this server offer?',
    responseName: 'responseRpcList',
    reply: ({ MAC }, { server }) => ok({ MAC, rpc: server.rpcNames() }),
  },

  requestRpcExecute: {
    summary: 'Run one of them.',
    responseName: 'responseRpcExecute',
    reply: ({ MAC, name, params }, { server }) => server.runRpc(MAC, name, params),
  },
}

module.exports.helpers = { ok, nothing }
