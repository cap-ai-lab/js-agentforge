import type { A2ARequest, IncomingMessage, Part } from './types.js'

const flatten = (m: IncomingMessage) => m.parts.map((p) => p.text).join('')

export function parseRequest(body: A2ARequest): {
  message: string
  history: { role: 'user' | 'assistant'; content: string }[]
} {
  return {
    message: flatten(body.message),
    history: (body.history ?? []).map((m) => ({ role: m.role, content: flatten(m) })),
  }
}

export function encodePart(part: Part): string {
  return `data: ${JSON.stringify(part)}\n\n`
}
