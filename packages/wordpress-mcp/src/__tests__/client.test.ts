import { describe, it, expect, vi, beforeEach } from "vitest";
import { WpClient } from "../api/client.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

describe("WpClient", () => {
  let client: WpClient;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new WpClient({ url: "http://localhost/wp", username: "admin", applicationPassword: "xxxx xxxx xxxx" });
  });

  it("sends Basic Auth header", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse([]));
    await client.get("posts");
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const h = init.headers as Record<string, string>;
    expect(h["Authorization"]).toMatch(/^Basic /);
    const decoded = Buffer.from(h["Authorization"]!.replace("Basic ", ""), "base64").toString();
    expect(decoded).toBe("admin:xxxx xxxx xxxx");
  });

  it("constructs correct WP REST API URL", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse([]));
    await client.get("posts", { status: "publish" });
    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain("http://localhost/wp/wp-json/wp/v2/posts");
    expect(url).toContain("status=publish");
  });

  it("list adds page and per_page", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse([]));
    await client.list("pages", {}, 2, 50);
    const [url] = mockFetch.mock.calls[0] as [string];
    const parsed = new URL(url);
    expect(parsed.searchParams.get("page")).toBe("2");
    expect(parsed.searchParams.get("per_page")).toBe("50");
  });

  it("post sends body", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: 1 }));
    await client.post("posts", { title: "Test", status: "draft" });
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ title: "Test", status: "draft" });
  });

  it("del sends DELETE", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ deleted: true }));
    await client.del("posts/1", { force: true });
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("DELETE");
    expect(url).toContain("force=true");
  });
});
