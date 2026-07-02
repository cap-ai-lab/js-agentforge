import { expect, test } from 'vitest'
import { defineAgent, defineTool } from '../src/define.js'

test('defineAgent normalizes optionals', () => {
  const a = defineAgent({ system: 'hi' })
  expect(a).toEqual({ system: 'hi', tools: [], options: { maxSteps: undefined } })
})

test('defineAgent rejects duplicate tool names', () => {
  const t = defineTool({ name: 'x', description: '', parameters: {}, execute: () => '' })
  expect(() => defineAgent({ tools: [t, t] })).toThrow(/duplicate tool/i)
})
