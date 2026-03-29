/**
 * Product Shipping Class tools (5): list, get, create, update, delete
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WooClient } from "../api/client.js";
import { ListShippingClassesSchema, GetShippingClassSchema, CreateShippingClassSchema, UpdateShippingClassSchema, DeleteShippingClassSchema } from "../schemas/index.js";

export function registerShippingClassTools(server: McpServer, client: WooClient): void {
  server.tool("woo_list_shipping_classes", "List product shipping classes.", ListShippingClassesSchema.shape, async (params) => {
    try {
      const { page, per_page } = ListShippingClassesSchema.parse(params);
      return mcpSuccess(await client.list<unknown>("products/shipping_classes", {}, page, per_page));
    } catch (error) { return mcpError(error, "woo_list_shipping_classes"); }
  });

  server.tool("woo_get_shipping_class", "Get a shipping class by ID.", GetShippingClassSchema.shape, async (params) => {
    try { return mcpSuccess(await client.get<unknown>(`products/shipping_classes/${GetShippingClassSchema.parse(params).shipping_class_id}`)); }
    catch (error) { return mcpError(error, "woo_get_shipping_class"); }
  });

  server.tool("woo_create_shipping_class", "Create a product shipping class.", CreateShippingClassSchema.shape, async (params) => {
    try {
      const v = CreateShippingClassSchema.parse(params);
      const sc = await client.post<Record<string, unknown>>("products/shipping_classes", v);
      return mcpSuccess({ id: sc["id"], name: sc["name"], message: `Shipping class '${sc["name"]}' created` });
    } catch (error) { return mcpError(error, "woo_create_shipping_class"); }
  });

  server.tool("woo_update_shipping_class", "Update a shipping class.", UpdateShippingClassSchema.shape, async (params) => {
    try {
      const { shipping_class_id, ...data } = UpdateShippingClassSchema.parse(params);
      const sc = await client.put<Record<string, unknown>>(`products/shipping_classes/${shipping_class_id}`, data);
      return mcpSuccess({ id: sc["id"], name: sc["name"], message: `Shipping class ${shipping_class_id} updated` });
    } catch (error) { return mcpError(error, "woo_update_shipping_class"); }
  });

  server.tool("woo_delete_shipping_class", "Delete a shipping class.", DeleteShippingClassSchema.shape, async (params) => {
    try {
      const { shipping_class_id, force } = DeleteShippingClassSchema.parse(params);
      await client.delete(`products/shipping_classes/${shipping_class_id}`, { force });
      return mcpSuccess({ message: `Shipping class ${shipping_class_id} deleted` });
    } catch (error) { return mcpError(error, "woo_delete_shipping_class"); }
  });
}
