import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { ShopifyClient } from "../api/client.js";
import { ListInventoryItemsSchema, GetInventoryItemSchema, UpdateInventoryItemSchema, ListInventoryLevelsSchema, AdjustInventorySchema, SetInventorySchema, ListLocationsSchema, GetLocationSchema, CountLocationsSchema } from "../schemas/index.js";

export function registerInventoryTools(server: McpServer, client: ShopifyClient): void {
  server.tool("shopify_list_inventory_items", "List inventory items by IDs.", ListInventoryItemsSchema.shape, async (p) => { try { return mcpSuccess(await client.list("inventory_items", ListInventoryItemsSchema.parse(p) as Record<string, string | number | boolean | undefined>)); } catch(e) { return mcpError(e, "shopify_list_inventory_items"); } });
  server.tool("shopify_get_inventory_item", "Get an inventory item.", GetInventoryItemSchema.shape, async (p) => { try { return mcpSuccess(await client.get(`inventory_items/${GetInventoryItemSchema.parse(p).id}`)); } catch(e) { return mcpError(e, "shopify_get_inventory_item"); } });
  server.tool("shopify_update_inventory_item", "Update inventory item SKU, tracking, cost.", UpdateInventoryItemSchema.shape, async (p) => { try { const { id, ...d } = UpdateInventoryItemSchema.parse(p); return mcpSuccess(await client.put(`inventory_items/${id}`, { inventory_item: d })); } catch(e) { return mcpError(e, "shopify_update_inventory_item"); } });
  server.tool("shopify_list_inventory_levels", "List inventory levels by item or location.", ListInventoryLevelsSchema.shape, async (p) => { try { return mcpSuccess(await client.list("inventory_levels", ListInventoryLevelsSchema.parse(p) as Record<string, string | number | boolean | undefined>)); } catch(e) { return mcpError(e, "shopify_list_inventory_levels"); } });
  server.tool("shopify_adjust_inventory", "Adjust inventory level (add or subtract quantity).", AdjustInventorySchema.shape, async (p) => { try { return mcpSuccess(await client.post("inventory_levels/adjust", AdjustInventorySchema.parse(p))); } catch(e) { return mcpError(e, "shopify_adjust_inventory"); } });
  server.tool("shopify_set_inventory", "Set absolute inventory level.", SetInventorySchema.shape, async (p) => { try { return mcpSuccess(await client.post("inventory_levels/set", SetInventorySchema.parse(p))); } catch(e) { return mcpError(e, "shopify_set_inventory"); } });
  server.tool("shopify_list_locations", "List store locations.", ListLocationsSchema.shape, async () => { try { return mcpSuccess(await client.get("locations")); } catch(e) { return mcpError(e, "shopify_list_locations"); } });
  server.tool("shopify_get_location", "Get a location.", GetLocationSchema.shape, async (p) => { try { return mcpSuccess(await client.get(`locations/${GetLocationSchema.parse(p).id}`)); } catch(e) { return mcpError(e, "shopify_get_location"); } });
  server.tool("shopify_count_locations", "Count locations.", CountLocationsSchema.shape, async () => { try { return mcpSuccess(await client.get("locations/count")); } catch(e) { return mcpError(e, "shopify_count_locations"); } });
}
