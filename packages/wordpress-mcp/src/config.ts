/**
 * Configuration management for multi-site WordPress MCP server.
 *
 * Priority order:
 * 1. CMSMCP_CONFIG_B64 env var (base64-encoded JSON)
 * 2. CMSMCP_CONFIG_FILE env var (path to config file)
 * 3. ~/.cmsmcp/config.json (default config file)
 * 4. WORDPRESS_URL + WORDPRESS_USERNAME + WORDPRESS_APP_PASSWORD (single-site backward compat)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { createLogger, ConfigError } from "@cmsmcp/shared";
import type { SiteConfig, CmsmcpConfig } from "./types/config.js";
import { WpClient } from "./api/client.js";

const logger = createLogger("wordpress");

export const CONFIG_DIR = join(homedir(), ".cmsmcp");
export const CONFIG_FILE = join(CONFIG_DIR, "config.json");

/**
 * Validate and normalize a WordPress URL.
 * Adds https:// if no protocol, removes trailing slashes, fixes double protocols.
 */
export function normalizeUrl(raw: string): string {
  let url = raw.trim();

  // Fix double protocols (e.g., https://https://site.com)
  url = url.replace(/^(https?:\/\/)+/i, (match) => {
    const protocols = match.match(/https?:\/\//gi);
    return protocols ? protocols[protocols.length - 1]! : "https://";
  });

  // Add https:// if no protocol
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  // Remove trailing slashes
  url = url.replace(/\/+$/, "");

  // Validate the resulting URL
  try {
    new URL(url);
  } catch {
    throw new ConfigError(`Invalid URL: "${raw}" — could not parse as a valid URL.`);
  }

  return url;
}

/**
 * Parse and validate a CmsmcpConfig object from raw JSON.
 */
function parseConfig(raw: unknown, source: string): CmsmcpConfig {
  if (!raw || typeof raw !== "object") {
    throw new ConfigError(`Invalid config from ${source}: expected a JSON object.`);
  }

  const obj = raw as Record<string, unknown>;

  if (!Array.isArray(obj["sites"]) || obj["sites"].length === 0) {
    throw new ConfigError(`Invalid config from ${source}: "sites" must be a non-empty array.`);
  }

  const sites: SiteConfig[] = [];
  for (const [i, entry] of (obj["sites"] as unknown[]).entries()) {
    if (!entry || typeof entry !== "object") {
      throw new ConfigError(`Invalid site at index ${i} in ${source}: expected an object.`);
    }
    const s = entry as Record<string, unknown>;

    const id = s["id"];
    const name = s["name"];
    const url = s["url"];
    const username = s["username"];
    const appPassword = s["appPassword"];

    if (typeof id !== "string" || !id) {
      throw new ConfigError(`Site at index ${i} in ${source}: "id" is required (string).`);
    }
    if (typeof name !== "string" || !name) {
      throw new ConfigError(`Site "${id}" in ${source}: "name" is required (string).`);
    }
    if (typeof url !== "string" || !url) {
      throw new ConfigError(`Site "${id}" in ${source}: "url" is required (string).`);
    }
    if (typeof username !== "string" || !username) {
      throw new ConfigError(`Site "${id}" in ${source}: "username" is required (string).`);
    }
    if (typeof appPassword !== "string" || !appPassword) {
      throw new ConfigError(`Site "${id}" in ${source}: "appPassword" is required (string).`);
    }

    sites.push({
      id,
      name,
      url: normalizeUrl(url),
      username,
      appPassword,
      default: s["default"] === true,
    });
  }

  // Ensure exactly one default if none marked
  const defaults = sites.filter((s) => s.default);
  if (defaults.length === 0) {
    sites[0]!.default = true;
  } else if (defaults.length > 1) {
    // Keep only the first default
    for (let i = 1; i < defaults.length; i++) {
      defaults[i]!.default = false;
    }
  }

  const config: CmsmcpConfig = { sites };

  if (obj["preferences"] && typeof obj["preferences"] === "object") {
    const prefs = obj["preferences"] as Record<string, unknown>;
    config.preferences = {
      enabledTools: Array.isArray(prefs["enabledTools"]) ? (prefs["enabledTools"] as string[]) : null,
    };
  }

  return config;
}

/**
 * Try loading config from CMSMCP_CONFIG_B64 env var (base64-encoded JSON).
 */
function loadFromBase64Env(): CmsmcpConfig | null {
  const b64 = process.env["CMSMCP_CONFIG_B64"];
  if (!b64) return null;

  try {
    const json = Buffer.from(b64, "base64").toString("utf-8");
    const raw = JSON.parse(json) as unknown;
    logger.info("Config loaded from CMSMCP_CONFIG_B64");
    return parseConfig(raw, "CMSMCP_CONFIG_B64");
  } catch (e) {
    if (e instanceof ConfigError) throw e;
    throw new ConfigError(`Failed to parse CMSMCP_CONFIG_B64: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/**
 * Try loading config from a JSON file path.
 */
function loadFromFile(filePath: string, source: string): CmsmcpConfig | null {
  if (!existsSync(filePath)) return null;

  try {
    const content = readFileSync(filePath, "utf-8");
    const raw = JSON.parse(content) as unknown;
    logger.info("Config loaded from file", { path: filePath });
    return parseConfig(raw, source);
  } catch (e) {
    if (e instanceof ConfigError) throw e;
    throw new ConfigError(`Failed to parse config file "${filePath}": ${e instanceof Error ? e.message : String(e)}`);
  }
}

/**
 * Try loading config from legacy single-site env vars.
 */
function loadFromEnvVars(): CmsmcpConfig | null {
  const url = process.env["WORDPRESS_URL"];
  const username = process.env["WORDPRESS_USERNAME"];
  const appPassword = process.env["WORDPRESS_APP_PASSWORD"];

  if (!url || !username || !appPassword) return null;

  logger.info("Config loaded from WORDPRESS_* env vars (single-site mode)");

  return {
    sites: [
      {
        id: "default",
        name: "WordPress",
        url: normalizeUrl(url),
        username,
        appPassword,
        default: true,
      },
    ],
  };
}

/**
 * Load configuration from all sources in priority order.
 *
 * 1. CMSMCP_CONFIG_B64
 * 2. CMSMCP_CONFIG_FILE
 * 3. ~/.cmsmcp/config.json
 * 4. WORDPRESS_URL + WORDPRESS_USERNAME + WORDPRESS_APP_PASSWORD
 */
export function loadConfig(): CmsmcpConfig {
  // 1. Base64 env var (highest priority)
  const fromB64 = loadFromBase64Env();
  if (fromB64) return fromB64;

  // 2. Custom config file path
  const configFilePath = process.env["CMSMCP_CONFIG_FILE"];
  if (configFilePath) {
    const fromCustomFile = loadFromFile(configFilePath, "CMSMCP_CONFIG_FILE");
    if (fromCustomFile) return fromCustomFile;
    throw new ConfigError(`Config file not found: "${configFilePath}" (specified via CMSMCP_CONFIG_FILE)`);
  }

  // 3. Default config file
  const fromDefaultFile = loadFromFile(CONFIG_FILE, CONFIG_FILE);
  if (fromDefaultFile) return fromDefaultFile;

  // 4. Legacy single-site env vars
  const fromEnv = loadFromEnvVars();
  if (fromEnv) return fromEnv;

  throw new ConfigError(
    "No WordPress configuration found. Set WORDPRESS_URL + WORDPRESS_USERNAME + WORDPRESS_APP_PASSWORD env vars, " +
    `or create a config file at ${CONFIG_FILE}. ` +
    "See documentation for multi-site config format.",
  );
}

/**
 * Save configuration to ~/.cmsmcp/config.json.
 */
export function saveConfig(config: CmsmcpConfig): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
  logger.info("Config saved", { path: CONFIG_FILE });
}

/**
 * Add a site to the config file. Saves to ~/.cmsmcp/config.json.
 */
export function addSite(site: SiteConfig): void {
  let config: CmsmcpConfig;
  try {
    config = loadConfig();
  } catch {
    config = { sites: [] };
  }

  // Check for duplicate ID
  if (config.sites.some((s) => s.id === site.id)) {
    throw new ConfigError(`Site with ID "${site.id}" already exists. Use a different ID or remove it first.`);
  }

  // Normalize URL
  site.url = normalizeUrl(site.url);

  // If this is the first site or marked default, ensure it's the only default
  if (site.default || config.sites.length === 0) {
    for (const s of config.sites) {
      s.default = false;
    }
    site.default = true;
  }

  config.sites.push(site);
  saveConfig(config);
}

/**
 * Remove a site from the config file by ID.
 */
export function removeSite(siteId: string): void {
  const config = loadConfig();
  const idx = config.sites.findIndex((s) => s.id === siteId);
  if (idx === -1) {
    throw new ConfigError(`Site "${siteId}" not found in config.`);
  }

  const wasDefault = config.sites[idx]!.default;
  config.sites.splice(idx, 1);

  // If removed site was default, make the first remaining site default
  if (wasDefault && config.sites.length > 0) {
    config.sites[0]!.default = true;
  }

  saveConfig(config);
}

/**
 * Set a site as the default.
 */
export function setDefaultSite(siteId: string): void {
  const config = loadConfig();
  const site = config.sites.find((s) => s.id === siteId);
  if (!site) {
    throw new ConfigError(`Site "${siteId}" not found in config.`);
  }

  for (const s of config.sites) {
    s.default = s.id === siteId;
  }

  saveConfig(config);
}

/**
 * Test connectivity to a configured site by hitting /wp-json/wp/v2/.
 */
export async function testConnection(siteId: string): Promise<void> {
  const config = loadConfig();
  const site = config.sites.find((s) => s.id === siteId);
  if (!site) {
    throw new ConfigError(`Site "${siteId}" not found in config.`);
  }

  const client = new WpClient({
    url: site.url,
    username: site.username,
    applicationPassword: site.appPassword,
  });

  // Try fetching current user to verify auth
  await client.get("users/me", { context: "edit" });
}

/**
 * Filter sites by CMSMCP_SITES env var (comma-separated hostnames).
 */
export function filterSitesByHostname(config: CmsmcpConfig): CmsmcpConfig {
  const allowedHosts = process.env["CMSMCP_SITES"];
  if (!allowedHosts) return config;

  const hostnames = allowedHosts
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);

  if (hostnames.length === 0) return config;

  const filtered = config.sites.filter((site) => {
    try {
      const siteHost = new URL(site.url).hostname.toLowerCase();
      return hostnames.some((h) => siteHost === h || siteHost.endsWith(`.${h}`));
    } catch {
      return false;
    }
  });

  if (filtered.length === 0) {
    throw new ConfigError(
      `CMSMCP_SITES filter "${allowedHosts}" matched no configured sites. ` +
      `Available hostnames: ${config.sites.map((s) => new URL(s.url).hostname).join(", ")}`,
    );
  }

  // Ensure a default exists in filtered set
  if (!filtered.some((s) => s.default) && filtered.length > 0) {
    filtered[0]!.default = true;
  }

  return { ...config, sites: filtered };
}
