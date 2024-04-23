/* eslint-disable no-console */
import express from 'express'
import { hawtioBackend } from './build/main/index.js'

const port = 3333

const app = express()
app.get('/', (_, res) => {
  res.send('hello!')
})
app.use(
  '/proxy',
  hawtioBackend({
    logLevel: 'debug',
  }),
)
app.listen(port, () => {
  console.log(`started at :${port}`)
})
