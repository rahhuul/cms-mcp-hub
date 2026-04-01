import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createLogger, requireEnv } from "@cmsmcp/shared";
import { WixClient } from "./api/client.js";
import { registerDataTools } from "./tools/data.js";
import { registerCommerceTools } from "./tools/commerce.js";

const logger = createLogger("wix");

async function main(): Promise<void> {
  const apiKey = requireEnv("WIX_API_KEY");
  const siteId = requireEnv("WIX_SITE_ID");

  const client = new WixClient({ apiKey, siteId });
  const server = new McpServer({ name: "@cmsmcp/wix", version: "0.3.0" });

  registerDataTools(server, client);
  registerCommerceTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("Wix MCP server running on stdio");
}

main().catch((error) => {
  logger.error("Fatal error", { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});
