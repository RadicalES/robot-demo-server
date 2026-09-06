/**
 * Write the bundle's manifest.
 *
 * A terminal will not install a bundle that cannot say what it is. See
 * ../device-webapp/docs/WEBAPP-MANIFEST.md for the contract.
 *
 * Change the slug and the supported functions to suit the app: the slug is the
 * name the terminal serves it under, and "supports" is what the terminal's
 * Application page will offer once this app is installed.
 */
import { writeFileSync, readFileSync, unlinkSync } from 'node:fs'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

const manifest = {
  schema: 1,
  slug: 'device-webapp-template',
  name: 'Robot Demonstration Web Application',
  version: pkg.version,
  vendor: 'Radical Electronic Systems',
  supports: ['TERMINAL', 'SCALE', 'SCANNER', 'LABELPRINT'],
  built: new Date().toISOString().slice(0, 10),
}

// public/config.json exists so `npm run dev` has something to read. A terminal
// writes the real one beside the app and the built app reads ../config.json,
// one level up from the app's own directory - so a copy shipped inside the
// bundle would never be read, and would sit there looking like it was.
try {
  unlinkSync('dist/config.json')
  console.log('removed the development config from the bundle')
} catch { /* not there, which is fine */ }

writeFileSync('dist/manifest.json', JSON.stringify(manifest, null, 2) + '\n')
console.log(`manifest: ${manifest.slug} ${manifest.version}, supports ${manifest.supports.join(', ')}`)
