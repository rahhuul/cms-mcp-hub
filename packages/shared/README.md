# @cmsmcp/shared

Shared utilities for [CMS MCP Hub](https://github.com/rahhuul/cms-mcp-hub) -- the monorepo of MCP servers for every major CMS platform.

[![npm version](https://img.shields.io/npm/v/@cmsmcp/shared.svg)](https://www.npmjs.com/package/@cmsmcp/shared)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](../../LICENSE)

## Overview

`@cmsmcp/shared` provides the foundational utilities used by all `@cmsmcp/*` MCP server packages. It handles HTTP communication, error formatting, pagination, rate limiting, logging, and environment variable management so each CMS package can focus on its platform-specific logic.

## Modules

### ApiClient

HTTP client with built-in retry (exponential backoff + jitter), rate limiting (token bucket), and automatic 429/5xx retry handling.

```typescript
import { ApiClient } from "@cmsmcp/shared";

const client = new ApiClient({
  baseUrl: "https://api.example.com",
  apiKey: "your-key",
  maxRetries: 3,
  rateLimitPerSecond: 10,
});

const data = await client.request<MyType>("/endpoint");
```

### Error Handling

Consistent MCP-formatted error and success responses.

- `ApiError` -- Typed API error with status code
- `ConfigError` -- Missing or invalid configuration
- `formatError(error, toolName)` -- Format any error into a structured MCP error response
- `getSuggestion(statusCode)` -- Actionable fix suggestions based on HTTP status
- `mcpError(message)` -- Create an MCP error content response
- `mcpSuccess(data)` -- Create an MCP success content response

```typescript
import { formatError, mcpSuccess, mcpError } from "@cmsmcp/shared";

// Success
return mcpSuccess({ posts: data });

// Error
return mcpError(formatError(error, "wp_list_posts"));
```

### Pagination

Zod-validated pagination schema and helpers for consistent pagination across all CMS platforms.

- `PaginationSchema` -- Zod schema with `limit` and `offset` fields
- `paginate(items, params)` -- Paginate an in-memory array
- `toPageParams(params)` -- Convert to API-specific query parameters
- `fetchAllPages(fetcher)` -- Auto-paginate through all pages of a remote API
- `DEFAULT_PAGE_LIMIT` (25), `MAX_PAGE_LIMIT` (100)

### RateLimiter

Token-bucket rate limiter to prevent hitting API rate limits.

```typescript
import { RateLimiter } from "@cmsmcp/shared";

const limiter = new RateLimiter(10); // 10 requests/second
await limiter.acquire();
```

### Logger

Structured JSON logger that writes to stderr (stdout is reserved for MCP stdio transport).

```typescript
import { createLogger } from "@cmsmcp/shared";

const logger = createLogger("wordpress");
logger.info("Connected", { url: "https://mysite.com" });
logger.error("Failed to fetch", { statusCode: 401 });
```

### Environment Helpers

Safe environment variable access with clear error messages.

```typescript
import { requireEnv, optionalEnv, optionalEnvInt } from "@cmsmcp/shared";

const apiKey = requireEnv("GHOST_ADMIN_API_KEY"); // throws if missing
const url = optionalEnv("GHOST_URL", "http://localhost:2368");
const timeout = optionalEnvInt("TIMEOUT", 30000);
```

## Installation

```bash
npm install @cmsmcp/shared
```

## Development

```bash
# Build
npx turbo build --filter=@cmsmcp/shared

# Test
npx turbo test --filter=@cmsmcp/shared

# Dev mode (watch)
npx turbo dev --filter=@cmsmcp/shared
```

## Exported Types

| Type | Description |
|------|-------------|
| `ApiClientConfig` | Configuration for ApiClient constructor |
| `ApiErrorDetails` | Structured error details |
| `LogEntry` | Structured log entry shape |
| `LogLevel` | `"debug" \| "info" \| "warn" \| "error"` |
| `McpErrorContent` | MCP error response content |
| `McpToolResponse` | MCP tool response wrapper |
| `PaginatedResponse<T>` | Paginated API response |
| `PaginationParams` | Pagination input parameters |
| `RequestOptions` | Extended fetch request options |

## Part of CMS MCP Hub

This package is the shared foundation for all `@cmsmcp/*` MCP servers. See the [main repo](https://github.com/rahhuul/cms-mcp-hub) for the full project.

## License

MIT
