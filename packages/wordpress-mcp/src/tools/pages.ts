import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WpClient } from "../api/client.js";
import { ListPagesSchema, GetPageSchema, CreatePageSchema, UpdatePageSchema, DeletePageSchema } from "../schemas/index.js";

export function registerPageTools(server: McpServer, client: WpClient): void {
  server.tool("wp_list_pages", "List WordPress pages with status, parent, and sort filters.", ListPagesSchema.shape, async (params) => {
    try { const { page, per_page, ...f } = ListPagesSchema.parse(params); return mcpSuccess(await client.list("pages", f as Record<string, string | number | boolean | undefined>, page, per_page)); }
    catch (e) { return mcpError(e, "wp_list_pages"); }
  });
  server.tool("wp_get_page", "Get a single WordPress page by ID.", GetPageSchema.shape, async (params) => {
    try { return mcpSuccess(await client.get(`pages/${GetPageSchema.parse(params).id}`)); }
    catch (e) { return mcpError(e, "wp_get_page"); }
  });
  server.tool("wp_create_page", "Create a new WordPress page. Supports parent pages, templates, and menu order.", CreatePageSchema.shape, async (params) => {
    try { const v = CreatePageSchema.parse(params); const p = await client.post<Record<string, unknown>>("pages", v); return mcpSuccess({ id: p["id"], slug: p["slug"], status: p["status"], link: p["link"], message: `Page created (ID: ${p["id"]})` }); }
    catch (e) { return mcpError(e, "wp_create_page"); }
  });
  server.tool("wp_update_page", "Update an existing WordPress page.", UpdatePageSchema.shape, async (params) => {
    try { const { id, ...d } = UpdatePageSchema.parse(params); await client.put(`pages/${id}`, d); return mcpSuccess({ message: `Page ${id} updated` }); }
    catch (e) { return mcpError(e, "wp_update_page"); }
  });
  server.tool("wp_delete_page", "Delete a WordPress page.", DeletePageSchema.shape, async (params) => {
    try { const { id, force } = DeletePageSchema.parse(params); await client.del(`pages/${id}`, { force }); return mcpSuccess({ message: `Page ${id} ${force ? "deleted" : "trashed"}` }); }
    catch (e) { return mcpError(e, "wp_delete_page"); }
  });
}
