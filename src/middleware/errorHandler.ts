/**
 * The last word on anything that went wrong.
 *
 * Express needs four arguments to recognise this as an error handler, which is
 * why `next` is here and unused.
 */
import { NextFunction, Request, Response } from 'express'
import { ApiError } from '../errors/ApiError'

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const status = error instanceof ApiError ? error.status : 500
  const message = error instanceof Error ? error.message : 'Unknown error'
  res.status(status).json({ status: 'FAILED', message })
}
