import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WpClient } from "../api/client.js";
import { ListCategoriesSchema, GetCategorySchema, CreateCategorySchema, UpdateCategorySchema, DeleteCategorySchema, ListTagsSchema, GetTagSchema, CreateTagSchema, UpdateTagSchema, DeleteTagSchema } from "../schemas/index.js";

export function registerTaxonomyTools(server: McpServer, client: WpClient): void {
  // Categories
  server.tool("wp_list_categories", "List WordPress categories.", ListCategoriesSchema.shape, async (p) => { try { const { page, per_page, ...f } = ListCategoriesSchema.parse(p); return mcpSuccess(await client.list("categories", f as Record<string, string | number | boolean | undefined>, page, per_page)); } catch(e) { return mcpError(e, "wp_list_categories"); } });
  server.tool("wp_get_category", "Get a category by ID.", GetCategorySchema.shape, async (p) => { try { return mcpSuccess(await client.get(`categories/${GetCategorySchema.parse(p).id}`)); } catch(e) { return mcpError(e, "wp_get_category"); } });
  server.tool("wp_create_category", "Create a new category. Supports nesting via parent.", CreateCategorySchema.shape, async (p) => { try { const v = CreateCategorySchema.parse(p); const c = await client.post<Record<string, unknown>>("categories", v); return mcpSuccess({ id: c["id"], name: c["name"], slug: c["slug"], message: `Category '${c["name"]}' created` }); } catch(e) { return mcpError(e, "wp_create_category"); } });
  server.tool("wp_update_category", "Update a category.", UpdateCategorySchema.shape, async (p) => { try { const { id, ...d } = UpdateCategorySchema.parse(p); await client.put(`categories/${id}`, d); return mcpSuccess({ message: `Category ${id} updated` }); } catch(e) { return mcpError(e, "wp_update_category"); } });
  server.tool("wp_delete_category", "Delete a category.", DeleteCategorySchema.shape, async (p) => { try { const { id, force } = DeleteCategorySchema.parse(p); await client.del(`categories/${id}`, { force }); return mcpSuccess({ message: `Category ${id} deleted` }); } catch(e) { return mcpError(e, "wp_delete_category"); } });
  // Tags
  server.tool("wp_list_tags", "List WordPress tags.", ListTagsSchema.shape, async (p) => { try { const { page, per_page, ...f } = ListTagsSchema.parse(p); return mcpSuccess(await client.list("tags", f as Record<string, string | number | boolean | undefined>, page, per_page)); } catch(e) { return mcpError(e, "wp_list_tags"); } });
  server.tool("wp_get_tag", "Get a tag by ID.", GetTagSchema.shape, async (p) => { try { return mcpSuccess(await client.get(`tags/${GetTagSchema.parse(p).id}`)); } catch(e) { return mcpError(e, "wp_get_tag"); } });
  server.tool("wp_create_tag", "Create a new tag.", CreateTagSchema.shape, async (p) => { try { const v = CreateTagSchema.parse(p); const t = await client.post<Record<string, unknown>>("tags", v); return mcpSuccess({ id: t["id"], name: t["name"], slug: t["slug"], message: `Tag '${t["name"]}' created` }); } catch(e) { return mcpError(e, "wp_create_tag"); } });
  server.tool("wp_update_tag", "Update a tag.", UpdateTagSchema.shape, async (p) => { try { const { id, ...d } = UpdateTagSchema.parse(p); await client.put(`tags/${id}`, d); return mcpSuccess({ message: `Tag ${id} updated` }); } catch(e) { return mcpError(e, "wp_update_tag"); } });
  server.tool("wp_delete_tag", "Delete a tag.", DeleteTagSchema.shape, async (p) => { try { const { id, force } = DeleteTagSchema.parse(p); await client.del(`tags/${id}`, { force }); return mcpSuccess({ message: `Tag ${id} deleted` }); } catch(e) { return mcpError(e, "wp_delete_tag"); } });
}
