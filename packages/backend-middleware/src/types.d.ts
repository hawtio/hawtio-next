import { ErrorRequestHandler, RequestHandler } from 'express'

type Middleware =
  | {
      name?: string
      path?: string
      middleware: RequestHandler | ErrorRequestHandler
    }
  | RequestHandler
  | ErrorRequestHandler
