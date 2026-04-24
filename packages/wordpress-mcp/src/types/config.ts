/**
 * Configuration type definitions for multi-site support.
 */

export interface SiteConfig {
  id: string;
  name: string;
  url: string;
  username: string;
  appPassword: string;
  default?: boolean;
}

export interface CmsmcpPreferences {
  enabledTools?: string[] | null;
}

export interface CmsmcpConfig {
  sites: SiteConfig[];
  preferences?: CmsmcpPreferences;
}

export interface SiteInfo {
  id: string;
  name: string;
  url: string;
  username: string;
  active: boolean;
  isDefault: boolean;
}
