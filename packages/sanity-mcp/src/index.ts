import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createLogger, requireEnv, optionalEnv } from "@cmsmcp/shared";
import { SanityClient } from "./api/client.js";
import { registerContentTools } from "./tools/content.js";
import { registerSystemTools } from "./tools/system.js";

const logger = createLogger("sanity");

async function main(): Promise<void> {
  const projectId = requireEnv("SANITY_PROJECT_ID");
  const dataset = optionalEnv("SANITY_DATASET", "production");
  const token = requireEnv("SANITY_TOKEN");
  const apiVersion = optionalEnv("SANITY_API_VERSION", "2024-01");

  const client = new SanityClient({ projectId, dataset, token, apiVersion });
  const server = new McpServer({ name: "@cmsmcp/sanity", version: "0.3.0" });

  registerContentTools(server, client);
  registerSystemTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("Sanity MCP server running on stdio");
}

main().catch((error) => {
  logger.error("Fatal error", { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});
