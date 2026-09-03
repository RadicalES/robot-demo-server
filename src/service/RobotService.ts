/**
 * What the server does when a Robot says something.
 *
 * The rules live here: who may sign on, where a pallet goes, what counts as a
 * version worth recording. Nothing in this file knows it is reached over HTTP,
 * and nothing knows how a Robot spells a packet - the controller and the
 * protocol layer deal with that.
 */
import { Robot, ReportedVersions, User, normaliseMac } from '../domain/robot'
import {
  LocationRepository,
  RobotRepository,
  UserRepository,
} from '../repository/RobotRepository'

export interface Activity {
  at: string
  line: string
}

export class RobotService {
  private readonly activity: Activity[] = []
  private sessions = 0

  constructor(
    private readonly robots: RobotRepository,
    private readonly users: UserRepository,
    private readonly locations: LocationRepository,
  ) {}

  // -- terminals ------------------------------------------------------------

  find(mac: string | undefined): Robot | undefined {
    return mac ? this.robots.find(mac) : undefined
  }

  known(): Robot[] {
    return this.robots.all()
  }

  newSession(): string {
    this.sessions += 1
    return this.sessions.toString(16).padStart(16, '0')
  }

  /**
   * Record what a terminal says it is running.
   *
   * A field that was not sent is left alone. "Not reported" and "empty" are
   * different answers, and writing the second over a known version loses it.
   */
  recordVersions(robot: Robot, reported: ReportedVersions): void {
    for (const [field, value] of Object.entries(reported) as [
      keyof ReportedVersions,
      string | undefined,
    ][]) {
      if (value === undefined || value === null || value === '') continue
      if (robot.versions[field] !== value) {
        this.log(`version ${robot.mac}  ${field} = ${value}`)
      }
      robot.versions[field] = value
    }
    robot.lastSeen = new Date()
    this.robots.save(robot)
  }

  // -- people ---------------------------------------------------------------

  /**
   * Sign somebody on from whatever the terminal read.
   *
   * An unrecognised card is a null, not a thrown error: it is the commonest
   * thing that happens at a terminal, and treating it as a fault teaches every
   * app built against this server to treat it as one too.
   */
  signOn(robot: Robot, code: string): User | null {
    const user = this.users.findByCode(code)
    if (!user) {
      this.log(`logon   ${robot.mac}  REFUSED unknown card ${code}`)
      return null
    }
    robot.operator = user
    this.robots.save(robot)
    this.log(`logon   ${robot.mac}  ${user.name}`)
    return user
  }

  signOff(robot: Robot): void {
    robot.operator = null
    this.robots.save(robot)
    this.log(`logoff  ${robot.mac}`)
  }

  // -- pallets --------------------------------------------------------------

  store(barcode: string): string | null {
    const free = this.locations.firstFree()
    if (!free) return null
    free.pallet = barcode
    this.locations.save(free)
    this.log(`store   ${barcode} -> ${free.name}`)
    return free.name
  }

  move(barcode: string, to: string): boolean {
    const target = this.locations.find(to)
    if (!target || target.pallet !== null) return false
    for (const location of this.locations.all()) {
      if (location.pallet === barcode) {
        location.pallet = null
        this.locations.save(location)
      }
    }
    target.pallet = barcode
    this.locations.save(target)
    this.log(`move    ${barcode} -> ${to}`)
    return true
  }

  // -- what has been happening ---------------------------------------------

  log(line: string): void {
    const at = new Date().toTimeString().slice(0, 8)
    // eslint-disable-next-line no-console
    console.log(`${at}  ${line}`)
    this.activity.unshift({ at, line })
    if (this.activity.length > 100) this.activity.length = 100
  }

  recent(): Activity[] {
    return this.activity
  }
}

export { normaliseMac }
