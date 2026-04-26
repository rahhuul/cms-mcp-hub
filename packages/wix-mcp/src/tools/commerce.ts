import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WixClient } from "../api/client.js";
import {
  ListContactsSchema,
  GetContactSchema,
  CreateContactSchema,
  UpdateContactSchema,
  DeleteContactSchema,
  ListProductsSchema,
  GetProductSchema,
  ListOrdersSchema,
  GetOrderSchema,
  ListBlogPostsSchema,
  CreateBlogPostSchema,
  ListBookingServicesSchema,
  GetSitePropertiesSchema,
} from "../schemas/index.js";

export function registerCommerceTools(server: McpServer, client: WixClient): void {
  // ═══ Contacts ═══════════════════════════════════════════════════════

  server.tool(
    "wix_list_contacts",
    "Query Wix contacts with optional WQL filters and sorting. Returns contact names, emails, phones, and metadata.",
    ListContactsSchema.shape,
    async (p) => {
      try {
        const v = ListContactsSchema.parse(p);
        const body: Record<string, unknown> = {
          paging: { limit: v.limit, offset: v.offset },
        };
        if (v.filter) body.filter = v.filter;
        if (v.sort) body.sort = v.sort;

        return mcpSuccess(
          await client.post("/contacts/v4/contacts/query", body),
        );
      } catch (e) {
        return mcpError(e, "wix_list_contacts");
      }
    },
  );

  server.tool(
    "wix_get_contact",
    "Get a specific Wix contact by ID with full details including name, emails, phones, and metadata.",
    GetContactSchema.shape,
    async (p) => {
      try {
        const v = GetContactSchema.parse(p);
        return mcpSuccess(
          await client.get(`/contacts/v4/contacts/${v.contactId}`),
        );
      } catch (e) {
        return mcpError(e, "wix_get_contact");
      }
    },
  );

  server.tool(
    "wix_create_contact",
    "Create a new Wix contact with name, email, phone, company, and job title.",
    CreateContactSchema.shape,
    async (p) => {
      try {
        const v = CreateContactSchema.parse(p);
        return mcpSuccess(
          await client.post("/contacts/v4/contacts", v),
        );
      } catch (e) {
        return mcpError(e, "wix_create_contact");
      }
    },
  );

  server.tool(
    "wix_update_contact",
    "Update an existing Wix contact's name, emails, phones, company, or job title.",
    UpdateContactSchema.shape,
    async (p) => {
      try {
        const v = UpdateContactSchema.parse(p);
        const { contactId, ...body } = v;
        return mcpSuccess(
          await client.patch(`/contacts/v4/contacts/${contactId}`, body),
        );
      } catch (e) {
        return mcpError(e, "wix_update_contact");
      }
    },
  );

  server.tool(
    "wix_delete_contact",
    "Delete a Wix contact by ID. This action is irreversible.",
    DeleteContactSchema.shape,
    async (p) => {
      try {
        const v = DeleteContactSchema.parse(p);
        return mcpSuccess(
          await client.del(`/contacts/v4/contacts/${v.contactId}`),
        );
      } catch (e) {
        return mcpError(e, "wix_delete_contact");
      }
    },
  );

  // ═══ Products (Wix Stores) ══════════════════════════════════════════

  server.tool(
    "wix_list_products",
    "List Wix Store products with pagination. Optionally include product variants.",
    ListProductsSchema.shape,
    async (p) => {
      try {
        const v = ListProductsSchema.parse(p);
        const body: Record<string, unknown> = {
          paging: { limit: v.limit, offset: v.offset },
        };
        if (v.includeVariants !== undefined) body.includeVariants = v.includeVariants;

        return mcpSuccess(
          await client.post("/stores/v1/products/query", { query: body }),
        );
      } catch (e) {
        return mcpError(e, "wix_list_products");
      }
    },
  );

  server.tool(
    "wix_get_product",
    "Get a specific Wix Store product by ID with full details and optionally variants.",
    GetProductSchema.shape,
    async (p) => {
      try {
        const v = GetProductSchema.parse(p);
        const params: Record<string, string | number | boolean | undefined> = {};
        if (v.includeVariants !== undefined) params.includeVariants = v.includeVariants;

        return mcpSuccess(
          await client.get(`/stores/v1/products/${v.productId}`, params),
        );
      } catch (e) {
        return mcpError(e, "wix_get_product");
      }
    },
  );

  // ═══ Orders (Wix eCommerce) ═════════════════════════════════════════

  server.tool(
    "wix_list_orders",
    "List Wix eCommerce orders with pagination. Returns order details, line items, and payment info.",
    ListOrdersSchema.shape,
    async (p) => {
      try {
        const v = ListOrdersSchema.parse(p);
        return mcpSuccess(
          await client.post("/ecom/v1/orders/query", {
            query: { paging: { limit: v.limit, offset: v.offset } },
          }),
        );
      } catch (e) {
        return mcpError(e, "wix_list_orders");
      }
    },
  );

  server.tool(
    "wix_get_order",
    "Get a specific Wix eCommerce order by ID with full details.",
    GetOrderSchema.shape,
    async (p) => {
      try {
        const v = GetOrderSchema.parse(p);
        return mcpSuccess(
          await client.get(`/ecom/v1/orders/${v.orderId}`),
        );
      } catch (e) {
        return mcpError(e, "wix_get_order");
      }
    },
  );

  // ═══ Blog ═══════════════════════════════════════════════════════════

  server.tool(
    "wix_list_blog_posts",
    "List Wix Blog posts with pagination. Filter by featured status or publish status (PUBLISHED/DRAFT).",
    ListBlogPostsSchema.shape,
    async (p) => {
      try {
        const v = ListBlogPostsSchema.parse(p);
        const params: Record<string, string | number | boolean | undefined> = {
          limit: v.limit,
          offset: v.offset,
        };
        if (v.featured !== undefined) params.featured = v.featured;
        if (v.status) params.status = v.status;

        return mcpSuccess(
          await client.get("/blog/v3/posts", params),
        );
      } catch (e) {
        return mcpError(e, "wix_list_blog_posts");
      }
    },
  );

  server.tool(
    "wix_create_blog_post",
    "Create a new Wix Blog post with title, content, excerpt, tags, and categories. Defaults to DRAFT status.",
    CreateBlogPostSchema.shape,
    async (p) => {
      try {
        const v = CreateBlogPostSchema.parse(p);
        const post: Record<string, unknown> = { title: v.title };
        if (v.richContent) post.richContent = v.richContent;
        if (v.excerpt) post.excerpt = v.excerpt;
        if (v.featured !== undefined) post.featured = v.featured;
        if (v.categoryIds) post.categoryIds = v.categoryIds;
        if (v.tags) post.tags = v.tags;

        return mcpSuccess(
          await client.post("/blog/v3/draft-posts", {
            draftPost: post,
            publish: v.status === "PUBLISHED",
          }),
        );
      } catch (e) {
        return mcpError(e, "wix_create_blog_post");
      }
    },
  );

  // ═══ Bookings ═══════════════════════════════════════════════════════

  server.tool(
    "wix_list_booking_services",
    "List all Wix Bookings services (appointments, classes, courses). Returns service names, types, pricing, and availability.",
    ListBookingServicesSchema.shape,
    async (p) => {
      try {
        const v = ListBookingServicesSchema.parse(p);
        return mcpSuccess(
          await client.post("/bookings/v1/services/query", {
            query: { paging: { limit: v.limit, offset: v.offset } },
          }),
        );
      } catch (e) {
        return mcpError(e, "wix_list_booking_services");
      }
    },
  );

  // ═══ Site ═══════════════════════════════════════════════════════════

  server.tool(
    "wix_get_site_properties",
    "Get Wix site properties including site name, URL, language, locale, business contact info, and consent policy.",
    GetSitePropertiesSchema.shape,
    async (_p) => {
      try {
        return mcpSuccess(
          await client.get("/site-properties/v4/properties"),
        );
      } catch (e) {
        return mcpError(e, "wix_get_site_properties");
      }
    },
  );
}
