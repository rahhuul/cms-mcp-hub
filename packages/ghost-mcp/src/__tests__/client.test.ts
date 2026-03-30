import { describe, it, expect, vi, beforeEach } from "vitest";
import { GhostClient } from "../api/client.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("GhostClient", () => {
  let client: GhostClient;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new GhostClient({
      url: "https://myblog.com",
      adminApiKey: "abc123:aabbccddee112233445566778899aabb",
    });
  });

  it("sends Ghost JWT in Authorization header", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ posts: [] }));

    await client.get("posts/");

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["Authorization"]).toMatch(/^Ghost /);

    // Verify it's a valid JWT format
    const token = headers["Authorization"]!.replace("Ghost ", "");
    const parts = token.split(".");
    expect(parts).toHaveLength(3);
  });

  it("constructs correct Admin API URLs", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ posts: [] }));

    await client.get("posts/", { limit: 10, page: 2 });

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain("https://myblog.com/ghost/api/admin/posts/");
    const parsed = new URL(url);
    expect(parsed.searchParams.get("limit")).toBe("10");
    expect(parsed.searchParams.get("page")).toBe("2");
  });

  it("sends POST with body", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ posts: [{ id: "1" }] }));

    await client.post("posts/", { posts: [{ title: "Test" }] });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string);
    expect(body.posts[0].title).toBe("Test");
  });

  it("sends PUT with body", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ posts: [{ id: "1" }] }));

    await client.put("posts/1/", { posts: [{ title: "Updated" }] });

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/posts/1/");
    expect(init.method).toBe("PUT");
  });

  it("sends DELETE request", async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await client.delete("posts/1/");

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/posts/1/");
    expect(init.method).toBe("DELETE");
  });
});
