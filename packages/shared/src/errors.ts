/**
 * Error handling utilities for CMS MCP Hub
 */

import type { ApiErrorDetails, McpErrorContent, McpToolResponse } from "./types/index.js";

/**
 * Custom error class for API-related errors with structured details.
 */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly retryable: boolean;

  constructor(message: string, statusCode: number, retryable = false) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.retryable = retryable;
  }

  toDetails(tool?: string): ApiErrorDetails {
    return {
      message: this.message,
      statusCode: this.statusCode,
      tool,
      suggestion: getSuggestion(this.statusCode),
      retryable: this.retryable,
    };
  }
}

/**
 * Error thrown when required configuration/environment variables are missing.
 */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

/**
 * Returns an actionable suggestion based on HTTP status code.
 */
export function getSuggestion(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return "Check the request parameters — one or more values may be invalid.";
    case 401:
      return "Authentication failed. Verify your API key or token is correct and not expired.";
    case 403:
      return "Access denied. Check that your API credentials have the required permissions.";
    case 404:
      return "Resource not found. Verify the ID or slug exists.";
    case 409:
      return "Conflict — the resource may have been modified by another request. Retry with fresh data.";
    case 422:
      return "Validation failed. Check that all required fields are present and values are valid.";
    case 429:
      return "Rate limit exceeded. The request will be retried automatically.";
    case 500:
      return "The CMS API returned a server error. Try again in a few moments.";
    case 502:
    case 503:
    case 504:
      return "The CMS API is temporarily unavailable. Try again in a few moments.";
    default:
      return "An unexpected error occurred. Check your API credentials and try again.";
  }
}

/**
 * Determines if an HTTP status code indicates a retryable error.
 */
export function isRetryableStatus(statusCode: number): boolean {
  return statusCode === 429 || statusCode === 502 || statusCode === 503 || statusCode === 504;
}

/**
 * Formats any error into a structured MCP error response.
 */
export function formatError(error: unknown, toolName: string): string {
  if (error instanceof ApiError) {
    const content: McpErrorContent = {
      error: error.message,
      tool: toolName,
      statusCode: error.statusCode,
      suggestion: getSuggestion(error.statusCode),
    };
    return JSON.stringify(content);
  }

  const content: McpErrorContent = {
    error: error instanceof Error ? error.message : "Unknown error",
    tool: toolName,
    suggestion: "Check your API credentials and try again.",
  };
  return JSON.stringify(content);
}

/**
 * Creates an MCP-compatible error response object.
 */
export function mcpError(error: unknown, toolName: string): McpToolResponse {
  return {
    content: [{ type: "text", text: formatError(error, toolName) }],
    isError: true,
  };
}

/**
 * Creates an MCP-compatible success response object.
 */
export function mcpSuccess(data: unknown): McpToolResponse {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}
