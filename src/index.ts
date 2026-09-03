/**
 * A ROBOT-API server.
 *
 * This file wires the layers together and starts listening. Everything it
 * touches is constructed here and passed downwards, so any of it can be
 * replaced - a real repository, a real user directory - without the layers
 * below knowing.
 *
 *   npm run dev      watch and restart
 *   npm start        build and run
 */
import express from 'express'
import { loadConfig } from './config'
import { robotRoutes } from './controllers/robotController'
import { errorHandler } from './middleware/errorHandler'
import {
  InMemoryLocationRepository,
  InMemoryRobotRepository,
  InMemoryUserRepository,
} from './repository/RobotRepository'
import { RobotService } from './service/RobotService'

const config = loadConfig()

const service = new RobotService(
  new InMemoryRobotRepository(config.robots),
  new InMemoryUserRepository(config.users),
  new InMemoryLocationRepository(config.locations),
)

const app = express()
app.use(express.json({ limit: '256kb' }))

// The Robots are on the packhouse floor and a dashboard is not, so the browser
// asks first.
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') {
    res.sendStatus(204)
    return
  }
  next()
})

app.use(robotRoutes(service))
app.use(errorHandler)

const server = app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Robot demonstration server on http://0.0.0.0:${config.port}`)
})

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    // eslint-disable-next-line no-console
    console.error(`\nPort ${config.port} is already in use.\n\n  PORT=9000 npm start\n`)
    process.exit(1)
  }
  throw error
})
