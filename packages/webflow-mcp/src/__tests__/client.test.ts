import { describe, it, expect, vi, beforeEach } from "vitest";
import { WebflowClient } from "../api/client.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("WebflowClient", () => {
  let client: WebflowClient;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new WebflowClient({
      apiToken: "wf-test-token-abc",
    });
  });

  it("sends Bearer token in Authorization header", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ sites: [] }));

    await client.get("sites");

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer wf-test-token-abc");
  });

  it("constructs correct API URLs with v2 base", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ sites: [] }));

    await client.get("sites");

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain("https://api.webflow.com/v2/sites");
  });

  it("sends GET with query params", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ items: [] }));

    await client.get("collections/abc/items", { limit: 25, offset: 0 });

    const [url] = mockFetch.mock.calls[0] as [string];
    const parsed = new URL(url);
    expect(parsed.searchParams.get("limit")).toBe("25");
    expect(parsed.searchParams.get("offset")).toBe("0");
  });

  it("sends POST with body", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: "item1" }));

    await client.post("collections/abc/items", { fieldData: { name: "Test" } });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string);
    expect(body.fieldData.name).toBe("Test");
  });

  it("sends PUT with body", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: "item1" }));

    await client.put("collections/abc/items/item1", { fieldData: { name: "Updated" } });

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/items/item1");
    expect(init.method).toBe("PUT");
  });

  it("sends PATCH with body", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: "item1" }));

    await client.patch("collections/abc/items/item1", { fieldData: { name: "Patched" } });

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/items/item1");
    expect(init.method).toBe("PATCH");
  });

  it("sends DELETE request", async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await client.del("collections/abc/items/item1");

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/items/item1");
    expect(init.method).toBe("DELETE");
  });

  it("list helper defaults to limit 100", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ items: [] }));

    await client.list("collections/abc/items");

    const [url] = mockFetch.mock.calls[0] as [string];
    const parsed = new URL(url);
    expect(parsed.searchParams.get("limit")).toBe("100");
  });

  it("handles error responses", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ msg: "Not Found", code: 404, name: "NotFoundError" }, 404),
    );

    await expect(client.get("sites/nonexistent")).rejects.toThrow();
  });
});
