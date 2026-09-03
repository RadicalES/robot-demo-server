/**
 * The ROBOT-API on the wire.
 *
 * Every message is one JSON object with a single named key: the name is the
 * command, its contents are the parameters.
 *
 *     { "requestPing": { "MAC": "AA:BB:CC:00:11:22" } }
 *
 * These types describe that envelope and the packets inside it. They belong to
 * the protocol, not to the domain - the domain has a Robot; the wire has a
 * requestSetup with a MAC in it.
 */

/** Every packet carries the MAC of the Robot it came from. */
export interface RobotPacket {
  MAC: string
}

export interface RequestSetup extends RobotPacket {
  type?: string
  status?: 'REQUEST' | 'ACCEPT'
  /** Optional, and absent is not empty - see ReportedVersions. */
  firmware?: string
  deviceWebApp?: string
  rootfs?: string
  platform?: string
  model?: string
  controlURL?: string
  VNC?: string
}

export interface RequestPing extends RobotPacket {
  session?: string
  firmware?: string
  deviceWebApp?: string
  rootfs?: string
}

export interface PublishLogon extends RobotPacket {
  code: string
}

export interface PublishBarcodeScan extends RobotPacket {
  barcode: string
  scanner?: string
}

export interface PublishScaleWeight extends RobotPacket {
  weight: number
  units?: string
  barcode?: string
}

export interface PublishButton extends RobotPacket {
  button: string
}

export interface RequestPalletStore extends RobotPacket {
  barcode: string
}

export interface RequestPalletMove extends RobotPacket {
  barcode: string
  location: string
}

export interface RequestRpcExecute extends RobotPacket {
  name: string
  params?: Record<string, unknown>
}

/** A message as it arrives: one key, whose value is the packet. */
export type Envelope = Record<string, RobotPacket | undefined>

/**
 * Anything a handler may answer with. Every response carries a status, and the
 * dispatcher wraps it in the response name the packet declares.
 */
export interface Reply {
  /**
   * OK or FAILED for most packets - but responseSetup answers ENABLED or
   * DISABLED, which is the Robot's state rather than the request's outcome. A
   * union of the four would say those are interchangeable, and they are not.
   */
  status?: string
  [field: string]: unknown
}

export const ok = (fields: Reply = {}): Reply => ({ status: 'OK', ...fields })
export const failed = (message: string, fields: Reply = {}): Reply => ({
  status: 'FAILED',
  message,
  ...fields,
})
