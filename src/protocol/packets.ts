/**
 * The ROBOT-API, as a table.
 *
 * One entry per command. Reading this file is reading the protocol: what a
 * Robot can send, what it gets back, and what the server does about it.
 *
 * Adding a command means adding an entry and nothing else - no route to
 * register, no branch to extend, no switch to find.
 */
import { ReportedVersions, Robot } from '../domain/robot'
import { RobotService } from '../service/RobotService'
import {
  Envelope,
  PublishBarcodeScan,
  PublishButton,
  PublishLogon,
  PublishScaleWeight,
  Reply,
  RequestPalletMove,
  RequestPalletStore,
  RequestPing,
  RequestRpcExecute,
  RequestSetup,
  RobotPacket,
  failed,
  ok,
} from './messages'

/** What a handler is given: the packet, the Robot it came from, the service. */
export interface Context {
  robot: Robot | undefined
  service: RobotService
}

/**
 * A packet definition.
 *
 * `reply` returns the object to answer with, or null to answer nothing at all -
 * which is not the same as answering that it failed.
 */
export interface Packet {
  readonly summary: string
  readonly responseName: string
  reply(packet: RobotPacket, context: Context): Reply | null
}

/**
 * Define a packet, saying which shape it expects.
 *
 * The dispatcher only knows it has *a* packet; the handler knows which one.
 * The narrowing happens here, once, rather than as a cast on every entry -
 * which is the difference between one place to check and thirteen.
 */
function define<T extends RobotPacket>(packet: {
  summary: string
  responseName: string
  reply(packet: T, context: Context): Reply | null
}): Packet {
  return {
    summary: packet.summary,
    responseName: packet.responseName,
    reply: (received, context) => packet.reply(received as T, context),
  }
}

/**
 * The three version fields out of a packet, and only those.
 *
 * A packet's type says which fields it may carry, but at runtime it is still
 * the whole object - so handing it straight to recordVersions() records the
 * MAC as a version, which is how the dashboard came to show
 * "MAC E4:5F:01:50:EC:E0" beside the rootfs.
 */
function versionsIn(packet: {
  firmware?: string
  deviceWebApp?: string
  rootfs?: string
}): ReportedVersions {
  return {
    firmware: packet.firmware,
    deviceWebApp: packet.deviceWebApp,
    rootfs: packet.rootfs,
  }
}

/** Every packet needs a configured Robot; this says so once. */
function requiring<T extends RobotPacket>(
  responseName: string,
  summary: string,
  reply: (packet: T, robot: Robot, service: RobotService) => Reply | null,
): Packet {
  return define<T>({
    summary,
    responseName,
    reply: (packet, { robot, service }) =>
      robot
        ? reply(packet, robot, service)
        : failed('This Robot is not configured', { MAC: packet.MAC }),
  })
}

