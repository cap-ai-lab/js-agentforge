import type { CallLLM, LLMEvent, Message, ToolDef } from '../core/types.js'

type Frag = { id: string; name: string; args: string }

export async function* parseOpenAIStream(chunks: AsyncIterable<string>): AsyncGenerator<LLMEvent> {
  const frags: Frag[] = []           // tool_call fragments accumulated by index
  let finish: string | undefined

  for await (const line of chunks) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('data:')) continue
    const payload = trimmed.slice(5).trim()
    if (payload === '[DONE]') break
    let json: any
    try { json = JSON.parse(payload) } catch { continue }

    const choice = json.choices?.[0]
    const delta = choice?.delta
    if (delta?.content) yield { type: 'text', delta: delta.content }

    for (const tc of delta?.tool_calls ?? []) {
      const i = tc.index ?? 0
      frags[i] ??= { id: '', name: '', args: '' }
      if (tc.id) frags[i]!.id = tc.id
      if (tc.function?.name) frags[i]!.name = tc.function.name
      if (tc.function?.arguments) frags[i]!.args += tc.function.arguments
    }

    if (choice?.finish_reason) finish = choice.finish_reason
    if (json.usage) {
      yield {
        type: 'usage',
        input_tokens: json.usage.prompt_tokens ?? 0,
        output_tokens: json.usage.completion_tokens ?? 0,
      }
    }
  }

  for (const f of frags) {
    if (!f) continue
    let args: Record<string, unknown> = {}
    try { args = f.args ? JSON.parse(f.args) : {} } catch { args = {} }
    yield { type: 'tool_call', id: f.id, name: f.name, arguments: args }
  }
  yield { type: 'done', finish_reason: finish }
}

async function* readLines(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const parts = buf.split('\n')
    buf = parts.pop() ?? ''
    for (const p of parts) yield p
  }
  if (buf) yield buf
}

export function makeOpenAILLM(config: { baseUrl: string; apiKey: string; model: string }): CallLLM {
  return async function* (messages: Message[], tools: ToolDef[], signal: AbortSignal) {
    const res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
      signal,
      body: JSON.stringify({
        model: config.model,
        stream: true,
        stream_options: { include_usage: true },
        messages,
        tools: tools.length
          ? tools.map((t) => ({
              type: 'function',
              function: { name: t.name, description: t.description, parameters: t.parameters },
            }))
          : undefined,
      }),
    })
    if (!res.ok || !res.body) throw new Error(`LLM error ${res.status}`)
    yield* parseOpenAIStream(readLines(res.body))
  }
}
