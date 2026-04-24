/**
 * Site management tools — list, switch, and inspect configured WordPress sites.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { SiteManager } from "../site-manager.js";
import { ListSitesSchema, SwitchSiteSchema, GetActiveSiteSchema } from "../schemas/index.js";

export function registerSiteTools(server: McpServer, siteManager: SiteManager): void {
  server.tool(
    "wp_list_sites",
    "List all configured WordPress sites. Shows site ID, name, URL, and which site is currently active. Use site IDs with wp_switch_site to change the active site.",
    ListSitesSchema.shape,
    async () => {
      try {
        const sites = siteManager.listSites();
        return mcpSuccess({
          sites,
          activeSite: sites.find((s) => s.active)?.id,
          totalSites: sites.length,
        });
      } catch (e) {
        return mcpError(e, "wp_list_sites");
      }
    },
  );

  server.tool(
    "wp_switch_site",
    "Switch the active WordPress site. All subsequent tool calls will target the new site. Use wp_list_sites to see available site IDs.",
    SwitchSiteSchema.shape,
    async (params) => {
      try {
        const { siteId } = SwitchSiteSchema.parse(params);
        const site = siteManager.switchSite(siteId);
        return mcpSuccess({
          message: `Switched to site "${site.name}" (${site.url})`,
          activeSite: {
            id: site.id,
            name: site.name,
            url: site.url,
            username: site.username,
          },
        });
      } catch (e) {
        return mcpError(e, "wp_switch_site");
      }
    },
  );

  server.tool(
    "wp_get_active_site",
    "Get information about the currently active WordPress site, including its ID, name, URL, and username.",
    GetActiveSiteSchema.shape,
    async () => {
      try {
        const { config } = siteManager.getActiveSite();
        return mcpSuccess({
          id: config.id,
          name: config.name,
          url: config.url,
          username: config.username,
          isDefault: config.default === true,
        });
      } catch (e) {
        return mcpError(e, "wp_get_active_site");
      }
    },
  );
}
