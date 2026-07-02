# my-agentlet

Built with [agentforge](https://github.com/you/agentforge).

## Develop
1. `cp .env.example .env` and fill in `OPENAI_API_KEY` + `MODEL`
2. `npm install`
3. `npm run dev` — opens a local test UI
4. Add capabilities: drop a file in `agents/`. `agents/weather.ts` → `POST /weather`.

## Deploy
`npm start`, then register each agentlet on the platform with
`endpointUrl = https://<host>/<filename>`.
