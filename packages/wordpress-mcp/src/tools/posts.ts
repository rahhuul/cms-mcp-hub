import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WpClient } from "../api/client.js";
import { ListPostsSchema, GetPostSchema, CreatePostSchema, UpdatePostSchema, DeletePostSchema } from "../schemas/index.js";

export function registerPostTools(server: McpServer, client: WpClient): void {
  server.tool("wp_list_posts", "List WordPress posts with filtering by status, category, tag, author, date range, and search.", ListPostsSchema.shape, async (params) => {
    try { const { page, per_page, ...f } = ListPostsSchema.parse(params); return mcpSuccess(await client.list("posts", f as Record<string, string | number | boolean | undefined>, page, per_page)); }
    catch (e) { return mcpError(e, "wp_list_posts"); }
  });
  server.tool("wp_get_post", "Get a single WordPress post by ID with full content, meta, categories, and tags.", GetPostSchema.shape, async (params) => {
    try { return mcpSuccess(await client.get(`posts/${GetPostSchema.parse(params).id}`)); }
    catch (e) { return mcpError(e, "wp_get_post"); }
  });
  server.tool("wp_create_post", "Create a new WordPress post. Supports HTML content, categories, tags, featured image, and custom meta.", CreatePostSchema.shape, async (params) => {
    try { const v = CreatePostSchema.parse(params); const p = await client.post<Record<string, unknown>>("posts", v); return mcpSuccess({ id: p["id"], title: (p["title"] as Record<string, unknown>)?.["rendered"], slug: p["slug"], status: p["status"], link: p["link"], message: `Post created (ID: ${p["id"]})` }); }
    catch (e) { return mcpError(e, "wp_create_post"); }
  });
  server.tool("wp_update_post", "Update an existing WordPress post. Only provided fields are changed.", UpdatePostSchema.shape, async (params) => {
    try { const { id, ...d } = UpdatePostSchema.parse(params); const p = await client.put<Record<string, unknown>>(`posts/${id}`, d); return mcpSuccess({ id: p["id"], status: p["status"], message: `Post ${id} updated` }); }
    catch (e) { return mcpError(e, "wp_update_post"); }
  });
  server.tool("wp_delete_post", "Delete a WordPress post. Moves to trash by default; set force=true to permanently delete.", DeletePostSchema.shape, async (params) => {
    try { const { id, force } = DeletePostSchema.parse(params); await client.del(`posts/${id}`, { force }); return mcpSuccess({ message: `Post ${id} ${force ? "deleted" : "trashed"}` }); }
    catch (e) { return mcpError(e, "wp_delete_post"); }
  });
}
