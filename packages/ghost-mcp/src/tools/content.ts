/**
 * Content tools (10): posts (5), pages (3), tags (2)
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { GhostClient } from "../api/client.js";
import type { GhostPost, GhostPage, GhostTag } from "../types/index.js";
import {
  ListPostsSchema,
  GetPostSchema,
  CreatePostSchema,
  UpdatePostSchema,
  DeletePostSchema,
  ListPagesSchema,
  CreatePageSchema,
  UpdatePageSchema,
  ListTagsSchema,
  CreateTagSchema,
} from "../schemas/index.js";

export function registerContentTools(server: McpServer, client: GhostClient): void {
  // ─── 1. ghost_list_posts ─────────────────────────────────────────
  server.tool(
    "ghost_list_posts",
    "List Ghost blog posts with filtering, pagination, and sorting. Supports Ghost NQL filter syntax (e.g., 'tag:news+featured:true').",
    ListPostsSchema.shape,
    async (params) => {
      try {
        const validated = ListPostsSchema.parse(params);
        const result = await client.get<{ posts: GhostPost[]; meta: unknown }>("posts/", validated as Record<string, string | number | boolean | undefined>);
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "ghost_list_posts");
      }
    },
  );

  // ─── 2. ghost_get_post ───────────────────────────────────────────
  server.tool(
    "ghost_get_post",
    "Get a single Ghost post by ID or slug. Returns full post data including content, tags, and authors.",
    GetPostSchema.shape,
    async (params) => {
      try {
        const { id, slug, ...queryParams } = GetPostSchema.parse(params);
        if (!id && !slug) {
          return mcpError(new Error("Either id or slug is required"), "ghost_get_post");
        }

        const path = id ? `posts/${id}/` : `posts/slug/${slug}/`;
        const result = await client.get<{ posts: GhostPost[] }>(path, queryParams as Record<string, string | number | boolean | undefined>);
        return mcpSuccess(result.posts[0]);
      } catch (error) {
        return mcpError(error, "ghost_get_post");
      }
    },
  );

  // ─── 3. ghost_create_post ────────────────────────────────────────
  server.tool(
    "ghost_create_post",
    "Create a new Ghost blog post. Content can be Lexical JSON (recommended) or HTML. Tags are created automatically if they don't exist.",
    CreatePostSchema.shape,
    async (params) => {
      try {
        const validated = CreatePostSchema.parse(params);
        const result = await client.post<{ posts: GhostPost[] }>("posts/", {
          posts: [validated],
        });
        const post = result.posts[0]!;
        return mcpSuccess({
          id: post.id,
          title: post.title,
          slug: post.slug,
          status: post.status,
          url: post.url,
          message: `Post '${post.title}' created (${post.status})`,
        });
      } catch (error) {
        return mcpError(error, "ghost_create_post");
      }
    },
  );

  // ─── 4. ghost_update_post ────────────────────────────────────────
  server.tool(
    "ghost_update_post",
    "Update a Ghost post. Requires the current updated_at timestamp for collision detection. Get it from ghost_get_post first.",
    UpdatePostSchema.shape,
    async (params) => {
      try {
        const { id, ...data } = UpdatePostSchema.parse(params);
        const result = await client.put<{ posts: GhostPost[] }>(`posts/${id}/`, {
          posts: [data],
        });
        const post = result.posts[0]!;
        return mcpSuccess({
          id: post.id,
          title: post.title,
          status: post.status,
          message: `Post '${post.title}' updated`,
        });
      } catch (error) {
        return mcpError(error, "ghost_update_post");
      }
    },
  );

  // ─── 5. ghost_delete_post ────────────────────────────────────────
  server.tool(
    "ghost_delete_post",
    "Permanently delete a Ghost post by ID.",
    DeletePostSchema.shape,
    async (params) => {
      try {
        const { id } = DeletePostSchema.parse(params);
        await client.delete(`posts/${id}/`);
        return mcpSuccess({ message: `Post ${id} deleted` });
      } catch (error) {
        return mcpError(error, "ghost_delete_post");
      }
    },
  );

  // ─── 6. ghost_list_pages ─────────────────────────────────────────
  server.tool(
    "ghost_list_pages",
    "List Ghost pages with filtering, pagination, and sorting.",
    ListPagesSchema.shape,
    async (params) => {
      try {
        const validated = ListPagesSchema.parse(params);
        const result = await client.get<{ pages: GhostPage[]; meta: unknown }>("pages/", validated as Record<string, string | number | boolean | undefined>);
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "ghost_list_pages");
      }
    },
  );

  // ─── 7. ghost_create_page ────────────────────────────────────────
  server.tool(
    "ghost_create_page",
    "Create a new Ghost page. Content can be Lexical JSON or HTML.",
    CreatePageSchema.shape,
    async (params) => {
      try {
        const validated = CreatePageSchema.parse(params);
        const result = await client.post<{ pages: GhostPage[] }>("pages/", {
          pages: [validated],
        });
        const page = result.pages[0]!;
        return mcpSuccess({
          id: page.id,
          title: page.title,
          slug: page.slug,
          status: page.status,
          message: `Page '${page.title}' created`,
        });
      } catch (error) {
        return mcpError(error, "ghost_create_page");
      }
    },
  );

  // ─── 8. ghost_update_page ────────────────────────────────────────
  server.tool(
    "ghost_update_page",
    "Update a Ghost page. Requires the current updated_at timestamp for collision detection.",
    UpdatePageSchema.shape,
    async (params) => {
      try {
        const { id, ...data } = UpdatePageSchema.parse(params);
        const result = await client.put<{ pages: GhostPage[] }>(`pages/${id}/`, {
          pages: [data],
        });
        const page = result.pages[0]!;
        return mcpSuccess({
          id: page.id,
          title: page.title,
          status: page.status,
          message: `Page '${page.title}' updated`,
        });
      } catch (error) {
        return mcpError(error, "ghost_update_page");
      }
    },
  );

  // ─── 9. ghost_list_tags ──────────────────────────────────────────
  server.tool(
    "ghost_list_tags",
    "List all Ghost tags with optional post counts. Include 'count.posts' to see how many posts use each tag.",
    ListTagsSchema.shape,
    async (params) => {
      try {
        const validated = ListTagsSchema.parse(params);
        const result = await client.get<{ tags: GhostTag[]; meta: unknown }>("tags/", validated as Record<string, string | number | boolean | undefined>);
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "ghost_list_tags");
      }
    },
  );

  // ─── 10. ghost_create_tag ────────────────────────────────────────
  server.tool(
    "ghost_create_tag",
    "Create a new Ghost tag.",
    CreateTagSchema.shape,
    async (params) => {
      try {
        const validated = CreateTagSchema.parse(params);
        const result = await client.post<{ tags: GhostTag[] }>("tags/", {
          tags: [validated],
        });
        const tag = result.tags[0]!;
        return mcpSuccess({
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          message: `Tag '${tag.name}' created`,
        });
      } catch (error) {
        return mcpError(error, "ghost_create_tag");
      }
    },
  );
}
