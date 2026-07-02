import { expect, test } from 'vitest'
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadAgents } from '../src/loader.js'

test('loads each file as a named agentlet', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'af-'))
  const agents = join(dir, 'agents')
  mkdirSync(agents)
  writeFileSync(join(agents, 'hello.mjs'),
    `export default { system: 'hi', tools: [], options: {} }`)
  writeFileSync(join(agents, 'weather.mjs'),
    `export default { system: 'w', tools: [], options: {} }`)

  const reg = await loadAgents(agents)
  expect([...reg.keys()].sort()).toEqual(['hello', 'weather'])
  expect(reg.get('hello')?.system).toBe('hi')
})
