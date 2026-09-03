/*
 * The dispatcher.
 *
 * The whole of the ROBOT-API is: a message is one object with one named key,
 * the name is the command, and the answer is one object with one named key.
 * So this file reads the name, looks it up in packets.js, and wraps whatever
 * comes back.
 *
 * It is short on purpose. Everything a packet does lives beside the packet;
 * nothing about a particular command belongs in here.
 *
 * (C) 2020-2026 Radical Electronic Systems - www.radsys.io
 */

'use strict'

const packets = require('./packets')

/**
 * Answer one message.
 *
 *   body    the JSON the Robot posted
 *   server  the demo server's state, passed to whichever packet handles it
 *
 * Returns the object to send back.
 */
function handle(body, server) {
  const names = Object.keys(body || {}).filter((k) => k !== 'helpers')

  // One named object, no more and no less. A message with two commands in it
  // is a bug at the other end, and guessing which one was meant is how a
  // terminal ends up doing something nobody asked for.
  if (names.length !== 1) {
    return { responseError: { status: 'FAILED', message: 'Expected exactly one command' } }
  }

  const name = names[0]
  const packet = packets[name]
  if (!packet || typeof packet.reply !== 'function') {
    return { responseError: { status: 'FAILED', message: `Unknown command: ${name}` } }
  }

  const contents = body[name] || {}
  const robot = server.findRobot(contents.MAC)

  let answer
  try {
    answer = packet.reply(contents, { robot, server })
  } catch (e) {
    // A fault in one packet is not the end of the conversation: the Robot is
    // going to ask again in a few seconds either way, and a server that stops
    // answering is harder to diagnose than one that says what went wrong.
    server.log(`ERROR   ${name}: ${e.message}`)
    return { responseError: { status: 'FAILED', message: e.message } }
  }

  // A packet may decide there is nothing to say - an unknown Robot pinging, for
  // instance. Saying nothing is different from saying it failed.
  if (answer === null || answer === undefined) return {}

  return { [packet.responseName]: answer }
}

/** Every command this server understands, for the index page and the docs. */
function describe() {
  return Object.entries(packets)
    .filter(([, p]) => p && p.summary)
    .map(([name, p]) => ({ name, answers: p.responseName, summary: p.summary }))
}

module.exports = { handle, describe }
