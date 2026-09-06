/**
 * Start the scale emulator from scale.conf, on whatever this machine is.
 *
 *   npm run scale                    what scale.conf says
 *   npm run scale -- --ramp 0:25:0.5 anything here wins over the file
 *
 * Node rather than a shell script because the demonstration laptop may be
 * Windows, where scale.sh is not a thing that runs. Node is already here - it
 * builds the app - so this needs nothing installed that is not.
 *
 * (C) 2017-2026 Radical Electronic Systems - www.radsys.io
 */
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const conf = process.env.SCALE_CONF || join(here, 'scale.conf')

// KEY=VALUE, the same file a shell would source.
const settings = {}
if (existsSync(conf)) {
  for (const line of readFileSync(conf, 'utf8').split('\n')) {
    const m = /^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/.exec(line)
    if (m && !line.trimStart().startsWith('#')) settings[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const args = ['--protocol', settings.PROTOCOL || 'MICRO-A12E']
if (settings.PORT) args.push('--port', settings.PORT)
if (settings.BAUD) args.push('--baud', settings.BAUD)
if (settings.RAMP) args.push('--ramp', settings.RAMP)
else if (settings.WEIGHT) args.push('--weight', settings.WEIGHT)
if (settings.KIND) args.push('--kind', settings.KIND)
if (settings.UNITS) args.push('--units', settings.UNITS)

// Windows installs python as "py", Linux as "python3", and a machine may have
// both with only one of them being the one that has pyserial. Take the first
// that answers.
const candidates = process.platform === 'win32'
  ? [['py', ['-3']], ['python', []], ['python3', []]]
  : [['python3', []], ['python', []]]

let python = null
for (const [command, flags] of candidates) {
  const probe = spawnSync(command, [...flags, '--version'], { stdio: 'ignore' })
  if (!probe.error && probe.status === 0) { python = [command, flags]; break }
}
if (!python) {
  console.error('No python found. Install it, then: py -m pip install pyserial   (Windows)')
  console.error('                                    sudo apt install python3-serial  (Linux)')
  process.exit(1)
}

const [command, flags] = python
const all = [...flags, join(here, 'emulate.py'), ...args, ...process.argv.slice(2)]
console.log(`scale: ${settings.PROTOCOL || 'MICRO-A12E'} on ${settings.PORT || 'a new pty'}` +
            (settings.RAMP ? `, ramping ${settings.RAMP}` : ''))

// inherit, so typing a weight and pressing enter reaches the emulator.
const child = spawn(command, all, { stdio: 'inherit' })
child.on('exit', (code) => process.exit(code ?? 0))
