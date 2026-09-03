/**
 * What this server was told, and what it falls back to.
 *
 * Read once, typed here, and passed in - so nothing below this line reads a
 * file or an environment variable to find out how it should behave.
 */
import { readFileSync } from 'node:fs'
import { User } from './domain/robot'
import { RobotConfig } from './repository/RobotRepository'

export interface ServerConfig {
  port: number
  robots: RobotConfig[]
  users: User[]
  locations: string[]
}

const DEFAULT_USERS: User[] = [
  { userid: 'EMP005', name: 'Milton de Bruin', code: '8893004049623' },
  { userid: 'EMP011', name: 'Sarah Adams', code: '1865530413' },
  { userid: 'EMP023', name: 'Johan Steyn', code: '1234' },
]

export function loadConfig(path = 'config/robots.json'): ServerConfig {
  let robots: RobotConfig[] = []
  try {
    const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'))
    robots = Array.isArray(parsed) ? parsed : ((parsed as { robots?: RobotConfig[] }).robots ?? [])
  } catch {
    // A server with no Robots configured still runs and still answers - it
    // tells each of them DISABLED, which is the honest answer.
    // eslint-disable-next-line no-console
    console.log(`No ${path} - starting with no Robots configured.`)
  }

  return {
    port: Number(process.env.PORT ?? 8086),
    robots,
    users: DEFAULT_USERS,
    locations: ['A01', 'A02', 'A03', 'B01', 'B02'],
  }
}
