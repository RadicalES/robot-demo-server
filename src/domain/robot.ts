/**
 * What a Robot is, to this server.
 *
 * The domain layer describes the things the business talks about and nothing
 * else: no Express, no database, no JSON shapes off the wire. Everything above
 * it may depend on this; it depends on nothing.
 */

/** What a terminal has been set up to be. */
export type RobotFunction =
  | 'DISABLED'
  | 'AUTO'
  | 'TERMINAL'
  | 'SCALE'
  | 'SCANNER'
  | 'BINTIP'
  | 'FORKLIFT'
  | 'DUALSCAN'
  | 'LABELPRINT'

/**
 * The three things a terminal reports about itself, each versioned
 * independently.
 *
 * Every one is optional, and that is load-bearing: a field the terminal did not
 * send means "not reported" and must leave the last known value alone. An empty
 * string would overwrite it - and a T430, which has no processor in front of its
 * peripherals, would erase the firmware recorded against an ITPC-200.
 */
export interface ReportedVersions {
  /** Firmware of a processor in front of the peripherals, where there is one. */
  firmware?: string
  /** The web app the terminal is serving. */
  deviceWebApp?: string
  /** The image the filesystem was installed from. */
  rootfs?: string
}

/** How a terminal is configured: what the server tells it to be. */
export interface RobotSetup {
  name: string
  type: RobotFunction
  protocol: string
  message?: string
  security?: 'OPEN' | 'REQUIRED'
  scale?: string
  units?: string
  lowLimit?: string
  highLimit?: string
  serverURL?: string
  transactionURL?: string
}

export interface Robot {
  /** Normalised: no separators, upper case. Robots spell their own MAC both ways. */
  readonly mac: string
  readonly setup: RobotSetup
  versions: ReportedVersions
  operator: User | null
  session: string | null
  lastSeen: Date | null
}

export interface User {
  readonly userid: string
  readonly name: string
  /** A card number, a badge, or a keyed code - the terminal does not distinguish. */
  readonly code: string
}

export interface StorageLocation {
  readonly name: string
  pallet: string | null
}

/**
 * Robots are configured with colons and report without them, or the other way
 * about, depending on the firmware. One spelling here, or every lookup misses.
 */
export const normaliseMac = (mac: string | undefined): string =>
  (mac ?? '').toUpperCase().replace(/[^0-9A-F]/g, '')
