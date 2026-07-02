export type IncomingPart = { text: string }
export type IncomingMessage = { role: 'user' | 'assistant'; parts: IncomingPart[] }
export type A2ARequest = { id: string; message: IncomingMessage; history: IncomingMessage[] }

export type Part =
  | { type: 'text_delta'; content: string }
  | { type: 'file'; mimeType: string; data: string; filename?: string }
  | { type: 'data'; dataType: string; title?: string; data: unknown }
  | { type: 'metadata'; usage: { input_tokens: number; output_tokens: number } }
