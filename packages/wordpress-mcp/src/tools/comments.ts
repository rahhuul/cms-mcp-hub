import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WpClient } from "../api/client.js";
import { ListCommentsSchema, GetCommentSchema, CreateCommentSchema, UpdateCommentSchema, DeleteCommentSchema } from "../schemas/index.js";

export function registerCommentTools(server: McpServer, client: WpClient): void {
  server.tool("wp_list_comments", "List comments with post, status, and search filters.", ListCommentsSchema.shape, async (params) => {
    try { const { page, per_page, ...f } = ListCommentsSchema.parse(params); return mcpSuccess(await client.list("comments", f as Record<string, string | number | boolean | undefined>, page, per_page)); }
    catch (e) { return mcpError(e, "wp_list_comments"); }
  });
  server.tool("wp_get_comment", "Get a single comment by ID.", GetCommentSchema.shape, async (params) => {
    try { return mcpSuccess(await client.get(`comments/${GetCommentSchema.parse(params).id}`)); }
    catch (e) { return mcpError(e, "wp_get_comment"); }
  });
  server.tool("wp_create_comment", "Create a comment on a post. Supports replies via parent parameter.", CreateCommentSchema.shape, async (params) => {
    try { const v = CreateCommentSchema.parse(params); const c = await client.post<Record<string, unknown>>("comments", v); return mcpSuccess({ id: c["id"], post: c["post"], status: c["status"], message: "Comment created" }); }
    catch (e) { return mcpError(e, "wp_create_comment"); }
  });
  server.tool("wp_update_comment", "Update a comment's content or moderation status (approve, hold, spam, trash).", UpdateCommentSchema.shape, async (params) => {
    try { const { id, ...d } = UpdateCommentSchema.parse(params); await client.put(`comments/${id}`, d); return mcpSuccess({ message: `Comment ${id} updated` }); }
    catch (e) { return mcpError(e, "wp_update_comment"); }
  });
  server.tool("wp_delete_comment", "Delete a comment.", DeleteCommentSchema.shape, async (params) => {
    try { const { id, force } = DeleteCommentSchema.parse(params); await client.del(`comments/${id}`, { force }); return mcpSuccess({ message: `Comment ${id} ${force ? "deleted" : "trashed"}` }); }
    catch (e) { return mcpError(e, "wp_delete_comment"); }
  });
}
