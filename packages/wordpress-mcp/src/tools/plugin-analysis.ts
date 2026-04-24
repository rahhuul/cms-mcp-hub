/**
 * Plugin-powered analysis tools — server-side SEO, accessibility, and performance
 * analysis via the CMS MCP Hub WordPress plugin's REST API endpoints.
 *
 * These provide deeper analysis than client-side tools because the plugin
 * renders the page server-side and analyzes the actual HTML output.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { PluginClient } from "../api/plugin-client.js";
import {
  DeepSeoAuditSchema,
  ScanAccessibilitySchema,
  AnalyzePerformanceSchema,
} from "../schemas/index.js";

/* ------------------------------------------------------------------ */
/*  Register plugin analysis tools                                     */
/* ------------------------------------------------------------------ */

export function registerPluginAnalysisTools(server: McpServer, pluginClient: PluginClient): void {

  // ── wp_deep_seo_audit ────────────────────────────────────────────────
  server.tool(
    "wp_deep_seo_audit",
    "Server-side SEO audit via the CMS MCP Hub plugin. Analyzes the fully rendered HTML for comprehensive SEO scoring including meta tags, Open Graph, structured data, heading hierarchy, image optimization, and content quality. Requires the CMS MCP Hub WordPress plugin.",
    DeepSeoAuditSchema.shape,
    async (p) => {
      try {
        const validated = DeepSeoAuditSchema.parse(p);
        const available = await pluginClient.isAvailable();
        if (!available) {
          return mcpSuccess({
            error: "CMS MCP Hub plugin is not installed on this WordPress site.",
            suggestion: "Install the plugin for server-side SEO analysis. Alternatively, use wp_analyze_seo for client-side SEO analysis.",
            plugin_url: "https://github.com/rahhuul/cms-mcp-hub/tree/master/packages/wordpress-plugin",
          });
        }
        const result = await pluginClient.analyzeSeo(validated.post_id);
        return mcpSuccess(result);
      } catch (e) {
        return mcpError(e, "wp_deep_seo_audit");
      }
    },
  );

  // ── wp_scan_accessibility ────────────────────────────────────────────
  server.tool(
    "wp_scan_accessibility",
    "WCAG accessibility scan via the CMS MCP Hub plugin. Analyzes rendered HTML for accessibility violations, warnings, and passes with WCAG rule references and fix suggestions. Requires the CMS MCP Hub WordPress plugin.",
    ScanAccessibilitySchema.shape,
    async (p) => {
      try {
        const validated = ScanAccessibilitySchema.parse(p);
        const available = await pluginClient.isAvailable();
        if (!available) {
          return mcpSuccess({
            error: "CMS MCP Hub plugin is not installed on this WordPress site.",
            suggestion: "Install the plugin for accessibility scanning. No client-side alternative is available for this analysis.",
            plugin_url: "https://github.com/rahhuul/cms-mcp-hub/tree/master/packages/wordpress-plugin",
          });
        }
        const result = await pluginClient.scanAccessibility(validated.post_id);
        return mcpSuccess(result);
      } catch (e) {
        return mcpError(e, "wp_scan_accessibility");
      }
    },
  );

  // ── wp_analyze_performance ───────────────────────────────────────────
  server.tool(
    "wp_analyze_performance",
    "Server-side performance analysis via the CMS MCP Hub plugin. Measures page weight, asset counts, render-blocking resources, image optimization opportunities, and returns a performance score with recommendations. Requires the CMS MCP Hub WordPress plugin.",
    AnalyzePerformanceSchema.shape,
    async (p) => {
      try {
        const validated = AnalyzePerformanceSchema.parse(p);
        const available = await pluginClient.isAvailable();
        if (!available) {
          return mcpSuccess({
            error: "CMS MCP Hub plugin is not installed on this WordPress site.",
            suggestion: "Install the plugin for server-side performance analysis. No client-side alternative is available for this analysis.",
            plugin_url: "https://github.com/rahhuul/cms-mcp-hub/tree/master/packages/wordpress-plugin",
          });
        }
        const result = await pluginClient.analyzePerformance(validated.post_id);
        return mcpSuccess(result);
      } catch (e) {
        return mcpError(e, "wp_analyze_performance");
      }
    },
  );
}
