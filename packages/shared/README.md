# @cmsmcp/shared

Shared utilities for [CMS MCP Hub](https://github.com/rahhuul/cms-mcp-hub) — the monorepo of MCP servers for every major CMS platform.

## What's inside

- **ApiClient** — HTTP client with retry (exponential backoff + jitter), rate limiting (token bucket), 429/5xx auto-retry
- **Error handling** — `ApiError`, `formatError()`, `mcpError()`, `mcpSuccess()` for consistent MCP responses
- **Pagination** — `PaginationSchema` (Zod), `paginate()`, `toPageParams()`, `fetchAllPages()`
- **RateLimiter** — Token-bucket rate limiter
- **Logger** — Structured JSON logger to stderr (stdout reserved for MCP stdio)
- **Environment helpers** — `requireEnv()`, `optionalEnv()`, `optionalEnvInt()`

## Usage

```typescript
import { ApiClient, createLogger, mcpSuccess, mcpError, requireEnv } from "@cmsmcp/shared";
```

## Part of CMS MCP Hub

This package is used by all `@cmsmcp/*` MCP servers. See the [main repo](https://github.com/rahhuul/cms-mcp-hub) for the full project.

## License

MIT
