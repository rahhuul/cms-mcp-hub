import { describe, it, expect, vi, beforeEach } from "vitest";
import { YoastClient } from "../api/client.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("YoastClient", () => {
  let client: YoastClient;
  const expectedCredentials = Buffer.from("admin:app-pass-xyz").toString("base64");

  beforeEach(() => {
    mockFetch.mockReset();
    client = new YoastClient({
      url: "https://mysite.com",
      username: "admin",
      applicationPassword: "app-pass-xyz",
    });
  });

  it("sends Basic auth header", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: 1, title: { rendered: "Hello" } }));

    await client.getPost(1);

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe(`Basic ${expectedCredentials}`);
  });

  it("constructs correct URLs with wp-json base", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: 1 }));

    await client.getPost(1);

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain("https://mysite.com/wp-json/wp/v2/posts/1");
  });

  it("sends GET for listing posts with query params", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse([{ id: 1 }, { id: 2 }]));

    await client.listPosts("posts", { per_page: 10, page: 1 });

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("GET");
    const parsed = new URL(url);
    expect(parsed.searchParams.get("per_page")).toBe("10");
    expect(parsed.searchParams.get("page")).toBe("1");
    expect(parsed.searchParams.get("context")).toBe("edit");
  });

  it("sends POST for updating post meta", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: 1 }));

    await client.updatePostMeta(1, "posts", {
      _yoast_wpseo_title: "SEO Title",
      _yoast_wpseo_metadesc: "SEO Description",
    });

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/wp/v2/posts/1");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string);
    expect(body.meta._yoast_wpseo_title).toBe("SEO Title");
  });

  it("sends PUT for updating redirects", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: "r1" }));

    await client.updateRedirect("r1", { origin: "/old", target: "/new", type: 301 });

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/yoast/v1/redirects/r1");
    expect(init.method).toBe("PUT");
  });

  it("sends DELETE for redirects", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}));

    await client.deleteRedirect("r1");

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/yoast/v1/redirects/r1");
    expect(init.method).toBe("DELETE");
  });

  it("getSiteUrl() returns configured URL", () => {
    expect(client.getSiteUrl()).toBe("https://mysite.com");
  });

  it("strips trailing slashes from site URL", () => {
    const clientWithSlash = new YoastClient({
      url: "https://mysite.com///",
      username: "admin",
      applicationPassword: "pass",
    });
    expect(clientWithSlash.getSiteUrl()).toBe("https://mysite.com");
  });

  it("handles error responses", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ code: "rest_forbidden", message: "Sorry, you are not allowed to do that." }, 403),
    );

    await expect(client.getPost(999)).rejects.toThrow();
  });
});
