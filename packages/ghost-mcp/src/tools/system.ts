/**
 * System tools (14): authors, members, tiers, newsletters, images, site, webhooks, offers
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { GhostClient } from "../api/client.js";
import type { GhostAuthor, GhostMember, GhostTier, GhostNewsletter } from "../types/index.js";
import {
  ListAuthorsSchema,
  ListMembersSchema,
  CreateMemberSchema,
  GetMemberSchema,
  UpdateMemberSchema,
  ListTiersSchema,
  ListNewslettersSchema,
  UploadImageSchema,
  GetSiteSchema,
  ListWebhooksSchema,
  CreateWebhookSchema,
  UpdateWebhookSchema,
  DeleteWebhookSchema,
  ListOffersSchema,
} from "../schemas/index.js";

export function registerSystemTools(server: McpServer, client: GhostClient): void {
  // ─── 11. ghost_list_authors ──────────────────────────────────────
  server.tool(
    "ghost_list_authors",
    "List Ghost authors/staff members with optional post counts.",
    ListAuthorsSchema.shape,
    async (params) => {
      try {
        const validated = ListAuthorsSchema.parse(params);
        const result = await client.get<{ authors: GhostAuthor[]; meta: unknown }>("authors/", validated as Record<string, string | number | boolean | undefined>);
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "ghost_list_authors");
      }
    },
  );

  // ─── 12. ghost_list_tiers ────────────────────────────────────────
  server.tool(
    "ghost_list_tiers",
    "List Ghost membership tiers (free, paid) with pricing and benefits info.",
    ListTiersSchema.shape,
    async (params) => {
      try {
        const validated = ListTiersSchema.parse(params);
        const result = await client.get<{ tiers: GhostTier[]; meta: unknown }>("tiers/", validated as Record<string, string | number | boolean | undefined>);
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "ghost_list_tiers");
      }
    },
  );

  // ─── 13. ghost_list_members ──────────────────────────────────────
  server.tool(
    "ghost_list_members",
    "List Ghost newsletter members with filtering by status (free, paid, comped) and search by name/email.",
    ListMembersSchema.shape,
    async (params) => {
      try {
        const validated = ListMembersSchema.parse(params);
        const result = await client.get<{ members: GhostMember[]; meta: unknown }>("members/", validated as Record<string, string | number | boolean | undefined>);
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "ghost_list_members");
      }
    },
  );

  // ─── 14. ghost_create_member ─────────────────────────────────────
  server.tool(
    "ghost_create_member",
    "Add a new member to the Ghost newsletter. Can assign labels for segmentation and subscribe to specific newsletters.",
    CreateMemberSchema.shape,
    async (params) => {
      try {
        const validated = CreateMemberSchema.parse(params);
        const result = await client.post<{ members: GhostMember[] }>("members/", {
          members: [validated],
        });
        const member = result.members[0]!;
        return mcpSuccess({
          id: member.id,
          email: member.email,
          name: member.name,
          status: member.status,
          message: `Member '${member.email}' created`,
        });
      } catch (error) {
        return mcpError(error, "ghost_create_member");
      }
    },
  );

  // ─── 15. ghost_list_newsletters ──────────────────────────────────
  server.tool(
    "ghost_list_newsletters",
    "List all Ghost newsletters with their status and configuration.",
    ListNewslettersSchema.shape,
    async (params) => {
      try {
        const validated = ListNewslettersSchema.parse(params);
        const result = await client.get<{ newsletters: GhostNewsletter[]; meta: unknown }>("newsletters/", validated as Record<string, string | number | boolean | undefined>);
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "ghost_list_newsletters");
      }
    },
  );

  // ─── 16. ghost_upload_image ──────────────────────────────────────
  server.tool(
    "ghost_upload_image",
    "Upload an image to Ghost from a URL. Fetches the image and uploads it via multipart/form-data. Returns the hosted image URL.",
    UploadImageSchema.shape,
    async (params) => {
      try {
        const validated = UploadImageSchema.parse(params);
        const result = await client.uploadImage(validated.url, validated.ref);
        return mcpSuccess({
          url: result.url,
          message: `Image uploaded successfully`,
        });
      } catch (error) {
        return mcpError(error, "ghost_upload_image");
      }
    },
  );

  // ─── 17. ghost_get_site ──────────────────────────────────────────
  server.tool(
    "ghost_get_site",
    "Get Ghost site metadata including title, description, URL, version, and configuration.",
    GetSiteSchema.shape,
    async () => {
      try {
        const result = await client.get<{ site: Record<string, unknown> }>("site/");
        return mcpSuccess(result.site);
      } catch (error) {
        return mcpError(error, "ghost_get_site");
      }
    },
  );

  // ─── 18. ghost_list_webhooks ────────────────────────────────────
  server.tool(
    "ghost_list_webhooks",
    "List all configured Ghost webhooks.",
    ListWebhooksSchema.shape,
    async (params) => {
      try {
        const validated = ListWebhooksSchema.parse(params);
        const result = await client.get<{ webhooks: unknown[]; meta: unknown }>("webhooks/", validated as Record<string, string | number | boolean | undefined>);
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "ghost_list_webhooks");
      }
    },
  );

  // ─── 19. ghost_create_webhook ───────────────────────────────────
  server.tool(
    "ghost_create_webhook",
    "Create a new Ghost webhook. Triggers a POST request to the target URL when the specified event occurs.",
    CreateWebhookSchema.shape,
    async (params) => {
      try {
        const validated = CreateWebhookSchema.parse(params);
        const result = await client.post<{ webhooks: Array<{ id: string; event: string; target_url: string }> }>("webhooks/", {
          webhooks: [validated],
        });
        const webhook = result.webhooks[0]!;
        return mcpSuccess({
          id: webhook.id,
          event: webhook.event,
          target_url: webhook.target_url,
          message: `Webhook created for '${webhook.event}'`,
        });
      } catch (error) {
        return mcpError(error, "ghost_create_webhook");
      }
    },
  );

  // ─── 20. ghost_update_webhook ───────────────────────────────────
  server.tool(
    "ghost_update_webhook",
    "Update an existing Ghost webhook's event or target URL.",
    UpdateWebhookSchema.shape,
    async (params) => {
      try {
        const { id, ...data } = UpdateWebhookSchema.parse(params);
        const result = await client.put<{ webhooks: Array<{ id: string; event: string; target_url: string }> }>(`webhooks/${id}/`, {
          webhooks: [data],
        });
        const webhook = result.webhooks[0]!;
        return mcpSuccess({
          id: webhook.id,
          event: webhook.event,
          target_url: webhook.target_url,
          message: `Webhook ${id} updated`,
        });
      } catch (error) {
        return mcpError(error, "ghost_update_webhook");
      }
    },
  );

  // ─── 21. ghost_delete_webhook ───────────────────────────────────
  server.tool(
    "ghost_delete_webhook",
    "Delete a Ghost webhook by ID.",
    DeleteWebhookSchema.shape,
    async (params) => {
      try {
        const { id } = DeleteWebhookSchema.parse(params);
        await client.delete(`webhooks/${id}/`);
        return mcpSuccess({ message: `Webhook ${id} deleted` });
      } catch (error) {
        return mcpError(error, "ghost_delete_webhook");
      }
    },
  );

  // ─── 22. ghost_get_member ───────────────────────────────────────
  server.tool(
    "ghost_get_member",
    "Get a single Ghost member by ID. Returns full member data including subscriptions and labels.",
    GetMemberSchema.shape,
    async (params) => {
      try {
        const { id } = GetMemberSchema.parse(params);
        const result = await client.get<{ members: GhostMember[] }>(`members/${id}/`);
        return mcpSuccess(result.members[0]);
      } catch (error) {
        return mcpError(error, "ghost_get_member");
      }
    },
  );

  // ─── 23. ghost_update_member ────────────────────────────────────
  server.tool(
    "ghost_update_member",
    "Update a Ghost member's details (name, email, labels, note, newsletters).",
    UpdateMemberSchema.shape,
    async (params) => {
      try {
        const { id, ...data } = UpdateMemberSchema.parse(params);
        const result = await client.put<{ members: GhostMember[] }>(`members/${id}/`, {
          members: [data],
        });
        const member = result.members[0]!;
        return mcpSuccess({
          id: member.id,
          email: member.email,
          name: member.name,
          status: member.status,
          message: `Member '${member.email}' updated`,
        });
      } catch (error) {
        return mcpError(error, "ghost_update_member");
      }
    },
  );

  // ─── 24. ghost_list_offers ──────────────────────────────────────
  server.tool(
    "ghost_list_offers",
    "List all Ghost membership offers (discounts and promotions for paid tiers).",
    ListOffersSchema.shape,
    async (params) => {
      try {
        const validated = ListOffersSchema.parse(params);
        const result = await client.get<{ offers: unknown[]; meta: unknown }>("offers/", validated as Record<string, string | number | boolean | undefined>);
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "ghost_list_offers");
      }
    },
  );
}
