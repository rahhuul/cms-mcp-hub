/**
 * @cmsmcp/webflow — MCP server for Webflow CMS platform
 *
 * Provides 20 tools for managing Webflow:
 * - Sites (2 tools): list, get
 * - Collections (2 tools): list, get
 * - Collection Items (6 tools): list, get, create, update, delete, publish
 * - Pages (3 tools): list, get, update
 * - Products (2 tools): list, create
 * - Orders (2 tools): list, get
 * - Publishing (1 tool): publish site
 * - Domains (1 tool): list
 * - Webhooks (1 tool): list
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createLogger, requireEnv } from "@cmsmcp/shared";
import { WebflowClient } from "./api/client.js";
import { registerSiteTools } from "./tools/sites.js";
import { registerContentTools } from "./tools/content.js";

const logger = createLogger("webflow");

async function main(): Promise<void> {
  const apiToken = requireEnv("WEBFLOW_API_TOKEN");

  const client = new WebflowClient({ apiToken });

  const server = new McpServer({
    name: "@cmsmcp/webflow",
    version: "0.3.0",
  });

  registerSiteTools(server, client);
  registerContentTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("Webflow MCP server running on stdio");
}

main().catch((error) => {
  logger.error("Fatal error", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
