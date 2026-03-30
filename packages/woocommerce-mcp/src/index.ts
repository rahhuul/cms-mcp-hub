/**
 * @cmsmcp/woocommerce — MCP server for WooCommerce stores
 *
 * Full coverage of WooCommerce REST API v3 with 69 tools.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createLogger, requireEnv } from "@cmsmcp/shared";
import { WooClient } from "./api/client.js";
import { registerProductTools } from "./tools/products.js";
import { registerOrderTools } from "./tools/orders.js";
import { registerOrderNoteTools } from "./tools/order-notes.js";
import { registerOrderRefundTools } from "./tools/order-refunds.js";
import { registerCustomerTools } from "./tools/customers.js";
import { registerCouponTools } from "./tools/coupons.js";
import { registerReportTools } from "./tools/reports.js";
import { registerTaxonomyTools } from "./tools/taxonomy.js";
import { registerAttributeTools } from "./tools/attributes.js";
import { registerShippingClassTools } from "./tools/shipping-classes.js";
import { registerReviewTools } from "./tools/reviews.js";
import { registerTaxTools } from "./tools/tax.js";
import { registerWebhookTools } from "./tools/webhooks.js";
import { registerSettingsTools } from "./tools/settings.js";
import { registerSystemTools } from "./tools/system.js";
import { registerBatchTools } from "./tools/batch.js";
import { registerWorkflowTools } from "./tools/workflows.js";

const logger = createLogger("woocommerce");

async function main(): Promise<void> {
  const url = requireEnv("WOOCOMMERCE_URL");
  const consumerKey = requireEnv("WOOCOMMERCE_CONSUMER_KEY");
  const consumerSecret = requireEnv("WOOCOMMERCE_CONSUMER_SECRET");

  const client = new WooClient({ url, consumerKey, consumerSecret });

  const server = new McpServer({
    name: "@cmsmcp/woocommerce",
    version: "0.1.0",
  });

  registerProductTools(server, client);       // 10: products (5) + variations (5)
  registerOrderTools(server, client);          //  5: orders CRUD + delete
  registerOrderNoteTools(server, client);      //  4: order notes
  registerOrderRefundTools(server, client);    //  4: order refunds
  registerCustomerTools(server, client);       //  6: customers + downloads
  registerCouponTools(server, client);         //  5: coupons CRUD
  registerReportTools(server, client);         //  3: sales, top sellers, totals
  registerTaxonomyTools(server, client);       // 10: categories (5) + tags (5)
  registerAttributeTools(server, client);      // 10: attributes (5) + terms (5)
  registerShippingClassTools(server, client);  //  5: shipping classes
  registerReviewTools(server, client);         //  5: product reviews
  registerTaxTools(server, client);            //  8: tax rates (5) + classes (3)
  registerWebhookTools(server, client);        //  5: webhooks
  registerSettingsTools(server, client);       //  5: settings, shipping zones, payment gateways
  registerSystemTools(server, client);         //  6: system status + data
  registerBatchTools(server, client);          //  1: batch operations
  registerWorkflowTools(server, client);       //  3: store dashboard, create full product, process order

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("WooCommerce MCP server running on stdio");
}

main().catch((error) => {
  logger.error("Fatal error", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
