import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiClient } from "../api-client.js";
import { ApiError } from "../errors.js";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ message }), {
    status,
    statusText: "Error",
    headers: { "Content-Type": "application/json" },
  });
}

describe("ApiClient", () => {
  let client: ApiClient;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new ApiClient({
      baseUrl: "https://api.example.com",
      headers: { Authorization: "Bearer test-key" },
      maxRetries: 1,
      rateLimitPerSecond: 100,
    });
  });

  it("makes successful GET request", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: 1, name: "Test" }));

    const result = await client.get<{ id: number; name: string }>("/items/1");

    expect(result).toEqual({ id: 1, name: "Test" });
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.example.com/items/1");
    expect(init.method).toBe("GET");
  });

  it("makes POST request with body", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: 2 }));

    await client.post("/items", { name: "New" });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ name: "New" }));
  });

  it("adds query parameters", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse([]));

    await client.get("/items", { limit: 10, offset: 20, filter: undefined });

    const [url] = mockFetch.mock.calls[0] as [string];
    const parsed = new URL(url);
    expect(parsed.searchParams.get("limit")).toBe("10");
    expect(parsed.searchParams.get("offset")).toBe("20");
    expect(parsed.searchParams.has("filter")).toBe(false);
  });

  it("throws ApiError on 4xx response", async () => {
    mockFetch.mockResolvedValue(errorResponse("Not found", 404));

    try {
      await client.get("/items/999");
      expect.unreachable("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).statusCode).toBe(404);
      expect((error as ApiError).message).toBe("Not found");
    }
  });

  it("retries on 429 then succeeds", async () => {
    mockFetch
      .mockResolvedValueOnce(errorResponse("Rate limited", 429))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    const result = await client.get<{ ok: boolean }>("/items");

    expect(result).toEqual({ ok: true });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("retries on 503 then fails", async () => {
    mockFetch
      .mockResolvedValue(errorResponse("Unavailable", 503));

    await expect(client.get("/items")).rejects.toThrow(ApiError);
    // 1 initial + 1 retry = 2 calls
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("does not retry on 400", async () => {
    mockFetch.mockResolvedValue(errorResponse("Bad request", 400));

    await expect(client.get("/items")).rejects.toThrow(ApiError);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("handles 204 No Content", async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

    const result = await client.delete("/items/1");
    expect(result).toBeUndefined();
  });

  it("includes custom headers", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}));

    await client.get("/items");

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer test-key");
    expect(headers["Content-Type"]).toBe("application/json");
  });
});
