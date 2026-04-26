/**
 * ACF (Advanced Custom Fields) deep integration tools.
 *
 * Provides 10 tools for managing ACF field groups, field values, repeaters,
 * flexible content, options pages, cloning, and meta-based search.
 *
 * ACF exposes data via two mechanisms:
 * - Standard WP REST endpoints with `acf` key on post responses (when ACF REST is enabled)
 * - ACF-specific namespace: /wp-json/acf/v3/ (for options pages, etc.)
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WpClient } from "../api/client.js";
import {
  AcfListFieldGroupsSchema,
  AcfGetFieldGroupSchema,
  AcfGetPostFieldsSchema,
  AcfUpdatePostFieldsSchema,
  AcfListOptionsSchema,
  AcfUpdateOptionsSchema,
  AcfGetRepeaterSchema,
  AcfGetFlexibleContentSchema,
  AcfCloneFieldValuesSchema,
  AcfSearchByFieldSchema,
} from "../schemas/index.js";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const ACF_NOT_INSTALLED =
  "ACF (Advanced Custom Fields) does not appear to be active on this WordPress site. " +
  "Install and activate ACF from https://www.advancedcustomfields.com/ to use ACF tools. " +
  "Ensure 'Show in REST API' is enabled for your field groups in ACF settings.";

const ACF_PRO_REQUIRED =
  "This feature requires ACF Pro (options pages). " +
  "Upgrade to ACF Pro at https://www.advancedcustomfields.com/pro/ and register at least one options page.";

function resolveEndpoint(postType: string, customType?: string): string {
  if (postType === "custom") {
    if (!customType) throw new Error("custom_type is required when post_type is 'custom'");
    return customType;
  }
  return postType;
}

/**
 * Make a raw fetch call to the ACF v3 REST namespace.
 */
async function acfFetch<T>(
  client: WpClient,
  path: string,
  method: "GET" | "POST" = "GET",
  body?: unknown,
): Promise<T> {
  const siteUrl = client.getSiteUrl();
  const url = `${siteUrl}/wp-json/acf/v3/${path.replace(/^\//, "")}`;
  const headers: Record<string, string> = {
    Authorization: client.getAuthHeader(),
    "Content-Type": "application/json",
  };

  const init: RequestInit = { method, headers };
  if (body && method === "POST") {
    init.body = JSON.stringify(body);
  }

  const response = await fetch(url, init);
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    if (response.status === 404) {
      throw new Error(ACF_NOT_INSTALLED);
    }
    throw new Error(`ACF API error (${response.status}): ${text}`);
  }
  return response.json() as Promise<T>;
}

/**
 * Check if a response has the `acf` key, indicating ACF is active.
 */
function assertAcfPresent(data: Record<string, unknown>, _toolName: string): void {
  if (!("acf" in data) || data["acf"] === false) {
    throw new Error(
      `No ACF data found on this post. Possible reasons:\n` +
      `1. ACF is not installed/activated\n` +
      `2. 'Show in REST API' is not enabled for the field group\n` +
      `3. No ACF fields are assigned to this post type`,
    );
  }
}

/* ------------------------------------------------------------------ */
/*  Register ACF tools                                                 */
/* ------------------------------------------------------------------ */

