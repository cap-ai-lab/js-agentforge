import type { Part } from '../protocol/types.js'

export type Role = 'system' | 'user' | 'assistant' | 'tool'

export type ToolCall = { id: string; name: string; arguments: Record<string, unknown> }

export type Message = {
  role: Role
  content: string
  tool_calls?: ToolCall[]
  tool_call_id?: string
}

export type Ctx = { signal: AbortSignal; memory: string; emit: (part: Part) => void }

export type ToolDef = {
  name: string
  description: string
  parameters: Record<string, unknown>
  execute: (args: Record<string, unknown>, ctx: Ctx) => Promise<string> | string
}

export type LLMEvent =
  | { type: 'text'; delta: string }
  | { type: 'tool_call'; id: string; name: string; arguments: Record<string, unknown> }
  | { type: 'usage'; input_tokens: number; output_tokens: number }
  | { type: 'done'; finish_reason?: string }

export type CallLLM = (
  messages: Message[],
  tools: ToolDef[],
  signal: AbortSignal,
) => AsyncGenerator<LLMEvent>
