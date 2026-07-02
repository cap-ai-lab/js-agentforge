#!/usr/bin/env node
import { start } from './bootstrap.js'

const cmd = process.argv[2]
if (cmd !== 'dev' && cmd !== 'start') {
  console.error('Usage: agentforge <dev|start>')
  process.exit(1)
}

start({ dev: cmd === 'dev' })
  .then((app) => {
    if (cmd === 'dev') {
      const addr = app.server.address()
      const port = typeof addr === 'object' && addr ? addr.port : 3000
      console.log(`agentforge dev → http://localhost:${port}/`)
    }
  })
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  })
