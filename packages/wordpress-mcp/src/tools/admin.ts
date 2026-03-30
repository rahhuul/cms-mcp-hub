import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WpClient } from "../api/client.js";
import { ListPluginsSchema, GetPluginSchema, UpdatePluginSchema, DeletePluginSchema, InstallPluginSchema, ListThemesSchema, GetThemeSchema, GetSettingsSchema, UpdateSettingsSchema, SearchSchema, GetSiteHealthSchema } from "../schemas/index.js";

export function registerAdminTools(server: McpServer, client: WpClient): void {
  // Plugins
  server.tool("wp_list_plugins", "List installed plugins with active/inactive status.", ListPluginsSchema.shape, async (p) => { try { const f = ListPluginsSchema.parse(p); return mcpSuccess(await client.get("plugins", f as Record<string, string | number | boolean | undefined>)); } catch(e) { return mcpError(e, "wp_list_plugins"); } });
  server.tool("wp_get_plugin", "Get plugin details by slug.", GetPluginSchema.shape, async (p) => { try { return mcpSuccess(await client.get(`plugins/${GetPluginSchema.parse(p).plugin}`)); } catch(e) { return mcpError(e, "wp_get_plugin"); } });
  server.tool("wp_update_plugin", "Activate or deactivate a plugin.", UpdatePluginSchema.shape, async (p) => { try { const { plugin, status } = UpdatePluginSchema.parse(p); await client.put(`plugins/${plugin}`, { status }); return mcpSuccess({ message: `Plugin '${plugin}' ${status === "active" ? "activated" : "deactivated"}` }); } catch(e) { return mcpError(e, "wp_update_plugin"); } });
  server.tool("wp_delete_plugin", "Delete/uninstall a plugin (must be deactivated first).", DeletePluginSchema.shape, async (p) => { try { await client.del(`plugins/${DeletePluginSchema.parse(p).plugin}`); return mcpSuccess({ message: "Plugin deleted" }); } catch(e) { return mcpError(e, "wp_delete_plugin"); } });
  // Themes
  server.tool("wp_list_themes", "List installed themes.", ListThemesSchema.shape, async (p) => { try { return mcpSuccess(await client.get("themes", ListThemesSchema.parse(p) as Record<string, string | number | boolean | undefined>)); } catch(e) { return mcpError(e, "wp_list_themes"); } });
  server.tool("wp_get_theme", "Get theme details by stylesheet slug.", GetThemeSchema.shape, async (p) => { try { return mcpSuccess(await client.get(`themes/${GetThemeSchema.parse(p).stylesheet}`)); } catch(e) { return mcpError(e, "wp_get_theme"); } });
  // Settings
  server.tool("wp_get_settings", "Get WordPress site settings (title, tagline, URL, timezone, etc.).", GetSettingsSchema.shape, async () => { try { return mcpSuccess(await client.get("settings")); } catch(e) { return mcpError(e, "wp_get_settings"); } });
  server.tool("wp_update_settings", "Update site settings (title, tagline, timezone, date format, etc.).", UpdateSettingsSchema.shape, async (p) => { try { const v = UpdateSettingsSchema.parse(p); const s = await client.post<Record<string, unknown>>("settings", v); return mcpSuccess({ ...s, message: "Settings updated" }); } catch(e) { return mcpError(e, "wp_update_settings"); } });
  // Search
  server.tool("wp_install_plugin", "Install a plugin from WordPress.org by slug.", InstallPluginSchema.shape, async (p) => { try { const { slug } = InstallPluginSchema.parse(p); const pl = await client.post<Record<string, unknown>>("plugins", { slug, status: "inactive" }); return mcpSuccess({ plugin: pl["plugin"], name: pl["name"], status: pl["status"], message: `Plugin '${slug}' installed (inactive). Use wp_update_plugin to activate.` }); } catch(e) { return mcpError(e, "wp_install_plugin"); } });
  // Search
  server.tool("wp_search", "Global search across posts, pages, and other content types.", SearchSchema.shape, async (p) => { try { const { page, per_page, ...f } = SearchSchema.parse(p); return mcpSuccess(await client.list("search", f as Record<string, string | number | boolean | undefined>, page, per_page)); } catch(e) { return mcpError(e, "wp_search"); } });
  // Site Health
  server.tool("wp_get_site_health", "Get WordPress site health status and test results.", GetSiteHealthSchema.shape, async () => { try { return mcpSuccess(await client.get("site-health")); } catch(e) { return mcpError(e, "wp_get_site_health"); } });
}
