import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WpClient } from "../api/client.js";
import { ListPostTypesSchema, GetPostTypeSchema, ListTaxonomiesSchema, GetTaxonomySchema, ListCustomPostsSchema, GetCustomPostSchema, CreateCustomPostSchema, UpdateCustomPostSchema, DeleteCustomPostSchema } from "../schemas/index.js";

// WP REST API uses plural REST bases for built-in types, not the singular post_type slug.
const BUILTIN_REST_BASE: Record<string, string> = {
  post: "posts",
  page: "pages",
  attachment: "media",
  revision: "revisions",
  "nav_menu_item": "menu-items",
  "wp_block": "blocks",
  "wp_template": "templates",
  "wp_template_part": "template-parts",
  "wp_navigation": "navigation",
  "wp_font_family": "font-families",
  "wp_font_face": "font-faces",
};

function restBase(postType: string): string {
  return BUILTIN_REST_BASE[postType] ?? postType;
}

export function registerCustomTypeTools(server: McpServer, client: WpClient): void {
  server.tool("wp_list_post_types", "Discover all registered post types (post, page, product, event, etc.).", ListPostTypesSchema.shape, async () => { try { return mcpSuccess(await client.get("types")); } catch(e) { return mcpError(e, "wp_list_post_types"); } });
  server.tool("wp_get_post_type", "Get details about a specific post type including its REST base and capabilities.", GetPostTypeSchema.shape, async (p) => { try { return mcpSuccess(await client.get(`types/${GetPostTypeSchema.parse(p).type}`)); } catch(e) { return mcpError(e, "wp_get_post_type"); } });
  server.tool("wp_list_taxonomies", "Discover all registered taxonomies (category, tag, product_cat, etc.).", ListTaxonomiesSchema.shape, async () => { try { return mcpSuccess(await client.get("taxonomies")); } catch(e) { return mcpError(e, "wp_list_taxonomies"); } });
  server.tool("wp_get_taxonomy", "Get details about a specific taxonomy.", GetTaxonomySchema.shape, async (p) => { try { return mcpSuccess(await client.get(`taxonomies/${GetTaxonomySchema.parse(p).taxonomy}`)); } catch(e) { return mcpError(e, "wp_get_taxonomy"); } });
  server.tool("wp_list_custom_posts", "List posts of any post type (e.g., 'post', 'page', 'product', 'event'). Automatically maps built-in type slugs to their REST base (page→pages, post→posts, attachment→media). Use wp_list_post_types first to discover available types.", ListCustomPostsSchema.shape, async (p) => { try { const { post_type, page, per_page, ...f } = ListCustomPostsSchema.parse(p); return mcpSuccess(await client.list(restBase(post_type), f as Record<string, string | number | boolean | undefined>, page, per_page)); } catch(e) { return mcpError(e, "wp_list_custom_posts"); } });
  server.tool("wp_get_custom_post", "Get a single post of any post type by ID.", GetCustomPostSchema.shape, async (p) => { try { const { post_type, id } = GetCustomPostSchema.parse(p); return mcpSuccess(await client.get(`${restBase(post_type)}/${id}`)); } catch(e) { return mcpError(e, "wp_get_custom_post"); } });
  server.tool("wp_create_custom_post", "Create an entry for any custom post type.", CreateCustomPostSchema.shape, async (p) => { try { const { post_type, ...d } = CreateCustomPostSchema.parse(p); const r = await client.post<Record<string, unknown>>(restBase(post_type), d); return mcpSuccess({ id: r["id"], type: post_type, status: r["status"], message: `${post_type} created (ID: ${r["id"]})` }); } catch(e) { return mcpError(e, "wp_create_custom_post"); } });
  server.tool("wp_update_custom_post", "Update a custom post type entry.", UpdateCustomPostSchema.shape, async (p) => { try { const { post_type, id, ...d } = UpdateCustomPostSchema.parse(p); await client.put(`${restBase(post_type)}/${id}`, d); return mcpSuccess({ message: `${post_type} ${id} updated` }); } catch(e) { return mcpError(e, "wp_update_custom_post"); } });
  server.tool("wp_delete_custom_post", "Delete a custom post type entry.", DeleteCustomPostSchema.shape, async (p) => { try { const { post_type, id, force } = DeleteCustomPostSchema.parse(p); await client.del(`${restBase(post_type)}/${id}`, { force }); return mcpSuccess({ message: `${post_type} ${id} deleted` }); } catch(e) { return mcpError(e, "wp_delete_custom_post"); } });
}
