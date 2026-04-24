/**
 * WordPress theme management tools.
 * Tools 1-3, 8 use the standard WP REST API (/wp/v2/themes).
 * Tools 4-7 require the CMS MCP Hub plugin for Customizer access.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WpClient } from "../api/client.js";
import type { PluginClient } from "../api/plugin-client.js";
import {
  ListThemesSchema,
  GetThemeSchema,
  ActivateThemeSchema,
  GetThemeModsSchema,
  UpdateThemeModSchema,
  ExportCustomizerSchema,
  ImportCustomizerSchema,
  GetThemeSupportSchema,
} from "../schemas/index.js";

const PLUGIN_REQUIRED_MSG =
  "The CMS MCP Hub plugin is required for this tool. Install and activate it on the WordPress site.";

export function registerThemeTools(server: McpServer, client: WpClient, pluginClient: PluginClient): void {

  // ── wp_list_themes ──────────────────────────────────────────────────
  server.tool(
    "wp_list_themes",
    "List all installed WordPress themes with active/inactive status, version, author, and description. Uses GET /wp/v2/themes.",
    ListThemesSchema.shape,
    async (params) => {
      try {
        const validated = ListThemesSchema.parse(params);
        const queryParams: Record<string, string | number | boolean | undefined> = {};
        if (validated.status) queryParams["status"] = validated.status;
        if (validated.search) queryParams["search"] = validated.search;

        const themes = await client.get<Record<string, unknown>[]>("themes", queryParams);
        return mcpSuccess({ themes, count: Array.isArray(themes) ? themes.length : 0 });
      } catch (e) {
        return mcpError(e, "wp_list_themes");
      }
    },
  );

  // ── wp_get_theme ────────────────────────────────────────────────────
  server.tool(
    "wp_get_theme",
    "Get detailed information about a specific WordPress theme by its stylesheet slug. Returns name, version, author, description, screenshot URL, tags, and supported features.",
    GetThemeSchema.shape,
    async (params) => {
      try {
        const { stylesheet } = GetThemeSchema.parse(params);
        const theme = await client.get<Record<string, unknown>>(`themes/${encodeURIComponent(stylesheet)}`);
        return mcpSuccess(theme);
      } catch (e) {
        return mcpError(e, "wp_get_theme");
      }
    },
  );

  // ── wp_activate_theme ───────────────────────────────────────────────
  server.tool(
    "wp_activate_theme",
    "Activate/switch to a different installed WordPress theme. Specify the theme's stylesheet slug (folder name). The previously active theme becomes inactive but remains installed.",
    ActivateThemeSchema.shape,
    async (params) => {
      try {
        const { stylesheet } = ActivateThemeSchema.parse(params);
        const result = await client.post<Record<string, unknown>>(
          `themes/${encodeURIComponent(stylesheet)}`,
          { status: "active" },
        );
        return mcpSuccess({
          message: `Theme "${stylesheet}" activated successfully.`,
          theme: result,
        });
      } catch (e) {
        return mcpError(e, "wp_activate_theme");
      }
    },
  );

  // ── wp_get_theme_mods ───────────────────────────────────────────────
  server.tool(
    "wp_get_theme_mods",
    "Get all theme modifications (Customizer settings) for the active theme. Returns colors, fonts, layout options, header/footer settings, and other Customizer values. Requires CMS MCP Hub plugin.",
    GetThemeModsSchema.shape,
    async (_params) => {
      try {
        if (!(await pluginClient.isAvailable())) {
          return mcpError(new Error(PLUGIN_REQUIRED_MSG), "wp_get_theme_mods");
        }
        const mods = await pluginClient.getThemeMods();
        return mcpSuccess(mods);
      } catch (e) {
        return mcpError(e, "wp_get_theme_mods");
      }
    },
  );

  // ── wp_update_theme_mod ─────────────────────────────────────────────
  server.tool(
    "wp_update_theme_mod",
    "Update a single theme modification (Customizer setting) for the active theme. Specify the mod name and new value. Use wp_get_theme_mods to see available mod names. Requires CMS MCP Hub plugin.",
    UpdateThemeModSchema.shape,
    async (params) => {
      try {
        if (!(await pluginClient.isAvailable())) {
          return mcpError(new Error(PLUGIN_REQUIRED_MSG), "wp_update_theme_mod");
        }
        const { name, value } = UpdateThemeModSchema.parse(params);
        const result = await pluginClient.updateThemeMod(name, value);
        return mcpSuccess({
          message: `Theme mod "${name}" updated successfully.`,
          result,
        });
      } catch (e) {
        return mcpError(e, "wp_update_theme_mod");
      }
    },
  );

  // ── wp_export_customizer ────────────────────────────────────────────
  server.tool(
    "wp_export_customizer",
    "Export all WordPress Customizer settings as JSON. Returns the complete set of theme modifications, custom CSS, widgets, menus, and other Customizer data. Useful for backup or migration. Requires CMS MCP Hub plugin.",
    ExportCustomizerSchema.shape,
    async (_params) => {
      try {
        if (!(await pluginClient.isAvailable())) {
          return mcpError(new Error(PLUGIN_REQUIRED_MSG), "wp_export_customizer");
        }
        const data = await pluginClient.exportCustomizer();
        return mcpSuccess(data);
      } catch (e) {
        return mcpError(e, "wp_export_customizer");
      }
    },
  );

  // ── wp_import_customizer ────────────────────────────────────────────
  server.tool(
    "wp_import_customizer",
    "Import WordPress Customizer settings from a JSON object. Applies theme modifications, custom CSS, and other Customizer data. Use wp_export_customizer to get the expected format. CAUTION: this overwrites current Customizer settings. Requires CMS MCP Hub plugin.",
    ImportCustomizerSchema.shape,
    async (params) => {
      try {
        if (!(await pluginClient.isAvailable())) {
          return mcpError(new Error(PLUGIN_REQUIRED_MSG), "wp_import_customizer");
        }
        const { data } = ImportCustomizerSchema.parse(params);
        const result = await pluginClient.importCustomizer(data);
        return mcpSuccess({
          message: "Customizer settings imported successfully.",
          result,
        });
      } catch (e) {
        return mcpError(e, "wp_import_customizer");
      }
    },
  );

  // ── wp_get_theme_support ────────────────────────────────────────────
  server.tool(
    "wp_get_theme_support",
    "Get the list of features supported by the active WordPress theme. Shows support for custom-logo, post-thumbnails, custom-header, custom-background, title-tag, automatic-feed-links, html5, post-formats, block styles, and more.",
    GetThemeSupportSchema.shape,
    async (_params) => {
      try {
        // Theme support info is included in the theme details for the active theme
        const themes = await client.get<Record<string, unknown>[]>("themes", { status: "active" });

        if (!Array.isArray(themes) || themes.length === 0) {
          return mcpError(
            new Error("No active theme found. This should not happen on a functioning WordPress installation."),
            "wp_get_theme_support",
          );
        }

        const activeTheme = themes[0];
        return mcpSuccess({
          theme: activeTheme["stylesheet"] ?? activeTheme["name"],
          theme_supports: activeTheme["theme_supports"] ?? {},
          features: activeTheme["tags"] ?? [],
          version: activeTheme["version"],
        });
      } catch (e) {
        return mcpError(e, "wp_get_theme_support");
      }
    },
  );
}
