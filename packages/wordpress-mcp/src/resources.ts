/**
 * MCP Resources — browseable data endpoints.
 * Resources provide context to the AI without executing actions.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { WpClient } from "./api/client.js";

export function registerResources(server: McpServer, client: WpClient): void {

  // ─── Site Info ───────────────────────────────────────────────────
  server.resource("site-info", "wordpress://site/info", async (uri) => {
    const settings = await client.get<Record<string, unknown>>("settings");
    return {
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify({
          title: settings["title"],
          description: settings["description"],
          url: settings["url"],
          timezone: settings["timezone_string"],
          date_format: settings["date_format"],
          language: settings["language"],
        }, null, 2),
      }],
    };
  });

  // ─── Recent Posts ────────────────────────────────────────────────
  server.resource("recent-posts", "wordpress://posts/recent", async (uri) => {
    const posts = await client.list<Record<string, unknown>>("posts", { status: "publish" }, 1, 10);
    const simplified = posts.map((p) => ({
      id: p["id"],
      title: (p["title"] as Record<string, unknown>)?.["rendered"],
      slug: p["slug"],
      date: p["date"],
      link: p["link"],
      status: p["status"],
    }));
    return {
      contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(simplified, null, 2) }],
    };
  });

  // ─── Draft Posts ─────────────────────────────────────────────────
  server.resource("draft-posts", "wordpress://posts/drafts", async (uri) => {
    const posts = await client.list<Record<string, unknown>>("posts", { status: "draft" }, 1, 25);
    const simplified = posts.map((p) => ({
      id: p["id"],
      title: (p["title"] as Record<string, unknown>)?.["rendered"],
      date: p["modified"],
    }));
    return {
      contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(simplified, null, 2) }],
    };
  });

  // ─── All Pages ───────────────────────────────────────────────────
  server.resource("all-pages", "wordpress://pages/all", async (uri) => {
    const pages = await client.list<Record<string, unknown>>("pages", { status: "publish" }, 1, 50);
    const simplified = pages.map((p) => ({
      id: p["id"],
      title: (p["title"] as Record<string, unknown>)?.["rendered"],
      slug: p["slug"],
      parent: p["parent"],
      link: p["link"],
    }));
    return {
      contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(simplified, null, 2) }],
    };
  });

  // ─── Media Library (recent images) ──────────────────────────────
  server.resource("recent-media", "wordpress://media/recent", async (uri) => {
    const media = await client.list<Record<string, unknown>>("media", { media_type: "image" }, 1, 20);
    const simplified = media.map((m) => ({
      id: m["id"],
      title: (m["title"] as Record<string, unknown>)?.["rendered"],
      source_url: m["source_url"],
      mime_type: m["mime_type"],
      date: m["date"],
    }));
    return {
      contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(simplified, null, 2) }],
    };
  });

  // ─── Active Plugins ──────────────────────────────────────────────
  server.resource("active-plugins", "wordpress://plugins/active", async (uri) => {
    const plugins = await client.get<Record<string, unknown>[]>("plugins");
    const active = plugins.filter((p) => p["status"] === "active").map((p) => ({
      plugin: p["plugin"],
      name: p["name"],
      version: p["version"],
      author: p["author"],
    }));
    return {
      contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(active, null, 2) }],
    };
  });

  // ─── Users ───────────────────────────────────────────────────────
  server.resource("users-list", "wordpress://users/all", async (uri) => {
    const users = await client.list<Record<string, unknown>>("users", {}, 1, 50);
    const simplified = users.map((u) => ({
      id: u["id"], name: u["name"], slug: u["slug"], roles: u["roles"],
    }));
    return {
      contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(simplified, null, 2) }],
    };
  });

  // ─── Categories ──────────────────────────────────────────────────
  server.resource("categories-list", "wordpress://categories/all", async (uri) => {
    const cats = await client.list<Record<string, unknown>>("categories", { per_page: 100 }, 1, 100);
    const simplified = cats.map((c) => ({
      id: c["id"], name: c["name"], slug: c["slug"], count: c["count"], parent: c["parent"],
    }));
    return {
      contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(simplified, null, 2) }],
    };
  });

  // ─── Tags ────────────────────────────────────────────────────────
  server.resource("tags-list", "wordpress://tags/all", async (uri) => {
    const tags = await client.list<Record<string, unknown>>("tags", { per_page: 100 }, 1, 100);
    const simplified = tags.map((t) => ({
      id: t["id"], name: t["name"], slug: t["slug"], count: t["count"],
    }));
    return {
      contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(simplified, null, 2) }],
    };
  });

  // ─── Content Calendar (scheduled + draft) ────────────────────────
  server.resource("content-calendar", "wordpress://posts/calendar", async (uri) => {
    const [scheduled, drafts] = await Promise.all([
      client.list<Record<string, unknown>>("posts", { status: "future" }, 1, 25),
      client.list<Record<string, unknown>>("posts", { status: "draft" }, 1, 25),
    ]);
    const result = {
      scheduled: scheduled.map((p) => ({
        id: p["id"], title: (p["title"] as Record<string, unknown>)?.["rendered"],
        scheduled_for: p["date"],
      })),
      drafts: drafts.map((p) => ({
        id: p["id"], title: (p["title"] as Record<string, unknown>)?.["rendered"],
        modified: p["modified"],
      })),
    };
    return {
      contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(result, null, 2) }],
    };
  });
}
