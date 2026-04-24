/**
 * WordPress Multisite network management tools.
 * Tools 1-5 attempt WP REST API first (WP 5.9+ /wp/v2/sites), with fallback to plugin.
 * Tools 6-8 require the CMS MCP Hub plugin for network-level queries.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WpClient } from "../api/client.js";
import type { PluginClient } from "../api/plugin-client.js";
import {
  MultisiteListSitesSchema,
  MultisiteGetSiteSchema,
  MultisiteCreateSiteSchema,
  MultisiteUpdateSiteSchema,
  MultisiteDeleteSiteSchema,
  MultisiteListNetworkPluginsSchema,
  MultisiteListNetworkThemesSchema,
  MultisiteGetNetworkSettingsSchema,
} from "../schemas/index.js";

const PLUGIN_REQUIRED_MSG =
  "The CMS MCP Hub plugin is required for this tool. Install and activate it on the WordPress site.";

export function registerMultisiteTools(server: McpServer, client: WpClient, pluginClient: PluginClient): void {

  // ── wp_multisite_list_sites ─────────────────────────────────────────
  server.tool(
    "wp_multisite_list_sites",
    "List all sites in the WordPress multisite network. Returns blog IDs, domains, paths, and status. Tries WP REST API first (WP 5.9+), falls back to CMS MCP Hub plugin.",
    MultisiteListSitesSchema.shape,
    async (params) => {
      try {
        const validated = MultisiteListSitesSchema.parse(params);
        const queryParams: Record<string, string | number | boolean | undefined> = {
          page: validated.page,
          per_page: validated.per_page,
        };
        if (validated.search) queryParams["search"] = validated.search;

        // Try standard REST API first (WP 5.9+)
        try {
          const sites = await client.list<Record<string, unknown>>(
            "sites",
            queryParams,
            validated.page,
            validated.per_page,
          );
          return mcpSuccess({ sites, count: sites.length, source: "rest_api" });
        } catch {
          // Fallback to plugin
          if (!(await pluginClient.isAvailable())) {
            return mcpError(
              new Error(
                "Multisite sites endpoint not available. This requires either WordPress 5.9+ multisite " +
                "or the CMS MCP Hub plugin. Ensure multisite is enabled and you have Super Admin privileges."
              ),
              "wp_multisite_list_sites",
            );
          }
          const sites = await pluginClient.listNetworkSites(queryParams);
          return mcpSuccess({ sites, source: "plugin" });
        }
      } catch (e) {
        return mcpError(e, "wp_multisite_list_sites");
      }
    },
  );

  // ── wp_multisite_get_site ───────────────────────────────────────────
  server.tool(
    "wp_multisite_get_site",
    "Get details about a specific site in the multisite network by blog ID. Returns domain, path, status, options, and admin info.",
    MultisiteGetSiteSchema.shape,
    async (params) => {
      try {
        const { blog_id } = MultisiteGetSiteSchema.parse(params);

        // Try standard REST API first
        try {
          const site = await client.get<Record<string, unknown>>(`sites/${blog_id}`);
          return mcpSuccess({ site, source: "rest_api" });
        } catch {
          // Fallback to plugin
          if (!(await pluginClient.isAvailable())) {
            return mcpError(
              new Error(
                "Multisite site endpoint not available. This requires either WordPress 5.9+ multisite " +
                "or the CMS MCP Hub plugin."
              ),
              "wp_multisite_get_site",
            );
          }
          const site = await pluginClient.getNetworkSite(blog_id);
          return mcpSuccess({ site, source: "plugin" });
        }
      } catch (e) {
        return mcpError(e, "wp_multisite_get_site");
      }
    },
  );

  // ── wp_multisite_create_site ────────────────────────────────────────
  server.tool(
    "wp_multisite_create_site",
    "Create a new site in the WordPress multisite network. Requires Super Admin privileges. Specify domain/path, title, and admin user.",
    MultisiteCreateSiteSchema.shape,
    async (params) => {
      try {
        const validated = MultisiteCreateSiteSchema.parse(params);
        const data: Record<string, unknown> = {
          title: validated.title,
          slug: validated.slug,
        };
        if (validated.domain) data["domain"] = validated.domain;
        if (validated.admin_user_id) data["admin_user_id"] = validated.admin_user_id;
        if (validated.admin_email) data["admin_email"] = validated.admin_email;
        if (validated.public !== undefined) data["public"] = validated.public;

        // Try standard REST API first
        try {
          const site = await client.post<Record<string, unknown>>("sites", data);
          return mcpSuccess({ message: "Site created successfully.", site, source: "rest_api" });
        } catch {
          // Fallback to plugin
          if (!(await pluginClient.isAvailable())) {
            return mcpError(
              new Error(
                "Cannot create multisite site. This requires either WordPress 5.9+ multisite REST API " +
                "or the CMS MCP Hub plugin with Super Admin privileges."
              ),
              "wp_multisite_create_site",
            );
          }
          const site = await pluginClient.createNetworkSite(data);
          return mcpSuccess({ message: "Site created successfully.", site, source: "plugin" });
        }
      } catch (e) {
        return mcpError(e, "wp_multisite_create_site");
      }
    },
  );

  // ── wp_multisite_update_site ────────────────────────────────────────
  server.tool(
    "wp_multisite_update_site",
    "Update a network site in the WordPress multisite installation. Can change title, status (active/archived/spam/deleted), and public visibility flag.",
    MultisiteUpdateSiteSchema.shape,
    async (params) => {
      try {
        const validated = MultisiteUpdateSiteSchema.parse(params);
        const data: Record<string, unknown> = {};
        if (validated.title !== undefined) data["title"] = validated.title;
        if (validated.status !== undefined) data["status"] = validated.status;
        if (validated.public !== undefined) data["public"] = validated.public;

        // Try standard REST API first
        try {
          const site = await client.post<Record<string, unknown>>(`sites/${validated.blog_id}`, data);
          return mcpSuccess({ message: `Site ${validated.blog_id} updated.`, site, source: "rest_api" });
        } catch {
          if (!(await pluginClient.isAvailable())) {
            return mcpError(
              new Error(
                "Cannot update multisite site. This requires either WordPress 5.9+ multisite REST API " +
                "or the CMS MCP Hub plugin."
              ),
              "wp_multisite_update_site",
            );
          }
          const site = await pluginClient.updateNetworkSite(validated.blog_id, data);
          return mcpSuccess({ message: `Site ${validated.blog_id} updated.`, site, source: "plugin" });
        }
      } catch (e) {
        return mcpError(e, "wp_multisite_update_site");
      }
    },
  );

  // ── wp_multisite_delete_site ────────────────────────────────────────
  server.tool(
    "wp_multisite_delete_site",
    "Delete or archive a site in the WordPress multisite network. DESTRUCTIVE: set confirm=true to proceed. By default archives instead of permanently deleting.",
    MultisiteDeleteSiteSchema.shape,
    async (params) => {
      try {
        const validated = MultisiteDeleteSiteSchema.parse(params);

        if (!validated.confirm) {
          return mcpError(
            new Error(
              `Refusing to delete/archive site ${validated.blog_id} without confirmation. ` +
              `Set confirm=true to proceed. This action cannot be undone if permanent=true.`
            ),
            "wp_multisite_delete_site",
          );
        }

        // Try standard REST API first
        try {
          const result = await client.del<Record<string, unknown>>(
            `sites/${validated.blog_id}`,
            { force: validated.permanent },
          );
          return mcpSuccess({
            message: validated.permanent
              ? `Site ${validated.blog_id} permanently deleted.`
              : `Site ${validated.blog_id} archived.`,
            result,
            source: "rest_api",
          });
        } catch {
          if (!(await pluginClient.isAvailable())) {
            return mcpError(
              new Error(
                "Cannot delete multisite site. This requires either WordPress 5.9+ multisite REST API " +
                "or the CMS MCP Hub plugin."
              ),
              "wp_multisite_delete_site",
            );
          }
          const result = await pluginClient.deleteNetworkSite(validated.blog_id);
          return mcpSuccess({
            message: validated.permanent
              ? `Site ${validated.blog_id} permanently deleted.`
              : `Site ${validated.blog_id} archived.`,
            result,
            source: "plugin",
          });
        }
      } catch (e) {
        return mcpError(e, "wp_multisite_delete_site");
      }
    },
  );

  // ── wp_multisite_list_network_plugins ───────────────────────────────
  server.tool(
    "wp_multisite_list_network_plugins",
    "List all network-activated plugins in the WordPress multisite installation. Shows plugin name, version, author, and network activation status. Requires CMS MCP Hub plugin.",
    MultisiteListNetworkPluginsSchema.shape,
    async (_params) => {
      try {
        if (!(await pluginClient.isAvailable())) {
          return mcpError(new Error(PLUGIN_REQUIRED_MSG), "wp_multisite_list_network_plugins");
        }

        // Use the standard WP REST API plugins endpoint with network context
        try {
          const plugins = await client.list<Record<string, unknown>>("plugins", { status: "network-active" });
          return mcpSuccess({ plugins, count: plugins.length });
        } catch {
          // Fallback: try plugin endpoint for network plugin listing
          const result = await pluginClient.getNetworkSettings();
          const settings = result as Record<string, unknown>;
          return mcpSuccess({
            plugins: settings["network_plugins"] ?? [],
            note: "Retrieved via plugin fallback. Install WordPress 5.5+ for direct REST API support.",
          });
        }
      } catch (e) {
        return mcpError(e, "wp_multisite_list_network_plugins");
      }
    },
  );

  // ── wp_multisite_list_network_themes ────────────────────────────────
  server.tool(
    "wp_multisite_list_network_themes",
    "List all network-enabled themes in the WordPress multisite installation. Shows theme name, version, author, and whether it is enabled network-wide. Uses WP REST API /wp/v2/themes.",
    MultisiteListNetworkThemesSchema.shape,
    async (_params) => {
      try {
        // Themes endpoint is available in standard WP REST API
        const themes = await client.list<Record<string, unknown>>("themes", {});
        return mcpSuccess({ themes, count: themes.length });
      } catch (e) {
        return mcpError(e, "wp_multisite_list_network_themes");
      }
    },
  );

  // ── wp_multisite_get_network_settings ───────────────────────────────
  server.tool(
    "wp_multisite_get_network_settings",
    "Get network-wide settings for the WordPress multisite installation. Returns registration options, upload limits, allowed file types, default site settings, and more. Requires CMS MCP Hub plugin.",
    MultisiteGetNetworkSettingsSchema.shape,
    async (_params) => {
      try {
        if (!(await pluginClient.isAvailable())) {
          return mcpError(new Error(PLUGIN_REQUIRED_MSG), "wp_multisite_get_network_settings");
        }

        const settings = await pluginClient.getNetworkSettings();
        return mcpSuccess(settings);
      } catch (e) {
        return mcpError(e, "wp_multisite_get_network_settings");
      }
    },
  );
}
