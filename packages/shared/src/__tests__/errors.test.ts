import { describe, it, expect } from "vitest";
import { ApiError, ConfigError, formatError, getSuggestion, isRetryableStatus, mcpError, mcpSuccess } from "../errors.js";

describe("ApiError", () => {
  it("creates error with status code and retryable flag", () => {
    const error = new ApiError("Not found", 404, false);
    expect(error.message).toBe("Not found");
    expect(error.statusCode).toBe(404);
    expect(error.retryable).toBe(false);
    expect(error.name).toBe("ApiError");
  });

  it("toDetails includes suggestion", () => {
    const error = new ApiError("Unauthorized", 401);
    const details = error.toDetails("test_tool");
    expect(details.tool).toBe("test_tool");
    expect(details.suggestion).toContain("API key");
  });
});

describe("ConfigError", () => {
  it("creates config error", () => {
    const error = new ConfigError("Missing API key");
    expect(error.name).toBe("ConfigError");
    expect(error.message).toBe("Missing API key");
  });
});

describe("getSuggestion", () => {
  it("returns appropriate suggestion for each status code", () => {
    expect(getSuggestion(401)).toContain("Authentication");
    expect(getSuggestion(403)).toContain("permissions");
    expect(getSuggestion(404)).toContain("not found");
    expect(getSuggestion(429)).toContain("Rate limit");
    expect(getSuggestion(500)).toContain("server error");
    expect(getSuggestion(999)).toContain("unexpected");
  });
});

describe("isRetryableStatus", () => {
  it("returns true for retryable status codes", () => {
    expect(isRetryableStatus(429)).toBe(true);
    expect(isRetryableStatus(502)).toBe(true);
    expect(isRetryableStatus(503)).toBe(true);
    expect(isRetryableStatus(504)).toBe(true);
  });

  it("returns false for non-retryable status codes", () => {
    expect(isRetryableStatus(400)).toBe(false);
    expect(isRetryableStatus(401)).toBe(false);
    expect(isRetryableStatus(404)).toBe(false);
    expect(isRetryableStatus(500)).toBe(false);
  });
});

describe("formatError", () => {
  it("formats ApiError with status code", () => {
    const error = new ApiError("Forbidden", 403);
    const result = JSON.parse(formatError(error, "test_tool"));
    expect(result.error).toBe("Forbidden");
    expect(result.tool).toBe("test_tool");
    expect(result.statusCode).toBe(403);
    expect(result.suggestion).toBeDefined();
  });

  it("formats generic Error", () => {
    const error = new Error("Something broke");
    const result = JSON.parse(formatError(error, "test_tool"));
    expect(result.error).toBe("Something broke");
    expect(result.tool).toBe("test_tool");
  });

  it("formats non-Error values", () => {
    const result = JSON.parse(formatError("string error", "test_tool"));
    expect(result.error).toBe("Unknown error");
  });
});

describe("mcpError", () => {
  it("returns MCP error response shape", () => {
    const response = mcpError(new Error("fail"), "test_tool");
    expect(response.isError).toBe(true);
    expect(response.content).toHaveLength(1);
    expect(response.content[0]!.type).toBe("text");
  });
});

describe("mcpSuccess", () => {
  it("returns MCP success response shape", () => {
    const response = mcpSuccess({ id: 1, name: "test" });
    expect(response.isError).toBeUndefined();
    expect(response.content).toHaveLength(1);
    const parsed = JSON.parse(response.content[0]!.text);
    expect(parsed.id).toBe(1);
  });
});
