/**
 * @cmsmcp/strapi — MCP server for Strapi headless CMS
 *
 * Provides 17 tools with dynamic content type discovery:
 * - Content type & component discovery (2 tools)
 * - Entry CRUD with filtering & population (5 tools)
 * - Bulk delete, publish/unpublish (3 tools)
 * - Media management (3 tools)
 * - Users & roles (2 tools)
 * - i18n localization (2 tools)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createLogger, requireEnv } from "@cmsmcp/shared";
import { StrapiClient } from "./api/client.js";
import { registerContentTools } from "./tools/content.js";
import { registerSystemTools } from "./tools/system.js";

const logger = createLogger("strapi");

async function main(): Promise<void> {
  const url = requireEnv("STRAPI_URL");
  const apiToken = requireEnv("STRAPI_API_TOKEN");

  const client = new StrapiClient({ url, apiToken });

  const server = new McpServer({
    name: "@cmsmcp/strapi",
    version: "0.1.0",
  });

  registerContentTools(server, client);
  registerSystemTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("Strapi MCP server running on stdio");
}

main().catch((error) => {
  logger.error("Fatal error", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
