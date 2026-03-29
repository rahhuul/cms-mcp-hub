/**
 * Order tools (5): list, get, create, update, delete
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WooClient } from "../api/client.js";
import type { WooOrder } from "../types/index.js";
import {
  ListOrdersSchema, GetOrderSchema, CreateOrderSchema, UpdateOrderSchema, DeleteOrderSchema,
} from "../schemas/index.js";

export function registerOrderTools(server: McpServer, client: WooClient): void {
  server.tool("woo_list_orders",
    "List WooCommerce orders with filtering. Supports status, customer, date range, and search filters.",
    ListOrdersSchema.shape, async (params) => {
      try {
        const { page, per_page, ...filters } = ListOrdersSchema.parse(params);
        const orders = await client.list<WooOrder>("orders", filters as Record<string, string | number | boolean | undefined>, page, per_page);
        return mcpSuccess({ orders: orders.map((o) => ({ id: o.id, status: o.status, currency: o.currency, total: o.total, customer_id: o.customer_id, date_created: o.date_created, line_items_count: o.line_items.length })), page, per_page });
      } catch (error) { return mcpError(error, "woo_list_orders"); }
    });

  server.tool("woo_get_order",
    "Get detailed information about a single WooCommerce order including line items, billing/shipping, and payment info.",
    GetOrderSchema.shape, async (params) => {
      try {
        const { order_id } = GetOrderSchema.parse(params);
        return mcpSuccess(await client.get<WooOrder>(`orders/${order_id}`));
      } catch (error) { return mcpError(error, "woo_get_order"); }
    });

  server.tool("woo_create_order",
    "Create a new WooCommerce order. Add line items, set billing/shipping, apply coupons, and optionally mark as paid.",
    CreateOrderSchema.shape, async (params) => {
      try {
        const validated = CreateOrderSchema.parse(params);
        const order = await client.post<WooOrder>("orders", validated);
        return mcpSuccess({ id: order.id, status: order.status, total: order.total, message: `Order #${order.id} created` });
      } catch (error) { return mcpError(error, "woo_create_order"); }
    });

  server.tool("woo_update_order",
    "Update a WooCommerce order's status, customer note, or metadata.",
    UpdateOrderSchema.shape, async (params) => {
      try {
        const { order_id, ...updates } = UpdateOrderSchema.parse(params);
        const order = await client.put<WooOrder>(`orders/${order_id}`, updates);
        return mcpSuccess({ id: order.id, status: order.status, total: order.total, message: `Order #${order.id} updated` });
      } catch (error) { return mcpError(error, "woo_update_order"); }
    });

  server.tool("woo_delete_order",
    "Delete a WooCommerce order. Moves to trash by default; set force=true to permanently delete.",
    DeleteOrderSchema.shape, async (params) => {
      try {
        const { order_id, force } = DeleteOrderSchema.parse(params);
        await client.delete(`orders/${order_id}`, { force });
        return mcpSuccess({ message: force ? `Order #${order_id} permanently deleted` : `Order #${order_id} trashed` });
      } catch (error) { return mcpError(error, "woo_delete_order"); }
    });
}
