import Fastify, { type FastifyInstance } from 'fastify'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join as pathJoin } from 'node:path'
import type { AgentDescriptor } from '../define.js'
import type { CallLLM, Ctx } from '../core/types.js'
import { runAgent } from '../core/loop.js'
import { buildMessages } from '../core/messages.js'
import { parseRequest, encodePart } from '../protocol/sse.js'
import type { A2ARequest } from '../protocol/types.js'

const REQUEST_TIMEOUT_MS = 30_000

export function buildServer(
  registry: Map<string, AgentDescriptor>,
  opts: { callLLM: CallLLM; platformSecret?: string; dev?: boolean },
): FastifyInstance {
  const app = Fastify({ logger: true })

  if (opts.platformSecret) {
    app.addHook('onRequest', async (req, reply) => {
      if (req.method !== 'POST') return
      const token = (req.headers.authorization ?? '').replace('Bearer ', '')
      if (token !== opts.platformSecret) reply.code(401).send({ error: 'Unauthorized' })
    })
  }

  app.get('/health', async () => ({ ok: true }))

  if (opts.dev) {
    app.get('/_agents', async () => [...registry.keys()])
    const uiPath = pathJoin(dirname(fileURLToPath(import.meta.url)), '..', 'devui', 'index.html')
    const html = readFileSync(uiPath, 'utf8')
    app.get('/', async (_req, reply) => reply.type('text/html').send(html))
  }

  app.post('/:name', async (req, reply) => {
    const name = (req.params as { name: string }).name
    const agent = registry.get(name)
    if (!agent) return reply.code(404).send({ error: 'Unknown agentlet' })

    const { message, history } = parseRequest(req.body as A2ARequest)
    const messages = buildMessages(agent.system, history, message)

    const ac = new AbortController()
    const timer = setTimeout(() => ac.abort(), REQUEST_TIMEOUT_MS)
    req.raw.on('close', () => ac.abort())

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })

    const ctx: Ctx = { signal: ac.signal, memory: '', emit: () => {} }
    try {
      for await (const part of runAgent({
        messages, tools: agent.tools, callLLM: opts.callLLM, ctx,
        maxSteps: agent.options.maxSteps, signal: ac.signal,
      })) {
        reply.raw.write(encodePart(part))
      }
    } catch (err) {
      req.log.error({ err }, 'agentlet run failed')
    } finally {
      clearTimeout(timer)
      reply.raw.end()
    }
  })

  return app
}
