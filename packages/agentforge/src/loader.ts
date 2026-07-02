import { readdir } from 'node:fs/promises'
import { join, extname, basename } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { AgentDescriptor } from './define.js'

const EXTS = new Set(['.ts', '.js', '.mjs'])

function isAgent(x: unknown): x is AgentDescriptor {
  return !!x && typeof x === 'object' && Array.isArray((x as AgentDescriptor).tools)
}

export async function loadAgents(dir: string): Promise<Map<string, AgentDescriptor>> {
  const reg = new Map<string, AgentDescriptor>()
  let files: string[]
  try {
    files = await readdir(dir)
  } catch {
    return reg
  }
  for (const f of files) {
    if (!EXTS.has(extname(f))) continue
    const mod = await import(pathToFileURL(join(dir, f)).href)
    const def = mod.default
    if (isAgent(def)) reg.set(basename(f, extname(f)), def)
  }
  return reg
}
