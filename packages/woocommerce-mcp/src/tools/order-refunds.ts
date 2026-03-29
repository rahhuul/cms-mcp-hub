/**
 * Order Refund tools (4): list, get, create, delete
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WooClient } from "../api/client.js";
import { ListOrderRefundsSchema, GetOrderRefundSchema, CreateOrderRefundSchema, DeleteOrderRefundSchema } from "../schemas/index.js";

export function registerOrderRefundTools(server: McpServer, client: WooClient): void {
  server.tool("woo_list_order_refunds", "List all refunds for an order.", ListOrderRefundsSchema.shape, async (params) => {
    try {
      const { order_id, page, per_page } = ListOrderRefundsSchema.parse(params);
      return mcpSuccess(await client.list<unknown>(`orders/${order_id}/refunds`, {}, page, per_page));
    } catch (error) { return mcpError(error, "woo_list_order_refunds"); }
  });

  server.tool("woo_get_order_refund", "Get details of a specific refund.", GetOrderRefundSchema.shape, async (params) => {
    try {
      const { order_id, refund_id } = GetOrderRefundSchema.parse(params);
      return mcpSuccess(await client.get<unknown>(`orders/${order_id}/refunds/${refund_id}`));
    } catch (error) { return mcpError(error, "woo_get_order_refund"); }
  });

  server.tool("woo_create_order_refund", "Create a refund for an order. Can refund full amount or specific line items. Set api_refund=true to process via payment gateway.", CreateOrderRefundSchema.shape, async (params) => {
    try {
      const { order_id, ...data } = CreateOrderRefundSchema.parse(params);
      const refund = await client.post<Record<string, unknown>>(`orders/${order_id}/refunds`, data);
      return mcpSuccess({ id: refund["id"], amount: refund["amount"], reason: refund["reason"], message: `Refund created for order #${order_id}` });
    } catch (error) { return mcpError(error, "woo_create_order_refund"); }
  });

  server.tool("woo_delete_order_refund", "Delete a refund record (does not reverse the payment).", DeleteOrderRefundSchema.shape, async (params) => {
    try {
      const { order_id, refund_id } = DeleteOrderRefundSchema.parse(params);
      await client.delete(`orders/${order_id}/refunds/${refund_id}`, { force: true });
      return mcpSuccess({ message: `Refund ${refund_id} deleted from order #${order_id}` });
    } catch (error) { return mcpError(error, "woo_delete_order_refund"); }
  });
}
