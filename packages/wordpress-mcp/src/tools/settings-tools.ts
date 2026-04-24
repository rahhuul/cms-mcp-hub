/**
 * WordPress settings and options management tools.
 * Settings (1-2, 7) use the standard WP REST API.
 * Options/transients (3-6) require the CMS MCP Hub plugin.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WpClient } from "../api/client.js";
import type { PluginClient } from "../api/plugin-client.js";
import {
  GetSettingsGroupSchema,
  UpdateSettingsBatchSchema,
  GetOptionSchema,
  UpdateOptionSchema,
  ListTransientsSchema,
  DeleteTransientSchema,
  GetSiteHealthSchema,
} from "../schemas/index.js";

// Settings that should never be changed via the API without explicit warning
const PROTECTED_SETTINGS = new Set([
  "siteurl",
  "home",
  "url",
]);

// Options that are blocked from modification (security-critical)
const BLOCKED_OPTIONS = new Set([
  "siteurl",
  "home",
  "admin_email",
  "db_version",
  "initial_db_version",
  "secret",
  "nonce_key",
  "nonce_salt",
  "auth_key",
  "auth_salt",
  "secure_auth_key",
  "secure_auth_salt",
  "logged_in_key",
  "logged_in_salt",
]);

const PLUGIN_REQUIRED_MSG =
  "The CMS MCP Hub plugin is required for this tool. Install and activate it on the WordPress site.";

export function registerSettingsTools(server: McpServer, client: WpClient, pluginClient: PluginClient): void {

  // ── wp_get_settings ───────────────────────────────────────────────
  server.tool(
    "wp_get_settings",
    "Get WordPress site settings (general, writing, reading, discussion, media, permalinks). Returns all configurable settings from the WP REST API.",
    GetSettingsGroupSchema.shape,
    async (params) => {
      try {
        const validated = GetSettingsGroupSchema.parse(params);
        const settings = await client.get<Record<string, unknown>>("settings");

        // If a specific group is requested, filter the results
        if (validated.group) {
          const groupPrefixes: Record<string, string[]> = {
            general: ["title", "description", "url", "email", "timezone", "date_format", "time_format", "start_of_week", "language", "site_icon", "site_logo"],
            writing: ["default_category", "default_post_format", "use_smilies"],
            reading: ["posts_per_page", "posts_per_rss", "rss_use_excerpt", "show_on_front", "page_on_front", "page_for_posts"],
            discussion: ["default_comment_status", "default_ping_status"],
            media: ["thumbnail_size_w", "thumbnail_size_h", "medium_size_w", "medium_size_h", "large_size_w", "large_size_h"],
            permalinks: ["permalink_structure"],
          };

          const keys = groupPrefixes[validated.group];
          if (keys) {
            const filtered: Record<string, unknown> = {};
            for (const key of keys) {
              if (key in settings) {
                filtered[key] = settings[key];
              }
            }
            return mcpSuccess({ group: validated.group, settings: filtered });
          }
        }

        return mcpSuccess(settings);
      } catch (e) {
        return mcpError(e, "wp_get_settings");
      }
    },
  );

  // ── wp_update_settings ────────────────────────────────────────────
  server.tool(
    "wp_update_settings",
    "Update one or more WordPress settings. Supports general, writing, reading, discussion, and media settings. Protected settings (siteurl, home) will be rejected to prevent accidental site breakage.",
    UpdateSettingsBatchSchema.shape,
    async (params) => {
      try {
        const { settings } = UpdateSettingsBatchSchema.parse(params);

        // Check for protected settings
        const protectedKeys = Object.keys(settings).filter((k) => PROTECTED_SETTINGS.has(k));
        if (protectedKeys.length > 0) {
          return mcpError(
            new Error(
              `Refusing to update protected settings: ${protectedKeys.join(", ")}. ` +
              `Changing these can break site access. Update them directly in wp-config.php or WordPress admin.`
            ),
            "wp_update_settings",
          );
        }

        const result = await client.post<Record<string, unknown>>("settings", settings);
        return mcpSuccess({
          message: `Updated ${Object.keys(settings).length} setting(s) successfully.`,
          updated: result,
        });
      } catch (e) {
        return mcpError(e, "wp_update_settings");
      }
    },
  );

  // ── wp_get_option ─────────────────────────────────────────────────
  server.tool(
    "wp_get_option",
    "Get a specific WordPress option by name. Reads from the wp_options table via the CMS MCP Hub plugin. Useful for reading plugin settings, theme options, and custom configuration.",
    GetOptionSchema.shape,
    async (params) => {
      try {
        if (!(await pluginClient.isAvailable())) {
          return mcpError(new Error(PLUGIN_REQUIRED_MSG), "wp_get_option");
        }
        const { name } = GetOptionSchema.parse(params);
        const result = await pluginClient.getOption(name);
        return mcpSuccess(result);
      } catch (e) {
        return mcpError(e, "wp_get_option");
      }
    },
  );

  // ── wp_update_option ──────────────────────────────────────────────
  server.tool(
    "wp_update_option",
    "Update a specific WordPress option by name. Writes to the wp_options table via the CMS MCP Hub plugin. Blocked for security-critical options (auth keys, salts, siteurl, home, admin_email).",
    UpdateOptionSchema.shape,
    async (params) => {
      try {
        if (!(await pluginClient.isAvailable())) {
          return mcpError(new Error(PLUGIN_REQUIRED_MSG), "wp_update_option");
        }
        const { name, value } = UpdateOptionSchema.parse(params);

        // Block security-critical options
        if (BLOCKED_OPTIONS.has(name)) {
          return mcpError(
            new Error(
              `Option "${name}" is blocked from modification for security reasons. ` +
              `Update it directly in wp-config.php or WordPress admin.`
            ),
            "wp_update_option",
          );
        }

        const result = await pluginClient.updateOption(name, value);
        return mcpSuccess({
          message: `Option "${name}" updated successfully.`,
          result,
        });
      } catch (e) {
        return mcpError(e, "wp_update_option");
      }
    },
  );

  // ── wp_list_transients ────────────────────────────────────────────
  server.tool(
    "wp_list_transients",
    "List WordPress transients (cached data stored in wp_options). Filter by search pattern or show only expired. Requires the CMS MCP Hub plugin.",
    ListTransientsSchema.shape,
    async (params) => {
      try {
        if (!(await pluginClient.isAvailable())) {
          return mcpError(new Error(PLUGIN_REQUIRED_MSG), "wp_list_transients");
        }
        const validated = ListTransientsSchema.parse(params);
        const filters: Record<string, unknown> = {};
        if (validated.search) filters["search"] = validated.search;
        if (validated.expired_only !== undefined) filters["expired_only"] = validated.expired_only;
        if (validated.page) filters["page"] = validated.page;
        if (validated.per_page) filters["per_page"] = validated.per_page;

        const result = await pluginClient.listTransients(filters);
        return mcpSuccess(result);
      } catch (e) {
        return mcpError(e, "wp_list_transients");
      }
    },
  );

  // ── wp_delete_transient ───────────────────────────────────────────
  server.tool(
    "wp_delete_transient",
    "Delete a specific transient by name, or delete all expired transients. Pass name='__expired__' to clear all expired transients. Requires the CMS MCP Hub plugin.",
    DeleteTransientSchema.shape,
    async (params) => {
      try {
        if (!(await pluginClient.isAvailable())) {
          return mcpError(new Error(PLUGIN_REQUIRED_MSG), "wp_delete_transient");
        }
        const { name } = DeleteTransientSchema.parse(params);
        const result = await pluginClient.deleteTransient(name);
        return mcpSuccess({
          message: name === "__expired__"
            ? "All expired transients deleted."
            : `Transient "${name}" deleted successfully.`,
          result,
        });
      } catch (e) {
        return mcpError(e, "wp_delete_transient");
      }
    },
  );

  // ── wp_get_site_health ────────────────────────────────────────────
  server.tool(
    "wp_get_site_health",
    "Get WordPress Site Health status and recommendations. Shows critical issues, recommended improvements, and passed tests. Requires WordPress 5.2+.",
    GetSiteHealthSchema.shape,
    async (_params) => {
      try {
        // Site Health uses a different REST API namespace: wp-site-health/v1
        // We need to construct the URL manually since WpClient is scoped to wp/v2
        const siteUrl = client.getSiteUrl().replace(/\/wp-json\/wp\/v2\/?$/, "");
        const healthUrl = `${siteUrl}/wp-json/wp-site-health/v1`;

        // Try to fetch directory tests first
        let tests: unknown;
        try {
          // Use the WpClient's underlying fetch via a raw get to the custom endpoint
          // We build a relative path from the wp/v2 base — but Site Health lives outside that.
          // Instead, use the plugin client's api for raw fetches, or fetch directly.
          const response = await fetch(`${healthUrl}/tests/page-cache`, {
            headers: {
              Authorization: client.getAuthHeader(),
            },
          });

          if (response.status === 404) {
            return mcpError(
              new Error(
                "Site Health API not available. This requires WordPress 5.2 or higher. " +
                "Check that your WordPress version supports Site Health."
              ),
              "wp_get_site_health",
            );
          }

          tests = await response.json();
        } catch {
          // If page-cache test fails, try the directory test
          tests = null;
        }

        // Fetch the main site health info via standard REST API
        // WordPress exposes site health through a different mechanism
        // Try fetching available test endpoints
        const testEndpoints = [
          "background-updates",
          "loopback-requests",
          "https-status",
          "dotorg-communication",
          "authorization-header",
        ];

        const results: Record<string, unknown> = {};
        if (tests) {
          results["page_cache"] = tests;
        }

        for (const endpoint of testEndpoints) {
          try {
            const resp = await fetch(`${healthUrl}/tests/${endpoint}`, {
              headers: { Authorization: client.getAuthHeader() },
            });
            if (resp.ok) {
              results[endpoint.replace(/-/g, "_")] = await resp.json();
            }
          } catch {
            // Skip unavailable tests
          }
        }

        // Also fetch the directory sizes if available
        try {
          const dirResp = await fetch(`${healthUrl}/directory-sizes`, {
            headers: { Authorization: client.getAuthHeader() },
          });
          if (dirResp.ok) {
            results["directory_sizes"] = await dirResp.json();
          }
        } catch {
          // Skip if not available
        }

        if (Object.keys(results).length === 0) {
          return mcpError(
            new Error(
              "Site Health API returned no data. This may indicate WordPress < 5.2 or " +
              "the Site Health feature has been disabled by a plugin."
            ),
            "wp_get_site_health",
          );
        }

        return mcpSuccess({
          site_health: results,
          tests_run: Object.keys(results).length,
          note: "Some Site Health tests may require cron to run. Results may be cached.",
        });
      } catch (e) {
        return mcpError(e, "wp_get_site_health");
      }
    },
  );
}
