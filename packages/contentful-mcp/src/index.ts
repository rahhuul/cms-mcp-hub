/**
 * @cmsmcp/contentful — MCP server for Contentful CMS platform
 *
 * Provides 17 tools for managing Contentful:
 * - Spaces (1 tool)
 * - Content Types: list, get, create (3 tools)
 * - Entries: list, get, create, update, delete, publish, unpublish (7 tools)
 * - Assets: list, upload (2 tools)
 * - Environments (1 tool)
 * - Locales (1 tool)
 * - Tags (1 tool)
 * - Bulk: publish (1 tool)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createLogger, requireEnv, optionalEnv } from "@cmsmcp/shared";
import { ContentfulClient } from "./api/client.js";
import { registerContentTools } from "./tools/content.js";
import { registerSystemTools } from "./tools/system.js";

const logger = createLogger("contentful");

async function main(): Promise<void> {
  const spaceId = requireEnv("CONTENTFUL_SPACE_ID");
  const managementToken = requireEnv("CONTENTFUL_MANAGEMENT_TOKEN");
  const environmentId = optionalEnv("CONTENTFUL_ENVIRONMENT", "master");

  const client = new ContentfulClient({
    spaceId,
    environmentId,
    managementToken,
  });

  const server = new McpServer({
    name: "@cmsmcp/contentful",
    version: "0.3.0",
  });

  registerContentTools(server, client);
  registerSystemTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("Contentful MCP server running on stdio");
}

main().catch((error) => {
  logger.error("Fatal error", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
