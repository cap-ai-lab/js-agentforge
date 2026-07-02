import type { Message } from './types.js'

export function buildMessages(
  system: string | undefined,
  history: { role: 'user' | 'assistant'; content: string }[],
  userMessage: string,
): Message[] {
  const msgs: Message[] = []
  if (system) msgs.push({ role: 'system', content: system })
  for (const h of history) msgs.push({ role: h.role, content: h.content })
  msgs.push({ role: 'user', content: userMessage })
  return msgs
}
