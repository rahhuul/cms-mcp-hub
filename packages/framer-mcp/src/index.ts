/**
 * @cmsmcp/framer — MCP server for Framer CMS platform
 *
 * Provides 20 tools for managing Framer projects:
 * - Project info & settings (3 tools)
 * - CMS collections, fields & items (7 tools)
 * - Pages (3 tools)
 * - Code files (4 tools)
 * - Publishing & deployment (3 tools)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createLogger, requireEnv } from "@cmsmcp/shared";
import { FramerClient } from "./api/client.js";
import { registerProjectTools } from "./tools/project.js";
import { registerCollectionTools } from "./tools/collections.js";
import { registerPageTools } from "./tools/pages.js";
import { registerCodeTools } from "./tools/code.js";
import { registerPublishingTools } from "./tools/publishing.js";

const logger = createLogger("framer");

async function main(): Promise<void> {
  const projectUrl = requireEnv("FRAMER_PROJECT_URL");
  const apiKey = requireEnv("FRAMER_API_KEY");

  const client = new FramerClient({ projectUrl, apiKey });

  const server = new McpServer({
    name: "@cmsmcp/framer",
    version: "0.1.0",
  });

  // Register all 20 tools
  registerProjectTools(server, client);
  registerCollectionTools(server, client);
  registerPageTools(server, client);
  registerCodeTools(server, client);
  registerPublishingTools(server, client);

  // Handle graceful shutdown
  const cleanup = async (): Promise<void> => {
    logger.info("Shutting down...");
    await client.disconnect();
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  // Start stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("Framer MCP server running on stdio");
}

main().catch((error) => {
  logger.error("Fatal error", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
