import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WpClient } from "../api/client.js";
import { ListBlocksSchema, GetBlockSchema, CreateBlockSchema, UpdateBlockSchema, DeleteBlockSchema } from "../schemas/index.js";

export function registerReusableBlockTools(server: McpServer, client: WpClient): void {
  server.tool("wp_list_blocks", "List reusable blocks (synced patterns).", ListBlocksSchema.shape, async (p) => {
    try { const { page, per_page, ...f } = ListBlocksSchema.parse(p); return mcpSuccess(await client.list("blocks", f as Record<string, string | number | boolean | undefined>, page, per_page)); }
    catch (e) { return mcpError(e, "wp_list_blocks"); }
  });
  server.tool("wp_get_block", "Get a reusable block by ID.", GetBlockSchema.shape, async (p) => {
    try { return mcpSuccess(await client.get(`blocks/${GetBlockSchema.parse(p).id}`)); }
    catch (e) { return mcpError(e, "wp_get_block"); }
  });
  server.tool("wp_create_block", "Create a reusable block with block markup content.", CreateBlockSchema.shape, async (p) => {
    try { const v = CreateBlockSchema.parse(p); const b = await client.post<Record<string, unknown>>("blocks", v); return mcpSuccess({ id: b["id"], message: "Reusable block created" }); }
    catch (e) { return mcpError(e, "wp_create_block"); }
  });
  server.tool("wp_update_block", "Update a reusable block's title or content.", UpdateBlockSchema.shape, async (p) => {
    try { const { id, ...d } = UpdateBlockSchema.parse(p); await client.put(`blocks/${id}`, d); return mcpSuccess({ message: `Block ${id} updated` }); }
    catch (e) { return mcpError(e, "wp_update_block"); }
  });
  server.tool("wp_delete_block", "Delete a reusable block.", DeleteBlockSchema.shape, async (p) => {
    try { const { id, force } = DeleteBlockSchema.parse(p); await client.del(`blocks/${id}`, { force }); return mcpSuccess({ message: `Block ${id} deleted` }); }
    catch (e) { return mcpError(e, "wp_delete_block"); }
  });
}
