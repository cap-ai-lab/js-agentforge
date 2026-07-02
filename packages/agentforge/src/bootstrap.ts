import { join } from 'node:path'
import type { FastifyInstance } from 'fastify'
import { makeOpenAILLM } from './adapters/llm.js'
import { buildServer } from './adapters/http.js'
import { loadAgents } from './loader.js'

export type Config = {
  apiKey: string
  model: string
  baseUrl: string
  port: number
  platformSecret?: string
}

export function loadConfig(env: Record<string, string | undefined>): Config {
  const req = (k: string): string => {
    const v = env[k]
    if (!v) throw new Error(`Missing required env var: ${k}`)
    return v
  }
  return {
    apiKey: req('OPENAI_API_KEY'),
    model: req('MODEL'),
    baseUrl: env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
    port: env.PORT ? Number(env.PORT) : 3000,
    platformSecret: env.PLATFORM_SECRET,
  }
}

export async function start(opts: { dev: boolean; cwd?: string }): Promise<FastifyInstance> {
  const cfg = loadConfig(process.env)
  const cwd = opts.cwd ?? process.cwd()
  const registry = await loadAgents(join(cwd, 'agents'))
  if (registry.size === 0) throw new Error('No agentlets found in ./agents')

  const callLLM = makeOpenAILLM({ baseUrl: cfg.baseUrl, apiKey: cfg.apiKey, model: cfg.model })
  const app = buildServer(registry, { callLLM, platformSecret: cfg.platformSecret, dev: opts.dev })
  await app.listen({ port: cfg.port, host: '0.0.0.0' })
  return app
}
