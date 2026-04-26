/**
 * Shared type definitions for CMS MCP Hub
 */

/** Configuration for the base API client */
export interface ApiClientConfig {
  baseUrl: string;
  headers?: Record<string, string>;
  maxRetries?: number;
  rateLimitPerSecond?: number;
  timeoutMs?: number;
}

/** Options for a single API request */
export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

/** Structured API error details */
export interface ApiErrorDetails {
  message: string;
  statusCode: number;
  tool?: string;
  suggestion?: string;
  retryable: boolean;
}

/** Standard pagination parameters */
export interface PaginationParams {
  limit: number;
  offset: number;
}

/** Paginated response wrapper */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/** Log level for structured logger */
export type LogLevel = "debug" | "info" | "warn" | "error";

/** Structured log entry */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

/** MCP tool error response content */
export interface McpErrorContent {
  error: string;
  tool: string;
  statusCode?: number;
  suggestion: string;
}

/** MCP tool success response */
export interface McpToolResponse {
  [key: string]: unknown;
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}
