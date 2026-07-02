import { expect, test } from 'vitest'
import { runAgent } from '../src/core/loop.js'
import type { LLMEvent, ToolDef, Ctx } from '../src/core/types.js'
import type { Part } from '../src/protocol/types.js'

function scriptedLLM(turns: LLMEvent[][]) {
  let i = 0
  return async function* () {
    const t = turns[i++] ?? [{ type: 'done' as const }]
    for (const e of t) yield e
  }
}

const ctx: Ctx = { signal: new AbortController().signal, memory: '', emit: () => {} }

async function collect(gen: AsyncGenerator<Part>) {
  const out: Part[] = []
  for await (const p of gen) out.push(p)
  return out
}

test('tool call result is fed back and produces final answer', async () => {
  const callLLM = scriptedLLM([
    [{ type: 'tool_call', id: '1', name: 'echo', arguments: { x: 'hi' } }, { type: 'done' }],
    [{ type: 'text', delta: 'done: hi' }, { type: 'usage', input_tokens: 1, output_tokens: 2 }, { type: 'done' }],
  ])
  const tools: ToolDef[] = [
    { name: 'echo', description: '', parameters: {}, execute: (a) => `echoed ${a.x}` },
  ]
  const parts = await collect(runAgent({ messages: [], tools, callLLM, ctx, signal: ctx.signal }))
  expect(parts).toContainEqual({ type: 'text_delta', content: 'done: hi' })
  expect(parts.at(-1)).toEqual({ type: 'metadata', usage: { input_tokens: 1, output_tokens: 2 } })
})

test('tool that throws feeds an error string back, does not crash', async () => {
  const callLLM = scriptedLLM([
    [{ type: 'tool_call', id: '1', name: 'boom', arguments: {} }, { type: 'done' }],
    [{ type: 'text', delta: 'recovered' }, { type: 'done' }],
  ])
  const tools: ToolDef[] = [
    { name: 'boom', description: '', parameters: {}, execute: () => { throw new Error('nope') } },
  ]
  const parts = await collect(runAgent({ messages: [], tools, callLLM, ctx, signal: ctx.signal }))
  expect(parts).toContainEqual({ type: 'text_delta', content: 'recovered' })
})

test('ctx.emit parts are yielded before the tool result message', async () => {
  const callLLM = scriptedLLM([
    [{ type: 'tool_call', id: '1', name: 'chart', arguments: {} }, { type: 'done' }],
    [{ type: 'text', delta: 'ok' }, { type: 'done' }],
  ])
  const tools: ToolDef[] = [
    {
      name: 'chart', description: '', parameters: {},
      execute: (_a, c) => { c.emit({ type: 'data', dataType: 'chart', data: [1, 2] }); return 'made chart' },
    },
  ]
  const parts = await collect(runAgent({ messages: [], tools, callLLM, ctx, signal: ctx.signal }))
  expect(parts[0]).toEqual({ type: 'data', dataType: 'chart', data: [1, 2] })
})

test('stops at maxSteps even if model keeps calling tools', async () => {
  const callLLM = scriptedLLM([
    [{ type: 'tool_call', id: '1', name: 'loop', arguments: {} }, { type: 'done' }],
    [{ type: 'tool_call', id: '2', name: 'loop', arguments: {} }, { type: 'done' }],
  ])
  const tools: ToolDef[] = [{ name: 'loop', description: '', parameters: {}, execute: () => 'again' }]
  const parts = await collect(runAgent({ messages: [], tools, callLLM, ctx, maxSteps: 2, signal: ctx.signal }))
  // final part is always metadata; loop terminated without hanging
  expect(parts.at(-1)?.type).toBe('metadata')
})
