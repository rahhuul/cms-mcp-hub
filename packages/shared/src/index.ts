/**
 * @cmsmcp/shared — Common utilities for CMS MCP Hub
 */

// API Client
export { ApiClient } from "./api-client.js";

// Errors
export { ApiError, ConfigError, formatError, getSuggestion, isRetryableStatus, mcpError, mcpSuccess } from "./errors.js";

// Pagination
export {
  DEFAULT_PAGE_LIMIT,
  MAX_PAGE_LIMIT,
  PaginationSchema,
  fetchAllPages,
  paginate,
  paginationToQuery,
  toPageParams,
} from "./pagination.js";

// Rate Limiter
export { RateLimiter } from "./rate-limiter.js";

// Logger
export { Logger, createLogger } from "./logger.js";

// Environment
export { requireEnv, optionalEnv, optionalEnvInt } from "./env.js";

// Types
export type {
  ApiClientConfig,
  ApiErrorDetails,
  LogEntry,
  LogLevel,
  McpErrorContent,
  McpToolResponse,
  PaginatedResponse,
  PaginationParams,
  RequestOptions,
} from "./types/index.js";
