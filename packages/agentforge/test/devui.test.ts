import { expect, test } from 'vitest'
import { buildServer } from '../src/adapters/http.js'
import type { CallLLM } from '../src/core/types.js'

const callLLM: CallLLM = async function* () { yield { type: 'done' } }

test('dev mode serves the test UI at /', async () => {
  const app = buildServer(new Map(), { callLLM, dev: true })
  const res = await app.inject({ method: 'GET', url: '/' })
  expect(res.statusCode).toBe(200)
  expect(res.headers['content-type']).toContain('text/html')
  expect(res.body).toContain('<title>agentforge')
})

test('non-dev mode does not serve /', async () => {
  const app = buildServer(new Map(), { callLLM, dev: false })
  const res = await app.inject({ method: 'GET', url: '/' })
  expect(res.statusCode).toBe(404)
})
