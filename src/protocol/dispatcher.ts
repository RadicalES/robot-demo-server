/**
 * Reading a message and choosing what answers it.
 *
 * The whole protocol is: one named object in, one named object out. So this is
 * the whole dispatcher. Nothing about any particular command belongs here -
 * that is what the table is for.
 */
import { RobotService } from '../service/RobotService'
import { Envelope, Reply, RobotPacket } from './messages'
import { Context, packets } from './packets'

export interface Answer {
  [responseName: string]: Reply
}

export function dispatch(body: Envelope, service: RobotService): Answer {
  const names = Object.keys(body ?? {})

  // One named object, no more and no less. A message carrying two commands is
  // a bug at the other end, and guessing which was meant is how a terminal
  // does something nobody asked for.
  if (names.length !== 1) {
    return { responseError: { status: 'FAILED', message: 'Expected exactly one command' } }
  }

  const name = names[0] as string
  const packet = packets[name]
  if (!packet) {
    return { responseError: { status: 'FAILED', message: `Unknown command: ${name}` } }
  }

  const contents = (body[name] ?? {}) as RobotPacket
  const context: Context = { robot: service.find(contents.MAC), service }

  let reply: Reply | null
  try {
    reply = packet.reply(contents as never, context)
  } catch (error) {
    // One bad packet does not end the conversation: the Robot asks again in a
    // few seconds regardless, and a server that goes quiet is harder to
    // diagnose than one that says what went wrong.
    const message = error instanceof Error ? error.message : String(error)
    service.log(`ERROR   ${name}: ${message}`)
    return { responseError: { status: 'FAILED', message } }
  }

  if (reply === null) return {}
  return { [packet.responseName]: reply }
}

/** Every command this server implements, for the dashboard and the docs. */
export function describe(): { name: string; answers: string; summary: string }[] {
  return Object.entries(packets).map(([name, packet]) => ({
    name,
    answers: packet.responseName,
    summary: packet.summary,
  }))
}
