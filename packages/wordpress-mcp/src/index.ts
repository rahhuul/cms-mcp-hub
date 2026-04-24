/**
 * @cmsmcp/wordpress — MCP server for WordPress REST API v2
 * Full coverage + Yoast/ACF + workflows + resources + prompts + webhooks
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createLogger, optionalEnvInt } from "@cmsmcp/shared";
import { loadConfig, filterSitesByHostname } from "./config.js";
import { SiteManager } from "./site-manager.js";
import { getServerInstructions } from "./instructions.js";
import { createToolGovernance, type ToolGovernance } from "./tool-governance.js";
import { registerSiteTools } from "./tools/sites.js";
import { registerPostTools } from "./tools/posts.js";
import { registerPageTools } from "./tools/pages.js";
import { registerMediaTools } from "./tools/media.js";
import { registerCommentTools } from "./tools/comments.js";
import { registerTaxonomyTools } from "./tools/taxonomy.js";
import { registerUserTools } from "./tools/users.js";
import { registerCustomTypeTools } from "./tools/custom-types.js";
import { registerMenuTools } from "./tools/menus.js";
import { registerAdminTools } from "./tools/admin.js";
import { registerBlockTools } from "./tools/blocks.js";
import { registerWidgetTools } from "./tools/widgets.js";
import { registerSiteEditorTools } from "./tools/site-editor.js";
import { registerRevisionTools } from "./tools/revisions.js";
import { registerReusableBlockTools } from "./tools/reusable-blocks.js";
import { registerStatusTools } from "./tools/statuses.js";
import { registerDirectoryTools } from "./tools/directories.js";
import { registerFontTools } from "./tools/fonts.js";
import { registerPluginTools } from "./tools/plugins-yoast.js";
import { registerWorkflowTools } from "./tools/workflows.js";
import { registerBlockEditorTools } from "./tools/block-editor.js";
import { registerComponentTools } from "./tools/components.js";
import { registerBulkOperationTools } from "./tools/bulk-operations.js";
import { registerPageBuilderTools } from "./tools/page-builder.js";
import { registerWidgetShortcutTools } from "./tools/widget-shortcuts.js";
import { registerStockImageTools } from "./tools/stock-images.js";
import { registerSnapshotTools } from "./tools/snapshots.js";
import { registerSeoAnalysisTools } from "./tools/analysis-seo.js";
import { registerContentAnalysisTools } from "./tools/analysis-content.js";
import { registerLinkAnalysisTools } from "./tools/analysis-links.js";
import { registerAdvancedContentTools } from "./tools/advanced-content.js";
import { registerBuilderTools } from "./tools/builder-tools.js";
import { registerBuilderShortcutTools } from "./tools/builder-shortcuts.js";
import { registerBricksTools } from "./tools/bricks-tools.js";
import { registerSecurityTools } from "./tools/security-tools.js";
import { registerPluginAnalysisTools } from "./tools/plugin-analysis.js";
import { registerPluginSnapshotTools } from "./tools/plugin-snapshots.js";
import { registerAcfTools } from "./tools/acf-tools.js";
import { registerWpCliTools } from "./tools/wpcli-tools.js";
import { registerStagingTools } from "./tools/staging-tools.js";
import { registerActivityLogTools } from "./tools/activity-log.js";
import { registerSettingsTools } from "./tools/settings-tools.js";
import { registerMultisiteTools } from "./tools/multisite-tools.js";
import { registerThemeTools } from "./tools/theme-tools.js";
import { registerMediaAdvancedTools } from "./tools/media-advanced.js";
import { registerCronTools } from "./tools/cron-tools.js";
import { registerDatabaseTools } from "./tools/database-tools.js";
import { registerEmailTools } from "./tools/email-tools.js";
import { registerCommentModerationTools } from "./tools/comment-moderation.js";
import { registerResources } from "./resources.js";
import { registerPrompts } from "./prompts.js";
import { registerWebhookTools } from "./webhook-listener.js";
import { hasCliFlag, handleCli } from "./cli.js";

const logger = createLogger("wordpress");

/**
 * Creates a proxy around McpServer that intercepts tool() calls
 * and skips registration for tools not enabled by governance.
 */
