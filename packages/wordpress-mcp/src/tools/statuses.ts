import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WpClient } from "../api/client.js";
import { ListPostStatusesSchema, GetPostStatusSchema } from "../schemas/index.js";

export function registerStatusTools(server: McpServer, client: WpClient): void {
  server.tool("wp_list_post_statuses", "List all registered post statuses (publish, draft, pending, private, future, trash).", ListPostStatusesSchema.shape, async () => {
    try { return mcpSuccess(await client.get("statuses")); }
    catch (e) { return mcpError(e, "wp_list_post_statuses"); }
  });
  server.tool("wp_get_post_status", "Get details about a specific post status.", GetPostStatusSchema.shape, async (p) => {
    try { return mcpSuccess(await client.get(`statuses/${GetPostStatusSchema.parse(p).status}`)); }
    catch (e) { return mcpError(e, "wp_get_post_status"); }
  });
}
