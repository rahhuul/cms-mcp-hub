/**
 * Type definitions for @cmsmcp/wordpress
 */

export interface WpConfig {
  url: string;
  username: string;
  applicationPassword: string;
}

export type { SiteConfig, CmsmcpPreferences, CmsmcpConfig, SiteInfo } from "./config.js";
