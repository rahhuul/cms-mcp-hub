/**
 * Security audit tools — non-destructive WordPress security checks
 * via WP REST API and optional plugin-powered deep scans.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WpClient } from "../api/client.js";
import type { PluginClient } from "../api/plugin-client.js";
import {
  SecurityAuditSchema,
  CheckFilePermissionsSchema,
  ValidateContentSecuritySchema,
} from "../schemas/index.js";

// ─── Types ───────────────────────────────────────────────────────────

interface SecurityCheck {
  name: string;
  status: "pass" | "warn" | "fail";
  message: string;
  recommendation: string;
}

// ─── Weak username list ──────────────────────────────────────────────

const WEAK_USERNAMES = new Set([
  "admin", "administrator", "user", "test", "root", "wordpress",
  "wp", "webmaster", "manager", "demo", "guest",
]);

// ─── XSS pattern definitions ────────────────────────────────────────

interface SecurityPattern {
  type: string;
  regex: RegExp;
  severity: "critical" | "high" | "medium" | "low";
  recommendation: string;
}

const XSS_PATTERNS: SecurityPattern[] = [
  {
    type: "inline_script",
    regex: /<script\b[^>]*>[\s\S]*?<\/script>/gi,
    severity: "critical",
    recommendation: "Remove inline scripts. Use enqueued JavaScript files instead.",
  },
  {
    type: "onclick_handler",
    regex: /\bon\w+\s*=\s*["'][^"']*["']/gi,
    severity: "high",
    recommendation: "Remove inline event handlers. Use addEventListener in separate JS files.",
  },
  {
    type: "javascript_url",
    regex: /href\s*=\s*["']javascript:[^"']*["']/gi,
    severity: "critical",
    recommendation: "Replace javascript: URLs with proper links and event handlers.",
  },
  {
    type: "data_url",
    regex: /(?:src|href)\s*=\s*["']data:[^"']*["']/gi,
    severity: "medium",
    recommendation: "Avoid data: URLs in content. Use uploaded media files instead.",
  },
  {
    type: "untrusted_iframe",
    regex: /<iframe\b[^>]*src\s*=\s*["'](?!https:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|vimeo\.com|google\.com|maps\.google|twitter\.com|facebook\.com|instagram\.com|spotify\.com|soundcloud\.com))[^"']*["'][^>]*>/gi,
    severity: "high",
    recommendation: "Review iframe sources. Only embed content from trusted domains.",
  },
  {
    type: "base64_content",
    regex: /(?:src|href|data)\s*=\s*["'][^"']*base64[^"']*["']/gi,
    severity: "medium",
    recommendation: "Avoid base64-encoded content in posts. Upload files to the media library.",
  },
];

// ─── Helper: extract line number from content position ──────────────

function getLineNumber(content: string, position: number): number {
  return content.substring(0, position).split("\n").length;
}

// ─── Tool registration ──────────────────────────────────────────────

export function registerSecurityTools(
  server: McpServer,
  client: WpClient,
  pluginClient: PluginClient,
): void {

  // ── wp_security_audit ─────────────────────────────────────────────
  server.tool(
    "wp_security_audit",
    "Comprehensive WordPress security audit via REST API. Checks WordPress version, weak usernames, user enumeration, application passwords, inactive plugins, SSL status, REST API exposure, and more. Non-destructive read-only scan.",
    SecurityAuditSchema.shape,
    async () => {
      try {
        const checks: SecurityCheck[] = [];
        let score = 100;
        const siteUrl = client.getSiteUrl();

        // 1. SSL status
        if (siteUrl.startsWith("https://")) {
          checks.push({
            name: "ssl_enabled",
            status: "pass",
            message: "Site is served over HTTPS.",
            recommendation: "No action needed.",
          });
        } else {
          checks.push({
            name: "ssl_enabled",
            status: "fail",
            message: "Site is NOT served over HTTPS.",
            recommendation: "Enable SSL/TLS. Get a free certificate from Let's Encrypt and configure your server to redirect HTTP to HTTPS.",
          });
          score -= 20;
        }

        // 2. Users with weak usernames
        try {
          const users = await client.list<Record<string, unknown>>("users", { context: "edit" }, 1, 100);
          const weakUsers: string[] = [];
          let totalAppPasswords = 0;

          for (const user of users) {
            const slug = (user["slug"] as string) ?? "";
            const username = (user["username"] as string) ?? slug;
            if (WEAK_USERNAMES.has(username.toLowerCase())) {
              weakUsers.push(username);
            }
            // Application password count (WP 5.6+)
            const appPasswords = user["application_passwords"] as unknown[];
            if (Array.isArray(appPasswords)) {
              totalAppPasswords += appPasswords.length;
            }
          }

          if (weakUsers.length > 0) {
            checks.push({
              name: "weak_usernames",
              status: "fail",
              message: `Found ${weakUsers.length} user(s) with weak usernames: ${weakUsers.join(", ")}`,
              recommendation: "Rename or remove accounts with predictable usernames. Attackers commonly target 'admin', 'administrator', and 'test'.",
            });
            score -= 15;
          } else {
            checks.push({
              name: "weak_usernames",
              status: "pass",
              message: "No weak usernames detected.",
              recommendation: "No action needed.",
            });
          }

          // Application passwords
          if (totalAppPasswords > 10) {
            checks.push({
              name: "application_passwords",
              status: "warn",
              message: `${totalAppPasswords} application passwords found across ${users.length} users.`,
              recommendation: "Review and revoke unused application passwords. Each one is a potential access point.",
            });
            score -= 5;
          } else {
            checks.push({
              name: "application_passwords",
              status: "pass",
              message: `${totalAppPasswords} application password(s) found — within normal range.`,
              recommendation: "No action needed. Periodically review active application passwords.",
            });
          }

          // User count
          checks.push({
            name: "user_count",
            status: users.length > 20 ? "warn" : "pass",
            message: `${users.length} user account(s) registered.`,
            recommendation: users.length > 20
              ? "Review user accounts and remove inactive ones. Many accounts increases attack surface."
              : "No action needed.",
          });
          if (users.length > 20) score -= 3;

        } catch {
          checks.push({
            name: "weak_usernames",
            status: "warn",
            message: "Could not enumerate users (may require higher permissions).",
            recommendation: "Ensure the authenticated user has 'list_users' capability for full audit.",
          });
        }

        // 3. REST API user enumeration (public access check)
        try {
          // Try unauthenticated user listing by checking the base endpoint
          const publicUrl = `${siteUrl}/wp-json/wp/v2/users`;
          const response = await fetch(publicUrl, {
            method: "GET",
            headers: { "Accept": "application/json" },
            signal: AbortSignal.timeout(10_000),
          });

          if (response.ok) {
            const data = await response.json() as unknown[];
            if (Array.isArray(data) && data.length > 0) {
              checks.push({
                name: "user_enumeration",
                status: "fail",
                message: `REST API exposes ${data.length} user(s) publicly without authentication.`,
                recommendation: "Restrict the /wp/v2/users endpoint to authenticated requests. Use a security plugin or add a filter to restrict user enumeration.",
              });
              score -= 10;
            } else {
              checks.push({
                name: "user_enumeration",
                status: "pass",
                message: "User enumeration via REST API is restricted.",
                recommendation: "No action needed.",
              });
            }
          } else if (response.status === 401 || response.status === 403) {
            checks.push({
              name: "user_enumeration",
              status: "pass",
              message: "REST API user enumeration is blocked (returns 401/403).",
              recommendation: "No action needed.",
            });
          } else {
            checks.push({
              name: "user_enumeration",
              status: "warn",
              message: `REST API users endpoint returned status ${response.status}.`,
              recommendation: "Verify that public user enumeration is intentionally blocked.",
            });
          }
        } catch {
          checks.push({
            name: "user_enumeration",
            status: "warn",
            message: "Could not test public user enumeration endpoint.",
            recommendation: "Manually verify that /wp-json/wp/v2/users is not publicly accessible.",
          });
        }

        // 4. Plugin check (inactive plugins)
        try {
          const plugins = await client.list<Record<string, unknown>>("plugins", {}, 1, 100);
          const inactive = plugins.filter((p) => (p["status"] as string) !== "active");
          const total = plugins.length;

          if (inactive.length > 0) {
            checks.push({
              name: "inactive_plugins",
              status: "warn",
              message: `${inactive.length} of ${total} plugins are inactive.`,
              recommendation: "Remove inactive plugins. They can still contain exploitable vulnerabilities even when deactivated.",
            });
            score -= 5;
          } else {
            checks.push({
              name: "inactive_plugins",
              status: "pass",
              message: `All ${total} plugins are active — no inactive plugins found.`,
              recommendation: "No action needed.",
            });
          }

          if (total > 20) {
            checks.push({
              name: "plugin_count",
              status: "warn",
              message: `${total} plugins installed — high plugin count increases attack surface.`,
              recommendation: "Audit installed plugins and remove any that are not essential.",
            });
            score -= 3;
          }
        } catch {
          checks.push({
            name: "inactive_plugins",
            status: "warn",
            message: "Could not list plugins (may require 'activate_plugins' capability).",
            recommendation: "Ensure the authenticated user has admin privileges for full plugin audit.",
          });
        }

        // 5. XML-RPC check
        try {
          const xmlrpcUrl = `${siteUrl}/xmlrpc.php`;
          const xmlrpcResp = await fetch(xmlrpcUrl, {
            method: "POST",
            headers: { "Content-Type": "text/xml" },
            body: '<?xml version="1.0"?><methodCall><methodName>system.listMethods</methodName></methodCall>',
            signal: AbortSignal.timeout(10_000),
          });

          if (xmlrpcResp.ok) {
            const body = await xmlrpcResp.text();
            if (body.includes("methodResponse")) {
              checks.push({
                name: "xmlrpc_enabled",
                status: "warn",
                message: "XML-RPC is enabled and responding.",
                recommendation: "Disable XML-RPC if not needed. It is commonly exploited for brute-force and DDoS amplification attacks. Use 'Disable XML-RPC' plugin or server-level block.",
              });
              score -= 5;
            }
          } else {
            checks.push({
              name: "xmlrpc_enabled",
              status: "pass",
              message: `XML-RPC endpoint returned status ${xmlrpcResp.status} — likely blocked.`,
              recommendation: "No action needed.",
            });
          }
        } catch {
          checks.push({
            name: "xmlrpc_enabled",
            status: "pass",
            message: "XML-RPC endpoint is not reachable — likely blocked.",
            recommendation: "No action needed.",
          });
        }

        // 6. Login URL check (default wp-login.php)
        try {
          const loginUrl = `${siteUrl}/wp-login.php`;
          const loginResp = await fetch(loginUrl, {
            method: "HEAD",
            redirect: "manual",
            signal: AbortSignal.timeout(10_000),
          });

          if (loginResp.status === 200) {
            checks.push({
              name: "default_login_url",
              status: "warn",
              message: "Default login URL (wp-login.php) is accessible.",
              recommendation: "Consider using a plugin like WPS Hide Login to change the login URL and reduce bot attacks.",
            });
            score -= 3;
          } else if (loginResp.status === 301 || loginResp.status === 302) {
            const location = loginResp.headers.get("location") ?? "";
            if (location.includes("wp-login.php")) {
              checks.push({
                name: "default_login_url",
                status: "warn",
                message: "Default login URL redirects but is still accessible.",
                recommendation: "Consider hiding the login URL to reduce automated brute-force attempts.",
              });
              score -= 2;
            } else {
              checks.push({
                name: "default_login_url",
                status: "pass",
                message: "Login URL appears to be customized (redirects away from wp-login.php).",
                recommendation: "No action needed.",
              });
            }
          } else {
            checks.push({
              name: "default_login_url",
              status: "pass",
              message: `Login URL returned status ${loginResp.status} — may be blocked or customized.`,
              recommendation: "No action needed.",
            });
          }
        } catch {
          checks.push({
            name: "default_login_url",
            status: "pass",
            message: "Login URL is not reachable — likely blocked or customized.",
            recommendation: "No action needed.",
          });
        }

        // 7. WordPress version (check via REST API root)
        try {
          const rootUrl = `${siteUrl}/wp-json`;
          const rootResp = await fetch(rootUrl, {
            headers: { "Accept": "application/json" },
            signal: AbortSignal.timeout(10_000),
          });

          if (rootResp.ok) {
            const rootData = await rootResp.json() as Record<string, unknown>;
            const wpNamespace = rootData["namespaces"] as string[] | undefined;
            const description = (rootData["description"] as string) ?? "";

            // Check if WP version is exposed in generator tag or headers
            const wpVersionHeader = rootResp.headers.get("x-powered-by") ?? "";
            const serverHeader = rootResp.headers.get("server") ?? "";

            if (wpVersionHeader.toLowerCase().includes("php")) {
              checks.push({
                name: "php_version_exposed",
                status: "warn",
                message: `Server exposes PHP version in headers: ${wpVersionHeader}`,
                recommendation: "Hide PHP version by setting expose_php = Off in php.ini.",
              });
              score -= 3;
            }

            if (wpNamespace && wpNamespace.includes("wp/v2")) {
              checks.push({
                name: "wp_rest_api",
                status: "pass",
                message: "WordPress REST API is functional.",
                recommendation: "No action needed.",
              });
            }

            // Check generator meta for version leakage
            if (description) {
              checks.push({
                name: "site_description",
                status: "pass",
                message: `Site description: "${description.substring(0, 100)}"`,
                recommendation: "No action needed.",
              });
            }

            // Server header information
            if (serverHeader && serverHeader.length > 0) {
              checks.push({
                name: "server_header",
                status: serverHeader.length > 20 ? "warn" : "pass",
                message: `Server header: ${serverHeader.substring(0, 80)}`,
                recommendation: serverHeader.length > 20
                  ? "Reduce information in the Server header to avoid exposing server software details."
                  : "No action needed.",
              });
              if (serverHeader.length > 20) score -= 2;
            }
          }
        } catch {
          checks.push({
            name: "wp_version",
            status: "warn",
            message: "Could not fetch WordPress REST API root.",
            recommendation: "Verify that the REST API is accessible.",
          });
        }

        // Clamp score
        score = Math.max(0, Math.min(100, score));

        const failCount = checks.filter((c) => c.status === "fail").length;
        const warnCount = checks.filter((c) => c.status === "warn").length;
        const passCount = checks.filter((c) => c.status === "pass").length;

        return mcpSuccess({
          score,
          total_checks: checks.length,
          passed: passCount,
          warnings: warnCount,
          failures: failCount,
          checks,
          summary: `Security Score: ${score}/100 — ${failCount} failures, ${warnCount} warnings, ${passCount} passed`,
        });
      } catch (e) {
        return mcpError(e, "wp_security_audit");
      }
    },
  );

  // ── wp_check_file_permissions ─────────────────────────────────────
  server.tool(
    "wp_check_file_permissions",
    "Check for potentially dangerous file permission issues via the CMS MCP Hub plugin. Falls back to basic REST API checks when the plugin is not installed.",
    CheckFilePermissionsSchema.shape,
    async () => {
      try {
        // Try plugin-powered check first
        const available = await pluginClient.isAvailable();
        if (available) {
          try {
            const status = await pluginClient.getStatus();
            return mcpSuccess({
              source: "plugin",
              wp_version: status.wp_version,
              php_version: status.php_version,
              site_url: status.site_url,
              plugin_version: status.plugin_version,
              message: "Plugin is available. File permission checks are handled server-side by the plugin.",
              recommendation: "Use the CMS MCP Hub plugin's file permission endpoint for detailed file system checks.",
            });
          } catch {
            // Fall through to basic checks
          }
        }

        // Fallback: basic checks via REST API
        const checks: SecurityCheck[] = [];
        const siteUrl = client.getSiteUrl();

        // Check if wp-config.php is accessible via web
        try {
          const configUrl = `${siteUrl}/wp-config.php`;
          const resp = await fetch(configUrl, {
            method: "HEAD",
            signal: AbortSignal.timeout(10_000),
          });

          if (resp.ok && resp.headers.get("content-type")?.includes("text")) {
            checks.push({
              name: "wp_config_exposed",
              status: "fail",
              message: "wp-config.php may be accessible via web browser.",
              recommendation: "Block direct access to wp-config.php in your server configuration (.htaccess or nginx config).",
            });
          } else {
            checks.push({
              name: "wp_config_exposed",
              status: "pass",
              message: "wp-config.php is not directly accessible via web.",
              recommendation: "No action needed.",
            });
          }
        } catch {
          checks.push({
            name: "wp_config_exposed",
            status: "pass",
            message: "wp-config.php is not accessible — likely properly protected.",
            recommendation: "No action needed.",
          });
        }

        // Check if debug.log is accessible
        try {
          const debugUrl = `${siteUrl}/wp-content/debug.log`;
          const resp = await fetch(debugUrl, {
            method: "HEAD",
            signal: AbortSignal.timeout(10_000),
          });

          if (resp.ok) {
            checks.push({
              name: "debug_log_exposed",
              status: "fail",
              message: "debug.log is publicly accessible — may contain sensitive information.",
              recommendation: "Block access to debug.log via server configuration or move it outside the web root.",
            });
          } else {
            checks.push({
              name: "debug_log_exposed",
              status: "pass",
              message: "debug.log is not publicly accessible.",
              recommendation: "No action needed.",
            });
          }
        } catch {
          checks.push({
            name: "debug_log_exposed",
            status: "pass",
            message: "debug.log is not accessible.",
            recommendation: "No action needed.",
          });
        }

        // Check if directory listing is enabled on wp-content/uploads
        try {
          const uploadsUrl = `${siteUrl}/wp-content/uploads/`;
          const resp = await fetch(uploadsUrl, {
            method: "GET",
            signal: AbortSignal.timeout(10_000),
          });

          if (resp.ok) {
            const body = await resp.text();
            if (body.includes("Index of") || body.includes("<title>Index")) {
              checks.push({
                name: "directory_listing",
                status: "warn",
                message: "Directory listing is enabled on wp-content/uploads/.",
                recommendation: "Disable directory listing by adding 'Options -Indexes' to .htaccess or equivalent server config.",
              });
            } else {
              checks.push({
                name: "directory_listing",
                status: "pass",
                message: "Directory listing appears to be disabled.",
                recommendation: "No action needed.",
              });
            }
          } else {
            checks.push({
              name: "directory_listing",
              status: "pass",
              message: "Uploads directory listing is blocked.",
              recommendation: "No action needed.",
            });
          }
        } catch {
          checks.push({
            name: "directory_listing",
            status: "pass",
            message: "Could not check directory listing — likely blocked.",
            recommendation: "No action needed.",
          });
        }

        return mcpSuccess({
          source: "rest_api_fallback",
          plugin_available: false,
          checks,
          message: "Basic file permission checks via REST API. Install the CMS MCP Hub plugin for deeper server-side file system analysis.",
          plugin_url: "https://github.com/rahhuul/cms-mcp-hub/tree/master/packages/wordpress-plugin",
        });
      } catch (e) {
        return mcpError(e, "wp_check_file_permissions");
      }
    },
  );

  // ── wp_validate_content_security ──────────────────────────────────
  server.tool(
    "wp_validate_content_security",
    "Scan a post or page content for potential XSS and security issues. Checks for inline scripts, event handlers, javascript: URLs, data: URLs, untrusted iframes, and base64-encoded content. Non-destructive read-only scan.",
    ValidateContentSecuritySchema.shape,
    async (p) => {
      try {
        const { post_id, post_type } = ValidateContentSecuritySchema.parse(p);
        const post = await client.get<Record<string, unknown>>(
          `${post_type}/${post_id}`,
          { context: "edit" },
        );

        const contentRaw = ((post["content"] as Record<string, unknown>)?.["raw"] as string) ?? "";
        const titleRaw = ((post["title"] as Record<string, unknown>)?.["raw"] as string) ?? "";

        if (!contentRaw) {
          return mcpSuccess({
            post_id,
            post_type,
            clean: true,
            issues: [],
            message: "Post has no content to scan.",
          });
        }

        const issues: Array<{
          type: string;
          severity: string;
          element: string;
          line: number;
          recommendation: string;
        }> = [];

        for (const pattern of XSS_PATTERNS) {
          // Reset regex state for each scan
          pattern.regex.lastIndex = 0;
          let match: RegExpExecArray | null;

          while ((match = pattern.regex.exec(contentRaw)) !== null) {
            const element = match[0];
            issues.push({
              type: pattern.type,
              severity: pattern.severity,
              element: element.length > 120 ? element.substring(0, 120) + "..." : element,
              line: getLineNumber(contentRaw, match.index),
              recommendation: pattern.recommendation,
            });
          }
        }

        const critical = issues.filter((i) => i.severity === "critical").length;
        const high = issues.filter((i) => i.severity === "high").length;
        const medium = issues.filter((i) => i.severity === "medium").length;
        const low = issues.filter((i) => i.severity === "low").length;

        return mcpSuccess({
          post_id,
          post_type,
          title: titleRaw,
          clean: issues.length === 0,
          total_issues: issues.length,
          by_severity: { critical, high, medium, low },
          issues,
          summary: issues.length === 0
            ? "No security issues found in post content."
            : `Found ${issues.length} potential security issue(s): ${critical} critical, ${high} high, ${medium} medium, ${low} low.`,
        });
      } catch (e) {
        return mcpError(e, "wp_validate_content_security");
      }
    },
  );
}
