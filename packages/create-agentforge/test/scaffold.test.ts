import { expect, test } from 'vitest'
import { mkdtempSync, existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { scaffold } from '../index.js'

test('scaffold copies template and renames gitignore', () => {
  const dir = join(mkdtempSync(join(tmpdir(), 'caf-')), 'my-agent')
  scaffold(dir)
  expect(existsSync(join(dir, 'agents', 'hello.ts'))).toBe(true)
  expect(existsSync(join(dir, '.gitignore'))).toBe(true)
  expect(readFileSync(join(dir, 'package.json'), 'utf8')).toContain('agentforge')
})
