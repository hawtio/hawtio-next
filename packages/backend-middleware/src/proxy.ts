import axios, { type AxiosRequestConfig, isAxiosError } from 'axios'
import { Request, Response } from 'express'

import { log } from './logger'

export async function proxy(uri: string, req: Request, res: Response) {
  const handleError = (e: string) => {
    res.status(500).end(`error proxying to "${uri}: ${e}`)
  }
  delete req.headers.referer
  if (req.headers['x-jolokia-authorization']) {
    req.headers['Authorization'] = req.headers['x-jolokia-authorization']
  }
  try {
    const axiosRequest: AxiosRequestConfig = {
      method: req.method,
      url: uri,
      headers: req.headers,
      responseType: 'stream',
    }
    if (req.method === 'POST') {
      // can we pass the request to be streamed from incoming expres.js to outgoing axios request?
      if (req.complete || req.readableEnded) {
        // pass data consumed and transformed into JSON by bodyParser.json() middleware
        axiosRequest.data = req.body ?? {}
      } else {
        // we can safely stream
        axiosRequest.data = req
      }
    }
    const res2 = await axios(axiosRequest)
    if (res2.headers['content-type']) {
      res.header('content-type', res2.headers['content-type'])
    }
    res.status(res2.status)
    res2.data.pipe(res).on('error', handleError)
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      const res2 = error.response
      const newHeaders = Object.assign({}, res2.headers as { [key: string]: string })
      if (res2.status == 401 && newHeaders['www-authenticate']) {
        // emulate Hawtio's probing of remote Jolokia. Without "WWW-Authenticate: Basic ...",
        // browser never displays native credentials dialog, so we can handle it nicer
        let v = newHeaders['www-authenticate'] as string
        if (v.toLowerCase().startsWith('basic')) {
          v = 'Hawtio original-scheme="Basic" ' + v.substring(6, v.length)
          newHeaders['WWW-Authenticate'] = v
        }
      }
      switch (res2.status) {
        case 401:
        case 403:
        case 429:
          log.info('Authentication failed on remote server:', error.status, error.message, uri)
          log.debug('Response headers:', newHeaders)
          res.header(newHeaders).sendStatus(res2.status)
          break
        default:
          handleError(String(error))
      }
    } else {
      handleError(String(error))
    }
  }
}
