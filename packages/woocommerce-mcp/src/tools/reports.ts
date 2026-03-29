/**
 * Report tools (3): sales, top_sellers, totals
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WooClient } from "../api/client.js";
import { GetReportsSalesSchema, GetReportsTopSellersSchema, GetReportsTotalsSchema } from "../schemas/index.js";

export function registerReportTools(server: McpServer, client: WooClient): void {
  server.tool("woo_get_reports_sales", "Get sales analytics by period or custom date range. Returns total sales, orders, items sold, and more.", GetReportsSalesSchema.shape, async (params) => {
    try {
      const v = GetReportsSalesSchema.parse(params);
      return mcpSuccess(await client.get<unknown[]>("reports/sales", v as Record<string, string | number | boolean | undefined>));
    } catch (error) { return mcpError(error, "woo_get_reports_sales"); }
  });

  server.tool("woo_get_reports_top_sellers", "Get top-selling products by period or date range.", GetReportsTopSellersSchema.shape, async (params) => {
    try {
      const v = GetReportsTopSellersSchema.parse(params);
      return mcpSuccess(await client.get<unknown[]>("reports/top_sellers", v as Record<string, string | number | boolean | undefined>));
    } catch (error) { return mcpError(error, "woo_get_reports_top_sellers"); }
  });

  server.tool("woo_get_reports_totals", "Get total counts for coupons, customers, orders, products, or reviews.", GetReportsTotalsSchema.shape, async (params) => {
    try {
      const { resource } = GetReportsTotalsSchema.parse(params);
      return mcpSuccess(await client.get<unknown[]>(`reports/${resource}/totals`));
    } catch (error) { return mcpError(error, "woo_get_reports_totals"); }
  });
}
