import { expect, test } from 'vitest'
import { parseRequest, encodePart } from '../src/protocol/sse.js'

test('parseRequest flattens parts to text', () => {
  const out = parseRequest({
    id: 'x',
    message: { role: 'user', parts: [{ text: '北京' }, { text: '天气?' }] },
    history: [{ role: 'assistant', parts: [{ text: 'hi' }] }],
  })
  expect(out.message).toBe('北京天气?')
  expect(out.history).toEqual([{ role: 'assistant', content: 'hi' }])
})

test('encodePart emits SSE line', () => {
  expect(encodePart({ type: 'text_delta', content: 'a' }))
    .toBe('data: {"type":"text_delta","content":"a"}\n\n')
})
