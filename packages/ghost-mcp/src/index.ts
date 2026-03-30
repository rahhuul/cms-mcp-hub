/**
 * @cmsmcp/ghost — MCP server for Ghost publishing platform
 *
 * Provides 17 tools for managing Ghost:
 * - Posts CRUD (5 tools)
 * - Pages (3 tools)
 * - Tags (2 tools)
 * - Authors (1 tool)
 * - Members (2 tools)
 * - Tiers & newsletters (2 tools)
 * - Images & site (2 tools)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createLogger, requireEnv, optionalEnv } from "@cmsmcp/shared";
import { GhostClient } from "./api/client.js";
import { registerContentTools } from "./tools/content.js";
import { registerSystemTools } from "./tools/system.js";

const logger = createLogger("ghost");

async function main(): Promise<void> {
  const url = requireEnv("GHOST_URL");
  const adminApiKey = requireEnv("GHOST_ADMIN_API_KEY");
  const contentApiKey = optionalEnv("GHOST_CONTENT_API_KEY", "");

  const client = new GhostClient({
    url,
    adminApiKey,
    contentApiKey: contentApiKey || undefined,
  });

  const server = new McpServer({
    name: "@cmsmcp/ghost",
    version: "0.1.0",
  });

  registerContentTools(server, client);
  registerSystemTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("Ghost MCP server running on stdio");
}

main().catch((error) => {
  logger.error("Fatal error", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