export function registerAcfTools(server: McpServer, client: WpClient): void {

  // ── 1. wp_acf_list_field_groups ───────────────────────────────────
  server.tool(
    "wp_acf_list_field_groups",
    "List all ACF (Advanced Custom Fields) field groups with their fields, location rules, and status. Requires ACF plugin to be active. Returns field group titles, keys, fields, and assignment rules.",
    AcfListFieldGroupsSchema.shape,
    async (p) => {
      try {
        const { status, page, per_page } = AcfListFieldGroupsSchema.parse(p);
        const params: Record<string, string | number | boolean | undefined> = {
          page,
          per_page,
        };
        if (status !== "all") {
          params["status"] = status;
        }

        let groups: Record<string, unknown>[];
        try {
          groups = await client.list<Record<string, unknown>>(
            "acf-field-group",
            params,
            page,
            per_page,
          );
        } catch {
          throw new Error(ACF_NOT_INSTALLED);
        }

        const result = groups.map((g) => ({
          id: g["id"],
          title: typeof g["title"] === "object" && g["title"] !== null
            ? (g["title"] as Record<string, unknown>)["rendered"]
            : g["title"],
          status: g["status"],
          menu_order: g["menu_order"],
          modified: g["modified"],
        }));

        return mcpSuccess({
          total: result.length,
          page,
          per_page,
          field_groups: result,
        });
      } catch (e) {
        return mcpError(e, "wp_acf_list_field_groups");
      }
    },
  );

  // ── 2. wp_acf_get_field_group ─────────────────────────────────────
  server.tool(
    "wp_acf_get_field_group",
    "Get detailed information about a specific ACF field group by ID, including all field definitions, types, settings, and location rules. Useful for understanding the field structure before reading/writing field values.",
    AcfGetFieldGroupSchema.shape,
    async (p) => {
      try {
        const { id } = AcfGetFieldGroupSchema.parse(p);

        let group: Record<string, unknown>;
        try {
          group = await client.get<Record<string, unknown>>(`acf-field-group/${id}`);
        } catch {
          throw new Error(
            `Field group with ID ${id} not found. ` + ACF_NOT_INSTALLED,
          );
        }

        // Also fetch the fields belonging to this group
        let fields: Record<string, unknown>[] = [];
        try {
          fields = await client.list<Record<string, unknown>>(
            "acf-field",
            { parent: id } as Record<string, string | number | boolean | undefined>,
            1,
            100,
          );
        } catch {
          // Fields endpoint may not be available; continue without fields
        }

        return mcpSuccess({
          id: group["id"],
          title: typeof group["title"] === "object" && group["title"] !== null
            ? (group["title"] as Record<string, unknown>)["rendered"]
            : group["title"],
          status: group["status"],
          menu_order: group["menu_order"],
          modified: group["modified"],
          content: group["content"],
          field_count: fields.length,
          fields: fields.map((f) => ({
            id: f["id"],
            title: typeof f["title"] === "object" && f["title"] !== null
              ? (f["title"] as Record<string, unknown>)["rendered"]
              : f["title"],
            slug: f["slug"],
            status: f["status"],
            content: f["content"],
          })),
        });
      } catch (e) {
        return mcpError(e, "wp_acf_get_field_group");
      }
    },
  );

  // ── 3. wp_acf_get_post_fields ─────────────────────────────────────
  server.tool(
    "wp_acf_get_post_fields",
    "Get all ACF field values for a specific post or page. Returns the complete ACF data object with all custom field names and their current values. Requires ACF 'Show in REST API' to be enabled.",
    AcfGetPostFieldsSchema.shape,
    async (p) => {
      try {
        const { post_id, post_type, custom_type } = AcfGetPostFieldsSchema.parse(p);
        const endpoint = resolveEndpoint(post_type, custom_type);

        const post = await client.get<Record<string, unknown>>(
          `${endpoint}/${post_id}`,
          { acf_format: "standard" },
        );

        assertAcfPresent(post, "wp_acf_get_post_fields");

        const title = typeof post["title"] === "object" && post["title"] !== null
          ? (post["title"] as Record<string, unknown>)["rendered"]
          : post["title"];

        return mcpSuccess({
          post_id,
          post_type: endpoint,
          title,
          acf_fields: post["acf"],
        });
      } catch (e) {
        return mcpError(e, "wp_acf_get_post_fields");
      }
    },
  );

  // ── 4. wp_acf_update_post_fields ──────────────────────────────────
  server.tool(
    "wp_acf_update_post_fields",
    "Update ACF field values on a post or page. Pass field name-value pairs to update specific custom fields. Use wp_acf_get_post_fields first to see available field names. Supports text, number, boolean, select, image, and other ACF field types.",
    AcfUpdatePostFieldsSchema.shape,
    async (p) => {
      try {
        const { post_id, post_type, custom_type, fields } = AcfUpdatePostFieldsSchema.parse(p);
        const endpoint = resolveEndpoint(post_type, custom_type);

        const updated = await client.post<Record<string, unknown>>(
          `${endpoint}/${post_id}`,
          { acf: fields },
        );

        assertAcfPresent(updated, "wp_acf_update_post_fields");

        return mcpSuccess({
          post_id,
          post_type: endpoint,
          updated_fields: Object.keys(fields),
          acf_fields: updated["acf"],
          message: `Updated ${Object.keys(fields).length} ACF field(s) on ${endpoint}/${post_id}`,
        });
      } catch (e) {
        return mcpError(e, "wp_acf_update_post_fields");
      }
    },
  );

  // ── 5. wp_acf_list_options ────────────────────────────────────────
  server.tool(
    "wp_acf_list_options",
    "List all ACF options page field values (requires ACF Pro). Returns all custom field values stored on the specified options page. Default options page ID is 'options'.",
    AcfListOptionsSchema.shape,
    async (p) => {
      try {
        const { page_id } = AcfListOptionsSchema.parse(p);

        let options: Record<string, unknown>;
        try {
          options = await acfFetch<Record<string, unknown>>(
            client,
            `options/${page_id}`,
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes("404") || msg.includes("not found")) {
            throw new Error(ACF_PRO_REQUIRED);
          }
          throw err;
        }

        const fieldCount = options && typeof options === "object" ? Object.keys(options).length : 0;

        return mcpSuccess({
          page_id,
          field_count: fieldCount,
          options,
        });
      } catch (e) {
        return mcpError(e, "wp_acf_list_options");
      }
    },
  );

  // ── 6. wp_acf_update_options ──────────────────────────────────────
  server.tool(
    "wp_acf_update_options",
    "Update ACF options page field values (requires ACF Pro). Pass field name-value pairs to update global site options. Use wp_acf_list_options first to see available fields.",
    AcfUpdateOptionsSchema.shape,
    async (p) => {
      try {
        const { page_id, fields } = AcfUpdateOptionsSchema.parse(p);

        let updated: Record<string, unknown>;
        try {
          updated = await acfFetch<Record<string, unknown>>(
            client,
            `options/${page_id}`,
            "POST",
            { fields },
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes("404") || msg.includes("not found")) {
            throw new Error(ACF_PRO_REQUIRED);
          }
          throw err;
        }

        return mcpSuccess({
          page_id,
          updated_fields: Object.keys(fields),
          options: updated,
          message: `Updated ${Object.keys(fields).length} option field(s) on options page '${page_id}'`,
        });
      } catch (e) {
        return mcpError(e, "wp_acf_update_options");
      }
    },
  );

  // ── 7. wp_acf_get_repeater ────────────────────────────────────────
  server.tool(
    "wp_acf_get_repeater",
    "Get ACF repeater field data for a post with proper row structure. Returns an array of rows, where each row contains the sub-field values. Useful for structured repeated data like team members, FAQs, pricing tiers, etc.",
    AcfGetRepeaterSchema.shape,
    async (p) => {
      try {
        const { post_id, post_type, custom_type, field_name } = AcfGetRepeaterSchema.parse(p);
        const endpoint = resolveEndpoint(post_type, custom_type);

        const post = await client.get<Record<string, unknown>>(
          `${endpoint}/${post_id}`,
          { acf_format: "standard" },
        );

        assertAcfPresent(post, "wp_acf_get_repeater");

        const acf = post["acf"] as Record<string, unknown>;
        const repeaterData = acf[field_name];

        if (repeaterData === undefined || repeaterData === null) {
          throw new Error(
            `Repeater field '${field_name}' not found on ${endpoint}/${post_id}. ` +
            `Available ACF fields: ${Object.keys(acf).join(", ") || "(none)"}`,
          );
        }

        const rows = Array.isArray(repeaterData) ? repeaterData : [];

        return mcpSuccess({
          post_id,
          post_type: endpoint,
          field_name,
          row_count: rows.length,
          rows,
        });
      } catch (e) {
        return mcpError(e, "wp_acf_get_repeater");
      }
    },
  );

  // ── 8. wp_acf_get_flexible_content ────────────────────────────────
  server.tool(
    "wp_acf_get_flexible_content",
    "Get ACF flexible content field layouts for a post. Returns an array of layout blocks, each with its layout name (acf_fc_layout) and field values. Useful for page-builder-style content structures.",
    AcfGetFlexibleContentSchema.shape,
    async (p) => {
      try {
        const { post_id, post_type, custom_type, field_name } = AcfGetFlexibleContentSchema.parse(p);
        const endpoint = resolveEndpoint(post_type, custom_type);

        const post = await client.get<Record<string, unknown>>(
          `${endpoint}/${post_id}`,
          { acf_format: "standard" },
        );

        assertAcfPresent(post, "wp_acf_get_flexible_content");

        const acf = post["acf"] as Record<string, unknown>;
        const flexData = acf[field_name];

        if (flexData === undefined || flexData === null) {
          throw new Error(
            `Flexible content field '${field_name}' not found on ${endpoint}/${post_id}. ` +
            `Available ACF fields: ${Object.keys(acf).join(", ") || "(none)"}`,
          );
        }

        const layouts = Array.isArray(flexData) ? flexData : [];
        const layoutSummary = layouts.map((layout: Record<string, unknown>) => ({
          layout_name: layout["acf_fc_layout"] ?? "unknown",
          field_count: Object.keys(layout).filter((k) => k !== "acf_fc_layout").length,
        }));

        return mcpSuccess({
          post_id,
          post_type: endpoint,
          field_name,
          layout_count: layouts.length,
          layout_summary: layoutSummary,
          layouts,
        });
      } catch (e) {
        return mcpError(e, "wp_acf_get_flexible_content");
      }
    },
  );

  // ── 9. wp_acf_clone_field_values ──────────────────────────────────
  server.tool(
    "wp_acf_clone_field_values",
    "Copy all (or specific) ACF field values from one post to another. Reads ACF fields from the source post and writes them to the target post. Both posts must be the same post type. Useful for templating and content duplication.",
    AcfCloneFieldValuesSchema.shape,
    async (p) => {
      try {
        const { source_id, target_id, post_type, custom_type, field_names } =
          AcfCloneFieldValuesSchema.parse(p);
        const endpoint = resolveEndpoint(post_type, custom_type);

        // Read source ACF fields
        const source = await client.get<Record<string, unknown>>(
          `${endpoint}/${source_id}`,
          { acf_format: "standard" },
        );

        assertAcfPresent(source, "wp_acf_clone_field_values");
        const sourceAcf = source["acf"] as Record<string, unknown>;

        // Filter fields if specific names provided
        let fieldsToCopy: Record<string, unknown>;
        if (field_names && field_names.length > 0) {
          fieldsToCopy = {};
          for (const name of field_names) {
            if (name in sourceAcf) {
              fieldsToCopy[name] = sourceAcf[name];
            }
          }
          const missing = field_names.filter((n) => !(n in sourceAcf));
          if (missing.length > 0 && Object.keys(fieldsToCopy).length === 0) {
            throw new Error(
              `None of the specified fields found on source post ${source_id}. ` +
              `Available ACF fields: ${Object.keys(sourceAcf).join(", ")}`,
            );
          }
        } else {
          fieldsToCopy = { ...sourceAcf };
        }

        if (Object.keys(fieldsToCopy).length === 0) {
          throw new Error(`No ACF fields to copy from source post ${source_id}.`);
        }

        // Write to target
        const updated = await client.post<Record<string, unknown>>(
          `${endpoint}/${target_id}`,
          { acf: fieldsToCopy },
        );

        return mcpSuccess({
          source_id,
          target_id,
          post_type: endpoint,
          cloned_fields: Object.keys(fieldsToCopy),
          field_count: Object.keys(fieldsToCopy).length,
          target_acf: (updated as Record<string, unknown>)["acf"],
          message: `Cloned ${Object.keys(fieldsToCopy).length} ACF field(s) from ${endpoint}/${source_id} to ${endpoint}/${target_id}`,
        });
      } catch (e) {
        return mcpError(e, "wp_acf_clone_field_values");
      }
    },
  );

  // ── 10. wp_acf_search_by_field ────────────────────────────────────
  server.tool(
    "wp_acf_search_by_field",
    "Search posts by ACF field value using WordPress meta queries. Find all posts where a specific custom field matches a given value. Supports exact match, LIKE, NOT LIKE, EXISTS, and NOT EXISTS comparisons.",
    AcfSearchByFieldSchema.shape,
    async (p) => {
      try {
        const { field_name, field_value, post_type, custom_type, compare, page, per_page } =
          AcfSearchByFieldSchema.parse(p);
        const endpoint = resolveEndpoint(post_type, custom_type);

        // WordPress REST API supports meta_key/meta_value filtering
        // but for complex queries we need to use the meta query parameters
        const params: Record<string, string | number | boolean | undefined> = {
          page,
          per_page,
          meta_key: field_name,
          meta_value: field_value,
          meta_compare: compare,
          acf_format: "standard",
        };

        let posts: Record<string, unknown>[];
        try {
          posts = await client.list<Record<string, unknown>>(
            endpoint,
            params,
            page,
            per_page,
          );
        } catch (err) {
          // Some WP configurations don't support meta_compare via REST.
          // Fall back to basic meta_key + meta_value without compare.
          if (compare !== "=") {
            const fallbackParams: Record<string, string | number | boolean | undefined> = {
              page,
              per_page,
              meta_key: field_name,
              meta_value: field_value,
              acf_format: "standard",
            };
            posts = await client.list<Record<string, unknown>>(
              endpoint,
              fallbackParams,
              page,
              per_page,
            );
          } else {
            throw err;
          }
        }

        const results = posts.map((post) => {
          const title = typeof post["title"] === "object" && post["title"] !== null
            ? (post["title"] as Record<string, unknown>)["rendered"]
            : post["title"];
          const acf = post["acf"] as Record<string, unknown> | undefined;
          return {
            id: post["id"],
            title,
            status: post["status"],
            link: post["link"],
            matched_field: field_name,
            matched_value: acf ? acf[field_name] : undefined,
            acf_fields: acf,
          };
        });

        return mcpSuccess({
          search: { field_name, field_value, compare },
          post_type: endpoint,
          page,
          per_page,
          result_count: results.length,
          results,
        });
      } catch (e) {
        return mcpError(e, "wp_acf_search_by_field");
      }
    },
  );
}
