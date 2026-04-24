/**
 * Email testing and management tools — send test emails, check logs,
 * inspect config, and verify DNS deliverability records.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WpClient } from "../api/client.js";
import type { PluginClient } from "../api/plugin-client.js";
import {
  EmailTestSchema,
  EmailGetLogSchema,
  EmailGetConfigSchema,
  EmailCheckDeliverabilitySchema,
} from "../schemas/index.js";

const PLUGIN_REQUIRED_MSG =
  "The CMS MCP Hub companion plugin is required for this email tool. Install and activate it on your WordPress site.";

// ─── DNS helpers ────────────────────────────────────────────────────────

interface DnsRecord {
  type: string;
  found: boolean;
  value?: string;
  status: "pass" | "warn" | "fail";
  message: string;
}

async function lookupDns(domain: string, type: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`,
      { signal: AbortSignal.timeout(10_000) },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { Answer?: Array<{ data: string }> };
    return data.Answer?.map((a) => a.data) ?? [];
  } catch {
    return [];
  }
}

async function checkDnsRecords(domain: string): Promise<{ domain: string; records: DnsRecord[]; score: number }> {
  const records: DnsRecord[] = [];
  let score = 100;

  // MX records
  const mx = await lookupDns(domain, "MX");
  if (mx.length > 0) {
    records.push({ type: "MX", found: true, value: mx[0], status: "pass", message: `MX record found: ${mx[0]}` });
  } else {
    records.push({ type: "MX", found: false, status: "fail", message: "No MX record found. Emails may not be deliverable." });
    score -= 40;
  }

  // SPF record
  const txt = await lookupDns(domain, "TXT");
  const spf = txt.find((r) => r.includes("v=spf1"));
  if (spf) {
    records.push({ type: "SPF", found: true, value: spf, status: "pass", message: `SPF record found: ${spf}` });
  } else {
    records.push({ type: "SPF", found: false, status: "warn", message: "No SPF record found. Add an SPF TXT record to prevent emails from being marked as spam." });
    score -= 20;
  }

  // DKIM selector check (common selectors)
  const dkimSelectors = ["default", "google", "k1", "mail", "selector1", "selector2"];
  let dkimFound = false;
  for (const sel of dkimSelectors) {
    const dkim = await lookupDns(`${sel}._domainkey.${domain}`, "TXT");
    if (dkim.length > 0) {
      records.push({ type: "DKIM", found: true, value: `${sel}._domainkey (found)`, status: "pass", message: `DKIM record found for selector '${sel}'.` });
      dkimFound = true;
      break;
    }
  }
  if (!dkimFound) {
    records.push({ type: "DKIM", found: false, status: "warn", message: "No DKIM record found for common selectors. DKIM signing improves email deliverability." });
    score -= 15;
  }

  // DMARC record
  const dmarc = await lookupDns(`_dmarc.${domain}`, "TXT");
  const dmarcRec = dmarc.find((r) => r.includes("v=DMARC1"));
  if (dmarcRec) {
    records.push({ type: "DMARC", found: true, value: dmarcRec, status: "pass", message: `DMARC record found: ${dmarcRec}` });
  } else {
    records.push({ type: "DMARC", found: false, status: "warn", message: "No DMARC record found. Add a DMARC TXT record at _dmarc.yourdomain.com to control email authentication policy." });
    score -= 15;
  }

  return { domain, records, score: Math.max(0, score) };
}

// ─── Tool registration ──────────────────────────────────────────────────

export function registerEmailTools(server: McpServer, client: WpClient, pluginClient: PluginClient): void {

  // ── wp_email_test ───────────────────────────────────────────────────
  server.tool(
    "wp_email_test",
    "Send a test email to verify WordPress email delivery is working. Sends to a specified address with an optional custom subject and body. Requires the CMS MCP Hub plugin.",
    EmailTestSchema.shape,
    async (params) => {
      try {
        if (!(await pluginClient.isAvailable())) {
          return mcpError(new Error(PLUGIN_REQUIRED_MSG), "wp_email_test");
        }
        const v = EmailTestSchema.parse(params);
        const result = await pluginClient.sendTestEmail(v.to, v.subject, v.body);
        return mcpSuccess(result);
      } catch (e) {
        return mcpError(e, "wp_email_test");
      }
    },
  );

  // ── wp_email_get_log ────────────────────────────────────────────────
  server.tool(
    "wp_email_get_log",
    "Get recent email log entries from WordPress. Shows recipient, subject, delivery status, and timestamp. Requires the CMS MCP Hub plugin with email logging enabled.",
    EmailGetLogSchema.shape,
    async (params) => {
      try {
        if (!(await pluginClient.isAvailable())) {
          return mcpError(new Error(PLUGIN_REQUIRED_MSG), "wp_email_get_log");
        }
        const v = EmailGetLogSchema.parse(params);
        const result = await pluginClient.getEmailLog({
          page: v.page,
          per_page: v.per_page,
          status: v.status,
          search: v.search,
        });
        return mcpSuccess(result);
      } catch (e) {
        return mcpError(e, "wp_email_get_log");
      }
    },
  );

  // ── wp_email_get_config ─────────────────────────────────────────────
  server.tool(
    "wp_email_get_config",
    "Get current WordPress email configuration including SMTP settings, from address, from name, and whether an SMTP plugin is active. Requires the CMS MCP Hub plugin.",
    EmailGetConfigSchema.shape,
    async () => {
      try {
        if (!(await pluginClient.isAvailable())) {
          return mcpError(new Error(PLUGIN_REQUIRED_MSG), "wp_email_get_config");
        }
        const result = await pluginClient.getEmailConfig();
        return mcpSuccess(result);
      } catch (e) {
        return mcpError(e, "wp_email_get_config");
      }
    },
  );

  // ── wp_email_check_deliverability ───────────────────────────────────
  server.tool(
    "wp_email_check_deliverability",
    "Check email deliverability by testing DNS records (MX, SPF, DKIM, DMARC) for the site's domain. Returns a deliverability score and detailed record analysis. No plugin required.",
    EmailCheckDeliverabilitySchema.shape,
    async (params) => {
      try {
        const v = EmailCheckDeliverabilitySchema.parse(params);

        // Extract domain from the site URL if not provided
        let domain = v.domain;
        if (!domain) {
          const siteUrl = client.getSiteUrl();
          try {
            domain = new URL(siteUrl).hostname;
          } catch {
            return mcpError(
              new Error("Could not extract domain from site URL. Please provide a domain explicitly."),
              "wp_email_check_deliverability",
            );
          }
        }

        const result = await checkDnsRecords(domain);
        return mcpSuccess(result);
      } catch (e) {
        return mcpError(e, "wp_email_check_deliverability");
      }
    },
  );
}
