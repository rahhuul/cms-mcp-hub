/**
 * @cmsmcp/yoast — MCP server for Yoast SEO
 *
 * Provides 13 tools for managing WordPress SEO via the Yoast SEO plugin:
 * - SEO metadata (title, description, focus keyword, canonical)
 * - SEO & readability scores
 * - Bulk SEO operations
 * - Indexing control (noindex, canonical)
 * - URL redirects (Yoast Premium)
 * - Social metadata (Open Graph, Twitter Cards)
 * - Schema/structured data
 * - XML sitemap
 *
 * Environment variables:
 *   YOAST_SITE_URL       — WordPress site URL (e.g., https://example.com)
 *   YOAST_USERNAME       — WordPress username
 *   YOAST_APP_PASSWORD   — WordPress application password
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createLogger, requireEnv } from "@cmsmcp/shared";
import { YoastClient } from "./api/client.js";
import { registerSeoTools } from "./tools/seo.js";
import { registerSystemTools } from "./tools/system.js";

const logger = createLogger("yoast");

async function main(): Promise<void> {
  const url = requireEnv("YOAST_SITE_URL");
  const username = requireEnv("YOAST_USERNAME");
  const applicationPassword = requireEnv("YOAST_APP_PASSWORD");

  const client = new YoastClient({ url, username, applicationPassword });
  const server = new McpServer({ name: "@cmsmcp/yoast", version: "0.3.0" });

  registerSeoTools(server, client);
  registerSystemTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("Yoast SEO MCP server running on stdio");
}

main().catch((error) => {
  logger.error("Fatal error", { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});
