# agentforge

Write only `agents/*.ts` (system prompt + tools) and get a running A2A-compatible endpoint.

## Quickstart

```bash
npm create agentforge my-agent
cd my-agent
cp .env.example .env   # fill in OPENAI_API_KEY + MODEL
npm install
npm run dev            # opens http://localhost:3000/
```

## defineAgent example

```ts
import { defineAgent, defineTool } from 'agentforge'

export default defineAgent({
  system: 'You are a weather assistant.',
  tools: [
    defineTool({
      name: 'get_weather',
      description: 'Get current weather for a city',
      parameters: {
        type: 'object',
        properties: { city: { type: 'string' } },
        required: ['city'],
      },
      async execute({ city }, ctx) {
        const d = await (await fetch(`https://api.weather/${city}`, { signal: ctx.signal })).json()
        ctx.emit({ type: 'data', dataType: 'weather', data: d })  // visible to user
        return `Weather in ${city}: ${d.temp}°C`                  // fed back to LLM
      },
    }),
  ],
})
```

## Environment variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `OPENAI_API_KEY` | ✅ | — | LLM key |
| `MODEL` | ✅ | — | Model name (e.g. `gpt-4o-mini`) |
| `OPENAI_BASE_URL` | | `https://api.openai.com/v1` | Swap provider / self-hosted model |
| `PORT` | | `3000` | Listen port |
| `PLATFORM_SECRET` | | off | Auth: validates `Authorization: Bearer` |
| `LOG_LEVEL` | | `info` | Log level |

## Porting to other languages

See [`SPEC.md`](./SPEC.md) — language-agnostic L1 protocol + L2 core pseudocode.
Rule: copy logic and data (L1+L2), rewrite I/O and syntax (L3+L4).
