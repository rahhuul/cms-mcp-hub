/**
 * Order Note tools (4): list, get, create, delete
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WooClient } from "../api/client.js";
import { ListOrderNotesSchema, GetOrderNoteSchema, CreateOrderNoteSchema, DeleteOrderNoteSchema } from "../schemas/index.js";

export function registerOrderNoteTools(server: McpServer, client: WooClient): void {
  server.tool("woo_list_order_notes", "List all notes for an order (private and customer-facing).", ListOrderNotesSchema.shape, async (params) => {
    try {
      const { order_id } = ListOrderNotesSchema.parse(params);
      return mcpSuccess(await client.get<unknown[]>(`orders/${order_id}/notes`));
    } catch (error) { return mcpError(error, "woo_list_order_notes"); }
  });

  server.tool("woo_get_order_note", "Get a specific order note.", GetOrderNoteSchema.shape, async (params) => {
    try {
      const { order_id, note_id } = GetOrderNoteSchema.parse(params);
      return mcpSuccess(await client.get<unknown>(`orders/${order_id}/notes/${note_id}`));
    } catch (error) { return mcpError(error, "woo_get_order_note"); }
  });

  server.tool("woo_create_order_note", "Add a note to an order. Set customer_note=true to send to customer, false for private.", CreateOrderNoteSchema.shape, async (params) => {
    try {
      const { order_id, ...data } = CreateOrderNoteSchema.parse(params);
      const note = await client.post<Record<string, unknown>>(`orders/${order_id}/notes`, data);
      return mcpSuccess({ id: note["id"], message: `Note added to order #${order_id}` });
    } catch (error) { return mcpError(error, "woo_create_order_note"); }
  });

  server.tool("woo_delete_order_note", "Delete an order note.", DeleteOrderNoteSchema.shape, async (params) => {
    try {
      const { order_id, note_id } = DeleteOrderNoteSchema.parse(params);
      await client.delete(`orders/${order_id}/notes/${note_id}`, { force: true });
      return mcpSuccess({ message: `Note ${note_id} deleted from order #${order_id}` });
    } catch (error) { return mcpError(error, "woo_delete_order_note"); }
  });
}
