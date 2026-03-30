import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createLogger, requireEnv, optionalEnv } from "@cmsmcp/shared";
import { ShopifyClient } from "./api/client.js";
import { registerProductTools } from "./tools/products.js";
import { registerCollectionTools } from "./tools/collections.js";
import { registerOrderTools } from "./tools/orders.js";
import { registerCustomerTools } from "./tools/customers.js";
import { registerInventoryTools } from "./tools/inventory.js";
import { registerContentTools } from "./tools/content.js";
import { registerStoreTools } from "./tools/store.js";

const logger = createLogger("shopify");

async function main(): Promise<void> {
  const store = requireEnv("SHOPIFY_STORE");
  const accessToken = requireEnv("SHOPIFY_ACCESS_TOKEN");
  const apiVersion = optionalEnv("SHOPIFY_API_VERSION", "2025-01");

  const client = new ShopifyClient({ store, accessToken, apiVersion });
  const server = new McpServer({ name: "@cmsmcp/shopify", version: "0.3.0" });

  registerProductTools(server, client);
  registerCollectionTools(server, client);
  registerOrderTools(server, client);
  registerCustomerTools(server, client);
  registerInventoryTools(server, client);
  registerContentTools(server, client);
  registerStoreTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("Shopify MCP server running on stdio");
}

main().catch((error) => {
  logger.error("Fatal error", { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});
