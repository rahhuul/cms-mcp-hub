/**
 * Tax Rate tools (5) + Tax Class tools (3) = 8 tools
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WooClient } from "../api/client.js";
import {
  ListTaxRatesSchema, GetTaxRateSchema, CreateTaxRateSchema, UpdateTaxRateSchema, DeleteTaxRateSchema,
  ListTaxClassesSchema, CreateTaxClassSchema, DeleteTaxClassSchema,
} from "../schemas/index.js";

export function registerTaxTools(server: McpServer, client: WooClient): void {
  // ── Tax Rates ────────────────────────────────────────────────────
  server.tool("woo_list_tax_rates", "List tax rates with optional tax class filter.", ListTaxRatesSchema.shape, async (params) => {
    try {
      const { page, per_page, ...f } = ListTaxRatesSchema.parse(params);
      return mcpSuccess(await client.list<unknown>("taxes", f as Record<string, string | number | boolean | undefined>, page, per_page));
    } catch (error) { return mcpError(error, "woo_list_tax_rates"); }
  });

  server.tool("woo_get_tax_rate", "Get a specific tax rate.", GetTaxRateSchema.shape, async (params) => {
    try { return mcpSuccess(await client.get<unknown>(`taxes/${GetTaxRateSchema.parse(params).tax_rate_id}`)); }
    catch (error) { return mcpError(error, "woo_get_tax_rate"); }
  });

  server.tool("woo_create_tax_rate", "Create a tax rate for a country/state/city/postcode combination.", CreateTaxRateSchema.shape, async (params) => {
    try {
      const v = CreateTaxRateSchema.parse(params);
      const t = await client.post<Record<string, unknown>>("taxes", v);
      return mcpSuccess({ id: t["id"], country: t["country"], rate: t["rate"], name: t["name"], message: "Tax rate created" });
    } catch (error) { return mcpError(error, "woo_create_tax_rate"); }
  });

  server.tool("woo_update_tax_rate", "Update a tax rate.", UpdateTaxRateSchema.shape, async (params) => {
    try {
      const { tax_rate_id, ...data } = UpdateTaxRateSchema.parse(params);
      const t = await client.put<Record<string, unknown>>(`taxes/${tax_rate_id}`, data);
      return mcpSuccess({ id: t["id"], rate: t["rate"], message: `Tax rate ${tax_rate_id} updated` });
    } catch (error) { return mcpError(error, "woo_update_tax_rate"); }
  });

  server.tool("woo_delete_tax_rate", "Delete a tax rate.", DeleteTaxRateSchema.shape, async (params) => {
    try {
      await client.delete(`taxes/${DeleteTaxRateSchema.parse(params).tax_rate_id}`, { force: true });
      return mcpSuccess({ message: "Tax rate deleted" });
    } catch (error) { return mcpError(error, "woo_delete_tax_rate"); }
  });

  // ── Tax Classes ──────────────────────────────────────────────────
  server.tool("woo_list_tax_classes", "List all tax classes (e.g., Standard, Reduced Rate, Zero Rate).", ListTaxClassesSchema.shape, async () => {
    try { return mcpSuccess(await client.get<unknown[]>("taxes/classes")); }
    catch (error) { return mcpError(error, "woo_list_tax_classes"); }
  });

  server.tool("woo_create_tax_class", "Create a new tax class.", CreateTaxClassSchema.shape, async (params) => {
    try {
      const v = CreateTaxClassSchema.parse(params);
      const tc = await client.post<Record<string, unknown>>("taxes/classes", v);
      return mcpSuccess({ name: tc["name"], slug: tc["slug"], message: `Tax class '${tc["name"]}' created` });
    } catch (error) { return mcpError(error, "woo_create_tax_class"); }
  });

  server.tool("woo_delete_tax_class", "Delete a tax class by slug.", DeleteTaxClassSchema.shape, async (params) => {
    try {
      await client.delete(`taxes/classes/${DeleteTaxClassSchema.parse(params).slug}`, { force: true });
      return mcpSuccess({ message: "Tax class deleted" });
    } catch (error) { return mcpError(error, "woo_delete_tax_class"); }
  });
}
