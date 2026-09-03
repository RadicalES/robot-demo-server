/**
 * Where Robots are kept.
 *
 * An interface first, and an in-memory implementation of it. The service
 * depends on the interface, so a real server swaps this for Prisma, or
 * anything else, without the service knowing - which is the only reason to
 * have a repository layer at all.
 */
import { Robot, RobotSetup, StorageLocation, User, normaliseMac } from '../domain/robot'

export interface RobotRepository {
  find(mac: string): Robot | undefined
  all(): Robot[]
  save(robot: Robot): void
}

export interface UserRepository {
  findByCode(code: string): User | undefined
}

export interface LocationRepository {
  firstFree(): StorageLocation | undefined
  find(name: string): StorageLocation | undefined
  all(): StorageLocation[]
  save(location: StorageLocation): void
}

/** A Robot as it is written in config.json. */
export interface RobotConfig {
  macAddress: string
  tagName?: string
  type?: string
  protocol?: string
  message?: string
  config?: Partial<RobotSetup>
}

export class InMemoryRobotRepository implements RobotRepository {
  private readonly robots = new Map<string, Robot>()

  constructor(configured: RobotConfig[] = []) {
    for (const entry of configured) {
      const mac = normaliseMac(entry.macAddress)
      if (!mac) continue
      this.robots.set(mac, {
        mac,
        setup: {
          name: entry.tagName ?? '',
          type: (entry.type as RobotSetup['type']) ?? 'DISABLED',
          protocol: entry.protocol ?? 'ROBOT-API',
          message: entry.message,
          security: 'OPEN',
          ...entry.config,
        },
        versions: {},
        operator: null,
        session: null,
        lastSeen: null,
      })
    }
  }

  find(mac: string): Robot | undefined {
    return this.robots.get(normaliseMac(mac))
  }

  all(): Robot[] {
    return [...this.robots.values()]
  }

  save(robot: Robot): void {
    this.robots.set(robot.mac, robot)
  }
}

export class InMemoryUserRepository implements UserRepository {
  constructor(private readonly users: User[]) {}

  findByCode(code: string): User | undefined {
    const wanted = (code ?? '').trim()
    return this.users.find((u) => u.code === wanted)
  }
}

export class InMemoryLocationRepository implements LocationRepository {
  private readonly locations = new Map<string, StorageLocation>()

  constructor(names: string[]) {
    for (const name of names) this.locations.set(name, { name, pallet: null })
  }

  firstFree(): StorageLocation | undefined {
    return [...this.locations.values()].find((l) => l.pallet === null)
  }

  find(name: string): StorageLocation | undefined {
    return this.locations.get(name)
  }

  all(): StorageLocation[] {
    return [...this.locations.values()]
  }

  save(location: StorageLocation): void {
    this.locations.set(location.name, location)
  }
}
