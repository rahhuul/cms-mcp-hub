/**
 * Content tools (10): pages (3), products (2), orders (2), publish (1), domains (1), webhooks (1)
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WebflowClient } from "../api/client.js";
import type {
  WebflowPage,
  WebflowProduct,
  WebflowOrder,
  WebflowDomain,
  WebflowWebhook,
} from "../types/index.js";
import {
  ListPagesSchema,
  GetPageSchema,
  UpdatePageSchema,
  ListProductsSchema,
  CreateProductSchema,
  ListOrdersSchema,
  GetOrderSchema,
  PublishSiteSchema,
  ListDomainsSchema,
  ListWebhooksSchema,
} from "../schemas/index.js";

export function registerContentTools(server: McpServer, client: WebflowClient): void {
  // ─── 11. webflow_list_pages ─────────────────────────────────────
  server.tool(
    "webflow_list_pages",
    "List all pages for a Webflow site with pagination. Returns page IDs, titles, slugs, and draft/archive status.",
    ListPagesSchema.shape,
    async (params) => {
      try {
        const { siteId, ...queryParams } = ListPagesSchema.parse(params);
        const result = await client.list<{ pages: WebflowPage[]; pagination: unknown }>(
          `sites/${siteId}/pages`,
          queryParams as Record<string, string | number | boolean | undefined>,
        );
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "webflow_list_pages");
      }
    },
  );

  // ─── 12. webflow_get_page ───────────────────────────────────────
  server.tool(
    "webflow_get_page",
    "Get detailed information about a specific Webflow page including SEO settings and OpenGraph metadata.",
    GetPageSchema.shape,
    async (params) => {
      try {
        const { pageId, ...queryParams } = GetPageSchema.parse(params);
        const result = await client.get<WebflowPage>(
          `pages/${pageId}`,
          queryParams as Record<string, string | number | boolean | undefined>,
        );
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "webflow_get_page");
      }
    },
  );

  // ─── 13. webflow_update_page ────────────────────────────────────
  server.tool(
    "webflow_update_page",
    "Update a Webflow page's title, slug, SEO settings, or OpenGraph metadata. Does not modify page content/layout.",
    UpdatePageSchema.shape,
    async (params) => {
      try {
        const { pageId, ...body } = UpdatePageSchema.parse(params);
        const result = await client.patch<WebflowPage>(`pages/${pageId}`, body);
        return mcpSuccess({
          id: result.id,
          title: result.title,
          slug: result.slug,
          message: `Page '${result.title}' updated`,
        });
      } catch (error) {
        return mcpError(error, "webflow_update_page");
      }
    },
  );

  // ─── 14. webflow_list_products ──────────────────────────────────
  server.tool(
    "webflow_list_products",
    "List all e-commerce products for a Webflow site with pagination. Returns product data, SKUs, and pricing.",
    ListProductsSchema.shape,
    async (params) => {
      try {
        const { siteId, ...queryParams } = ListProductsSchema.parse(params);
        const result = await client.list<{ items: WebflowProduct[]; pagination: unknown }>(
          `sites/${siteId}/products`,
          queryParams as Record<string, string | number | boolean | undefined>,
        );
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "webflow_list_products");
      }
    },
  );

  // ─── 15. webflow_create_product ─────────────────────────────────
  server.tool(
    "webflow_create_product",
    "Create a new e-commerce product in Webflow. Requires product field data (name, slug, description) and optional default SKU.",
    CreateProductSchema.shape,
    async (params) => {
      try {
        const { siteId, ...body } = CreateProductSchema.parse(params);
        const result = await client.post<WebflowProduct>(`sites/${siteId}/products`, body);
        return mcpSuccess({
          id: result.id,
          isDraft: result.isDraft,
          product: result.product,
          message: "Product created",
        });
      } catch (error) {
        return mcpError(error, "webflow_create_product");
      }
    },
  );

  // ─── 16. webflow_list_orders ────────────────────────────────────
  server.tool(
    "webflow_list_orders",
    "List e-commerce orders for a Webflow site with optional status filter. Returns order details, totals, and customer info.",
    ListOrdersSchema.shape,
    async (params) => {
      try {
        const { siteId, ...queryParams } = ListOrdersSchema.parse(params);
        const result = await client.list<{ orders: WebflowOrder[]; pagination: unknown }>(
          `sites/${siteId}/orders`,
          queryParams as Record<string, string | number | boolean | undefined>,
        );
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "webflow_list_orders");
      }
    },
  );

  // ─── 17. webflow_get_order ──────────────────────────────────────
  server.tool(
    "webflow_get_order",
    "Get detailed information about a specific Webflow e-commerce order including line items, shipping, and payment.",
    GetOrderSchema.shape,
    async (params) => {
      try {
        const { siteId, orderId } = GetOrderSchema.parse(params);
        const result = await client.get<WebflowOrder>(`sites/${siteId}/orders/${orderId}`);
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "webflow_get_order");
      }
    },
  );

  // ─── 18. webflow_publish_site ───────────────────────────────────
  server.tool(
    "webflow_publish_site",
    "Publish a Webflow site to make all staged changes live. Optionally specify domain IDs to publish to specific domains only.",
    PublishSiteSchema.shape,
    async (params) => {
      try {
        const { siteId, domains } = PublishSiteSchema.parse(params);
        const body = domains ? { customDomains: domains } : {};
        const result = await client.post<{ queued: boolean }>(`sites/${siteId}/publish`, body);
        return mcpSuccess({
          queued: result.queued ?? true,
          message: `Site ${siteId} publish queued`,
        });
      } catch (error) {
        return mcpError(error, "webflow_publish_site");
      }
    },
  );

  // ─── 19. webflow_list_domains ───────────────────────────────────
  server.tool(
    "webflow_list_domains",
    "List all custom domains configured for a Webflow site.",
    ListDomainsSchema.shape,
    async (params) => {
      try {
        const { siteId } = ListDomainsSchema.parse(params);
        const result = await client.get<{ customDomains: WebflowDomain[] }>(`sites/${siteId}/custom_domains`);
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "webflow_list_domains");
      }
    },
  );

  // ─── 20. webflow_list_webhooks ──────────────────────────────────
  server.tool(
    "webflow_list_webhooks",
    "List all webhooks configured for a Webflow site. Returns trigger types and endpoint URLs.",
    ListWebhooksSchema.shape,
    async (params) => {
      try {
        const { siteId } = ListWebhooksSchema.parse(params);
        const result = await client.get<{ webhooks: WebflowWebhook[] }>(`sites/${siteId}/webhooks`);
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "webflow_list_webhooks");
      }
    },
  );
}
