import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WpClient } from "../api/client.js";
import { SearchBlockDirectorySchema, SearchPatternDirectorySchema } from "../schemas/index.js";

export function registerDirectoryTools(server: McpServer, client: WpClient): void {
  server.tool("wp_search_block_directory", "Search the WordPress.org block directory for installable blocks.", SearchBlockDirectorySchema.shape, async (p) => {
    try { const { page, per_page, ...f } = SearchBlockDirectorySchema.parse(p); return mcpSuccess(await client.list("block-directory/search", f as Record<string, string | number | boolean | undefined>, page, per_page)); }
    catch (e) { return mcpError(e, "wp_search_block_directory"); }
  });
  server.tool("wp_search_pattern_directory", "Search the WordPress.org pattern directory for block patterns.", SearchPatternDirectorySchema.shape, async (p) => {
    try { const { page, per_page, ...f } = SearchPatternDirectorySchema.parse(p); return mcpSuccess(await client.list("pattern-directory/patterns", f as Record<string, string | number | boolean | undefined>, page, per_page)); }
    catch (e) { return mcpError(e, "wp_search_pattern_directory"); }
  });
}
