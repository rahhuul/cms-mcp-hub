/**
 * @cmsmcp/payload — MCP server for Payload CMS
 *
 * Provides 14 tools for managing Payload CMS content:
 * - Collection discovery (1 tool)
 * - Entry CRUD with filtering & depth population (5 tools)
 * - Globals management (3 tools)
 * - Media listing & upload (2 tools)
 * - Access permissions (1 tool)
 * - Version history & restore (2 tools)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createLogger, requireEnv, optionalEnv } from "@cmsmcp/shared";
import { PayloadClient } from "./api/client.js";
import { registerContentTools } from "./tools/content.js";
import { registerSystemTools } from "./tools/system.js";

const logger = createLogger("payload");

async function main(): Promise<void> {
  const url = requireEnv("PAYLOAD_URL");
  const apiKey = optionalEnv("PAYLOAD_API_KEY", "") || undefined;
  const email = optionalEnv("PAYLOAD_EMAIL", "") || undefined;
  const password = optionalEnv("PAYLOAD_PASSWORD", "") || undefined;

  if (!apiKey && (!email || !password)) {
    logger.warn(
      "No PAYLOAD_API_KEY or PAYLOAD_EMAIL/PAYLOAD_PASSWORD set. "
      + "Authentication will fail for protected endpoints.",
    );
  }

  const client = new PayloadClient({ url, apiKey, email, password });

  const server = new McpServer({
    name: "@cmsmcp/payload",
    version: "0.3.0",
  });

  registerContentTools(server, client);
  registerSystemTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("Payload CMS MCP server running on stdio");
}

main().catch((error) => {
  logger.error("Fatal error", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
