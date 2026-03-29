/**
 * Customer tools (6): list, get, create, update, delete, downloads
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WooClient } from "../api/client.js";
import type { WooCustomer } from "../types/index.js";
import {
  ListCustomersSchema, GetCustomerSchema, CreateCustomerSchema,
  UpdateCustomerSchema, DeleteCustomerSchema, GetCustomerDownloadsSchema,
} from "../schemas/index.js";

export function registerCustomerTools(server: McpServer, client: WooClient): void {
  server.tool("woo_list_customers", "List WooCommerce customers with search, email, role filters.", ListCustomersSchema.shape, async (params) => {
    try {
      const { page, per_page, ...filters } = ListCustomersSchema.parse(params);
      const customers = await client.list<WooCustomer>("customers", filters as Record<string, string | number | boolean | undefined>, page, per_page);
      return mcpSuccess({ customers: customers.map((c) => ({ id: c.id, email: c.email, first_name: c.first_name, last_name: c.last_name, username: c.username })), page, per_page });
    } catch (error) { return mcpError(error, "woo_list_customers"); }
  });

  server.tool("woo_get_customer", "Get detailed customer profile including billing/shipping addresses.", GetCustomerSchema.shape, async (params) => {
    try { return mcpSuccess(await client.get<WooCustomer>(`customers/${GetCustomerSchema.parse(params).customer_id}`)); }
    catch (error) { return mcpError(error, "woo_get_customer"); }
  });

  server.tool("woo_create_customer", "Create a new WooCommerce customer account.", CreateCustomerSchema.shape, async (params) => {
    try {
      const validated = CreateCustomerSchema.parse(params);
      const c = await client.post<WooCustomer>("customers", validated);
      return mcpSuccess({ id: c.id, email: c.email, username: c.username, message: `Customer '${c.email}' created (ID: ${c.id})` });
    } catch (error) { return mcpError(error, "woo_create_customer"); }
  });

  server.tool("woo_update_customer", "Update a customer's profile, billing, or shipping address.", UpdateCustomerSchema.shape, async (params) => {
    try {
      const { customer_id, ...data } = UpdateCustomerSchema.parse(params);
      const c = await client.put<WooCustomer>(`customers/${customer_id}`, data);
      return mcpSuccess({ id: c.id, email: c.email, message: `Customer ${customer_id} updated` });
    } catch (error) { return mcpError(error, "woo_update_customer"); }
  });

  server.tool("woo_delete_customer", "Delete a customer. Optionally reassign their content to another user.", DeleteCustomerSchema.shape, async (params) => {
    try {
      const { customer_id, force, reassign } = DeleteCustomerSchema.parse(params);
      await client.delete(`customers/${customer_id}`, { force, reassign });
      return mcpSuccess({ message: `Customer ${customer_id} deleted` });
    } catch (error) { return mcpError(error, "woo_delete_customer"); }
  });

  server.tool("woo_get_customer_downloads", "Get a customer's downloadable file permissions.", GetCustomerDownloadsSchema.shape, async (params) => {
    try { return mcpSuccess(await client.get<unknown[]>(`customers/${GetCustomerDownloadsSchema.parse(params).customer_id}/downloads`)); }
    catch (error) { return mcpError(error, "woo_get_customer_downloads"); }
  });
}
