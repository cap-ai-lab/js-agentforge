import { expect, test } from 'vitest'
import { parseOpenAIStream } from '../src/adapters/llm.js'
import type { LLMEvent } from '../src/core/types.js'

async function* lines(...ls: string[]) { for (const l of ls) yield l }
async function collect(gen: AsyncGenerator<LLMEvent>) {
  const out: LLMEvent[] = []
  for await (const e of gen) out.push(e)
  return out
}

test('parses text deltas and usage', async () => {
  const out = await collect(parseOpenAIStream(lines(
    'data: {"choices":[{"delta":{"content":"hel"}}]}',
    'data: {"choices":[{"delta":{"content":"lo"}}]}',
    'data: {"choices":[{"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":3,"completion_tokens":4}}',
    'data: [DONE]',
  )))
  expect(out).toContainEqual({ type: 'text', delta: 'hel' })
  expect(out).toContainEqual({ type: 'text', delta: 'lo' })
  expect(out).toContainEqual({ type: 'usage', input_tokens: 3, output_tokens: 4 })
  expect(out.at(-1)).toEqual({ type: 'done', finish_reason: 'stop' })
})

test('accumulates fragmented tool_call arguments by index', async () => {
  const out = await collect(parseOpenAIStream(lines(
    'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"c1","function":{"name":"get_weather","arguments":"{\\"ci"}}]}}]}',
    'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"ty\\":\\"BJ\\"}"}}]}}]}',
    'data: {"choices":[{"delta":{},"finish_reason":"tool_calls"}]}',
    'data: [DONE]',
  )))
  expect(out).toContainEqual({ type: 'tool_call', id: 'c1', name: 'get_weather', arguments: { city: 'BJ' } })
})
