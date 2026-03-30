/**
 * Gateway HTTP server — routes requests to MCP tool bridges.
 * Zero external dependencies — uses Node.js built-in http module.
 */

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createLogger } from "@cmsmcp/shared";
import { McpBridge, type McpTool } from "./mcp-bridge.js";
import { generateOpenApiSpec } from "./openapi.js";
import { renderDashboard } from "./dashboard.js";

const logger = createLogger("gateway");

export interface ServerConfig {
  name: string;
  command: string;
  args: string[];
  env: Record<string, string>;
}

export interface GatewayConfig {
  port: number;
  apiKey: string;
  baseUrl: string;
  servers: ServerConfig[];
}

export async function startGateway(config: GatewayConfig): Promise<void> {
  const bridges = new Map<string, McpBridge>();

  // Start all MCP servers
  for (const sc of config.servers) {
    const bridge = new McpBridge(sc.name, sc.command, sc.args, sc.env);
    try {
      await bridge.start();
      bridges.set(sc.name, bridge);
    } catch (error) {
      logger.error(`Failed to start MCP server '${sc.name}'`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Collect all tools for OpenAPI spec
  const allTools: Array<{ serverName: string; tool: McpTool }> = [];
  for (const [name, bridge] of bridges) {
    for (const tool of bridge.getTools()) {
      allTools.push({ serverName: name, tool });
    }
  }

  logger.info(`Gateway loaded ${allTools.length} tools from ${bridges.size} servers`);

  // Create HTTP server
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-API-Key, Authorization");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || "/", `http://localhost:${config.port}`);
    const path = url.pathname;

    // ─── Public routes (no auth) ───────────────────────────────────
    if (path === "/" && req.method === "GET") {
      const serverInfos = Array.from(bridges.entries()).map(([name, bridge]) => ({
        name, tools: bridge.getTools(), ready: bridge.isReady(),
      }));
      const html = renderDashboard(serverInfos, config.baseUrl, config.apiKey);
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(html);
      return;
    }

    if (path === "/health" && req.method === "GET") {
      const status = Object.fromEntries(
        Array.from(bridges.entries()).map(([name, bridge]) => [name, { ready: bridge.isReady(), tools: bridge.getTools().length }]),
      );
      json(res, 200, { status: "ok", servers: status, total_tools: allTools.length });
      return;
    }

    if (path === "/openapi.json" && req.method === "GET") {
      const serverFilter = url.searchParams.get("server");
      const limit = parseInt(url.searchParams.get("limit") || "0", 10);
      const pack = url.searchParams.get("pack");

      let filtered = allTools;

      // Filter by server name
      if (serverFilter) {
        filtered = filtered.filter((t) => t.serverName === serverFilter);
      }

      // Pre-built packs for ChatGPT's 30-action limit
      if (pack === "wp-content") {
        const keep = new Set(["wp_list_posts","wp_get_post","wp_create_post","wp_update_post","wp_delete_post","wp_list_pages","wp_get_page","wp_create_page","wp_update_page","wp_delete_page","wp_list_media","wp_upload_media","wp_list_comments","wp_create_comment","wp_update_comment","wp_list_categories","wp_create_category","wp_list_tags","wp_create_tag","wp_list_users","wp_get_me","wp_search","wp_get_settings","wp_update_settings","wp_create_full_post","wp_clone_post","wp_site_audit","wp_export_content","wp_get_yoast_seo","wp_update_yoast_seo"]);
        filtered = allTools.filter((t) => keep.has(t.tool.name));
      } else if (pack === "wp-admin") {
        const keep = new Set(["wp_list_plugins","wp_get_plugin","wp_update_plugin","wp_install_plugin","wp_delete_plugin","wp_list_themes","wp_get_theme","wp_list_menus","wp_create_menu","wp_setup_menu","wp_list_menu_items","wp_create_menu_item","wp_list_blocks","wp_create_block","wp_list_templates","wp_get_template","wp_list_template_parts","wp_list_navigations","wp_create_navigation","wp_list_sidebars","wp_list_widgets","wp_create_widget","wp_list_block_types","wp_list_block_patterns","wp_render_block","wp_list_font_families","wp_get_site_health","wp_bulk_update_posts","wp_list_post_types","wp_list_taxonomies"]);
        filtered = allTools.filter((t) => keep.has(t.tool.name));
      } else if (pack === "woo-store") {
        const keep = new Set(["woo_list_products","woo_get_product","woo_create_product","woo_update_product","woo_delete_product","woo_list_product_variations","woo_create_product_variation","woo_list_orders","woo_get_order","woo_create_order","woo_update_order","woo_list_customers","woo_get_customer","woo_create_customer","woo_list_coupons","woo_create_coupon","woo_list_categories","woo_create_category","woo_list_tags","woo_get_reports_sales","woo_get_reports_top_sellers","woo_list_product_reviews","woo_create_product_review","woo_store_dashboard","woo_create_full_product","woo_process_order","woo_batch_update","woo_get_payment_gateways","woo_get_settings","woo_list_shipping_zones"]);
        filtered = allTools.filter((t) => keep.has(t.tool.name));
      } else if (pack === "woo-admin") {
        const keep = new Set(["woo_list_product_attributes","woo_create_product_attribute","woo_list_attribute_terms","woo_create_attribute_term","woo_list_shipping_classes","woo_create_shipping_class","woo_list_tax_rates","woo_create_tax_rate","woo_list_tax_classes","woo_create_tax_class","woo_list_webhooks","woo_create_webhook","woo_update_webhook","woo_delete_webhook","woo_list_order_notes","woo_create_order_note","woo_list_order_refunds","woo_create_order_refund","woo_update_customer","woo_delete_customer","woo_get_coupon","woo_update_coupon","woo_delete_coupon","woo_get_reports_totals","woo_update_payment_gateway","woo_update_setting","woo_get_system_status","woo_list_system_tools","woo_run_system_tool","woo_list_data"]);
        filtered = allTools.filter((t) => keep.has(t.tool.name));
      }

      // Apply limit
      if (limit > 0) {
        filtered = filtered.slice(0, limit);
      }

      // Use the request's origin as server URL so ChatGPT/external clients see the correct host
      const requestOrigin = `${req.headers["x-forwarded-proto"] || "http"}://${req.headers["x-forwarded-host"] || req.headers["host"] || "localhost"}`;
      const effectiveUrl = requestOrigin.includes("ngrok") || requestOrigin.includes("://") ? requestOrigin : config.baseUrl;

      const spec = generateOpenApiSpec(filtered, config.baseUrl, effectiveUrl);
      json(res, 200, spec);
      return;
    }

    // Packs listing endpoint
    if (path === "/packs" && req.method === "GET") {
      json(res, 200, {
        message: "Use ?pack= parameter on /openapi.json to get a ChatGPT-friendly spec (max 30 tools each)",
        packs: {
          "wp-content": { description: "WordPress content management (posts, pages, media, comments, SEO)", tools: 30, url: `${config.baseUrl}/openapi.json?pack=wp-content` },
          "wp-admin": { description: "WordPress admin (plugins, themes, menus, blocks, templates, widgets)", tools: 30, url: `${config.baseUrl}/openapi.json?pack=wp-admin` },
          "woo-store": { description: "WooCommerce store (products, orders, customers, coupons, reports)", tools: 30, url: `${config.baseUrl}/openapi.json?pack=woo-store` },
          "woo-admin": { description: "WooCommerce admin (attributes, tax, webhooks, refunds, system)", tools: 30, url: `${config.baseUrl}/openapi.json?pack=woo-admin` },
        },
        custom: {
          by_server: `${config.baseUrl}/openapi.json?server=wordpress`,
          with_limit: `${config.baseUrl}/openapi.json?server=wordpress&limit=30`,
        },
      });
      return;
    }

    // ─── Protected routes (require API key) ────────────────────────
    const providedKey = req.headers["x-api-key"] as string
      || req.headers["authorization"]?.replace("Bearer ", "")
      || url.searchParams.get("api_key");

    if (providedKey !== config.apiKey) {
      json(res, 401, { error: "Unauthorized", message: "Provide a valid API key via X-API-Key header, Bearer token, or ?api_key= query param" });
      return;
    }

    // ─── List all tools ────────────────────────────────────────────
    if (path === "/api/tools" && req.method === "GET") {
      const grouped = Object.fromEntries(
        Array.from(bridges.entries()).map(([name, bridge]) => [
          name,
          bridge.getTools().map((t) => ({ name: t.name, description: t.description })),
        ]),
      );
      json(res, 200, { total: allTools.length, servers: grouped });
      return;
    }

    // ─── Call a tool: POST /api/{server}/{tool_name} ───────────────
    const toolMatch = path.match(/^\/api\/([^/]+)\/([^/]+)$/);
    if (toolMatch && req.method === "POST") {
      const [, serverName, toolName] = toolMatch;
      const bridge = bridges.get(serverName!);

      if (!bridge) {
        json(res, 404, { error: `Server '${serverName}' not found`, available: Array.from(bridges.keys()) });
        return;
      }

      if (!bridge.isReady()) {
        json(res, 503, { error: `Server '${serverName}' is not ready` });
        return;
      }

      const tool = bridge.getTools().find((t) => t.name === toolName);
      if (!tool) {
        json(res, 404, { error: `Tool '${toolName}' not found on server '${serverName}'`, available: bridge.getTools().map((t) => t.name) });
        return;
      }

      // Parse request body
      const body = await readBody(req);
      let args: Record<string, unknown> = {};
      if (body) {
        try { args = JSON.parse(body) as Record<string, unknown>; }
        catch { json(res, 400, { error: "Invalid JSON body" }); return; }
      }

      try {
        const result = await bridge.callTool(toolName!, args);
        json(res, 200, { success: true, tool: toolName, result });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        // Try to parse error message as JSON (MCP errors are JSON)
        try {
          const parsed = JSON.parse(message);
          json(res, 422, { success: false, tool: toolName, error: parsed });
        } catch {
          json(res, 500, { success: false, tool: toolName, error: message });
        }
      }
      return;
    }

    // ─── 404 ───────────────────────────────────────────────────────
    json(res, 404, {
      error: "Not found",
      endpoints: {
        dashboard: "GET /",
        health: "GET /health",
        openapi: "GET /openapi.json",
        tools: "GET /api/tools",
        call: "POST /api/{server}/{tool_name}",
      },
    });
  });

  server.listen(config.port, () => {
    logger.info(`Gateway running at ${config.baseUrl}`);
    logger.info(`Dashboard: ${config.baseUrl}`);
    logger.info(`OpenAPI spec: ${config.baseUrl}/openapi.json`);
    logger.info(`API: ${config.baseUrl}/api/{server}/{tool}`);
  });

  // Graceful shutdown
  const cleanup = async () => {
    logger.info("Shutting down gateway...");
    for (const bridge of bridges.values()) await bridge.stop();
    server.close();
    process.exit(0);
  };
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}

function json(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data, null, 2));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk: Buffer) => { body += chunk.toString(); });
    req.on("end", () => resolve(body));
  });
}
