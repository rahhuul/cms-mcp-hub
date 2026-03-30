/**
 * WordPress Webhook Listener — local HTTP server that receives WP/WooCommerce webhooks
 * and exposes them as MCP notifications/tools.
 */

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createLogger } from "@cmsmcp/shared";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

interface WebhookEvent {
  id: string;
  topic: string;
  resource: string;
  event: string;
  timestamp: string;
  payload: unknown;
}

const MAX_EVENTS = 100;
const logger = createLogger("wordpress:webhooks");

let events: WebhookEvent[] = [];
let eventCounter = 0;

function startWebhookServer(port: number): void {
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    if (req.method === "POST") {
      let body = "";
      req.on("data", (chunk: Buffer) => { body += chunk.toString(); });
      req.on("end", () => {
        try {
          const payload = JSON.parse(body) as Record<string, unknown>;
          const topic = req.headers["x-wc-webhook-topic"] as string
            || req.headers["x-wp-webhook-topic"] as string
            || "unknown";
          const resource = req.headers["x-wc-webhook-resource"] as string || topic.split(".")[0] || "unknown";
          const event = req.headers["x-wc-webhook-event"] as string || topic.split(".")[1] || "unknown";

          eventCounter++;
          const webhookEvent: WebhookEvent = {
            id: `evt_${eventCounter}`,
            topic,
            resource,
            event,
            timestamp: new Date().toISOString(),
            payload,
          };

          events.unshift(webhookEvent);
          if (events.length > MAX_EVENTS) events = events.slice(0, MAX_EVENTS);

          logger.info(`Webhook received: ${topic}`, { id: webhookEvent.id, resource, event });
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ received: true, id: webhookEvent.id }));
        } catch {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid JSON" }));
        }
      });
    } else if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", events_count: events.length }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      logger.warn(`Webhook listener port ${port} already in use — skipping (another instance may be running)`);
    } else {
      logger.error(`Webhook listener error: ${err.message}`);
    }
  });

  server.listen(port, () => {
    logger.info(`Webhook listener running on http://localhost:${port}`);
  });
}

// ─── MCP Tools for webhook events ──────────────────────────────────

const ListWebhookEventsSchema = z.object({
  limit: z.number().min(1).max(100).default(20).describe("Number of recent events"),
  topic: z.string().optional().describe("Filter by topic (e.g., 'order.created')"),
  resource: z.string().optional().describe("Filter by resource (e.g., 'order', 'product')"),
});

const GetWebhookEventSchema = z.object({
  event_id: z.string().describe("Event ID (e.g., 'evt_1')"),
});

const ClearWebhookEventsSchema = z.object({});

const GetWebhookUrlSchema = z.object({});

export function registerWebhookTools(server: McpServer, port: number): void {
  // Start the listener
  startWebhookServer(port);

  server.tool("wp_list_webhook_events",
    "List recent webhook events received from WordPress/WooCommerce. Shows order.created, product.updated, etc.",
    ListWebhookEventsSchema.shape, async (params) => {
      const { limit, topic, resource } = ListWebhookEventsSchema.parse(params);
      let filtered = events;
      if (topic) filtered = filtered.filter((e) => e.topic === topic);
      if (resource) filtered = filtered.filter((e) => e.resource === resource);
      return {
        content: [{ type: "text" as const, text: JSON.stringify({
          events: filtered.slice(0, limit),
          total: filtered.length,
          webhook_url: `http://localhost:${port}`,
        }, null, 2) }],
      };
    });

  server.tool("wp_get_webhook_event",
    "Get the full payload of a specific webhook event.",
    GetWebhookEventSchema.shape, async (params) => {
      const { event_id } = GetWebhookEventSchema.parse(params);
      const event = events.find((e) => e.id === event_id);
      if (!event) return { content: [{ type: "text" as const, text: JSON.stringify({ error: `Event ${event_id} not found` }) }], isError: true };
      return { content: [{ type: "text" as const, text: JSON.stringify(event, null, 2) }] };
    });

  server.tool("wp_clear_webhook_events",
    "Clear all stored webhook events.",
    ClearWebhookEventsSchema.shape, async () => {
      const count = events.length;
      events = [];
      return { content: [{ type: "text" as const, text: JSON.stringify({ cleared: count, message: `Cleared ${count} events` }) }] };
    });

  server.tool("wp_get_webhook_url",
    "Get the local webhook listener URL. Use this URL when creating WooCommerce/WordPress webhooks.",
    GetWebhookUrlSchema.shape, async () => {
      return { content: [{ type: "text" as const, text: JSON.stringify({
        url: `http://localhost:${port}`,
        message: `Use this URL as the delivery_url when creating webhooks. Example: woo_create_webhook with delivery_url="http://localhost:${port}"`,
      }, null, 2) }] };
    });
}
