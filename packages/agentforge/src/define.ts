import type { ToolDef } from './core/types.js'

export type AgentDescriptor = {
  system?: string
  tools: ToolDef[]
  options: { maxSteps?: number }
}

export function defineTool(input: ToolDef): ToolDef {
  return input
}

export function defineAgent(input: {
  system?: string
  tools?: ToolDef[]
  maxSteps?: number
}): AgentDescriptor {
  const tools = input.tools ?? []
  const seen = new Set<string>()
  for (const t of tools) {
    if (seen.has(t.name)) throw new Error(`duplicate tool name: ${t.name}`)
    seen.add(t.name)
  }
  return { system: input.system, tools, options: { maxSteps: input.maxSteps } }
}