function createGovernedServer(server: McpServer, governance: ToolGovernance): McpServer {
  if (governance.enabledSet === null) {
    // No filtering — all tools enabled
    return server;
  }

  let registered = 0;
  let skipped = 0;

  const proxy = new Proxy(server, {
    get(target, prop, receiver) {
      if (prop === "tool") {
        return function governedTool(name: string, ...args: unknown[]) {
          if (!governance.isToolEnabled(name)) {
            skipped++;
            return undefined;
          }
          registered++;
          return (target.tool as Function).call(target, name, ...args);
        };
      }
      return Reflect.get(target, prop, receiver);
    },
  });

  // Log summary after a tick (all registrations happen synchronously)
  queueMicrotask(() => {
    if (skipped > 0) {
      logger.info(`Tool governance: ${registered} tools registered, ${skipped} skipped`);
    }
  });

  return proxy;
}

async function main(): Promise<void> {
  // Load multi-site config (backward compatible with single-site env vars)
  const rawConfig = loadConfig();
  const config = filterSitesByHostname(rawConfig);
  const siteManager = new SiteManager(config);
  const webhookPort = optionalEnvInt("WP_WEBHOOK_PORT", 9456);

  // Tool governance — from env var or config preferences
  const enabledToolsEnv = process.env["WORDPRESS_ENABLED_TOOLS"];
  const enabledTools = enabledToolsEnv
    ? enabledToolsEnv.split(",").map((t) => t.trim()).filter(Boolean)
    : (config.preferences?.enabledTools ?? null);

  const client = siteManager.getSiteClient();
  const governance = createToolGovernance(enabledTools);

  const server = new McpServer(
    { name: "@cmsmcp/wordpress", version: "0.9.0" },
    { instructions: getServerInstructions() },
  );

  // Wrap server to filter tool registration based on governance
  const governedServer = createGovernedServer(server, governance);

  // Site management tools (only when multiple sites configured)
  if (siteManager.siteCount > 1) {
    registerSiteTools(governedServer, siteManager);
  }

  // Core REST API (128 tools)
  registerPostTools(governedServer, client);
  registerPageTools(governedServer, client);
  registerMediaTools(governedServer, client);
  registerCommentTools(governedServer, client);
  registerTaxonomyTools(governedServer, client);
  registerUserTools(governedServer, client);
  registerCustomTypeTools(governedServer, client);
  registerMenuTools(governedServer, client);
  registerAdminTools(governedServer, client);
  registerBlockTools(governedServer, client);
  registerWidgetTools(governedServer, client);
  registerSiteEditorTools(governedServer, client);
  registerRevisionTools(governedServer, client);
  registerReusableBlockTools(governedServer, client);
  registerStatusTools(governedServer, client);
  registerDirectoryTools(governedServer, client);
  registerFontTools(governedServer, client);

  // Plugin integrations (Yoast SEO + ACF)
  registerPluginTools(governedServer, client);

  // Composite workflows
  registerWorkflowTools(governedServer, client);

  // Gutenberg Block Editor
  registerBlockEditorTools(governedServer, client);

  // Block Component Library
  registerComponentTools(governedServer, client);

  // Widget Shortcuts (one-liner block appenders)
  registerWidgetShortcutTools(governedServer, client);

  // Page Builder (declarative page building, HTML-to-blocks, structure analysis)
  registerPageBuilderTools(governedServer, client);

  // Bulk Operations
  registerBulkOperationTools(governedServer, client);

  // Stock Images (Openverse Creative Commons)
  registerStockImageTools(governedServer, client);

  // Snapshots & Safety (revision-based backup/restore/diff)
  registerSnapshotTools(governedServer, client);

  // SEO Analysis (content-level auditing)
  registerSeoAnalysisTools(governedServer, client);

  // Content Quality & Readability Analysis
  registerContentAnalysisTools(governedServer, client);

  // Link Checking, Image Audit & Structured Data
  registerLinkAnalysisTools(governedServer, client);

  // Advanced Content Management (scheduling, moderation, stats, search, preview)
  registerAdvancedContentTools(governedServer, client);

  // Plugin-powered Analysis (server-side SEO, accessibility, performance — requires CMS MCP Hub plugin)
  // Note: pluginClient is provided by siteManager (wired by plugin-client integration)
  const pluginClient = siteManager.getPluginClient();
  registerPluginAnalysisTools(governedServer, pluginClient);

  // Plugin-powered Snapshots (builder-aware backup/restore/diff — requires CMS MCP Hub plugin)
  registerPluginSnapshotTools(governedServer, pluginClient);

  // Builder Tools (page builder element operations — requires CMS MCP Hub plugin)
  registerBuilderTools(governedServer, pluginClient);

  // Bricks Deep Intelligence (global classes, theme styles, design system — requires CMS MCP Hub plugin + Bricks)
  registerBricksTools(governedServer, pluginClient);

  // Builder-aware Widget Shortcuts (requires CMS MCP Hub plugin)
  registerBuilderShortcutTools(governedServer, pluginClient);

  // Security Audit & Hardening
  registerSecurityTools(governedServer, client, pluginClient);

  // ACF Deep Integration (field groups, post fields, repeaters, flexible content, options)
  registerAcfTools(governedServer, client);

  // WP-CLI Bridge (run commands, export/import, search-replace, maintenance mode)
  registerWpCliTools(governedServer, pluginClient);

  // Staging & Migration Workflows (push/pull content between configured sites)
  registerStagingTools(governedServer, siteManager);

  // Activity Logging (track, query, undo MCP-driven changes — requires CMS MCP Hub plugin)
  registerActivityLogTools(governedServer, client, pluginClient);

  // WordPress Settings & Options Management
  registerSettingsTools(governedServer, client, pluginClient);

  // WordPress Multisite Network Management
  registerMultisiteTools(governedServer, client, pluginClient);

  // Theme Management & Customizer
  registerThemeTools(governedServer, client, pluginClient);

  // Advanced Media Operations (audit, thumbnails, bulk alt text, unused detection)
  registerMediaAdvancedTools(governedServer, client, pluginClient);

  // WP-Cron Scheduled Tasks Management
  registerCronTools(governedServer, pluginClient);

  // Database Management & Optimization
  registerDatabaseTools(governedServer, pluginClient);

  // Email Testing & Deliverability
  registerEmailTools(governedServer, client, pluginClient);

  // Advanced Comment Moderation (bulk, stats, spam detection, auto-moderate)
  registerCommentModerationTools(governedServer, client);

  // MCP Resources (browseable data)
  registerResources(server, client);

  // MCP Prompts (templates)
  registerPrompts(server);

  // Webhook listener
  registerWebhookTools(governedServer, webhookPort);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("WordPress MCP server running on stdio", {
    sites: siteManager.siteCount,
    activeSite: siteManager.getActiveSite().config.id,
    enabledTools: enabledTools ? enabledTools.length : "all",
  });
}

/* ------------------------------------------------------------------ */
/*  CLI intercept — run handler and exit before MCP server starts      */
/* ------------------------------------------------------------------ */

const cliArgs = process.argv.slice(2);

if (hasCliFlag(cliArgs)) {
  handleCli(cliArgs).catch((err) => {
    process.stderr.write(
      `CLI error: ${err instanceof Error ? err.message : String(err)}\n`,
    );
    process.exit(1);
  });
} else {
  main().catch((error) => {
    logger.error("Fatal error", { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  });
}
