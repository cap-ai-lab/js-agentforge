import type { CallLLM, Ctx, Message, ToolCall, ToolDef } from './types.js'
import type { Part } from '../protocol/types.js'

export async function* runAgent(opts: {
  messages: Message[]
  tools: ToolDef[]
  callLLM: CallLLM
  ctx: Ctx
  maxSteps?: number
  signal: AbortSignal
}): AsyncGenerator<Part> {
  const { messages, tools, callLLM, ctx, signal } = opts
  const maxSteps = opts.maxSteps ?? 8
  let totalIn = 0
  let totalOut = 0

  for (let step = 1; step <= maxSteps; step++) {
    let assistantText = ''
    const toolCalls: ToolCall[] = []

    for await (const ev of callLLM(messages, tools, signal)) {
      if (signal.aborted) { yield metadata(); return }
      if (ev.type === 'text') {
        assistantText += ev.delta
        yield { type: 'text_delta', content: ev.delta }
      } else if (ev.type === 'tool_call') {
        toolCalls.push({ id: ev.id, name: ev.name, arguments: ev.arguments })
      } else if (ev.type === 'usage') {
        totalIn += ev.input_tokens
        totalOut += ev.output_tokens
      }
    }

    messages.push({ role: 'assistant', content: assistantText, tool_calls: toolCalls.length ? toolCalls : undefined })

    if (toolCalls.length === 0) break        // final answer
    if (step === maxSteps) break             // safety brake

    for (const tc of toolCalls) {
      const buffer: Part[] = []
      ctx.emit = (part) => { buffer.push(part) }
      const tool = tools.find((t) => t.name === tc.name)
      let result: string
      try {
        result = tool
          ? await tool.execute(tc.arguments, ctx)
          : `ERROR: unknown tool ${tc.name}`
      } catch (e) {
        result = `ERROR: ${e instanceof Error ? e.message : String(e)}`
      }
      for (const part of buffer) yield part
      messages.push({ role: 'tool', content: result, tool_call_id: tc.id })
    }
  }

  yield metadata()

  function metadata(): Part {
    return { type: 'metadata', usage: { input_tokens: totalIn, output_tokens: totalOut } }
  }
}
