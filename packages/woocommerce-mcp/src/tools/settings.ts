/**
 * Settings tools (3) + Payment Gateway update (1) = 4 tools
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WooClient } from "../api/client.js";
import { ListShippingZonesSchema, GetPaymentGatewaysSchema, UpdatePaymentGatewaySchema, GetSettingsSchema, UpdateSettingSchema } from "../schemas/index.js";

export function registerSettingsTools(server: McpServer, client: WooClient): void {
  server.tool("woo_list_shipping_zones", "List all shipping zones and their methods.", ListShippingZonesSchema.shape, async () => {
    try { return mcpSuccess(await client.get<unknown[]>("shipping/zones")); }
    catch (error) { return mcpError(error, "woo_list_shipping_zones"); }
  });

  server.tool("woo_get_payment_gateways", "List all payment gateways and their enabled/disabled status.", GetPaymentGatewaysSchema.shape, async () => {
    try { return mcpSuccess(await client.get<unknown[]>("payment_gateways")); }
    catch (error) { return mcpError(error, "woo_get_payment_gateways"); }
  });

  server.tool("woo_update_payment_gateway", "Enable/disable or configure a payment gateway.", UpdatePaymentGatewaySchema.shape, async (params) => {
    try {
      const { gateway_id, ...data } = UpdatePaymentGatewaySchema.parse(params);
      const gw = await client.put<Record<string, unknown>>(`payment_gateways/${gateway_id}`, data);
      return mcpSuccess({ id: gw["id"], title: gw["title"], enabled: gw["enabled"], message: `Payment gateway '${gateway_id}' updated` });
    } catch (error) { return mcpError(error, "woo_update_payment_gateway"); }
  });

  server.tool("woo_get_settings", "Get store settings. Omit group to list all groups, or specify a group (general, products, tax, etc.).", GetSettingsSchema.shape, async (params) => {
    try {
      const { group } = GetSettingsSchema.parse(params);
      return mcpSuccess(await client.get<unknown>(group ? `settings/${group}` : "settings"));
    } catch (error) { return mcpError(error, "woo_get_settings"); }
  });

  server.tool("woo_update_setting", "Update a specific store setting value.", UpdateSettingSchema.shape, async (params) => {
    try {
      const { group, setting_id, value } = UpdateSettingSchema.parse(params);
      const s = await client.put<Record<string, unknown>>(`settings/${group}/${setting_id}`, { value });
      return mcpSuccess({ id: s["id"], value: s["value"], message: `Setting '${setting_id}' updated` });
    } catch (error) { return mcpError(error, "woo_update_setting"); }
  });
}
