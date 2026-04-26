/**
 * CLI argument parser and handlers for @cmsmcp/wordpress
 * Handles --setup, --doctor, --test, --list, --version, --help
 * No external CLI framework dependencies.
 */

import { createInterface } from "node:readline";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SiteConfig {
  id: string;
  name: string;
  url: string;
  username: string;
  applicationPassword: string;
  default?: boolean;
}

interface CmsMcpConfig {
  version: number;
  sites: SiteConfig[];
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CONFIG_DIR = join(homedir(), ".cmsmcp");
const CONFIG_FILE = process.env["CMSMCP_CONFIG_FILE"] || join(CONFIG_DIR, "config.json");

const CLI_FLAGS: Record<string, string> = {
  "--setup": "setup",
  "-s": "setup",
  "--doctor": "doctor",
  "-d": "doctor",
  "--test": "test",
  "-t": "test",
  "--list": "list",
  "-l": "list",
  "--version": "version",
  "-v": "version",
  "--help": "help",
  "-h": "help",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function write(text: string): void {
  process.stdout.write(text);
}

function writeErr(text: string): void {
  process.stderr.write(text);
}

function readPackageVersion(): string {
  try {
    const require = createRequire(import.meta.url);
    const pkg = require("../package.json") as { version: string };
    return pkg.version;
  } catch {
    return "0.0.0";
  }
}

async function loadConfig(): Promise<CmsMcpConfig | null> {
  // Check CMSMCP_CONFIG_B64 first (for CI/CD)
  const b64 = process.env["CMSMCP_CONFIG_B64"];
  if (b64) {
    try {
      return JSON.parse(Buffer.from(b64, "base64").toString("utf-8")) as CmsMcpConfig;
    } catch {
      return null;
    }
  }

  if (!existsSync(CONFIG_FILE)) {
    return null;
  }
  try {
    const raw = await readFile(CONFIG_FILE, "utf-8");
    return JSON.parse(raw) as CmsMcpConfig;
  } catch {
    return null;
  }
}

async function saveConfig(config: CmsMcpConfig): Promise<void> {
  if (!existsSync(CONFIG_DIR)) {
    await mkdir(CONFIG_DIR, { recursive: true });
  }
  await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}

function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function getDefaultSite(config: CmsMcpConfig): SiteConfig | undefined {
  return config.sites.find((s) => s.default) || config.sites[0];
}

async function testConnection(url: string, username: string, appPassword: string): Promise<{
  ok: boolean;
  wpVersion?: string;
  phpVersion?: string;
  userRole?: string;
  userName?: string;
  error?: string;
}> {
  const baseUrl = url.replace(/\/+$/, "");
  const authHeader = `Basic ${Buffer.from(`${username}:${appPassword}`).toString("base64")}`;

  try {
    // Test REST API availability
    const restRes = await fetch(`${baseUrl}/wp-json/wp/v2/`, {
      headers: { Authorization: authHeader },
    });
    if (!restRes.ok) {
      return { ok: false, error: `REST API returned ${restRes.status}` };
    }

    // Test authentication by fetching current user
    const userRes = await fetch(`${baseUrl}/wp-json/wp/v2/users/me?context=edit`, {
      headers: { Authorization: authHeader },
    });
    if (!userRes.ok) {
      return { ok: false, error: `Authentication failed (${userRes.status})` };
    }
    const userData = (await userRes.json()) as { name?: string; roles?: string[] };

    // Try to get WP version from settings
    let wpVersion = "unknown";
    let phpVersion = "unknown";
    try {
      const settingsRes = await fetch(`${baseUrl}/wp-json/wp/v2/settings`, {
        headers: { Authorization: authHeader },
      });
      if (settingsRes.ok) {
        // Settings endpoint doesn't expose version directly; try system info
      }
      // Fallback: check the REST API root for version
      const rootRes = await fetch(`${baseUrl}/wp-json/`, {
        headers: { Authorization: authHeader },
      });
      if (rootRes.ok) {
        await rootRes.json();
        // WP REST API root doesn't expose version directly in standard install
        // Try the generator meta or status endpoint
      }
    } catch {
      // Non-critical
    }

    // Try site health for version info
    try {
      const healthRes = await fetch(`${baseUrl}/wp-json/wp-site-health/v1/tests/background-updates`, {
        headers: { Authorization: authHeader },
      });
      if (healthRes.ok) {
        const healthData = (await healthRes.json()) as { description?: string };
        const wpMatch = healthData.description?.match(/WordPress (\d+\.\d+\.?\d*)/);
        if (wpMatch) wpVersion = wpMatch[1] as string;
        const phpMatch = healthData.description?.match(/PHP (\d+\.\d+\.?\d*)/);
        if (phpMatch) phpVersion = phpMatch[1] as string;
      }
    } catch {
      // Non-critical
    }

    return {
      ok: true,
      wpVersion,
      phpVersion,
      userName: userData.name || username,
      userRole: userData.roles?.[0] || "unknown",
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/* ------------------------------------------------------------------ */
/*  CLI Flag Detection                                                 */
/* ------------------------------------------------------------------ */

export function hasCliFlag(args: string[]): boolean {
  return args.some((arg) => arg in CLI_FLAGS);
}

/* ------------------------------------------------------------------ */
/*  Handler: --help                                                    */
/* ------------------------------------------------------------------ */

function handleHelp(): void {
  write(`@cmsmcp/wordpress — MCP server for WordPress

Usage:
  npx @cmsmcp/wordpress              Start the MCP server
  npx @cmsmcp/wordpress --setup      Interactive setup wizard
  npx @cmsmcp/wordpress --doctor     Run health diagnostics
  npx @cmsmcp/wordpress --test       Test WordPress connection
  npx @cmsmcp/wordpress --list       List configured sites
  npx @cmsmcp/wordpress --version    Print version
  npx @cmsmcp/wordpress --help       Show this help

Environment Variables:
  WORDPRESS_URL            WordPress site URL
  WORDPRESS_USERNAME       WordPress username
  WORDPRESS_APP_PASSWORD   WordPress application password
  CMSMCP_CONFIG_FILE       Path to config file (default: ~/.cmsmcp/config.json)
  CMSMCP_CONFIG_B64        Base64-encoded config (for CI/CD)
  CMSMCP_SITES             Comma-separated hostnames to restrict visible sites

Documentation: https://github.com/rahhuul/cms-mcp-hub
`);
  process.exit(0);
}

/* ------------------------------------------------------------------ */
/*  Handler: --version                                                 */
/* ------------------------------------------------------------------ */

function handleVersion(): void {
  const version = readPackageVersion();
  write(`@cmsmcp/wordpress v${version}\n`);
  process.exit(0);
}

/* ------------------------------------------------------------------ */
/*  Handler: --list                                                    */
/* ------------------------------------------------------------------ */

async function handleList(): Promise<void> {
  const config = await loadConfig();
  if (!config || config.sites.length === 0) {
    write("No sites configured. Run --setup to add a site.\n");
    process.exit(0);
  }

  write("\nConfigured WordPress Sites:\n\n");
  write(
    `  ${"ID".padEnd(14)}${"Name".padEnd(20)}${"URL".padEnd(35)}${"Default"}\n`,
  );
  write(
    `  ${"─".repeat(12)}  ${"─".repeat(18)}  ${"─".repeat(33)}  ${"─".repeat(7)}\n`,
  );

  for (const site of config.sites) {
    const isDefault = site.default ? "★" : "";
    write(
      `  ${site.id.padEnd(14)}${(site.name || site.id).padEnd(20)}${site.url.padEnd(35)}${isDefault}\n`,
    );
  }

  write("\n");
  process.exit(0);
}

/* ------------------------------------------------------------------ */
/*  Handler: --test                                                    */
/* ------------------------------------------------------------------ */

async function handleTest(): Promise<void> {
  write("\nWordPress MCP Server — Connection Test\n\n");

  const config = await loadConfig();

  // Also check env vars
  const envUrl = process.env["WORDPRESS_URL"];
  const envUser = process.env["WORDPRESS_USERNAME"];
  const envPass = process.env["WORDPRESS_APP_PASSWORD"];

  const sites: { id: string; url: string; username: string; password: string }[] = [];

  if (config) {
    for (const site of config.sites) {
      sites.push({
        id: site.id,
        url: site.url,
        username: site.username,
        password: site.applicationPassword,
      });
    }
  }

  if (envUrl && envUser && envPass) {
    // Add env-based site if not already in config
    const alreadyInConfig = sites.some((s) => s.url.replace(/\/+$/, "") === envUrl.replace(/\/+$/, ""));
    if (!alreadyInConfig) {
      sites.push({ id: "env", url: envUrl, username: envUser, password: envPass });
    }
  }

  if (sites.length === 0) {
    writeErr("No sites configured. Set WORDPRESS_URL/WORDPRESS_USERNAME/WORDPRESS_APP_PASSWORD or run --setup.\n");
    process.exit(1);
  }

  let allOk = true;

  for (const site of sites) {
    write(`Testing: ${site.id} (${site.url})\n`);

    // 1. Reachability
    write("  Reachability ... ");
    try {
      const res = await fetch(site.url.replace(/\/+$/, "") + "/", { method: "HEAD" });
      if (res.ok || res.status === 301 || res.status === 302) {
        write("OK\n");
      } else {
        write(`WARN (HTTP ${res.status})\n`);
      }
    } catch (err) {
      write(`FAIL (${err instanceof Error ? err.message : String(err)})\n`);
      allOk = false;
      continue;
    }

    // 2. REST API
    write("  REST API     ... ");
    try {
      const res = await fetch(site.url.replace(/\/+$/, "") + "/wp-json/wp/v2/");
      if (res.ok) {
        write("OK\n");
      } else {
        write(`FAIL (HTTP ${res.status})\n`);
        allOk = false;
        continue;
      }
    } catch (err) {
      write(`FAIL (${err instanceof Error ? err.message : String(err)})\n`);
      allOk = false;
      continue;
    }

    // 3. Authentication
    write("  Auth         ... ");
    const result = await testConnection(site.url, site.username, site.password);
    if (result.ok) {
      write(`OK (user: ${result.userName}, role: ${result.userRole})\n`);
    } else {
      write(`FAIL (${result.error})\n`);
      allOk = false;
    }

    write("\n");
  }

  process.exit(allOk ? 0 : 1);
}

/* ------------------------------------------------------------------ */
/*  Handler: --doctor                                                  */
/* ------------------------------------------------------------------ */

async function handleDoctor(): Promise<void> {
  write("\nWordPress MCP Server — Health Check\n\n");

  let passed = 0;
  let total = 0;

  // 1. Node.js version
  total++;
  const nodeVersion = process.version;
  const nodeMajor = parseInt(nodeVersion.slice(1).split(".")[0] || "0", 10);
  if (nodeMajor >= 18) {
    write(`  ✓ Node.js: ${nodeVersion} (>= 18.0.0 required)\n`);
    passed++;
  } else {
    write(`  ✗ Node.js: ${nodeVersion} (>= 18.0.0 required)\n`);
  }

  // 2. Config file
  total++;
  const config = await loadConfig();
  if (config && config.sites.length > 0) {
    write(`  ✓ Config file: ${CONFIG_FILE} (${config.sites.length} site${config.sites.length > 1 ? "s" : ""})\n`);
    passed++;
  } else {
    write(`  ✗ Config file: not found or empty (${CONFIG_FILE})\n`);
  }

  // 3. Default site
  total++;
  const defaultSite = config ? getDefaultSite(config) : undefined;
  const envUrl = process.env["WORDPRESS_URL"];
  const envUser = process.env["WORDPRESS_USERNAME"];
  const envPass = process.env["WORDPRESS_APP_PASSWORD"];

  let activeUrl: string | undefined;
  let activeUser: string | undefined;
  let activePass: string | undefined;

  if (defaultSite) {
    write(`  ✓ Default site: ${defaultSite.id} (${defaultSite.url})\n`);
    passed++;
    activeUrl = defaultSite.url;
    activeUser = defaultSite.username;
    activePass = defaultSite.applicationPassword;
  } else if (envUrl && envUser && envPass) {
    write(`  ✓ Default site: from environment variables (${envUrl})\n`);
    passed++;
    activeUrl = envUrl;
    activeUser = envUser;
    activePass = envPass;
  } else {
    write("  ✗ Default site: not configured\n");
  }

  // 4-6. Connection, REST API, Authentication
  if (activeUrl && activeUser && activePass) {
    // 4. Connection
    total++;
    const connResult = await testConnection(activeUrl, activeUser, activePass);
    if (connResult.ok) {
      const wpInfo = connResult.wpVersion !== "unknown" ? `WordPress ${connResult.wpVersion}` : "WordPress";
      const phpInfo = connResult.phpVersion !== "unknown" ? `, PHP ${connResult.phpVersion}` : "";
      write(`  ✓ Connection: OK (${wpInfo}${phpInfo})\n`);
      passed++;
    } else {
      write(`  ✗ Connection: ${connResult.error}\n`);
    }

    // 5. REST API
    total++;
    try {
      const restRes = await fetch(`${activeUrl.replace(/\/+$/, "")}/wp-json/wp/v2/`);
      if (restRes.ok) {
        write("  ✓ REST API: /wp-json/wp/v2/ accessible\n");
        passed++;
      } else {
        write(`  ✗ REST API: HTTP ${restRes.status}\n`);
      }
    } catch (err) {
      write(`  ✗ REST API: ${err instanceof Error ? err.message : String(err)}\n`);
    }

    // 6. Authentication
    total++;
    if (connResult.ok) {
      write(`  ✓ Authentication: Valid (user: ${connResult.userName}, role: ${connResult.userRole})\n`);
      passed++;
    } else {
      write(`  ✗ Authentication: ${connResult.error}\n`);
    }
  } else {
    total += 3;
    write("  ✗ Connection: skipped (no site configured)\n");
    write("  ✗ REST API: skipped (no site configured)\n");
    write("  ✗ Authentication: skipped (no site configured)\n");
  }

  // 7. Plugin check
  total++;
  if (activeUrl && activeUser && activePass) {
    try {
      const authHeader = `Basic ${Buffer.from(`${activeUser}:${activePass}`).toString("base64")}`;
      const pluginRes = await fetch(`${activeUrl.replace(/\/+$/, "")}/wp-json/wp/v2/plugins`, {
        headers: { Authorization: authHeader },
      });
      if (pluginRes.ok) {
        const plugins = (await pluginRes.json()) as Array<{ plugin?: string; textdomain?: string }>;
        const mcpPlugin = plugins.find(
          (p) => p.plugin?.includes("cmsmcp") || p.textdomain?.includes("cmsmcp"),
        );
        if (mcpPlugin) {
          write("  ✓ Plugin: @cmsmcp/wordpress-plugin detected\n");
          passed++;
        } else {
          write("  ✗ Plugin: @cmsmcp/wordpress-plugin not detected (optional — page builder features unavailable)\n");
        }
      } else {
        write("  ✗ Plugin: could not list plugins (insufficient permissions)\n");
      }
    } catch {
      write("  ✗ Plugin: could not check (connection error)\n");
    }
  } else {
    write("  ✗ Plugin: skipped (no site configured)\n");
  }

  write(`\nOverall: ${passed}/${total} checks passed\n\n`);
  process.exit(passed === total ? 0 : 1);
}

/* ------------------------------------------------------------------ */
/*  Handler: --setup                                                   */
/* ------------------------------------------------------------------ */

function detectAiClients(): string[] {
  const detected: string[] = [];
  const os = platform();

  // Claude Desktop
  if (os === "darwin") {
    const claudePath = join(homedir(), "Library", "Application Support", "Claude", "claude_desktop_config.json");
    if (existsSync(claudePath)) detected.push("Claude Desktop");
  } else if (os === "win32") {
    const appData = process.env["APPDATA"] || join(homedir(), "AppData", "Roaming");
    const claudePath = join(appData, "Claude", "claude_desktop_config.json");
    if (existsSync(claudePath)) detected.push("Claude Desktop");
  }

  // Cursor
  const cursorPaths = [
    join(process.cwd(), ".cursor", "mcp.json"),
    join(homedir(), ".cursor", "mcp.json"),
  ];
  for (const p of cursorPaths) {
    if (existsSync(p)) {
      detected.push("Cursor");
      break;
    }
  }

  // Windsurf
  const windsurfPaths = [
    join(homedir(), ".windsurf", "mcp.json"),
    join(homedir(), ".codeium", "windsurf", "mcp_config.json"),
  ];
  for (const p of windsurfPaths) {
    if (existsSync(p)) {
      detected.push("Windsurf");
      break;
    }
  }

  return detected;
}

async function handleSetup(): Promise<void> {
  write("\n");
  write("╔══════════════════════════════════════════════╗\n");
  write("║   @cmsmcp/wordpress — Setup Wizard          ║\n");
  write("╚══════════════════════════════════════════════╝\n");
  write("\n");

  // Detect AI clients
  const clients = detectAiClients();
  if (clients.length > 0) {
    write(`Detected AI clients: ${clients.join(", ")}\n\n`);
  } else {
    write("No AI clients auto-detected. You can manually add the MCP config later.\n\n");
  }

  // Gather info
  const url = await ask("WordPress site URL (e.g., https://mysite.com): ");
  if (!url) {
    writeErr("URL is required.\n");
    process.exit(1);
  }

  const username = await ask("WordPress username: ");
  if (!username) {
    writeErr("Username is required.\n");
    process.exit(1);
  }

  const appPassword = await ask("Application password (from WordPress > Users > App Passwords): ");
  if (!appPassword) {
    writeErr("Application password is required.\n");
    process.exit(1);
  }

  // Test connection
  write("\nTesting connection...\n");
  const result = await testConnection(url, username, appPassword);

  if (!result.ok) {
    writeErr(`\nConnection failed: ${result.error}\n`);
    writeErr("Please check your URL, username, and application password.\n");
    process.exit(1);
  }

  write(`Connection successful! (user: ${result.userName}, role: ${result.userRole})\n\n`);

  // Ask for site name
  const siteName = await ask(`Site name (default: ${new URL(url).hostname}): `) || new URL(url).hostname;
  const siteId = slugify(siteName) || "default";

  // Load or create config
  const config = (await loadConfig()) || { version: 1, sites: [] };

  // Check if site ID already exists
  const existingIdx = config.sites.findIndex((s) => s.id === siteId);
  if (existingIdx >= 0) {
    config.sites[existingIdx] = {
      id: siteId,
      name: siteName,
      url: url.replace(/\/+$/, ""),
      username,
      applicationPassword: appPassword,
      default: config.sites[existingIdx]!.default || config.sites.length === 1,
    };
  } else {
    const isFirst = config.sites.length === 0;
    config.sites.push({
      id: siteId,
      name: siteName,
      url: url.replace(/\/+$/, ""),
      username,
      applicationPassword: appPassword,
      default: isFirst,
    });
  }

  // Save config
  await saveConfig(config);
  write(`Configuration saved to ${CONFIG_FILE}\n\n`);

  // Print MCP config for AI client
  const version = readPackageVersion();
  write("Add this to your AI client's MCP configuration:\n\n");
  write("─".repeat(60) + "\n");
  write(JSON.stringify({
    mcpServers: {
      wordpress: {
        command: "npx",
        args: ["-y", `@cmsmcp/wordpress@${version}`],
        env: {
          WORDPRESS_URL: url.replace(/\/+$/, ""),
          WORDPRESS_USERNAME: username,
          WORDPRESS_APP_PASSWORD: appPassword,
        },
      },
    },
  }, null, 2));
  write("\n" + "─".repeat(60) + "\n\n");

  write("Setup complete! You can now:\n");
  write("  - Run 'npx @cmsmcp/wordpress --doctor' to verify everything\n");
  write("  - Run 'npx @cmsmcp/wordpress --list' to see configured sites\n");
  write("  - Start the MCP server with 'npx @cmsmcp/wordpress'\n\n");

  process.exit(0);
}

/* ------------------------------------------------------------------ */
/*  Main CLI dispatcher                                                */
/* ------------------------------------------------------------------ */

export async function handleCli(args: string[]): Promise<void> {
  const firstFlag = args.find((arg) => arg in CLI_FLAGS);
  if (!firstFlag) {
    // Should not happen if hasCliFlag was checked, but safety fallback
    return;
  }

  const command = CLI_FLAGS[firstFlag];

  switch (command) {
    case "help":
      handleHelp();
      break;
    case "version":
      handleVersion();
      break;
    case "list":
      await handleList();
      break;
    case "test":
      await handleTest();
      break;
    case "doctor":
      await handleDoctor();
      break;
    case "setup":
      await handleSetup();
      break;
    default:
      writeErr(`Unknown command: ${command}\n`);
      process.exit(1);
  }
}
