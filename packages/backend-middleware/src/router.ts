import express, { NextFunction, Request, Response, Router } from 'express'
import Logger, { ILogLevel } from 'js-logger'
import { ParsedQs, stringify } from 'qs'

import { configureLog, log } from './logger'
import { proxy } from './proxy'

export type HawtioBackendOptions = {
  /**
   * Log level
   */
  logLevel: ILogLevel | string
}

const defaultOptions: HawtioBackendOptions = {
  logLevel: Logger.INFO,
}

export function hawtioBackend(options: HawtioBackendOptions = defaultOptions): Router {
  configureLog(options.logLevel)

  const backend = express.Router()

  backend.param('proto', (_req: Request, res: Response, next: NextFunction, proto: string) => {
    log.debug('Requesting proto:', proto)
    switch (proto.toLowerCase()) {
      case 'http':
      case 'https':
        next()
        break
      default:
        res.status(406).send(`Invalid protocol: ${proto}`)
    }
  })

  backend.param('hostname', (_req: Request, _res: Response, next: NextFunction, hostname: string) => {
    log.debug('Requesting hostname:', hostname)
    next()
  })

  backend.param('port', (_req: Request, res: Response, next: NextFunction, port: string) => {
    log.debug('Requesting port:', port)
    const portNumber = parseInt(port)
    log.debug('Parsed port number:', portNumber)
    if (isNaN(portNumber)) {
      res.status(406).send(`Invalid port number: ${port}`)
    } else {
      next()
    }
  })

  backend.use('/', (req: Request, res: Response, next: NextFunction) => {
    if (req.path === '') {
      res.status(200).end()
    } else {
      next()
    }
  })

  backend.use('/:proto/:hostname/:port/', (req: Request, res: Response) => {
    log.debug('Requesting path:', req.path)
    log.debug('Requesting query:', req.query)
    const uri = getTargetURI({
      proto: req.params.proto,
      hostname: req.params.hostname,
      port: req.params.port,
      path: req.path,
      query: req.query,
    })
    proxy(uri, req, res)
  })

  return backend
}

type URIOptions = {
  proto: string
  username?: string
  password?: string
  hostname: string
  port: string
  path: string
  query: ParsedQs
}

function getTargetURI(options: URIOptions): string {
  let uri = ''
  if (options.username && options.password) {
    uri = `${options.proto}://${options.username}:${options.password}@${options.hostname}:${options.port}${options.path}`
  } else {
    uri = `${options.proto}://${options.hostname}:${options.port}${options.path}`
  }
  if (Object.keys(options.query).length !== 0) {
    uri += '?' + stringify(options.query)
  }
  log.debug('Target URL:', uri)
  return uri
}
