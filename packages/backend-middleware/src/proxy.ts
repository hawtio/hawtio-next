import axios from 'axios'
import { Request, Response } from 'express'

import { log } from './logger'

export async function proxy(uri: string, req: Request, res: Response) {
  const handleError = (e: string) => {
    res.status(500).end(`error proxying to "${uri}: ${e}`)
  }
  delete req.headers.referer
  try {
    const res2 = await axios({
      method: req.method,
      url: uri,
      data: req,
      headers: req.headers,
      responseType: 'stream',
    })
    if (res2.headers['content-type']) {
      res.header('content-type', res2.headers['content-type'])
    }
    res.status(res2.status)
    res2.data.pipe(res).on('error', handleError)
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const res2 = error.response
      switch (res2.status) {
        case 401:
        case 403:
        case 429:
          log.info('Authentication failed on remote server:', error.status, error.message, uri)
          log.debug('Response headers:', res2.headers)
          res.header(res2.headers).sendStatus(res2.status)
          break
        default:
          handleError(String(error))
      }
    } else {
      handleError(String(error))
    }
  }
}
