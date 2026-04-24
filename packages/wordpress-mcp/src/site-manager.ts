/**
 * Runtime site management — holds WpClient instances for all configured sites,
 * manages active site selection and switching.
 */

import { createLogger, ConfigError } from "@cmsmcp/shared";
import { WpClient } from "./api/client.js";
import { PluginClient } from "./api/plugin-client.js";
import type { SiteConfig, CmsmcpConfig, SiteInfo } from "./types/config.js";

const logger = createLogger("wordpress");

export class SiteManager {
  private readonly clients: Map<string, WpClient> = new Map();
  private readonly pluginClients: Map<string, PluginClient> = new Map();
  private readonly siteConfigs: Map<string, SiteConfig> = new Map();
  private activeSiteId: string;

  constructor(config: CmsmcpConfig) {
    if (config.sites.length === 0) {
      throw new ConfigError("No sites configured. Add at least one site.");
    }

    // Determine default site
    const defaultSite = config.sites.find((s) => s.default) ?? config.sites[0];
    this.activeSiteId = defaultSite.id;

    // Optional plugin-specific API key
    const pluginApiKey = process.env["CMSMCP_API_KEY"];

    // Create WpClient and PluginClient instances for each site
    for (const site of config.sites) {
      this.siteConfigs.set(site.id, site);

      const wpClient = new WpClient({
        url: site.url,
        username: site.username,
        applicationPassword: site.appPassword,
      });
      this.clients.set(site.id, wpClient);

      this.pluginClients.set(
        site.id,
        new PluginClient({
          baseUrl: wpClient.getSiteUrl(),
          authHeader: wpClient.getAuthHeader(),
          apiKey: pluginApiKey,
        }),
      );
    }

    logger.info("SiteManager initialized", {
      siteCount: config.sites.length,
      activeSite: this.activeSiteId,
    });
  }

  /**
   * Get the currently active site's client and config.
   */
  getActiveSite(): { client: WpClient; pluginClient: PluginClient; config: SiteConfig } {
    const client = this.clients.get(this.activeSiteId);
    const pluginClient = this.pluginClients.get(this.activeSiteId);
    const config = this.siteConfigs.get(this.activeSiteId);
    if (!client || !pluginClient || !config) {
      throw new ConfigError(`Active site "${this.activeSiteId}" not found. This should not happen.`);
    }
    return { client, pluginClient, config };
  }

  /**
   * Get the PluginClient for a specific site, or the active site if no ID given.
   */
  getPluginClient(siteId?: string): PluginClient {
    const id = siteId ?? this.activeSiteId;
    const client = this.pluginClients.get(id);
    if (!client) {
      const available = Array.from(this.siteConfigs.keys()).join(", ");
      throw new ConfigError(`Site "${id}" not found. Available sites: ${available}`);
    }
    return client;
  }

  /**
   * Switch to a different configured site.
   */
  switchSite(siteId: string): SiteConfig {
    if (!this.siteConfigs.has(siteId)) {
      const available = Array.from(this.siteConfigs.keys()).join(", ");
      throw new ConfigError(`Site "${siteId}" not found. Available sites: ${available}`);
    }

    this.activeSiteId = siteId;
    const config = this.siteConfigs.get(siteId)!;
    logger.info("Switched active site", { siteId, siteName: config.name });
    return config;
  }

  /**
   * List all configured sites with active/default markers.
   */
  listSites(): SiteInfo[] {
    return Array.from(this.siteConfigs.values()).map((site) => ({
      id: site.id,
      name: site.name,
      url: site.url,
      username: site.username,
      active: site.id === this.activeSiteId,
      isDefault: site.default === true,
    }));
  }

  /**
   * Get a WpClient for a specific site, or the active site if no ID given.
   */
  getSiteClient(siteId?: string): WpClient {
    const id = siteId ?? this.activeSiteId;
    const client = this.clients.get(id);
    if (!client) {
      const available = Array.from(this.siteConfigs.keys()).join(", ");
      throw new ConfigError(`Site "${id}" not found. Available sites: ${available}`);
    }
    return client;
  }

  /**
   * Get the number of configured sites (useful for single-site detection).
   */
  get siteCount(): number {
    return this.siteConfigs.size;
  }
}
