import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WpClient } from "../api/client.js";
import { ListRevisionsSchema, GetRevisionSchema, DeleteRevisionSchema, ListTemplateRevisionsSchema, GetTemplateRevisionSchema, DeleteTemplateRevisionSchema } from "../schemas/index.js";

export function registerRevisionTools(server: McpServer, client: WpClient): void {
  // Post/Page/Block/Navigation revisions
  server.tool("wp_list_revisions", "List revisions for a post, page, reusable block, or navigation.", ListRevisionsSchema.shape, async (p) => {
    try { const { parent_type, parent_id, page, per_page } = ListRevisionsSchema.parse(p); return mcpSuccess(await client.list(`${parent_type}/${parent_id}/revisions`, {}, page, per_page)); }
    catch (e) { return mcpError(e, "wp_list_revisions"); }
  });
  server.tool("wp_get_revision", "Get a specific revision.", GetRevisionSchema.shape, async (p) => {
    try { const { parent_type, parent_id, revision_id } = GetRevisionSchema.parse(p); return mcpSuccess(await client.get(`${parent_type}/${parent_id}/revisions/${revision_id}`)); }
    catch (e) { return mcpError(e, "wp_get_revision"); }
  });
  server.tool("wp_delete_revision", "Delete a revision.", DeleteRevisionSchema.shape, async (p) => {
    try { const { parent_type, parent_id, revision_id, force } = DeleteRevisionSchema.parse(p); await client.del(`${parent_type}/${parent_id}/revisions/${revision_id}`, { force }); return mcpSuccess({ message: `Revision ${revision_id} deleted` }); }
    catch (e) { return mcpError(e, "wp_delete_revision"); }
  });
  // Template/Template Part revisions
  server.tool("wp_list_template_revisions", "List revisions for a template or template part.", ListTemplateRevisionsSchema.shape, async (p) => {
    try { const { resource, parent_id, page, per_page } = ListTemplateRevisionsSchema.parse(p); return mcpSuccess(await client.list(`${resource}/${parent_id}/revisions`, {}, page, per_page)); }
    catch (e) { return mcpError(e, "wp_list_template_revisions"); }
  });
  server.tool("wp_get_template_revision", "Get a specific template/template-part revision.", GetTemplateRevisionSchema.shape, async (p) => {
    try { const { resource, parent_id, revision_id } = GetTemplateRevisionSchema.parse(p); return mcpSuccess(await client.get(`${resource}/${parent_id}/revisions/${revision_id}`)); }
    catch (e) { return mcpError(e, "wp_get_template_revision"); }
  });
  server.tool("wp_delete_template_revision", "Delete a template/template-part revision.", DeleteTemplateRevisionSchema.shape, async (p) => {
    try { const { resource, parent_id, revision_id, force } = DeleteTemplateRevisionSchema.parse(p); await client.del(`${resource}/${parent_id}/revisions/${revision_id}`, { force }); return mcpSuccess({ message: "Template revision deleted" }); }
    catch (e) { return mcpError(e, "wp_delete_template_revision"); }
  });
}
