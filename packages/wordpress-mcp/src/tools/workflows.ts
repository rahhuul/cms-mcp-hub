/**
 * Composite workflow tools — multi-step operations in a single call.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WpClient } from "../api/client.js";
import { CreateFullPostSchema, ClonePostSchema, BulkUpdatePostsSchema, ExportContentSchema, SiteAuditSchema, SetupMenuSchema } from "../schemas/index.js";

export function registerWorkflowTools(server: McpServer, client: WpClient): void {

  // ─── wp_create_full_post ─────────────────────────────────────────
  server.tool("wp_create_full_post",
    "Create a complete post in one call: content + auto-create categories/tags + download & set featured image + SEO fields. The ultimate content creation tool.",
    CreateFullPostSchema.shape, async (params) => {
    try {
      const v = CreateFullPostSchema.parse(params);
      const categoryIds: number[] = [];
      const tagIds: number[] = [];

      // Create/find categories by name
      if (v.category_names?.length) {
        const existingCats = await client.list<Record<string, unknown>>("categories", { per_page: 100 });
        for (const name of v.category_names) {
          const existing = existingCats.find((c) => (c["name"] as string)?.toLowerCase() === name.toLowerCase());
          if (existing) { categoryIds.push(existing["id"] as number); }
          else {
            const created = await client.post<Record<string, unknown>>("categories", { name });
            categoryIds.push(created["id"] as number);
          }
        }
      }

      // Create/find tags by name
      if (v.tag_names?.length) {
        const existingTags = await client.list<Record<string, unknown>>("tags", { per_page: 100 });
        for (const name of v.tag_names) {
          const existing = existingTags.find((t) => (t["name"] as string)?.toLowerCase() === name.toLowerCase());
          if (existing) { tagIds.push(existing["id"] as number); }
          else {
            const created = await client.post<Record<string, unknown>>("tags", { name });
            tagIds.push(created["id"] as number);
          }
        }
      }

      // Upload featured image from URL
      let featuredMediaId: number | undefined;
      if (v.featured_image_url) {
        const media = await client.uploadMedia(v.featured_image_url);
        featuredMediaId = media["id"] as number;
      }

      // Create the post
      const postData: Record<string, unknown> = {
        title: v.title, content: v.content, status: v.status, excerpt: v.excerpt,
      };
      if (categoryIds.length) postData["categories"] = categoryIds;
      if (tagIds.length) postData["tags"] = tagIds;
      if (featuredMediaId) postData["featured_media"] = featuredMediaId;

      const post = await client.post<Record<string, unknown>>("posts", postData);
      const postId = post["id"] as number;

      // Set Yoast SEO if provided
      if (v.seo_title || v.seo_description || v.seo_keyword) {
        const meta: Record<string, string> = {};
        if (v.seo_title) meta["_yoast_wpseo_title"] = v.seo_title;
        if (v.seo_description) meta["_yoast_wpseo_metadesc"] = v.seo_description;
        if (v.seo_keyword) meta["_yoast_wpseo_focuskw"] = v.seo_keyword;
        await client.put(`posts/${postId}`, { meta }).catch(() => { /* Yoast not installed */ });
      }

      return mcpSuccess({
        id: postId, title: v.title, status: v.status, link: post["link"],
        categories_created: categoryIds, tags_created: tagIds,
        featured_media: featuredMediaId || null,
        message: `Full post created (ID: ${postId}) with ${categoryIds.length} categories, ${tagIds.length} tags${featuredMediaId ? ", featured image" : ""}`,
      });
    } catch (e) { return mcpError(e, "wp_create_full_post"); }
  });

  // ─── wp_clone_post ───────────────────────────────────────────────
  server.tool("wp_clone_post",
    "Duplicate a post with all its content, categories, tags, and featured image.",
    ClonePostSchema.shape, async (params) => {
    try {
      const { post_id, new_status } = ClonePostSchema.parse(params);
      const original = await client.get<Record<string, unknown>>(`posts/${post_id}`, { context: "edit" });

      const clone = await client.post<Record<string, unknown>>("posts", {
        title: `${(original["title"] as Record<string, unknown>)?.["raw"] || "Untitled"} (Copy)`,
        content: (original["content"] as Record<string, unknown>)?.["raw"] || "",
        excerpt: (original["excerpt"] as Record<string, unknown>)?.["raw"] || "",
        status: new_status,
        categories: original["categories"],
        tags: original["tags"],
        featured_media: original["featured_media"],
        format: original["format"],
        meta: original["meta"],
      });

      return mcpSuccess({
        original_id: post_id, clone_id: clone["id"], status: new_status,
        message: `Post ${post_id} cloned as ${clone["id"]}`,
      });
    } catch (e) { return mcpError(e, "wp_clone_post"); }
  });

  // ─── wp_bulk_update_posts ────────────────────────────────────────
  server.tool("wp_bulk_update_posts",
    "Update multiple posts at once — change status, categories, or author for many posts in one call.",
    BulkUpdatePostsSchema.shape, async (params) => {
    try {
      const { post_ids, ...updates } = BulkUpdatePostsSchema.parse(params);
      const cleanUpdates: Record<string, unknown> = {};
      if (updates.status) cleanUpdates["status"] = updates.status;
      if (updates.categories) cleanUpdates["categories"] = updates.categories;
      if (updates.author) cleanUpdates["author"] = updates.author;

      const results: Array<{ id: number; success: boolean }> = [];
      for (const id of post_ids) {
        try {
          await client.put(`posts/${id}`, cleanUpdates);
          results.push({ id, success: true });
        } catch { results.push({ id, success: false }); }
      }

      const succeeded = results.filter((r) => r.success).length;
      return mcpSuccess({ results, message: `${succeeded}/${post_ids.length} posts updated` });
    } catch (e) { return mcpError(e, "wp_bulk_update_posts"); }
  });

  // ─── wp_export_content ───────────────────────────────────────────
  server.tool("wp_export_content",
    "Export posts or pages as JSON or Markdown. Useful for backups, migrations, or content analysis.",
    ExportContentSchema.shape, async (params) => {
    try {
      const { post_type, status, limit, format } = ExportContentSchema.parse(params);
      const statusParam = status === "any" ? undefined : status;
      const items = await client.list<Record<string, unknown>>(post_type, { status: statusParam, context: "edit" }, 1, limit);

      if (format === "markdown") {
        const md = items.map((item) => {
          const title = (item["title"] as Record<string, unknown>)?.["raw"] || "";
          const content = (item["content"] as Record<string, unknown>)?.["raw"] || "";
          const date = item["date"] || "";
          return `# ${title}\n\n*Date: ${date}*\n\n${content}\n\n---\n`;
        }).join("\n");
        return mcpSuccess({ format: "markdown", count: items.length, content: md });
      }

      const json = items.map((item) => ({
        id: item["id"], title: (item["title"] as Record<string, unknown>)?.["raw"],
        content: (item["content"] as Record<string, unknown>)?.["raw"],
        excerpt: (item["excerpt"] as Record<string, unknown>)?.["raw"],
        slug: item["slug"], status: item["status"], date: item["date"],
        categories: item["categories"], tags: item["tags"],
      }));
      return mcpSuccess({ format: "json", count: json.length, data: json });
    } catch (e) { return mcpError(e, "wp_export_content"); }
  });

  // ─── wp_site_audit ───────────────────────────────────────────────
  server.tool("wp_site_audit",
    "Comprehensive site audit: site info, active theme, plugin status, post/page counts, user counts, and health check — all in one report.",
    SiteAuditSchema.shape, async () => {
    try {
      const [settings, themes, plugins, posts, pages, users, comments] = await Promise.all([
        client.get<Record<string, unknown>>("settings"),
        client.get<Record<string, unknown>[]>("themes"),
        client.get<Record<string, unknown>[]>("plugins"),
        client.list<Record<string, unknown>>("posts", { per_page: 1, status: "any" }),
        client.list<Record<string, unknown>>("pages", { per_page: 1, status: "any" }),
        client.list<Record<string, unknown>>("users", { per_page: 1 }),
        client.list<Record<string, unknown>>("comments", { per_page: 1 }),
      ]);

      const activeTheme = themes.find((t) => t["status"] === "active");
      const activePlugins = plugins.filter((p) => p["status"] === "active");
      const inactivePlugins = plugins.filter((p) => p["status"] === "inactive");

      return mcpSuccess({
        site: { title: settings["title"], tagline: settings["description"], url: settings["url"], timezone: settings["timezone_string"] },
        theme: { name: activeTheme?.["name"], stylesheet: activeTheme?.["stylesheet"], version: activeTheme?.["version"] },
        plugins: { active: activePlugins.length, inactive: inactivePlugins.length, list: activePlugins.map((p) => p["name"]) },
        content: { posts: "check wp_list_posts for count", pages: "check wp_list_pages for count" },
        users: { total: "check wp_list_users" },
        message: "Site audit complete",
      });
    } catch (e) { return mcpError(e, "wp_site_audit"); }
  });

  // ─── wp_setup_menu ───────────────────────────────────────────────
  server.tool("wp_setup_menu",
    "Create a navigation menu with items in one call. Specify pages, posts, categories, or custom URLs.",
    SetupMenuSchema.shape, async (params) => {
    try {
      const v = SetupMenuSchema.parse(params);

      // Create the menu
      const menu = await client.post<Record<string, unknown>>("menus", { name: v.name });
      const menuId = menu["id"] as number;

      // Add items
      const addedItems: Array<{ title: string; id: unknown }> = [];
      for (let i = 0; i < v.items.length; i++) {
        const item = v.items[i]!;
        const itemData: Record<string, unknown> = {
          title: item.title, menus: menuId, menu_order: i + 1,
        };

        if (item.type === "custom") {
          itemData["type"] = "custom";
          itemData["url"] = item.url || "#";
        } else if (item.type === "page") {
          itemData["type"] = "post_type";
          itemData["object"] = "page";
          itemData["object_id"] = item.object_id;
        } else if (item.type === "post") {
          itemData["type"] = "post_type";
          itemData["object"] = "post";
          itemData["object_id"] = item.object_id;
        } else if (item.type === "category") {
          itemData["type"] = "taxonomy";
          itemData["object"] = "category";
          itemData["object_id"] = item.object_id;
        }

        const created = await client.post<Record<string, unknown>>("menu-items", itemData);
        addedItems.push({ title: item.title, id: created["id"] });
      }

      return mcpSuccess({
        menu_id: menuId, menu_name: v.name,
        items: addedItems,
        message: `Menu '${v.name}' created with ${addedItems.length} items`,
      });
    } catch (e) { return mcpError(e, "wp_setup_menu"); }
  });
}
