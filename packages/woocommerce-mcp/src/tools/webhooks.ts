/**
 * Webhook tools (5): list, get, create, update, delete
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WooClient } from "../api/client.js";
import { ListWebhooksSchema, GetWebhookSchema, CreateWebhookSchema, UpdateWebhookSchema, DeleteWebhookSchema } from "../schemas/index.js";

export function registerWebhookTools(server: McpServer, client: WooClient): void {
  server.tool("woo_list_webhooks", "List WooCommerce webhooks with optional status filter.", ListWebhooksSchema.shape, async (params) => {
    try {
      const { page, per_page, ...f } = ListWebhooksSchema.parse(params);
      return mcpSuccess(await client.list<unknown>("webhooks", f as Record<string, string | number | boolean | undefined>, page, per_page));
    } catch (error) { return mcpError(error, "woo_list_webhooks"); }
  });

  server.tool("woo_get_webhook", "Get a webhook by ID.", GetWebhookSchema.shape, async (params) => {
    try { return mcpSuccess(await client.get<unknown>(`webhooks/${GetWebhookSchema.parse(params).webhook_id}`)); }
    catch (error) { return mcpError(error, "woo_get_webhook"); }
  });

  server.tool("woo_create_webhook", "Create a webhook for event notifications (e.g., order.created, product.updated).", CreateWebhookSchema.shape, async (params) => {
    try {
      const v = CreateWebhookSchema.parse(params);
      const w = await client.post<Record<string, unknown>>("webhooks", v);
      return mcpSuccess({ id: w["id"], name: w["name"], topic: w["topic"], delivery_url: w["delivery_url"], message: `Webhook '${w["name"]}' created` });
    } catch (error) { return mcpError(error, "woo_create_webhook"); }
  });

  server.tool("woo_update_webhook", "Update a webhook's name, topic, URL, secret, or status.", UpdateWebhookSchema.shape, async (params) => {
    try {
      const { webhook_id, ...data } = UpdateWebhookSchema.parse(params);
      const w = await client.put<Record<string, unknown>>(`webhooks/${webhook_id}`, data);
      return mcpSuccess({ id: w["id"], name: w["name"], status: w["status"], message: `Webhook ${webhook_id} updated` });
    } catch (error) { return mcpError(error, "woo_update_webhook"); }
  });

  server.tool("woo_delete_webhook", "Delete a webhook.", DeleteWebhookSchema.shape, async (params) => {
    try {
      await client.delete(`webhooks/${DeleteWebhookSchema.parse(params).webhook_id}`, { force: true });
      return mcpSuccess({ message: "Webhook deleted" });
    } catch (error) { return mcpError(error, "woo_delete_webhook"); }
  });
}
