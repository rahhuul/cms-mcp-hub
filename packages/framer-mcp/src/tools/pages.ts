/**
 * Page tools: list_pages, get_page, update_page
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { FramerClient } from "../api/client.js";
import type { SerializedPage } from "../types/index.js";
import {
  ListPagesSchema,
  GetPageSchema,
  UpdatePageSchema,
} from "../schemas/index.js";

export function registerPageTools(server: McpServer, client: FramerClient): void {
  // ─── 9. framer_list_pages ────────────────────────────────────────
  server.tool(
    "framer_list_pages",
    "List all web pages in the Framer project. Returns page IDs, names, paths, and visibility status.",
    ListPagesSchema.shape,
    async () => {
      try {
        const framer = await client.getConnection();
        const pages = await framer.getNodesWithType("WebPageNode");

        const result: SerializedPage[] = pages.map((p) => {
          const attrs = p as unknown as Record<string, unknown>;
          return {
            id: p.id,
            name: (attrs["name"] as string | null) ?? null,
            path: (attrs["path"] as string | null) ?? null,
            title: (attrs["title"] as string | null) ?? null,
            visible: (attrs["visible"] as boolean | null) ?? null,
          };
        });

        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "framer_list_pages");
      }
    },
  );

  // ─── 10. framer_get_page ─────────────────────────────────────────
  server.tool(
    "framer_get_page",
    "Get detailed information about a specific page including its properties, children, and metadata. Use framer_list_pages first to find the page ID.",
    GetPageSchema.shape,
    async (params) => {
      try {
        const { pageId } = GetPageSchema.parse(params);
        const framer = await client.getConnection();
        const node = await framer.getNode(pageId);

        if (!node) {
          return mcpError(new Error(`Page '${pageId}' not found`), "framer_get_page");
        }

        const children = await framer.getChildren(pageId);
        const attrs = node as unknown as Record<string, unknown>;

        return mcpSuccess({
          page: {
            id: node.id,
            name: attrs["name"] ?? null,
            path: attrs["path"] ?? null,
            title: attrs["title"] ?? null,
            visible: attrs["visible"] ?? null,
            description: attrs["description"] ?? null,
            ogImage: attrs["ogImage"] ?? null,
          },
          childCount: children.length,
          children: children.map((c) => ({
            id: c.id,
            class: (c as unknown as Record<string, unknown>)["__class"] ?? "UnknownNode",
            name: (c as unknown as Record<string, unknown>)["name"] ?? null,
          })),
        });
      } catch (error) {
        return mcpError(error, "framer_get_page");
      }
    },
  );

  // ─── 11. framer_update_page ──────────────────────────────────────
  server.tool(
    "framer_update_page",
    "Update a web page's properties such as title, URL path, or visibility. Use framer_get_page first to see current values.",
    UpdatePageSchema.shape,
    async (params) => {
      try {
        const validated = UpdatePageSchema.parse(params);
        const framer = await client.getConnection();

        const attributes: Record<string, unknown> = {};
        if (validated.title !== undefined) attributes["title"] = validated.title;
        if (validated.path !== undefined) attributes["path"] = validated.path;
        if (validated.visible !== undefined) attributes["visible"] = validated.visible;

        const updated = await framer.setAttributes(validated.pageId, attributes);

        if (!updated) {
          return mcpError(new Error(`Page '${validated.pageId}' not found`), "framer_update_page");
        }

        const updatedAttrs = updated as unknown as Record<string, unknown>;
        return mcpSuccess({
          page: {
            id: updated.id,
            name: updatedAttrs["name"] ?? null,
            path: updatedAttrs["path"] ?? null,
            title: updatedAttrs["title"] ?? null,
            visible: updatedAttrs["visible"] ?? null,
          },
          message: "Page updated successfully",
        });
      } catch (error) {
        return mcpError(error, "framer_update_page");
      }
    },
  );
}
