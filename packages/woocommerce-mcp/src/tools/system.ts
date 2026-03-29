/**
 * System Status tools (3) + Data tools (3) = 6 tools
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WooClient } from "../api/client.js";
import { GetSystemStatusSchema, ListSystemStatusToolsSchema, RunSystemStatusToolSchema, ListDataSchema, GetDataItemSchema, GetCurrentCurrencySchema } from "../schemas/index.js";

export function registerSystemTools(server: McpServer, client: WooClient): void {
  // ── System Status ────────────────────────────────────────────────
  server.tool("woo_get_system_status", "Get WooCommerce system status — environment, database, active plugins, theme, and settings diagnostics.", GetSystemStatusSchema.shape, async () => {
    try { return mcpSuccess(await client.get<unknown>("system_status")); }
    catch (error) { return mcpError(error, "woo_get_system_status"); }
  });

  server.tool("woo_list_system_tools", "List available system status tools (clear transients, recount terms, etc.).", ListSystemStatusToolsSchema.shape, async () => {
    try { return mcpSuccess(await client.get<unknown[]>("system_status/tools")); }
    catch (error) { return mcpError(error, "woo_list_system_tools"); }
  });

  server.tool("woo_run_system_tool", "Run a system status tool (e.g., clear_transients, recount_terms, db_update_routines).", RunSystemStatusToolSchema.shape, async (params) => {
    try {
      const { tool_id } = RunSystemStatusToolSchema.parse(params);
      const result = await client.put<Record<string, unknown>>(`system_status/tools/${tool_id}`, {});
      return mcpSuccess({ id: result["id"], name: result["name"], success: result["success"], message: result["message"] });
    } catch (error) { return mcpError(error, "woo_run_system_tool"); }
  });

  // ── Data ─────────────────────────────────────────────────────────
  server.tool("woo_list_data", "List store data: continents, countries, or currencies. Omit endpoint to see all data categories.", ListDataSchema.shape, async (params) => {
    try {
      const { endpoint } = ListDataSchema.parse(params);
      const path = endpoint ? `data/${endpoint}` : "data";
      return mcpSuccess(await client.get<unknown>(path));
    } catch (error) { return mcpError(error, "woo_list_data"); }
  });

  server.tool("woo_get_data_item", "Get a specific data item (continent, country, or currency by code).", GetDataItemSchema.shape, async (params) => {
    try {
      const { endpoint, code } = GetDataItemSchema.parse(params);
      return mcpSuccess(await client.get<unknown>(`data/${endpoint}/${code}`));
    } catch (error) { return mcpError(error, "woo_get_data_item"); }
  });

  server.tool("woo_get_current_currency", "Get the store's current currency.", GetCurrentCurrencySchema.shape, async () => {
    try { return mcpSuccess(await client.get<unknown>("data/currencies/current")); }
    catch (error) { return mcpError(error, "woo_get_current_currency"); }
  });
}
