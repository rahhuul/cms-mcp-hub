/**
 * WooCommerce composite workflow tools.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WooClient } from "../api/client.js";
import type { WooProduct, WooCategory, WooTag } from "../types/index.js";
import { StoreDashboardSchema, CreateFullProductSchema, ProcessOrderSchema } from "../schemas/index.js";

export function registerWorkflowTools(server: McpServer, client: WooClient): void {

  server.tool("woo_store_dashboard",
    "Get a complete store dashboard in one call: sales summary, pending orders, low stock products, top sellers, recent orders.",
    StoreDashboardSchema.shape, async (params) => {
    try {
      const { period } = StoreDashboardSchema.parse(params);
      const [sales, topSellers, pendingOrders, lowStock, recentOrders] = await Promise.all([
        client.get<unknown[]>("reports/sales", { period }),
        client.get<unknown[]>("reports/top_sellers", { period }),
        client.list<Record<string, unknown>>("orders", { status: "processing" }, 1, 10),
        client.list<WooProduct>("products", { stock_status: "outofstock" }, 1, 10),
        client.list<Record<string, unknown>>("orders", {}, 1, 5),
      ]);

      return mcpSuccess({
        sales_summary: sales[0] ?? {},
        top_sellers: topSellers.slice(0, 5),
        pending_orders: { count: pendingOrders.length, orders: pendingOrders.map((o) => ({ id: o["id"], total: o["total"], status: o["status"] })) },
        low_stock: lowStock.map((p) => ({ id: p.id, name: p.name, stock_quantity: p.stock_quantity, stock_status: p.stock_status })),
        recent_orders: recentOrders.map((o) => ({ id: o["id"], total: o["total"], status: o["status"], date: o["date_created"] })),
      });
    } catch (e) { return mcpError(e, "woo_store_dashboard"); }
  });

  server.tool("woo_create_full_product",
    "Create a complete product in one call: details + auto-create categories/tags + upload images + create variations for variable products.",
    CreateFullProductSchema.shape, async (params) => {
    try {
      const v = CreateFullProductSchema.parse(params);
      const catIds: number[] = [];
      const tagIds: number[] = [];

      // Find/create categories
      if (v.category_names?.length) {
        const existing = await client.list<WooCategory>("products/categories", { per_page: 100 });
        for (const name of v.category_names) {
          const found = existing.find((c) => c.name.toLowerCase() === name.toLowerCase());
          if (found) { catIds.push(found.id); }
          else { const c = await client.post<WooCategory>("products/categories", { name }); catIds.push(c.id); }
        }
      }

      // Find/create tags
      if (v.tag_names?.length) {
        const existing = await client.list<WooTag>("products/tags", { per_page: 100 });
        for (const name of v.tag_names) {
          const found = existing.find((t) => t.name.toLowerCase() === name.toLowerCase());
          if (found) { tagIds.push(found.id); }
          else { const t = await client.post<WooTag>("products/tags", { name }); tagIds.push(t.id); }
        }
      }

      // Build product data
      const productData: Record<string, unknown> = {
        name: v.name, type: v.type, status: v.status,
        description: v.description, short_description: v.short_description, sku: v.sku,
        manage_stock: v.manage_stock, stock_quantity: v.stock_quantity,
      };
      if (v.type === "simple") productData["regular_price"] = v.regular_price;
      if (catIds.length) productData["categories"] = catIds.map((id) => ({ id }));
      if (tagIds.length) productData["tags"] = tagIds.map((id) => ({ id }));
      if (v.image_urls?.length) productData["images"] = v.image_urls.map((src) => ({ src }));
      if (v.attributes?.length) productData["attributes"] = v.attributes;

      const product = await client.post<WooProduct>("products", productData);

      // Create variations for variable products
      let variationsCreated = 0;
      if (v.type === "variable" && v.variations?.length) {
        for (const variation of v.variations) {
          await client.post(`products/${product.id}/variations`, variation);
          variationsCreated++;
        }
      }

      return mcpSuccess({
        id: product.id, name: product.name, type: product.type, status: product.status,
        categories: catIds.length, tags: tagIds.length, images: v.image_urls?.length ?? 0,
        variations_created: variationsCreated,
        message: `Product '${product.name}' created (ID: ${product.id})`,
      });
    } catch (e) { return mcpError(e, "woo_create_full_product"); }
  });

  server.tool("woo_process_order",
    "Process an order in one call: update status + add customer note + add private note.",
    ProcessOrderSchema.shape, async (params) => {
    try {
      const v = ProcessOrderSchema.parse(params);

      // Update order status
      const order = await client.put<Record<string, unknown>>(`orders/${v.order_id}`, { status: v.new_status });

      // Add customer note if provided
      if (v.customer_note) {
        await client.post(`orders/${v.order_id}/notes`, { note: v.customer_note, customer_note: true });
      }

      // Add private note if provided
      if (v.private_note) {
        await client.post(`orders/${v.order_id}/notes`, { note: v.private_note, customer_note: false });
      }

      return mcpSuccess({
        id: v.order_id, status: v.new_status, total: order["total"],
        message: `Order #${v.order_id} → ${v.new_status}${v.customer_note ? " + customer note" : ""}${v.private_note ? " + private note" : ""}`,
      });
    } catch (e) { return mcpError(e, "woo_process_order"); }
  });
}
