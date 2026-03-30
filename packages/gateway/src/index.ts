/**
 * @cmsmcp/gateway — Universal REST API gateway for CMS MCP Hub
 *
 * Spawns MCP servers as child processes, exposes all tools as REST endpoints,
 * auto-generates OpenAPI spec, and provides a web dashboard.
 *
 * Config via gateway.json or environment variables.
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createLogger } from "@cmsmcp/shared";
import { startGateway, type GatewayConfig, type ServerConfig } from "./server.js";

const logger = createLogger("gateway");

async function main(): Promise<void> {
  // Try to load config from gateway.json
  let configFromFile: Partial<GatewayConfig> = {};
  const configPath = resolve(process.cwd(), process.env["GATEWAY_CONFIG"] || "gateway.json");

  try {
    const raw = await readFile(configPath, "utf-8");
    configFromFile = JSON.parse(raw) as Partial<GatewayConfig>;
    logger.info(`Loaded config from ${configPath}`);
  } catch {
    logger.info("No gateway.json found, using environment variables");
  }

  const port = Number(process.env["GATEWAY_PORT"]) || configFromFile.port || 3777;
  const apiKey = process.env["GATEWAY_API_KEY"] || configFromFile.apiKey || "cmsmcp-dev-key";
  const baseUrl = process.env["GATEWAY_BASE_URL"] || configFromFile.baseUrl || `http://localhost:${port}`;

  // Build server configs from file or env
  const servers: ServerConfig[] = configFromFile.servers || [];

  // Auto-detect: if env vars are set for known CMS platforms, add them
  if (process.env["WORDPRESS_URL"] && process.env["WORDPRESS_USERNAME"]) {
    const existing = servers.find((s) => s.name === "wordpress");
    if (!existing) {
      servers.push({
        name: "wordpress",
        command: "node",
        args: [resolve(process.cwd(), "packages/wordpress-mcp/dist/index.js")],
        env: {
          WORDPRESS_URL: process.env["WORDPRESS_URL"]!,
          WORDPRESS_USERNAME: process.env["WORDPRESS_USERNAME"]!,
          WORDPRESS_APP_PASSWORD: process.env["WORDPRESS_APP_PASSWORD"] || "",
        },
      });
    }
  }

  if (process.env["WOOCOMMERCE_URL"] && process.env["WOOCOMMERCE_CONSUMER_KEY"]) {
    const existing = servers.find((s) => s.name === "woocommerce");
    if (!existing) {
      servers.push({
        name: "woocommerce",
        command: "node",
        args: [resolve(process.cwd(), "packages/woocommerce-mcp/dist/index.js")],
        env: {
          WOOCOMMERCE_URL: process.env["WOOCOMMERCE_URL"]!,
          WOOCOMMERCE_CONSUMER_KEY: process.env["WOOCOMMERCE_CONSUMER_KEY"]!,
          WOOCOMMERCE_CONSUMER_SECRET: process.env["WOOCOMMERCE_CONSUMER_SECRET"] || "",
        },
      });
    }
  }

  if (servers.length === 0) {
    logger.error("No MCP servers configured. Create a gateway.json or set environment variables.");
    logger.error("Example gateway.json: { \"servers\": [{ \"name\": \"wordpress\", \"command\": \"node\", \"args\": [\"packages/wordpress-mcp/dist/index.js\"], \"env\": { ... } }] }");
    process.exit(1);
  }

  await startGateway({ port, apiKey, baseUrl, servers });
}

main().catch((error) => {
  logger.error("Fatal error", { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});
