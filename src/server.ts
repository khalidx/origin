#!/usr/bin/env node

import express from 'express'

const PORT = 80
const HOST = '0.0.0.0'

const app = express()

app.get('/', (_req, res) => {
  res.json({
    message: 'hello world!',
    time: new Date().toISOString()
  })
})

app.listen(PORT, HOST)

console.log(`Running on http://${HOST}:${PORT}`)

process.on('SIGINT', function () {
  console.log('Going down')
  process.exit()
})
