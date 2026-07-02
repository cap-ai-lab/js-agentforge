import { expect, test } from 'vitest'
import { buildMessages } from '../src/core/messages.js'

test('buildMessages prepends system and appends user', () => {
  const out = buildMessages('SYS', [{ role: 'user', content: 'q1' }], 'q2')
  expect(out).toEqual([
    { role: 'system', content: 'SYS' },
    { role: 'user', content: 'q1' },
    { role: 'user', content: 'q2' },
  ])
})

test('buildMessages omits system when undefined', () => {
  const out = buildMessages(undefined, [], 'hi')
  expect(out).toEqual([{ role: 'user', content: 'hi' }])
})
