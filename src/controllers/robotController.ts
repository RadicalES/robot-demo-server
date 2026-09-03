/**
 * HTTP, and nothing else.
 *
 * The controller's whole job is to turn a request into a call and a call into a
 * response. It knows no commands and no rules: it hands the message to the
 * dispatcher, which finds the packet, which asks the service.
 */
import { Request, Response, Router } from 'express'
import { dispatch, describe } from '../protocol/dispatcher'
import { RobotService } from '../service/RobotService'
import { Envelope } from '../protocol/messages'

export function robotRoutes(service: RobotService): Router {
  const router = Router()

  const answer = (req: Request, res: Response): void => {
    res.json(dispatch(req.body as Envelope, service))
  }

  // The one URL. The command is in the message, not in the path.
  router.post('/robot/api/', answer)

  // The paths Robots were configured with years ago. The path never carried
  // any meaning - a Robot posted to /scale.cgi and the server read the command
  // out of the message anyway - so they answer identically, and a terminal
  // holding a URL somebody typed into it once keeps working.
  for (const legacy of [
    '/setup.cgi',
    '/scale.cgi',
    '/term.cgi',
    '/scan.cgi',
    '/label.cgi',
    '/forklift.cgi',
  ]) {
    router.post(legacy, answer)
  }

  // What a dashboard reads. Small separate answers, so a page can ask for the
  // part that changes without re-reading the part that does not.
  router.get('/api/robots', (_req, res) => {
    res.json({
      robots: service.known().map((robot) => ({
        mac: robot.mac,
        name: robot.setup.name,
        type: robot.setup.type,
        versions: robot.versions,
        operator: robot.operator?.name ?? null,
      })),
    })
  })

  router.get('/api/commands', (_req, res) => res.json({ commands: describe() }))
  router.get('/api/recent', (_req, res) => res.json({ recent: service.recent() }))

  return router
}
