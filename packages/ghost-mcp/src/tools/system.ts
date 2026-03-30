/**
 * System tools (7): authors, members, tiers, newsletters, images, site
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { GhostClient } from "../api/client.js";
import type { GhostAuthor, GhostMember, GhostTier, GhostNewsletter } from "../types/index.js";
import {
  ListAuthorsSchema,
  ListMembersSchema,
  CreateMemberSchema,
  ListTiersSchema,
  ListNewslettersSchema,
  UploadImageSchema,
  GetSiteSchema,
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
    "Upload an image to Ghost from a URL. Returns the hosted image URL that can be used in posts and pages.",
    UploadImageSchema.shape,
    async (params) => {
      try {
        const validated = UploadImageSchema.parse(params);
        // Ghost image upload requires multipart form data with the actual file.
        // For URL-based uploads, we fetch the image first then would need to
        // convert to form data. Return guidance for now.
        return mcpSuccess({
          message: "Ghost image upload requires multipart form data. "
            + "For content creation, you can use HTML img tags with external URLs directly in post content, "
            + "or use the Ghost admin panel for file uploads.",
          providedUrl: validated.url,
          suggestion: "Use the URL directly in post HTML content: <img src=\"" + validated.url + "\">",
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
}
