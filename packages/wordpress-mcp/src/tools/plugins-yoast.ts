/**
 * Yoast SEO & ACF integration tools.
 * Works via post meta fields — no plugin-specific API required.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WpClient } from "../api/client.js";
import { GetYoastSeoSchema, UpdateYoastSeoSchema, GetAcfFieldsSchema, UpdateAcfFieldsSchema, ListAcfFieldGroupsSchema } from "../schemas/index.js";

export function registerPluginTools(server: McpServer, client: WpClient): void {
  // ── Yoast SEO ────────────────────────────────────────────────────
  server.tool("wp_get_yoast_seo", "Get Yoast SEO data for a post/page — SEO title, meta description, focus keyword, Open Graph, Twitter cards, and schema markup.", GetYoastSeoSchema.shape, async (p) => {
    try {
      const { post_id, post_type } = GetYoastSeoSchema.parse(p);
      const post = await client.get<Record<string, unknown>>(`${post_type}/${post_id}`, { context: "edit" });
      return mcpSuccess({
        yoast_head_json: post["yoast_head_json"] ?? null,
        meta: post["meta"] ?? {},
        message: post["yoast_head_json"] ? "Yoast SEO data found" : "Yoast may not be installed — meta fields returned instead",
      });
    } catch (e) { return mcpError(e, "wp_get_yoast_seo"); }
  });

  server.tool("wp_update_yoast_seo", "Update Yoast SEO fields for a post/page — SEO title, meta description, focus keyword, canonical URL, Open Graph and Twitter card settings.", UpdateYoastSeoSchema.shape, async (p) => {
    try {
      const { post_id, post_type, meta } = UpdateYoastSeoSchema.parse(p);
      if (!meta) return mcpError(new Error("Provide meta fields to update"), "wp_update_yoast_seo");
      const updated = await client.put<Record<string, unknown>>(`${post_type}/${post_id}`, { meta });
      return mcpSuccess({
        id: updated["id"],
        meta: updated["meta"],
        message: `Yoast SEO updated for ${post_type.slice(0, -1)} ${post_id}`,
      });
    } catch (e) { return mcpError(e, "wp_update_yoast_seo"); }
  });

  // ── ACF (Advanced Custom Fields) ─────────────────────────────────
  server.tool("wp_get_acf_fields", "Get ACF (Advanced Custom Fields) data for a post/page. Returns all custom field values.", GetAcfFieldsSchema.shape, async (p) => {
    try {
      const { post_id, post_type } = GetAcfFieldsSchema.parse(p);
      const post = await client.get<Record<string, unknown>>(`${post_type}/${post_id}`, { context: "edit" });
      return mcpSuccess({
        acf: post["acf"] ?? null,
        meta: post["meta"] ?? {},
        message: post["acf"] ? "ACF fields found" : "ACF may not be installed — raw meta returned instead",
      });
    } catch (e) { return mcpError(e, "wp_get_acf_fields"); }
  });

  server.tool("wp_update_acf_fields", "Update ACF field values for a post/page. Pass field values keyed by field name.", UpdateAcfFieldsSchema.shape, async (p) => {
    try {
      const { post_id, post_type, acf } = UpdateAcfFieldsSchema.parse(p);
      const updated = await client.put<Record<string, unknown>>(`${post_type}/${post_id}`, { acf });
      return mcpSuccess({
        id: updated["id"],
        acf: updated["acf"],
        message: `ACF fields updated for ${post_type.slice(0, -1)} ${post_id}`,
      });
    } catch (e) { return mcpError(e, "wp_update_acf_fields"); }
  });

  server.tool("wp_list_acf_field_groups", "List ACF field groups (requires ACF plugin with REST API enabled).", ListAcfFieldGroupsSchema.shape, async () => {
    try {
      // ACF Pro exposes field groups at /wp-json/acf/v3/field-groups or via custom post type
      const groups = await client.list<Record<string, unknown>>("acf-field-group", {});
      return mcpSuccess(groups);
    } catch (e) { return mcpError(e, "wp_list_acf_field_groups"); }
  });
}
