#!/usr/bin/env node
import { cpSync, renameSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export function scaffold(dest) {
  const templateDir = join(dirname(fileURLToPath(import.meta.url)), 'template')
  cpSync(templateDir, dest, { recursive: true })
  const gi = join(dest, '_gitignore')
  if (existsSync(gi)) renameSync(gi, join(dest, '.gitignore'))
}

// CLI entry (skip when imported by tests)
if (import.meta.url === `file://${process.argv[1]}`) {
  const dest = process.argv[2]
  if (!dest) {
    console.error('Usage: npm create agentforge <dir>')
    process.exit(1)
  }
  scaffold(join(process.cwd(), dest))
  console.log(`Created ${dest}. Next:\n  cd ${dest} && cp .env.example .env && npm install && npm run dev`)
}
