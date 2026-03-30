/**
 * Auto-generates OpenAPI 3.0.0 spec from MCP tool definitions.
 * ChatGPT-compatible: uses 3.0.0 (not 3.1), proper response schemas, external server URL.
 */

import type { McpTool } from "./mcp-bridge.js";

export function generateOpenApiSpec(
  tools: Array<{ serverName: string; tool: McpTool }>,
  baseUrl: string,
  overrideServerUrl?: string,
): Record<string, unknown> {
  const paths: Record<string, unknown> = {};

  for (const { serverName, tool } of tools) {
    const pathKey = `/api/${serverName}/${tool.name}`;
    const tag = serverName;

    // Convert MCP input schema to OpenAPI request body
    const requestBody: Record<string, unknown> = {};
    const properties = (tool.inputSchema as Record<string, unknown>)?.["properties"] as Record<string, unknown> | undefined;
    if (properties && Object.keys(properties).length > 0) {
      requestBody["required"] = true;
      requestBody["content"] = {
        "application/json": {
          schema: {
            type: "object",
            properties,
            required: (tool.inputSchema as Record<string, unknown>)["required"] || [],
          },
        },
      };
    }

    paths[pathKey] = {
      post: {
        operationId: tool.name,
        summary: tool.description.slice(0, 300),
        tags: [tag],
        ...(Object.keys(requestBody).length > 0 ? { requestBody } : {}),
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", description: "Whether the operation succeeded" },
                    tool: { type: "string", description: "Tool name that was called" },
                    result: { type: "object", description: "Tool execution result data" },
                  },
                },
              },
            },
          },
        },
      },
    };
  }

  const serverUrl = overrideServerUrl || baseUrl;

  return {
    openapi: "3.0.0",
    info: {
      title: "CMS MCP Hub API",
      description: "REST API for managing WordPress and WooCommerce. Supports posts, pages, media, products, orders, customers, and more.",
      version: "0.1.0",
    },
    servers: [{ url: serverUrl, description: "CMS MCP Gateway" }],
    paths,
    components: {
      securitySchemes: {
        apiKey: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
          description: "API key for authentication",
        },
      },
    },
    security: [{ apiKey: [] }],
  };
}
