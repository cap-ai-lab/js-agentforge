import { expect, test } from 'vitest'
import { buildServer } from '../src/adapters/http.js'
import type { CallLLM } from '../src/core/types.js'
import type { AgentDescriptor } from '../src/define.js'

const callLLM: CallLLM = async function* () {
  yield { type: 'text', delta: 'hi there' }
  yield { type: 'usage', input_tokens: 1, output_tokens: 1 }
  yield { type: 'done' }
}

const registry = new Map<string, AgentDescriptor>([
  ['hello', { system: 'S', tools: [], options: {} }],
])

test('POST /<name> streams SSE parts', async () => {
  const app = buildServer(registry, { callLLM })
  const res = await app.inject({
    method: 'POST',
    url: '/hello',
    payload: { id: '1', message: { role: 'user', parts: [{ text: 'q' }] }, history: [] },
  })
  expect(res.statusCode).toBe(200)
  expect(res.body).toContain('data: {"type":"text_delta","content":"hi there"}')
  expect(res.body).toContain('"type":"metadata"')
})

test('unknown agentlet returns 404', async () => {
  const app = buildServer(registry, { callLLM })
  const res = await app.inject({ method: 'POST', url: '/nope', payload: {} })
  expect(res.statusCode).toBe(404)
})

test('auth rejects when secret set and header missing', async () => {
  const app = buildServer(registry, { callLLM, platformSecret: 'sekret' })
  const res = await app.inject({
    method: 'POST', url: '/hello',
    payload: { id: '1', message: { role: 'user', parts: [{ text: 'q' }] }, history: [] },
  })
  expect(res.statusCode).toBe(401)
})
