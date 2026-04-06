import { describe, it, expect, vi, beforeEach } from "vitest";
import { ContentfulClient } from "../api/client.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("ContentfulClient", () => {
  let client: ContentfulClient;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new ContentfulClient({
      spaceId: "test-space",
      managementToken: "cfpat-test-token-123",
      environmentId: "master",
    });
  });

  it("sends Bearer token in Authorization header", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ items: [] }));

    await client.get("entries");

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer cfpat-test-token-123");
  });

  it("sends correct Content-Type for Contentful management API", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ items: [] }));

    await client.get("entries");

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["Content-Type"]).toBe("application/vnd.contentful.management.v1+json");
  });

  it("constructs correct API URLs with space and environment", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ items: [] }));

    await client.get("entries");

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain("https://api.contentful.com/spaces/test-space/environments/master/entries");
  });

  it("sends GET with query params", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ items: [] }));

    await client.get("entries", { content_type: "blogPost", limit: 10 });

    const [url] = mockFetch.mock.calls[0] as [string];
    const parsed = new URL(url);
    expect(parsed.searchParams.get("content_type")).toBe("blogPost");
    expect(parsed.searchParams.get("limit")).toBe("10");
  });

  it("sends POST with body", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ sys: { id: "entry1" } }));

    await client.post("entries", { fields: { title: { "en-US": "Hello" } } });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string);
    expect(body.fields.title["en-US"]).toBe("Hello");
  });

  it("sends PUT with body", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ sys: { id: "entry1" } }));

    await client.put("entries/entry1", { fields: { title: { "en-US": "Updated" } } });

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/entries/entry1");
    expect(init.method).toBe("PUT");
  });

  it("sends DELETE request", async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await client.delete("entries/entry1");

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/entries/entry1");
    expect(init.method).toBe("DELETE");
  });

  it("sends PUT with X-Contentful-Version header", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ sys: { id: "entry1", version: 3 } }));

    await client.putWithVersion("entries/entry1", 2, { fields: {} });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["X-Contentful-Version"]).toBe("2");
    expect(init.method).toBe("PUT");
  });

  it("sends DELETE with X-Contentful-Version header", async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await client.deleteWithVersion("entries/entry1", 5);

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["X-Contentful-Version"]).toBe("5");
    expect(init.method).toBe("DELETE");
  });

  it("uses space-scoped URL for getSpace requests", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ items: [] }));

    await client.getSpace("environments");

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain("https://api.contentful.com/spaces/test-space/environments");
    // Should NOT contain /environments/master/environments (double nesting)
    expect(url).not.toContain("/environments/master/environments");
  });

  it("handles error responses", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(
        { message: "The resource could not be found", sys: { type: "Error", id: "NotFound" } },
        404,
      ),
    );

    await expect(client.get("entries/nonexistent")).rejects.toThrow();
  });
});
