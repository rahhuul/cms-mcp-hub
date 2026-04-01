/**
 * @cmsmcp/wordpress — MCP server for WordPress REST API v2
 * Full coverage + Yoast/ACF + workflows + resources + prompts + webhooks
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createLogger, requireEnv, optionalEnvInt } from "@cmsmcp/shared";
import { WpClient } from "./api/client.js";
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
import { registerResources } from "./resources.js";
import { registerPrompts } from "./prompts.js";
import { registerWebhookTools } from "./webhook-listener.js";

const logger = createLogger("wordpress");

async function main(): Promise<void> {
  const url = requireEnv("WORDPRESS_URL");
  const username = requireEnv("WORDPRESS_USERNAME");
  const applicationPassword = requireEnv("WORDPRESS_APP_PASSWORD");
  const webhookPort = optionalEnvInt("WP_WEBHOOK_PORT", 9456);

  const client = new WpClient({ url, username, applicationPassword });

  const server = new McpServer({ name: "@cmsmcp/wordpress", version: "0.2.0" });

  // Core REST API (128 tools)
  registerPostTools(server, client);
  registerPageTools(server, client);
  registerMediaTools(server, client);
  registerCommentTools(server, client);
  registerTaxonomyTools(server, client);
  registerUserTools(server, client);
  registerCustomTypeTools(server, client);
  registerMenuTools(server, client);
  registerAdminTools(server, client);
  registerBlockTools(server, client);
  registerWidgetTools(server, client);
  registerSiteEditorTools(server, client);
  registerRevisionTools(server, client);
  registerReusableBlockTools(server, client);
  registerStatusTools(server, client);
  registerDirectoryTools(server, client);
  registerFontTools(server, client);

  // Plugin integrations (Yoast SEO + ACF)
  registerPluginTools(server, client);

  // Composite workflows
  registerWorkflowTools(server, client);

  // Gutenberg Block Editor
  registerBlockEditorTools(server, client);

  // Block Component Library
  registerComponentTools(server, client);

  // MCP Resources (browseable data)
  registerResources(server, client);

  // MCP Prompts (templates)
  registerPrompts(server);

  // Webhook listener
  registerWebhookTools(server, webhookPort);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("WordPress MCP server running on stdio");
}

main().catch((error) => {
  logger.error("Fatal error", { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});
