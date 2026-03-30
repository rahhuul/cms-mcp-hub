import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WpClient } from "../api/client.js";
import { ListBlockTypesSchema, GetBlockTypeSchema, ListBlockPatternsSchema, ListBlockPatternCategoriesSchema, RenderBlockSchema } from "../schemas/index.js";

export function registerBlockTools(server: McpServer, client: WpClient): void {
  server.tool("wp_list_block_types", "List registered block types. Filter by namespace (e.g., 'core', 'woocommerce').", ListBlockTypesSchema.shape, async (p) => { try { const { namespace } = ListBlockTypesSchema.parse(p); const path = namespace ? `block-types/${namespace}` : "block-types"; return mcpSuccess(await client.get(path)); } catch(e) { return mcpError(e, "wp_list_block_types"); } });
  server.tool("wp_get_block_type", "Get detailed info about a specific block type (attributes, supports, etc.).", GetBlockTypeSchema.shape, async (p) => { try { const { namespace, name } = GetBlockTypeSchema.parse(p); return mcpSuccess(await client.get(`block-types/${namespace}/${name}`)); } catch(e) { return mcpError(e, "wp_get_block_type"); } });
  server.tool("wp_list_block_patterns", "List all registered block patterns.", ListBlockPatternsSchema.shape, async () => { try { return mcpSuccess(await client.get("block-patterns/patterns")); } catch(e) { return mcpError(e, "wp_list_block_patterns"); } });
  server.tool("wp_list_block_pattern_categories", "List block pattern categories.", ListBlockPatternCategoriesSchema.shape, async () => { try { return mcpSuccess(await client.get("block-patterns/categories")); } catch(e) { return mcpError(e, "wp_list_block_pattern_categories"); } });
  server.tool("wp_render_block", "Server-side render a dynamic block by name with given attributes.", RenderBlockSchema.shape, async (p) => { try { const { name, ...d } = RenderBlockSchema.parse(p); return mcpSuccess(await client.post(`block-renderer/${name}`, d)); } catch(e) { return mcpError(e, "wp_render_block"); } });
}
