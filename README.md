# Claude Local API

A local HTTP API that wraps the Claude Code CLI (`claude -p`) as a subprocess. It exposes a buffered "complete" endpoint and a streaming endpoint, both documented with Swagger/OpenAPI.

## Requirements

- Node.js 20+
- The `claude` CLI installed and authenticated on this machine

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

The server starts on `http://localhost:4000` by default.

- Swagger UI: `http://localhost:4000/docs`
- OpenAPI spec: `http://localhost:4000/docs/openapi.json`
- Health check: `http://localhost:4000/api/v1/health`

## Endpoints

### `POST /api/v1/claude/complete`

Spawns `claude -p`, waits for it to finish, and returns the full answer.

```json
{
  "prompt": "Write a haiku about the ocean",
  "format": "text"
}
```

`format` is `"text"` (plain answer) or `"json"` (full Claude Code result object, including cost, usage, and `structured_output` when `jsonSchema` is set).

### `POST /api/v1/claude/stream`

Spawns `claude -p --output-format stream-json` and streams the response as it's generated.

```json
{
  "prompt": "Write a haiku about the ocean",
  "format": "text"
}
```

`format` controls the wire format:

- `"text"` (default) — incremental plain-text chunks as they're generated
- `"ndjson"` — raw `stream-json` events passed through, one JSON object per line
- `"sse"` — each event wrapped as a Server-Sent Event

Note: `jsonSchema` output (`structured_output`) is only available on the final event once the run completes — it is not part of the incremental text stream. Use `format: "ndjson"` and read the last `result` event, or use `/complete` with `format: "json"`, to access it.

### Shared request options

Both endpoints accept:

| Field | Type | Description |
| --- | --- | --- |
| `prompt` | `string` | Required. The prompt sent to Claude Code. |
| `cwd` | `string` | Working directory for the subprocess. Defaults to `CLAUDE_DEFAULT_CWD`. |
| `model` | `string` | Model alias or full name (e.g. `sonnet`, `opus`). |
| `systemPrompt` | `string` | Overrides the default system prompt. |
| `appendSystemPrompt` | `string` | Appends to the default system prompt. |
| `allowedTools` | `string[]` | Tool names to allow (e.g. `["WebSearch", "Bash(git *)"]`). |
| `disallowedTools` | `string[]` | Tool names to deny. |
| `permissionMode` | `string` | `acceptEdits`, `auto`, `bypassPermissions`, `default`, `dontAsk`, or `plan`. |
| `maxBudgetUsd` | `number` | Maximum dollar amount to spend on API calls for the run. |
| `jsonSchema` | `object` | JSON Schema the final answer must conform to. |

`/complete` additionally accepts `timeoutMs` to abort the subprocess after a given duration.

## Authentication

Requests are unauthenticated by default. Set `API_KEY` in `.env` to require a matching `x-api-key` header on every request.

## Project structure

```
src/
  app.ts               Express app factory (middleware, routing)
  index.ts             Server entrypoint
  config/openapi.ts     OpenAPI registry + document generator
  routes/openapi.ts     Swagger UI + spec routes
  core/claude/          Subprocess runner for the claude CLI
  middleware/           Auth, validation, rate limiting, error handling
  utils/                createRoute helper, env, logger
  v1/
    routes/             Route definitions (createRoute wiring)
    controllers/        Business logic
    schemas/            Zod request/response schemas
```

Routes are declared with a `createRoute` helper (`src/utils/create-route.ts`) that validates requests against Zod schemas and auto-registers each route with the OpenAPI document.

## Scripts

- `npm run dev` — run with hot reload (`tsx watch`)
- `npm run build` — compile to `dist/`
- `npm start` — run the compiled build
- `npm run type-check` — type-check without emitting
- `npm run lint` / `npm run lint:fix` — lint
- `npm run format` — format with Prettier

## License

MIT, see [LICENSE](LICENSE).