export const packets: Record<string, Packet> = {
  // -- keeping in touch -----------------------------------------------------

  requestPing: define<RequestPing>({
    summary: 'The Robot checks the server is still there, every few seconds.',
    responseName: 'responsePong',
    // An unconfigured Robot is answered with nothing rather than an error: it
    // will ask for setup soon enough, and a stream of failures says less.
    reply: (packet: RequestPing, { robot, service }) => {
      if (!robot) return null
      service.recordVersions(robot, versionsIn(packet))
      return ok({ MAC: packet.MAC })
    },
  }),

  requestDateTime: define<RobotPacket>({
    summary: 'The Robot has no clock of its own and asks for the time.',
    responseName: 'responseDateTime',
    reply: (packet: RobotPacket) => {
      const now = new Date()
      return ok({
        MAC: packet.MAC,
        date: now.toISOString().slice(0, 10),
        time: now.toTimeString().slice(0, 8),
      })
    },
  }),

  // -- becoming a terminal --------------------------------------------------

  requestSetup: define<RequestSetup>({
    summary:
      'A Robot asks what it is. Sent on boot, and again whenever it has lost ' +
      'the answer. Everything except MAC is optional.',
    responseName: 'responseSetup',
    reply: (packet: RequestSetup, { robot, service }) => {
      // A Robot nobody has configured is told DISABLED. Handing a
      // configuration to a terminal the server has never heard of is how one
      // ends up doing somebody else's job.
      if (!robot) {
        return { MAC: packet.MAC, status: 'DISABLED', message: 'Not configured' }
      }
      service.recordVersions(robot, versionsIn(packet))
      robot.session = service.newSession()
      return { MAC: packet.MAC, status: 'ENABLED', session: robot.session, ...robot.setup }
    },
  }),

  // -- what the Robot has to say -------------------------------------------

  publishStatus: requiring<RobotPacket & { status?: string }>(
    'responseStatus',
    'READY or not, sent when the Robot has finished starting up.',
    (packet, robot, service) => {
      service.log(`status  ${robot.mac}  ${packet.status ?? ''}`)
      return ok({ MAC: packet.MAC })
    },
  ),

  publishLogon: requiring<PublishLogon>(
    'responseUser',
    'Somebody presented a card, a badge or a code.',
    (packet, robot, service) => {
      const user = service.signOn(robot, packet.code)
      return user
        ? ok({ MAC: packet.MAC, name: user.name, userid: user.userid })
        : failed('Card not recognised', { MAC: packet.MAC })
    },
  ),

  publishLogoff: requiring<RobotPacket>(
    'responseUser',
    'The operator signed off, or was signed off by a timeout.',
    (packet, robot, service) => {
      service.signOff(robot)
      return ok({ MAC: packet.MAC })
    },
  ),

  publishBarcodeScan: requiring<PublishBarcodeScan>(
    'responseStation',
    'A barcode was scanned. Which scanner, when a Robot has two, is in the packet.',
    (packet, robot, service) => {
      service.log(`scan    ${robot.mac}  ${packet.barcode}`)
      return ok({ MAC: packet.MAC, LCD1: 'Scanned', LCD2: packet.barcode })
    },
  ),

  publishScaleWeight: requiring<PublishScaleWeight>(
    'responseStation',
    'A weight was taken. The Robot decides when a reading is the reading.',
    (packet, robot, service) => {
      service.log(`weight  ${robot.mac}  ${packet.weight}${packet.units ?? ''}`)
      return ok({
        MAC: packet.MAC,
        LCD1: 'Weight recorded',
        LCD2: `${packet.weight} ${packet.units ?? ''}`.trim(),
      })
    },
  ),

  publishButton: requiring<PublishButton>(
    'responseStation',
    'A button on the Robot was pressed.',
    (packet, robot, service) => {
      service.log(`button  ${robot.mac}  ${packet.button}`)
      return ok({ MAC: packet.MAC, LCD1: `Button ${packet.button}` })
    },
  ),

  publishRootfsUpdate: requiring<RobotPacket & { manifest?: string; status?: string; reason?: string }>(
    'responseStatus',
    'The terminal answering a release install: STARTED, or REFUSED with a reason.',
    (packet, robot, service) => {
      service.log(
        `rootfs  ${robot.mac}  ${packet.manifest ?? ''} ${packet.status ?? ''}` +
          (packet.reason ? `  ${packet.reason}` : ''),
      )
      return ok({ MAC: packet.MAC })
    },
  ),

  // -- asking the server for something --------------------------------------

  requestPalletStore: requiring<RequestPalletStore>(
    'responseStation',
    'Where should this pallet go?',
    (packet, _robot, service) => {
      const location = service.store(packet.barcode)
      return location
        ? ok({ MAC: packet.MAC, LCD1: 'Store at', LCD2: location })
        : failed('Nowhere to put it', { MAC: packet.MAC })
    },
  ),

  requestPalletMove: requiring<RequestPalletMove>(
    'responseStation',
    'Moving a pallet from where it is to somewhere else.',
    (packet, _robot, service) =>
      service.move(packet.barcode, packet.location)
        ? ok({ MAC: packet.MAC, LCD1: 'Moved', LCD2: packet.location })
        : failed('That space is taken', { MAC: packet.MAC }),
  ),

  requestRpcList: requiring<RobotPacket>(
    'responseRpcList',
    'Which remote procedures does this server offer?',
    (packet) => ok({ MAC: packet.MAC, rpc: ['reboot', 'identify'] }),
  ),

  requestRpcExecute: requiring<RequestRpcExecute>(
    'responseRpcExecute',
    'Run one of them.',
    (packet, robot, service) => {
      service.log(`rpc     ${robot.mac}  ${packet.name}`)
      return ok({ MAC: packet.MAC, message: `${packet.name} would run here` })
    },
  ),
}

export type { Envelope }
