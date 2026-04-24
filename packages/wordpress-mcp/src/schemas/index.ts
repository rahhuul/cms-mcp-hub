import { z } from "zod";

const Pg = { page: z.number().min(1).default(1).describe("Page number"), per_page: z.number().min(1).max(100).default(25).describe("Items per page") };
const Id = (n: string) => z.object({ id: z.number().describe(`${n} ID`) });
const Force = { force: z.boolean().default(false).describe("Bypass trash, permanently delete") };

// ─── Site Management ──────────────────────────────────────────────────
export const ListSitesSchema = z.object({});
export const SwitchSiteSchema = z.object({ siteId: z.string().min(1).describe("Site ID to switch to (use wp_list_sites to see available IDs)") });
export const GetActiveSiteSchema = z.object({});

// ─── Posts ──────────────────────────────────────────────────────────
export const ListPostsSchema = z.object({ ...Pg, search: z.string().optional(), status: z.enum(["publish","draft","pending","private","future","trash","any"]).optional(), categories: z.string().optional().describe("Comma-separated category IDs"), tags: z.string().optional().describe("Comma-separated tag IDs"), author: z.number().optional(), orderby: z.enum(["date","id","title","slug","modified","author"]).optional(), order: z.enum(["asc","desc"]).optional(), after: z.string().optional().describe("ISO 8601 date"), before: z.string().optional() });
export const GetPostSchema = Id("Post");
export const CreatePostSchema = z.object({ title: z.string().min(1).describe("Post title"), content: z.string().optional().describe("Post content (HTML)"), excerpt: z.string().optional(), status: z.enum(["publish","draft","pending","private","future"]).default("draft"), slug: z.string().optional(), author: z.number().optional(), categories: z.array(z.number()).optional(), tags: z.array(z.number()).optional(), featured_media: z.number().optional().describe("Featured image media ID"), format: z.enum(["standard","aside","chat","gallery","link","image","quote","status","video","audio"]).optional(), comment_status: z.enum(["open","closed"]).optional(), ping_status: z.enum(["open","closed"]).optional(), meta: z.record(z.string(), z.unknown()).optional() });
export const UpdatePostSchema = z.object({ id: z.number().describe("Post ID"), title: z.string().optional(), content: z.string().optional(), excerpt: z.string().optional(), status: z.enum(["publish","draft","pending","private","future"]).optional(), slug: z.string().optional(), author: z.number().optional(), categories: z.array(z.number()).optional(), tags: z.array(z.number()).optional(), featured_media: z.number().optional(), comment_status: z.enum(["open","closed"]).optional(), meta: z.record(z.string(), z.unknown()).optional() });
export const DeletePostSchema = z.object({ id: z.number().describe("Post ID"), ...Force });

// ─── Pages ──────────────────────────────────────────────────────────
export const ListPagesSchema = z.object({ ...Pg, search: z.string().optional(), status: z.enum(["publish","draft","pending","private","trash","any"]).optional(), parent: z.number().optional(), orderby: z.enum(["date","id","title","slug","modified","author","parent","menu_order"]).optional(), order: z.enum(["asc","desc"]).optional() });
export const GetPageSchema = Id("Page");
export const CreatePageSchema = z.object({ title: z.string().min(1), content: z.string().optional(), excerpt: z.string().optional(), status: z.enum(["publish","draft","pending","private"]).default("draft"), slug: z.string().optional(), author: z.number().optional(), parent: z.number().optional().describe("Parent page ID"), menu_order: z.number().optional(), featured_media: z.number().optional(), comment_status: z.enum(["open","closed"]).optional(), template: z.string().optional() });
export const UpdatePageSchema = z.object({ id: z.number(), title: z.string().optional(), content: z.string().optional(), status: z.enum(["publish","draft","pending","private"]).optional(), slug: z.string().optional(), parent: z.number().optional(), menu_order: z.number().optional(), template: z.string().optional() });
export const DeletePageSchema = z.object({ id: z.number(), ...Force });

// ─── Media ──────────────────────────────────────────────────────────
export const ListMediaSchema = z.object({ ...Pg, search: z.string().optional(), media_type: z.enum(["image","video","audio","application"]).optional(), mime_type: z.string().optional(), orderby: z.enum(["date","id","title","slug"]).optional(), order: z.enum(["asc","desc"]).optional() });
export const GetMediaSchema = Id("Media");
export const UpdateMediaSchema = z.object({ id: z.number(), title: z.string().optional(), caption: z.string().optional(), alt_text: z.string().optional(), description: z.string().optional() });
export const DeleteMediaSchema = z.object({ id: z.number(), force: z.boolean().default(true).describe("Must be true for media") });
export const UploadMediaSchema = z.object({ source: z.string().describe("File path (local) or URL (http/https) of the file to upload"), filename: z.string().optional().describe("Override filename (e.g., 'hero-image.jpg')"), title: z.string().optional().describe("Media title"), caption: z.string().optional(), alt_text: z.string().optional().describe("Alt text for images (accessibility)"), description: z.string().optional() });

// ─── Comments ───────────────────────────────────────────────────────
export const ListCommentsSchema = z.object({ ...Pg, post: z.number().optional().describe("Filter by post ID"), status: z.enum(["approve","hold","spam","trash","all"]).optional(), search: z.string().optional(), orderby: z.enum(["date","date_gmt","id"]).optional(), order: z.enum(["asc","desc"]).optional() });
export const GetCommentSchema = Id("Comment");
export const CreateCommentSchema = z.object({ post: z.number().describe("Post ID"), content: z.string().min(1).describe("Comment content"), author_name: z.string().optional(), author_email: z.string().optional(), author_url: z.string().optional(), parent: z.number().optional().describe("Parent comment ID for replies"), status: z.enum(["approve","hold","spam","trash"]).optional() });
export const UpdateCommentSchema = z.object({ id: z.number(), content: z.string().optional(), status: z.enum(["approve","hold","spam","trash"]).optional() });
export const DeleteCommentSchema = z.object({ id: z.number(), ...Force });

// ─── Categories ─────────────────────────────────────────────────────
export const ListCategoriesSchema = z.object({ ...Pg, search: z.string().optional(), parent: z.number().optional(), orderby: z.enum(["id","include","name","slug","count"]).optional(), order: z.enum(["asc","desc"]).optional(), hide_empty: z.boolean().optional() });
export const GetCategorySchema = Id("Category");
export const CreateCategorySchema = z.object({ name: z.string().min(1), slug: z.string().optional(), parent: z.number().optional(), description: z.string().optional() });
export const UpdateCategorySchema = z.object({ id: z.number(), name: z.string().optional(), slug: z.string().optional(), parent: z.number().optional(), description: z.string().optional() });
export const DeleteCategorySchema = z.object({ id: z.number(), ...Force });

// ─── Tags ───────────────────────────────────────────────────────────
export const ListTagsSchema = z.object({ ...Pg, search: z.string().optional(), orderby: z.enum(["id","include","name","slug","count"]).optional(), order: z.enum(["asc","desc"]).optional(), hide_empty: z.boolean().optional() });
export const GetTagSchema = Id("Tag");
export const CreateTagSchema = z.object({ name: z.string().min(1), slug: z.string().optional(), description: z.string().optional() });
export const UpdateTagSchema = z.object({ id: z.number(), name: z.string().optional(), slug: z.string().optional(), description: z.string().optional() });
export const DeleteTagSchema = z.object({ id: z.number(), ...Force });

// ─── Users ──────────────────────────────────────────────────────────
export const ListUsersSchema = z.object({ ...Pg, search: z.string().optional(), roles: z.string().optional().describe("Comma-separated role slugs"), orderby: z.enum(["id","include","name","registered_date","slug","email"]).optional(), order: z.enum(["asc","desc"]).optional() });
export const GetUserSchema = Id("User");
export const GetMeSchema = z.object({});
export const CreateUserSchema = z.object({ username: z.string().min(1), email: z.string().email(), password: z.string().min(1), first_name: z.string().optional(), last_name: z.string().optional(), roles: z.array(z.string()).optional().describe("e.g., ['editor']"), description: z.string().optional(), url: z.string().optional() });
export const UpdateUserSchema = z.object({ id: z.number(), email: z.string().email().optional(), first_name: z.string().optional(), last_name: z.string().optional(), roles: z.array(z.string()).optional(), description: z.string().optional(), password: z.string().optional() });
export const DeleteUserSchema = z.object({ id: z.number(), reassign: z.number().describe("Reassign content to this user ID") });

// ─── Custom Post Types & Taxonomies ─────────────────────────────────
export const ListPostTypesSchema = z.object({});
export const GetPostTypeSchema = z.object({ type: z.string().describe("Post type slug (e.g., 'product', 'event')") });
export const ListTaxonomiesSchema = z.object({});
export const GetTaxonomySchema = z.object({ taxonomy: z.string().describe("Taxonomy slug") });
export const ListCustomPostsSchema = z.object({ post_type: z.string().describe("Post type slug"), ...Pg, search: z.string().optional(), status: z.string().optional() });
export const GetCustomPostSchema = z.object({ post_type: z.string(), id: z.number() });
export const CreateCustomPostSchema = z.object({ post_type: z.string(), title: z.string().min(1), content: z.string().optional(), status: z.enum(["publish","draft","pending","private"]).default("draft"), slug: z.string().optional(), meta: z.record(z.string(), z.unknown()).optional() });
export const UpdateCustomPostSchema = z.object({ post_type: z.string(), id: z.number(), title: z.string().optional(), content: z.string().optional(), status: z.string().optional(), slug: z.string().optional(), meta: z.record(z.string(), z.unknown()).optional() });
export const DeleteCustomPostSchema = z.object({ post_type: z.string(), id: z.number(), ...Force });

// ─── Menus & Menu Items ─────────────────────────────────────────────
export const ListMenusSchema = z.object({ ...Pg });
export const GetMenuSchema = Id("Menu");
export const CreateMenuSchema = z.object({ name: z.string().min(1), slug: z.string().optional(), description: z.string().optional() });
export const UpdateMenuSchema = z.object({ id: z.number(), name: z.string().optional(), slug: z.string().optional(), description: z.string().optional() });
export const DeleteMenuSchema = z.object({ id: z.number(), ...Force });
export const ListMenuItemsSchema = z.object({ ...Pg, menus: z.number().optional().describe("Filter by menu ID") });
export const CreateMenuItemSchema = z.object({ title: z.string().min(1), url: z.string().optional(), menus: z.number().describe("Menu ID"), parent: z.number().optional(), menu_order: z.number().optional(), type: z.enum(["custom","post_type","taxonomy"]).optional(), object: z.string().optional().describe("Object type (page, post, category)"), object_id: z.number().optional() });
export const UpdateMenuItemSchema = z.object({ id: z.number(), title: z.string().optional(), url: z.string().optional(), menu_order: z.number().optional(), parent: z.number().optional() });
export const DeleteMenuItemSchema = z.object({ id: z.number(), ...Force });
export const ListMenuLocationsSchema = z.object({});

// ─── Plugins ────────────────────────────────────────────────────────
export const ListPluginsSchema = z.object({ status: z.enum(["active","inactive"]).optional(), search: z.string().optional() });
export const GetPluginSchema = z.object({ plugin: z.string().describe("Plugin slug (e.g., 'woocommerce/woocommerce')") });
export const UpdatePluginSchema = z.object({ plugin: z.string(), status: z.enum(["active","inactive"]).describe("Activate or deactivate") });
export const DeletePluginSchema = z.object({ plugin: z.string() });

// ─── Themes ─────────────────────────────────────────────────────────
export const ListThemesSchema = z.object({
  status: z.enum(["active", "inactive"]).optional().describe("Filter themes by status: 'active' for the current theme, 'inactive' for all others"),
  search: z.string().optional().describe("Search themes by name or description"),
});
export const GetThemeSchema = z.object({ stylesheet: z.string().min(1).describe("Theme stylesheet slug (folder name, e.g., 'twentytwentyfour', 'astra')") });

// ─── Settings ───────────────────────────────────────────────────────
export const GetSettingsSchema = z.object({});
export const UpdateSettingsSchema = z.object({ title: z.string().optional().describe("Site title"), description: z.string().optional().describe("Site tagline"), url: z.string().optional(), email: z.string().optional().describe("Admin email"), timezone: z.string().optional(), date_format: z.string().optional(), time_format: z.string().optional(), posts_per_page: z.number().optional(), default_comment_status: z.enum(["open","closed"]).optional() });

// ─── Search ─────────────────────────────────────────────────────────
export const SearchSchema = z.object({ search: z.string().min(1).describe("Search query"), ...Pg, type: z.enum(["post","term","post-format"]).optional(), subtype: z.string().optional().describe("Limit to specific subtype (e.g., 'post', 'page', 'product')") });

// ─── Block Types & Patterns ─────────────────────────────────────────
export const ListBlockTypesSchema = z.object({ namespace: z.string().optional().describe("Filter by block namespace (e.g., 'core')") });
export const GetBlockTypeSchema = z.object({ namespace: z.string(), name: z.string() });
export const ListBlockPatternsSchema = z.object({});
export const ListBlockPatternCategoriesSchema = z.object({});
export const RenderBlockSchema = z.object({ name: z.string().describe("Block name (e.g., 'core/latest-posts')"), attributes: z.record(z.string(), z.unknown()).optional().describe("Block attributes"), post_id: z.number().optional().describe("Post context for rendering") });

// ─── Widgets & Sidebars ─────────────────────────────────────────────
export const ListSidebarsSchema = z.object({});
export const GetSidebarSchema = z.object({ id: z.string().describe("Sidebar ID") });
export const ListWidgetsSchema = z.object({ sidebar: z.string().optional().describe("Filter by sidebar ID") });
export const GetWidgetSchema = z.object({ id: z.string().describe("Widget ID") });
export const CreateWidgetSchema = z.object({ id_base: z.string().describe("Widget type (e.g., 'text', 'custom_html')"), sidebar: z.string().describe("Target sidebar ID"), instance: z.object({ raw: z.record(z.string(), z.unknown()) }).optional().describe("Widget settings") });
export const UpdateWidgetSchema = z.object({ id: z.string(), sidebar: z.string().optional(), instance: z.object({ raw: z.record(z.string(), z.unknown()) }).optional() });
export const DeleteWidgetSchema = z.object({ id: z.string() });

// ─── Templates & Template Parts ─────────────────────────────────────
export const ListTemplatesSchema = z.object({ ...Pg });
export const GetTemplateSchema = z.object({ id: z.string().describe("Template ID (e.g., 'theme-slug//home')") });
export const ListTemplatePartsSchema = z.object({ ...Pg, area: z.string().optional().describe("Filter by area (header, footer, sidebar)") });
export const GetTemplatePartSchema = z.object({ id: z.string().describe("Template part ID") });

// ─── Navigation ─────────────────────────────────────────────────────
export const ListNavigationsSchema = z.object({ ...Pg, status: z.enum(["publish","draft","any"]).optional() });
export const GetNavigationSchema = Id("Navigation");
export const CreateNavigationSchema = z.object({ title: z.string().min(1), content: z.string().optional().describe("Navigation block content"), status: z.enum(["publish","draft"]).default("publish") });
export const UpdateNavigationSchema = z.object({ id: z.number(), title: z.string().optional(), content: z.string().optional(), status: z.enum(["publish","draft"]).optional() });
export const DeleteNavigationSchema = z.object({ id: z.number(), ...Force });

// ─── Application Passwords ──────────────────────────────────────────
export const ListAppPasswordsSchema = z.object({ user_id: z.number().describe("User ID (or use 'me' concept — pass your own ID)") });
export const CreateAppPasswordSchema = z.object({ user_id: z.number(), name: z.string().min(1).describe("App password name/label") });
export const DeleteAppPasswordSchema = z.object({ user_id: z.number(), uuid: z.string().describe("Application password UUID") });

// ─── Global Styles ──────────────────────────────────────────────────
export const GetGlobalStylesSchema = z.object({ id: z.number().describe("Global styles ID") });
export const UpdateGlobalStylesSchema = z.object({ id: z.number(), settings: z.record(z.string(), z.unknown()).optional(), styles: z.record(z.string(), z.unknown()).optional() });
export const GetThemeGlobalStylesSchema = z.object({ stylesheet: z.string().describe("Theme stylesheet slug") });
export const ListGlobalStyleVariationsSchema = z.object({ stylesheet: z.string().describe("Theme stylesheet slug") });

// ─── Revisions (Posts, Pages, Blocks, Navigation, Templates) ────────
export const ListRevisionsSchema = z.object({ parent_type: z.enum(["posts","pages","blocks","navigation"]).describe("Parent resource type"), parent_id: z.number().describe("Parent resource ID"), ...Pg });
export const GetRevisionSchema = z.object({ parent_type: z.enum(["posts","pages","blocks","navigation"]), parent_id: z.number(), revision_id: z.number().describe("Revision ID") });
export const DeleteRevisionSchema = z.object({ parent_type: z.enum(["posts","pages","blocks","navigation"]), parent_id: z.number(), revision_id: z.number(), ...Force });
export const ListTemplateRevisionsSchema = z.object({ parent_id: z.string().describe("Template or template-part ID"), resource: z.enum(["templates","template-parts"]).describe("Resource type"), ...Pg });
export const GetTemplateRevisionSchema = z.object({ parent_id: z.string(), resource: z.enum(["templates","template-parts"]), revision_id: z.number() });
export const DeleteTemplateRevisionSchema = z.object({ parent_id: z.string(), resource: z.enum(["templates","template-parts"]), revision_id: z.number(), ...Force });

// ─── Reusable Blocks ────────────────────────────────────────────────
export const ListBlocksSchema = z.object({ ...Pg, search: z.string().optional(), status: z.enum(["publish","draft","trash","any"]).optional() });
export const GetBlockSchema = Id("Block");
export const CreateBlockSchema = z.object({ title: z.string().min(1).describe("Reusable block title"), content: z.string().describe("Block content (HTML/block markup)"), status: z.enum(["publish","draft"]).default("publish") });
export const UpdateBlockSchema = z.object({ id: z.number(), title: z.string().optional(), content: z.string().optional(), status: z.enum(["publish","draft"]).optional() });
export const DeleteBlockSchema = z.object({ id: z.number(), ...Force });

// ─── Post Statuses ──────────────────────────────────────────────────
export const ListPostStatusesSchema = z.object({});
export const GetPostStatusSchema = z.object({ status: z.string().describe("Status slug (e.g., 'publish', 'draft', 'future')") });

// ─── Block Directory ────────────────────────────────────────────────
export const SearchBlockDirectorySchema = z.object({ term: z.string().min(1).describe("Search term for block directory"), ...Pg });

// ─── Pattern Directory ──────────────────────────────────────────────
export const SearchPatternDirectorySchema = z.object({ search: z.string().optional(), category: z.number().optional().describe("Pattern category ID"), ...Pg });

// ─── Widget Types ───────────────────────────────────────────────────
export const ListWidgetTypesSchema = z.object({});
export const GetWidgetTypeSchema = z.object({ id: z.string().describe("Widget type ID (e.g., 'text', 'custom_html', 'search')") });

// ─── Sidebar Update ─────────────────────────────────────────────────
export const UpdateSidebarSchema = z.object({ id: z.string().describe("Sidebar ID"), widgets: z.array(z.string()).optional().describe("Ordered list of widget IDs") });

// ─── Template & Template Part write ops ─────────────────────────────
export const CreateTemplateSchema = z.object({ slug: z.string().min(1).describe("Template slug"), content: z.string().optional().describe("Block content"), title: z.string().optional(), description: z.string().optional() });
export const UpdateTemplateSchema = z.object({ id: z.string(), content: z.string().optional(), title: z.string().optional(), description: z.string().optional() });
export const DeleteTemplateSchema = z.object({ id: z.string(), ...Force });
export const CreateTemplatePartSchema = z.object({ slug: z.string().min(1), content: z.string().optional(), title: z.string().optional(), area: z.enum(["header","footer","sidebar","uncategorized"]).optional() });
export const UpdateTemplatePartSchema = z.object({ id: z.string(), content: z.string().optional(), title: z.string().optional(), area: z.enum(["header","footer","sidebar","uncategorized"]).optional() });
export const DeleteTemplatePartSchema = z.object({ id: z.string(), ...Force });

// ─── Menu Item get & Menu Location get ──────────────────────────────
export const GetMenuItemSchema = Id("Menu item");
export const GetMenuLocationSchema = z.object({ location: z.string().describe("Menu location slug") });

// ─── Site Health ────────────────────────────────────────────────────
export const GetSiteHealthSchema = z.object({});

// ─── Font Families & Font Faces ─────────────────────────────────────
export const ListFontFamiliesSchema = z.object({ ...Pg });
export const GetFontFamilySchema = Id("Font family");
export const CreateFontFamilySchema = z.object({ font_family_settings: z.string().describe("JSON string with name, slug, fontFamily CSS value") });
export const DeleteFontFamilySchema = z.object({ id: z.number(), ...Force });
export const ListFontFacesSchema = z.object({ font_family_id: z.number().describe("Parent font family ID"), ...Pg });
export const GetFontFaceSchema = z.object({ font_family_id: z.number(), id: z.number().describe("Font face ID") });
export const CreateFontFaceSchema = z.object({ font_family_id: z.number(), font_face_settings: z.string().describe("JSON string with fontWeight, fontStyle, src") });
export const DeleteFontFaceSchema = z.object({ font_family_id: z.number(), id: z.number(), ...Force });

// ─── Plugin Install ─────────────────────────────────────────────────
export const InstallPluginSchema = z.object({ slug: z.string().describe("Plugin slug from wordpress.org (e.g., 'akismet')") });

// ═══════════════════════════════════════════════════════════════════════
// FEATURE 1: YOAST SEO & ACF PLUGIN TOOLS
// ═══════════════════════════════════════════════════════════════════════

// Yoast SEO (reads/writes via post meta)
export const GetYoastSeoSchema = z.object({ post_id: z.number().describe("Post/page ID"), post_type: z.enum(["posts","pages"]).default("posts") });
export const UpdateYoastSeoSchema = z.object({
  post_id: z.number().describe("Post/page ID"), post_type: z.enum(["posts","pages"]).default("posts"),
  yoast_head_json: z.record(z.string(), z.unknown()).optional().describe("Full Yoast head JSON override"),
  meta: z.object({
    _yoast_wpseo_title: z.string().optional().describe("SEO title"),
    _yoast_wpseo_metadesc: z.string().optional().describe("Meta description"),
    _yoast_wpseo_focuskw: z.string().optional().describe("Focus keyword"),
    _yoast_wpseo_canonical: z.string().optional().describe("Canonical URL"),
    _yoast_wpseo_opengraph_title: z.string().optional().describe("OG title"),
    _yoast_wpseo_opengraph_description: z.string().optional().describe("OG description"),
    _yoast_wpseo_twitter_title: z.string().optional().describe("Twitter title"),
    _yoast_wpseo_twitter_description: z.string().optional().describe("Twitter description"),
  }).optional().describe("Yoast SEO meta fields"),
});

// ACF (Advanced Custom Fields via post meta or ACF REST API)
export const GetAcfFieldsSchema = z.object({ post_id: z.number().describe("Post/page ID"), post_type: z.string().default("posts") });
export const UpdateAcfFieldsSchema = z.object({
  post_id: z.number(), post_type: z.string().default("posts"),
  acf: z.record(z.string(), z.unknown()).describe("ACF field values keyed by field name"),
});
export const ListAcfFieldGroupsSchema = z.object({});

// ═══════════════════════════════════════════════════════════════════════
// FEATURE 2: COMPOSITE WORKFLOWS (WordPress)
// ═══════════════════════════════════════════════════════════════════════

export const CreateFullPostSchema = z.object({
  title: z.string().min(1), content: z.string().describe("Post content HTML"),
  status: z.enum(["publish","draft"]).default("draft"),
  category_names: z.array(z.string()).optional().describe("Category names (created if they don't exist)"),
  tag_names: z.array(z.string()).optional().describe("Tag names (created if they don't exist)"),
  featured_image_url: z.string().optional().describe("URL to download and set as featured image"),
  excerpt: z.string().optional(),
  seo_title: z.string().optional().describe("Yoast SEO title (if Yoast installed)"),
  seo_description: z.string().optional().describe("Yoast meta description (if Yoast installed)"),
  seo_keyword: z.string().optional().describe("Yoast focus keyword"),
});

export const ClonePostSchema = z.object({ post_id: z.number().describe("Post ID to clone"), new_status: z.enum(["publish","draft"]).default("draft") });

export const BulkUpdatePostsSchema = z.object({
  post_ids: z.array(z.number()).min(1).describe("Post IDs to update"),
  status: z.enum(["publish","draft","pending","private","trash"]).optional(),
  categories: z.array(z.number()).optional().describe("Set categories (replaces existing)"),
  author: z.number().optional(),
});

export const ExportContentSchema = z.object({
  post_type: z.enum(["posts","pages"]).default("posts"),
  status: z.enum(["publish","draft","any"]).default("publish"),
  limit: z.number().min(1).max(100).default(50),
  format: z.enum(["json","markdown"]).default("json"),
});

export const SiteAuditSchema = z.object({});

export const SetupMenuSchema = z.object({
  name: z.string().min(1).describe("Menu name"),
  location: z.string().optional().describe("Menu location slug to assign"),
  items: z.array(z.object({
    title: z.string(), type: z.enum(["custom","page","post","category"]).default("custom"),
    url: z.string().optional(), object_id: z.number().optional(),
  })).describe("Menu items to add"),
});

// ═══════════════════════════════════════════════════════════════════════
// GUTENBERG BLOCK EDITOR
// ═══════════════════════════════════════════════════════════════════════

// Block content builder
export const BuildBlockContentSchema = z.object({
  blocks: z.array(z.object({
    type: z.enum(["heading","paragraph","image","list","quote","code","columns","separator","spacer","table","video","audio","cover","gallery","pullquote","preformatted","html","buttons","group"]).describe("Block type"),
    content: z.string().optional().describe("Text content or HTML"),
    level: z.number().min(1).max(6).optional().describe("Heading level (1-6, for heading blocks)"),
    url: z.string().optional().describe("Media URL (for image/video/audio/cover blocks)"),
    alt: z.string().optional().describe("Alt text (for image blocks)"),
    caption: z.string().optional().describe("Caption (for image/video/gallery blocks)"),
    ordered: z.boolean().optional().describe("Ordered list (for list blocks)"),
    items: z.array(z.string()).optional().describe("List items (for list blocks)"),
    language: z.string().optional().describe("Code language (for code blocks)"),
    columns: z.number().optional().describe("Number of columns (for columns/gallery blocks)"),
    align: z.enum(["left","center","right","wide","full"]).optional().describe("Block alignment"),
    className: z.string().optional().describe("Custom CSS class"),
  })).describe("Array of blocks to generate"),
});

export const CreateBlockPostSchema = z.object({
  title: z.string().min(1).describe("Post title"),
  blocks: z.array(z.object({
    type: z.string().describe("Block type (heading, paragraph, image, list, quote, code, etc.)"),
    content: z.string().optional(),
    level: z.number().optional(),
    url: z.string().optional(),
    alt: z.string().optional(),
    caption: z.string().optional(),
    ordered: z.boolean().optional(),
    items: z.array(z.string()).optional(),
    language: z.string().optional(),
    align: z.string().optional(),
  })).describe("Blocks that make up the post content"),
  status: z.enum(["publish","draft"]).default("draft"),
  categories: z.array(z.number()).optional(),
  tags: z.array(z.number()).optional(),
  featured_media: z.number().optional(),
  excerpt: z.string().optional(),
});

export const CreateLandingPageSchema = z.object({
  title: z.string().min(1).describe("Page title"),
  hero_heading: z.string().describe("Hero section heading"),
  hero_text: z.string().describe("Hero section description"),
  hero_image_url: z.string().optional().describe("Hero background image URL"),
  hero_cta_text: z.string().optional().describe("Call-to-action button text"),
  hero_cta_url: z.string().optional().describe("CTA button URL"),
  features: z.array(z.object({
    title: z.string(),
    description: z.string(),
  })).optional().describe("Feature cards (shown in columns)"),
  testimonial_quote: z.string().optional(),
  testimonial_author: z.string().optional(),
  closing_heading: z.string().optional(),
  closing_text: z.string().optional(),
  status: z.enum(["publish","draft"]).default("draft"),
});

// Pattern categories
export const ListPatternCategoriesSchema = z.object({ ...Pg });
export const GetPatternCategorySchema = Id("Pattern category");
export const CreatePatternCategorySchema = z.object({ name: z.string().min(1).describe("Category name"), slug: z.string().optional(), description: z.string().optional() });
export const UpdatePatternCategorySchema = z.object({ id: z.number(), name: z.string().optional(), slug: z.string().optional(), description: z.string().optional() });
export const DeletePatternCategorySchema = z.object({ id: z.number(), ...Force });

// Block editor endpoints
export const GetUrlDetailsSchema = z.object({ url: z.string().url().describe("URL to fetch preview details for (used for embeds)") });
export const GetNavigationFallbackSchema = z.object({});
export const ExportSiteSchema = z.object({});
export const ListFontCollectionsSchema = z.object({});
export const GetFontCollectionSchema = z.object({ slug: z.string().describe("Font collection slug") });
export const DetectPageBuilderSchema = z.object({ post_id: z.number().describe("Post/page ID"), post_type: z.enum(["posts","pages"]).default("posts") });
export const RenderWidgetTypeSchema = z.object({ id: z.string().describe("Widget type ID"), instance: z.record(z.string(), z.unknown()).optional().describe("Widget instance settings") });

// ═══════════════════════════════════════════════════════════════════════
// BLOCK COMPONENT LIBRARY
// ═══════════════════════════════════════════════════════════════════════

export const CreateHeroSectionSchema = z.object({
  heading: z.string().describe("Main heading"), subheading: z.string().optional().describe("Subheading text"),
  image_url: z.string().optional().describe("Background image URL (creates cover block)"),
  cta_text: z.string().optional().describe("Button text"), cta_url: z.string().optional().describe("Button URL"),
  alignment: z.enum(["left","center","right"]).default("center"),
});

export const CreateFeatureGridSchema = z.object({
  heading: z.string().optional().describe("Section heading"),
  columns: z.number().min(2).max(4).default(3).describe("Number of feature columns"),
  features: z.array(z.object({
    icon: z.string().optional().describe("Emoji or icon character"),
    title: z.string(), description: z.string(),
  })).min(1).describe("Feature items"),
});

export const CreatePricingTableSchema = z.object({
  heading: z.string().optional().describe("Section heading"),
  tiers: z.array(z.object({
    name: z.string(), price: z.string().describe("e.g., '$29/mo' or 'Free'"),
    description: z.string().optional(),
    features: z.array(z.string()).describe("Included features"),
    cta_text: z.string().optional().describe("Button text"), cta_url: z.string().optional(),
    highlighted: z.boolean().optional().describe("Highlight this tier"),
  })).min(1).describe("Pricing tiers"),
});

export const CreateTeamSectionSchema = z.object({
  heading: z.string().optional().describe("Section heading"),
  members: z.array(z.object({
    name: z.string(), role: z.string(), bio: z.string().optional(),
    image_url: z.string().optional().describe("Profile photo URL"),
  })).min(1),
});

export const CreateFaqSectionSchema = z.object({
  heading: z.string().optional().describe("Section heading"),
  items: z.array(z.object({ question: z.string(), answer: z.string() })).min(1),
});

export const CreateCtaBannerSchema = z.object({
  heading: z.string(), text: z.string().optional(),
  button_text: z.string(), button_url: z.string(),
  background_color: z.string().optional().describe("CSS color (e.g., '#1e40af')"),
});

export const CreateTestimonialsSectionSchema = z.object({
  heading: z.string().optional(),
  testimonials: z.array(z.object({
    quote: z.string(), author: z.string(), role: z.string().optional(),
    image_url: z.string().optional(),
  })).min(1),
});

export const CreateStatsSectionSchema = z.object({
  heading: z.string().optional(),
  stats: z.array(z.object({
    value: z.string().describe("e.g., '10K+', '99%', '$2M'"),
    label: z.string().describe("e.g., 'Users', 'Uptime', 'Revenue'"),
  })).min(1),
});

export const CreateContactSectionSchema = z.object({
  heading: z.string().optional(),
  text: z.string().optional().describe("Contact description"),
  email: z.string().optional(), phone: z.string().optional(),
  address: z.string().optional(),
  map_embed_url: z.string().optional().describe("Google Maps embed URL"),
});

export const CreateFullPageSchema = z.object({
  title: z.string().min(1).describe("Page title"),
  sections: z.array(z.enum(["hero","features","pricing","team","faq","cta","testimonials","stats","contact"])).describe("Sections to include in order"),
  hero: z.object({ heading: z.string(), subheading: z.string().optional(), image_url: z.string().optional(), cta_text: z.string().optional(), cta_url: z.string().optional() }).optional(),
  features: z.object({ features: z.array(z.object({ icon: z.string().optional(), title: z.string(), description: z.string() })) }).optional(),
  pricing: z.object({ tiers: z.array(z.object({ name: z.string(), price: z.string(), features: z.array(z.string()), cta_text: z.string().optional(), cta_url: z.string().optional() })) }).optional(),
  team: z.object({ members: z.array(z.object({ name: z.string(), role: z.string(), bio: z.string().optional(), image_url: z.string().optional() })) }).optional(),
  faq: z.object({ items: z.array(z.object({ question: z.string(), answer: z.string() })) }).optional(),
  cta: z.object({ heading: z.string(), text: z.string().optional(), button_text: z.string(), button_url: z.string() }).optional(),
  testimonials: z.object({ testimonials: z.array(z.object({ quote: z.string(), author: z.string(), role: z.string().optional() })) }).optional(),
  stats: z.object({ stats: z.array(z.object({ value: z.string(), label: z.string() })) }).optional(),
  contact: z.object({ email: z.string().optional(), phone: z.string().optional(), address: z.string().optional() }).optional(),
  status: z.enum(["publish","draft"]).default("draft"),
});

export const SaveComponentAsPatternSchema = z.object({
  title: z.string().min(1).describe("Reusable block/pattern name"),
  component: z.enum(["hero","features","pricing","team","faq","cta","testimonials","stats","contact"]).describe("Component type to save"),
  data: z.record(z.string(), z.unknown()).describe("Component data (same fields as the individual component schemas)"),
});

// ═══════════════════════════════════════════════════════════════════════
// STOCK IMAGES (Openverse Creative Commons)
// ═══════════════════════════════════════════════════════════════════════

export const SearchStockImagesSchema = z.object({
  query: z.string().min(1).describe("Search query for Creative Commons images"),
  page: z.number().min(1).default(1).describe("Page number"),
  per_page: z.number().min(1).max(50).default(20).describe("Results per page (max 50)"),
  license: z.string().optional().describe("License filter: cc0, by, by-sa, by-nc, by-nd, by-nc-sa, by-nc-nd, pdm"),
  license_type: z.string().optional().describe("License type filter: commercial, modification"),
  category: z.string().optional().describe("Category filter: photograph, illustration, digitized_artwork"),
  aspect_ratio: z.string().optional().describe("Aspect ratio filter: tall, wide, square"),
  size: z.string().optional().describe("Size filter: small, medium, large"),
});

export const SideloadImageSchema = z.object({
  image_url: z.string().url().describe("URL of the image to download and upload to WordPress"),
  title: z.string().optional().describe("Media title in WordPress"),
  alt_text: z.string().optional().describe("Alt text for accessibility"),
  caption: z.string().optional().describe("Image caption (auto-generated CC attribution if omitted and openverse_id provided)"),
  description: z.string().optional().describe("Image description"),
  attribution: z.string().optional().describe("CC attribution text (appended to caption)"),
  openverse_id: z.string().optional().describe("Openverse image ID — if provided, auto-generates Creative Commons attribution as caption"),
});

export const GetStockImageDetailsSchema = z.object({
  image_id: z.string().min(1).describe("Openverse image ID"),
});

export const SearchAndSideloadSchema = z.object({
  query: z.string().min(1).describe("Search query — picks the first Creative Commons result"),
  title: z.string().optional().describe("Override media title (defaults to image title)"),
  alt_text: z.string().optional().describe("Override alt text (defaults to image title)"),
  auto_attribute: z.boolean().default(true).describe("Automatically set CC attribution as image caption"),
});

// ═══════════════════════════════════════════════════════════════════════
// BULK OPERATIONS
// ═══════════════════════════════════════════════════════════════════════

export const BulkFindReplaceSchema = z.object({
  search: z.string().min(1).describe("Text string to find across posts/pages"),
  replace: z.string().describe("Replacement text (can be empty string to delete matches)"),
  post_type: z.enum(["post","page","any"]).default("post").describe("Post type to search in"),
  scope: z.enum(["title","content","excerpt","all"]).default("all").describe("Which fields to search: title, content, excerpt, or all"),
  dry_run: z.boolean().default(true).describe("Preview changes without applying them (default true for safety)"),
  max_posts: z.number().min(1).max(100).default(50).describe("Maximum number of posts to process"),
});

export const BulkUpdateMetaSchema = z.object({
  post_ids: z.array(z.number()).min(1).max(50).describe("Post IDs to update (max 50)"),
  meta: z.record(z.string(), z.unknown()).describe("Meta key-value pairs to set on each post"),
  post_type: z.enum(["posts","pages"]).default("posts").describe("Post type endpoint (posts or pages)"),
});

export const BulkManageMediaSchema = z.object({
  media_ids: z.array(z.number()).max(50).default([]).describe("Media IDs to update (leave empty to use search)"),
  updates: z.object({
    alt_text: z.string().optional().describe("Alt text to set on all matched media"),
    caption: z.string().optional().describe("Caption to set on all matched media"),
    title: z.string().optional().describe("Title to set on all matched media"),
  }).optional().describe("Fields to update on each media item"),
  search: z.string().optional().describe("Search term to find media items (used when media_ids is empty)"),
  fix_missing_alt: z.boolean().default(false).describe("Auto-generate alt text from title for media items missing alt text"),
});

export const BulkChangeStatusSchema = z.object({
  post_ids: z.array(z.number()).min(1).max(100).describe("Post IDs to change status (max 100)"),
  status: z.enum(["publish","draft","pending","private","trash"]).describe("New status to set on all posts"),
  post_type: z.enum(["posts","pages"]).default("posts").describe("Post type endpoint (posts or pages)"),
});

export const BulkAssignTermsSchema = z.object({
  post_ids: z.array(z.number()).min(1).max(100).describe("Post IDs to assign terms to (max 100)"),
  categories: z.array(z.number()).optional().describe("Category IDs to assign"),
  tags: z.array(z.number()).optional().describe("Tag IDs to assign"),
  mode: z.enum(["add","replace"]).default("add").describe("Add to existing terms or replace all existing terms"),
});

export const BulkDeleteSchema = z.object({
  ids: z.array(z.number()).min(1).max(50).describe("IDs of items to delete (max 50)"),
  resource: z.enum(["posts","pages","media","comments"]).describe("Resource type to delete"),
  force: z.boolean().default(false).describe("Permanently delete instead of trashing (media always requires force=true)"),
});

// ─── Snapshots & Safety ───────────────────────────────────────────────
export const ListSnapshotsSchema = z.object({
  post_id: z.number().describe("Post or page ID"),
  post_type: z.enum(["posts","pages"]).default("posts").describe("Post type (posts or pages)"),
});

export const GetSnapshotSchema = z.object({
  post_id: z.number().describe("Post or page ID"),
  revision_id: z.number().describe("Revision/snapshot ID"),
  post_type: z.enum(["posts","pages"]).default("posts").describe("Post type (posts or pages)"),
});

export const DiffContentSchema = z.object({
  post_id: z.number().describe("Post or page ID"),
  revision_id_a: z.number().describe("First revision ID (before)"),
  revision_id_b: z.number().describe("Second revision ID (after)"),
  post_type: z.enum(["posts","pages"]).default("posts").describe("Post type (posts or pages)"),
});

export const RestoreSnapshotSchema = z.object({
  post_id: z.number().describe("Post or page ID to restore"),
  revision_id: z.number().describe("Revision ID to restore from"),
  post_type: z.enum(["posts","pages"]).default("posts").describe("Post type (posts or pages)"),
});

export const CreateBackupSchema = z.object({
  post_id: z.number().describe("Post or page ID to back up"),
  post_type: z.enum(["posts","pages"]).default("posts").describe("Post type (posts or pages)"),
  suffix: z.string().default(" (Backup)").describe("Suffix to append to backup title"),
});

export const SafeUpdateSchema = z.object({
  post_id: z.number().describe("Post or page ID to update"),
  updates: z.object({
    title: z.string().optional().describe("New title"),
    content: z.string().optional().describe("New content (HTML)"),
    excerpt: z.string().optional().describe("New excerpt"),
    status: z.enum(["publish","draft","pending","private","future"]).optional().describe("New status"),
    slug: z.string().optional().describe("New slug"),
    categories: z.array(z.number()).optional().describe("Category IDs"),
    tags: z.array(z.number()).optional().describe("Tag IDs"),
    featured_media: z.number().optional().describe("Featured image media ID"),
    meta: z.record(z.string(), z.unknown()).optional().describe("Meta key-value pairs"),
  }).describe("Fields to update on the post"),
  post_type: z.enum(["posts","pages"]).default("posts").describe("Post type (posts or pages)"),
  create_backup: z.boolean().default(true).describe("Create a duplicate backup before updating (default true)"),
});

// ═══════════════════════════════════════════════════════════════════════
// Analysis — SEO
// ═══════════════════════════════════════════════════════════════════════

export const AnalyzeSeoSchema = z.object({
  post_id: z.number().describe("Post or page ID to analyze"),
  post_type: z.enum(["posts","pages"]).default("posts").describe("Post type (posts or pages)"),
});

export const GetRankMathScoreSchema = z.object({
  post_id: z.number().describe("Post or page ID"),
  post_type: z.enum(["posts","pages"]).default("posts").describe("Post type (posts or pages)"),
});

export const GetSeoOverviewSchema = z.object({
  post_type: z.enum(["posts","pages"]).default("posts").describe("Post type to audit"),
  limit: z.number().min(1).max(100).default(20).describe("Number of recent posts to check"),
});

// ═══════════════════════════════════════════════════════════════════════
// Analysis — Content Quality
// ═══════════════════════════════════════════════════════════════════════

export const AnalyzeReadabilitySchema = z.object({
  post_id: z.number().describe("Post or page ID to analyze"),
  post_type: z.enum(["posts","pages"]).default("posts").describe("Post type (posts or pages)"),
});

export const AnalyzeContentQualitySchema = z.object({
  post_id: z.number().describe("Post or page ID to analyze"),
  post_type: z.enum(["posts","pages"]).default("posts").describe("Post type (posts or pages)"),
});

export const ContentCalendarSchema = z.object({
  status: z.enum(["future","publish","draft","any"]).default("any").describe("Filter by post status"),
  days: z.number().min(1).max(365).default(30).describe("Number of days to look back/forward"),
  post_type: z.enum(["posts","pages"]).default("posts").describe("Post type (posts or pages)"),
});

export const FindThinContentSchema = z.object({
  post_type: z.enum(["posts","pages"]).default("posts").describe("Post type (posts or pages)"),
  min_words: z.number().min(1).default(300).describe("Minimum word count threshold"),
  limit: z.number().min(1).max(100).default(50).describe("Maximum number of posts to check"),
});

// ═══════════════════════════════════════════════════════════════════════
// Analysis — Links & Images
// ═══════════════════════════════════════════════════════════════════════

export const CheckBrokenLinksSchema = z.object({
  post_id: z.number().optional().describe("Specific post/page ID to scan (omit to scan recent posts)"),
  post_type: z.enum(["posts","pages"]).default("posts").describe("Post type to scan"),
  limit: z.number().min(1).max(20).default(10).describe("Number of recent posts to scan (ignored when post_id is set)"),
});

export const AnalyzeImagesSchema = z.object({
  post_id: z.number().describe("Post or page ID to audit images for"),
  post_type: z.enum(["posts","pages"]).default("posts").describe("Post type (posts or pages)"),
});

export const CheckStructuredDataSchema = z.object({
  post_id: z.number().describe("Post or page ID to check for structured data"),
  post_type: z.enum(["posts","pages"]).default("posts").describe("Post type (posts or pages)"),
});

// ═══════════════════════════════════════════════════════════════════════
// Widget Shortcuts — one-liner Gutenberg block appenders
// ═══════════════════════════════════════════════════════════════════════

const WidgetBase = {
  post_id: z.number().describe("Post or page ID to append the block to"),
  post_type: z.string().default("posts").describe("REST endpoint — 'posts' or 'pages'"),
};

export const AddHeadingSchema = z.object({
  ...WidgetBase,
  text: z.string().min(1).describe("Heading text"),
  level: z.number().min(1).max(6).default(2).describe("Heading level (1-6)"),
});

export const AddParagraphSchema = z.object({
  ...WidgetBase,
  text: z.string().min(1).describe("Paragraph text"),
});

export const AddImageSchema = z.object({
  ...WidgetBase,
  url: z.string().url().describe("Image URL"),
  alt: z.string().default("").describe("Alt text for accessibility"),
  caption: z.string().optional().describe("Image caption"),
});

export const AddButtonSchema = z.object({
  ...WidgetBase,
  text: z.string().min(1).describe("Button label"),
  url: z.string().url().describe("Button link URL"),
});

export const AddListSchema = z.object({
  ...WidgetBase,
  items: z.array(z.string().min(1)).min(1).describe("List items"),
  ordered: z.boolean().default(false).describe("Use ordered (numbered) list"),
});

export const AddQuoteSchema = z.object({
  ...WidgetBase,
  text: z.string().min(1).describe("Quote text"),
  citation: z.string().optional().describe("Attribution / citation"),
});

export const AddCodeSchema = z.object({
  ...WidgetBase,
  code: z.string().min(1).describe("Code content"),
  language: z.string().optional().describe("Programming language hint"),
});

export const AddTableSchema = z.object({
  ...WidgetBase,
  headers: z.array(z.string()).min(1).describe("Column headers"),
  rows: z.array(z.array(z.string())).min(1).describe("Table rows (array of cell arrays)"),
});

export const AddSeparatorSchema = z.object({
  ...WidgetBase,
  style: z.enum(["default","wide","dots"]).default("default").describe("Separator style"),
});

export const AddSpacerSchema = z.object({
  ...WidgetBase,
  height: z.number().min(1).max(500).default(40).describe("Spacer height in pixels"),
});

export const AddColumnsSchema = z.object({
  ...WidgetBase,
  count: z.number().min(2).max(4).default(2).describe("Number of columns (2-4)"),
  content: z.array(z.string()).describe("Text content for each column"),
});

export const AddGallerySchema = z.object({
  ...WidgetBase,
  image_urls: z.array(z.string().url()).min(1).describe("Image URLs for the gallery"),
  columns: z.number().min(1).max(4).default(3).describe("Gallery columns"),
});

export const AddVideoSchema = z.object({
  ...WidgetBase,
  url: z.string().url().describe("Video URL (YouTube, Vimeo, etc.)"),
});

export const AddEmbedSchema = z.object({
  ...WidgetBase,
  url: z.string().url().describe("URL to embed (YouTube, Twitter, etc.)"),
});

export const AddHtmlSchema = z.object({
  ...WidgetBase,
  html: z.string().min(1).describe("Custom HTML content"),
});

// ─── Page Builder ──────────────────────────────────────────────────

const PageBlockDef: z.ZodType = z.lazy(() => z.object({
  type: z.enum(["heading","paragraph","image","button","columns","list","quote","code","separator","spacer","html","embed","group","cover"]).describe("Block type"),
  attrs: z.record(z.string(), z.unknown()).default({}).describe("Block attributes (content, level, url, alt, items, etc.)"),
  children: z.array(z.lazy(() => PageBlockDef)).optional().describe("Child blocks (for columns, group, cover)"),
}));

export const BuildPageSchema = z.object({
  title: z.string().min(1).describe("Page title"),
  blocks: z.array(PageBlockDef).min(1).describe("Array of block definitions"),
  status: z.enum(["draft","publish"]).default("draft").describe("Page status"),
  template: z.string().optional().describe("Page template slug"),
  featured_image_id: z.number().optional().describe("Featured image media ID"),
});

export const ConvertHtmlToBlocksSchema = z.object({
  html: z.string().min(1).describe("Raw HTML to convert into Gutenberg blocks"),
  create_page: z.boolean().default(false).describe("If true, create a page with the converted content"),
  page_title: z.string().optional().describe("Page title (required if create_page is true)"),
  page_status: z.enum(["draft","publish"]).default("draft").describe("Page status if creating"),
});

export const GetPageStructureSchema = z.object({
  post_id: z.number().describe("Post/page ID to analyze"),
  post_type: z.enum(["pages","posts"]).default("pages").describe("Post type endpoint"),
});

// ═══════════════════════════════════════════════════════════════════════
// Advanced Content Management
// ═══════════════════════════════════════════════════════════════════════

export const SchedulePostSchema = z.object({
  post_id: z.number().describe("Post ID to schedule"),
  date: z.string().describe("Future publish date in ISO 8601 format (e.g., '2026-04-15T10:00:00')"),
  post_type: z.string().default("posts").describe("Post type endpoint (e.g., 'posts', 'pages', or custom post type slug)"),
});

export const ModerateCommentsSchema = z.object({
  comment_ids: z.array(z.number()).min(1).max(50).describe("Comment IDs to moderate (max 50)"),
  action: z.enum(["approve","spam","trash","untrash"]).describe("Moderation action: approve, spam, trash, or untrash"),
});

export const GetContentStatsSchema = z.object({
  post_id: z.number().describe("Post ID to get content statistics for"),
  post_type: z.string().default("posts").describe("Post type endpoint (e.g., 'posts', 'pages')"),
});

export const FindContentSchema = z.object({
  query: z.string().min(1).describe("Search query string"),
  content_types: z.array(z.string()).default(["posts","pages"]).describe("Content types to search (e.g., ['posts','pages'] or any registered post type)"),
  search_in: z.enum(["title","content","excerpt","all"]).default("all").describe("Restrict search to specific field or search all"),
  status: z.enum(["publish","draft","any"]).default("any").describe("Filter results by status"),
  limit: z.number().min(1).max(50).default(20).describe("Maximum results to return (max 50)"),
});

export const GetPreviewUrlSchema = z.object({
  post_id: z.number().describe("Post ID to generate preview URL for"),
  post_type: z.string().default("posts").describe("Post type endpoint (e.g., 'posts', 'pages')"),
});

// ═══════════════════════════════════════════════════════════════════════
// Plugin Analysis — server-side analysis via CMS MCP Hub plugin
// ═══════════════════════════════════════════════════════════════════════

export const DeepSeoAuditSchema = z.object({
  post_id: z.number().describe("Post or page ID to audit"),
  post_type: z.enum(["posts","pages"]).default("posts").describe("Post type (posts or pages)"),
});

export const ScanAccessibilitySchema = z.object({
  post_id: z.number().describe("Post or page ID to scan for accessibility issues"),
  post_type: z.enum(["posts","pages"]).default("posts").describe("Post type (posts or pages)"),
});

export const AnalyzePerformanceSchema = z.object({
  post_id: z.number().describe("Post or page ID to analyze performance for"),
  post_type: z.enum(["posts","pages"]).default("posts").describe("Post type (posts or pages)"),
});

// ═══════════════════════════════════════════════════════════════════════
// Plugin Snapshots — server-side snapshots via CMS MCP Hub plugin
// ═══════════════════════════════════════════════════════════════════════

export const PluginCreateSnapshotSchema = z.object({
  post_id: z.number().describe("Post or page ID to snapshot"),
  reason: z.string().default("manual").describe("Reason for creating the snapshot (e.g., 'before redesign', 'pre-update backup')"),
});

export const PluginListSnapshotsSchema = z.object({
  post_id: z.number().describe("Post or page ID to list snapshots for"),
});

export const PluginRestoreSnapshotSchema = z.object({
  post_id: z.number().describe("Post or page ID to restore"),
  snapshot_id: z.number().describe("Plugin snapshot ID to restore from"),
});

export const PluginDiffSnapshotsSchema = z.object({
  post_id: z.number().describe("Post or page ID"),
  snapshot_a: z.number().describe("First snapshot ID (before)"),
  snapshot_b: z.number().describe("Second snapshot ID (after)"),
});

// ═══════════════════════════════════════════════════════════════════════
// Builder Tools (Plugin) — page builder operations via CMS MCP Hub plugin
// ═══════════════════════════════════════════════════════════════════════

export const DetectBuildersSchema = z.object({});

export const GetBuilderContentSchema = z.object({
  post_id: z.number().describe("Post or page ID to extract builder content from"),
  post_type: z.string().default("posts").describe("Post type endpoint (e.g., 'posts', 'pages')"),
});

export const SetBuilderContentSchema = z.object({
  post_id: z.number().describe("Post or page ID to inject builder content into"),
  content: z.record(z.string(), z.unknown()).describe("Builder-native JSON content to inject"),
  post_type: z.string().default("posts").describe("Post type endpoint (e.g., 'posts', 'pages')"),
});

export const FindElementsSchema = z.object({
  post_id: z.number().describe("Post or page ID to search elements in"),
  identifier_type: z.enum(["type", "class", "content", "id"]).describe("How to identify elements: by type, CSS class, content text, or element ID"),
  identifier_value: z.string().min(1).describe("Value to search for (e.g., 'heading', 'my-class', 'Hello World', 'abc123')"),
  post_type: z.string().default("posts").describe("Post type endpoint (e.g., 'posts', 'pages')"),
});

export const UpdateElementSchema = z.object({
  post_id: z.number().describe("Post or page ID containing the element"),
  element_id: z.string().min(1).describe("Element ID to update (from wp_find_elements)"),
  updates: z.record(z.string(), z.unknown()).describe("Key-value pairs of element settings to update"),
  post_type: z.string().default("posts").describe("Post type endpoint (e.g., 'posts', 'pages')"),
});

export const MoveElementSchema = z.object({
  post_id: z.number().describe("Post or page ID containing the element"),
  element_id: z.string().min(1).describe("Element ID to move"),
  target_id: z.string().min(1).describe("Target element ID to move relative to"),
  position: z.enum(["before", "after", "inside"]).describe("Position relative to target: before, after, or inside (as child)"),
  post_type: z.string().default("posts").describe("Post type endpoint (e.g., 'posts', 'pages')"),
});

export const DuplicateElementSchema = z.object({
  post_id: z.number().describe("Post or page ID containing the element"),
  element_id: z.string().min(1).describe("Element ID to duplicate"),
  post_type: z.string().default("posts").describe("Post type endpoint (e.g., 'posts', 'pages')"),
});

export const RemoveElementSchema = z.object({
  post_id: z.number().describe("Post or page ID containing the element"),
  element_id: z.string().min(1).describe("Element ID to remove"),
  post_type: z.string().default("posts").describe("Post type endpoint (e.g., 'posts', 'pages')"),
});

export const GetPluginStatusSchema = z.object({});

// ─── Bricks Deep Intelligence ──────────────────────────────────────────

// Global Classes
export const BricksListGlobalClassesSchema = z.object({});
export const BricksCreateGlobalClassSchema = z.object({
  name: z.string().min(1).describe("CSS class name (e.g., 'btn-primary')"),
  settings: z.record(z.string(), z.unknown()).describe("CSS property map (e.g., { color: '#fff', background: '#000' })"),
  description: z.string().optional().describe("Human-readable description of the class purpose"),
});
export const BricksUpdateGlobalClassSchema = z.object({
  class_id: z.string().min(1).describe("Global class ID to update"),
  name: z.string().optional().describe("New CSS class name"),
  settings: z.record(z.string(), z.unknown()).optional().describe("Updated CSS properties"),
  description: z.string().optional().describe("Updated description"),
});
export const BricksDeleteGlobalClassSchema = z.object({
  class_id: z.string().min(1).describe("Global class ID to delete"),
});

// Theme Styles
export const BricksGetThemeStylesSchema = z.object({});
export const BricksUpdateThemeStylesSchema = z.object({
  styles: z.record(z.string(), z.unknown()).describe("Theme style configuration to set (headings, body text, links, buttons, etc.)"),
});

// Color & Typography
export const BricksGetColorPaletteSchema = z.object({});
export const BricksUpdateColorPaletteSchema = z.object({
  colors: z.array(z.object({
    id: z.string().optional().describe("Color ID (omit to auto-generate)"),
    name: z.string().describe("Color name (e.g., 'Primary', 'Accent')"),
    value: z.string().describe("CSS color value (hex, rgb, hsl)"),
    group: z.string().optional().describe("Color group name"),
  })).describe("Array of color palette entries"),
});
export const BricksGetTypographySchema = z.object({});
export const BricksUpdateTypographySchema = z.object({
  variables: z.record(z.string(), z.unknown()).describe("CSS variable definitions and typography scale settings"),
});

// Components
export const BricksListComponentsSchema = z.object({});
export const BricksGetComponentSchema = z.object({
  component_id: z.number().describe("Bricks template/component post ID"),
});
export const BricksApplyComponentSchema = z.object({
  post_id: z.number().describe("Target post/page ID to insert the component into"),
  component_id: z.number().describe("Bricks template/component post ID to insert"),
  position: z.enum(["prepend", "append", "replace"]).default("append").describe("Where to insert: prepend, append to existing content, or replace entirely"),
});

// Analysis
export const BricksSearchElementsSchema = z.object({
  element_type: z.string().optional().describe("Bricks element name (e.g., 'heading', 'button', 'container')"),
  css_class: z.string().optional().describe("CSS class to search for across all pages"),
  setting_key: z.string().optional().describe("Setting key to filter by (e.g., 'tag', 'link')"),
  setting_value: z.string().optional().describe("Setting value to match"),
  post_ids: z.array(z.number()).optional().describe("Limit search to specific post IDs (omit to search all Bricks pages)"),
});
export const BricksHealthCheckSchema = z.object({
  post_id: z.number().describe("Post/page ID to run diagnostics on"),
});
export const BricksStyleProfileSchema = z.object({
  post_id: z.number().describe("Post/page ID to analyze design patterns for"),
});
export const BricksDesignSystemSchema = z.object({});

// ═══════════════════════════════════════════════════════════════════════
// Builder Widget Shortcuts — builder-aware widget appenders via plugin
// ═══════════════════════════════════════════════════════════════════════

const BuilderWidgetBase = {
  post_id: z.number().describe("Post or page ID to add the widget to"),
  position: z.enum(["top", "bottom"]).default("bottom").describe("Where to insert: top or bottom of the page content"),
};

export const BuilderAddHeadingSchema = z.object({
  ...BuilderWidgetBase,
  text: z.string().min(1).describe("Heading text"),
  level: z.number().min(1).max(6).default(2).describe("Heading level (1-6)"),
  alignment: z.enum(["left", "center", "right"]).optional().describe("Text alignment"),
});

export const BuilderAddTextSchema = z.object({
  ...BuilderWidgetBase,
  text: z.string().min(1).describe("Text/paragraph content (can include basic HTML like <strong>, <em>)"),
  alignment: z.enum(["left", "center", "right", "justify"]).optional().describe("Text alignment"),
});

export const BuilderAddImageSchema = z.object({
  ...BuilderWidgetBase,
  url: z.string().url().describe("Image URL"),
  alt: z.string().default("").describe("Alt text for accessibility"),
  caption: z.string().optional().describe("Image caption"),
  link_url: z.string().optional().describe("URL to link the image to"),
  width: z.number().optional().describe("Image width in pixels"),
  height: z.number().optional().describe("Image height in pixels"),
});

export const BuilderAddButtonSchema = z.object({
  ...BuilderWidgetBase,
  text: z.string().min(1).describe("Button label"),
  url: z.string().url().describe("Button link URL"),
  style: z.enum(["primary", "secondary", "outline", "text"]).default("primary").describe("Button style variant"),
  size: z.enum(["small", "medium", "large"]).default("medium").describe("Button size"),
  target_blank: z.boolean().default(false).describe("Open link in new tab"),
  alignment: z.enum(["left", "center", "right"]).optional().describe("Button alignment"),
});

export const BuilderAddVideoSchema = z.object({
  ...BuilderWidgetBase,
  url: z.string().url().describe("Video URL (YouTube, Vimeo, self-hosted, etc.)"),
  autoplay: z.boolean().default(false).describe("Auto-play the video"),
  mute: z.boolean().default(false).describe("Mute by default"),
  loop: z.boolean().default(false).describe("Loop the video"),
});

export const BuilderAddSectionSchema = z.object({
  ...BuilderWidgetBase,
  layout: z.enum(["full", "boxed", "narrow"]).default("full").describe("Section width/layout"),
  background_color: z.string().optional().describe("CSS background color (e.g., '#f5f5f5')"),
  background_image: z.string().optional().describe("Background image URL"),
  padding: z.string().optional().describe("Padding value (e.g., '40px 20px')"),
  min_height: z.string().optional().describe("Minimum height (e.g., '400px', '50vh')"),
});

export const BuilderAddDividerSchema = z.object({
  ...BuilderWidgetBase,
  style: z.enum(["solid", "dashed", "dotted", "double"]).default("solid").describe("Divider line style"),
  color: z.string().optional().describe("Divider color (e.g., '#ccc')"),
  width: z.string().optional().describe("Divider width (e.g., '100%', '80%')"),
  weight: z.number().optional().describe("Divider thickness in pixels"),
});

export const BuilderAddSpacerSchema = z.object({
  ...BuilderWidgetBase,
  height: z.number().min(1).max(500).default(40).describe("Spacer height in pixels"),
});

export const BuilderAddIconSchema = z.object({
  ...BuilderWidgetBase,
  icon: z.string().min(1).describe("Icon identifier (e.g., 'fa fa-star', 'dashicons-admin-home', or SVG markup)"),
  size: z.number().optional().describe("Icon size in pixels"),
  color: z.string().optional().describe("Icon color (e.g., '#333')"),
  link_url: z.string().optional().describe("URL to link the icon to"),
  alignment: z.enum(["left", "center", "right"]).optional().describe("Icon alignment"),
});

export const BuilderAddFormSchema = z.object({
  ...BuilderWidgetBase,
  fields: z.array(z.object({
    type: z.enum(["text", "email", "textarea", "tel", "number", "select", "checkbox", "radio"]).describe("Field type"),
    label: z.string().describe("Field label"),
    placeholder: z.string().optional().describe("Placeholder text"),
    required: z.boolean().default(false).describe("Whether the field is required"),
    options: z.array(z.string()).optional().describe("Options for select/radio/checkbox fields"),
  })).optional().describe("Form fields (uses builder default form if omitted)"),
  submit_text: z.string().default("Submit").describe("Submit button text"),
  email_to: z.string().optional().describe("Email address to receive submissions"),
});

export const BuilderAddGallerySchema = z.object({
  ...BuilderWidgetBase,
  image_urls: z.array(z.string().url()).min(1).describe("Image URLs for the gallery"),
  columns: z.number().min(1).max(6).default(3).describe("Number of gallery columns"),
  gap: z.number().optional().describe("Gap between images in pixels"),
  lightbox: z.boolean().default(true).describe("Enable lightbox on click"),
});

export const BuilderAddSliderSchema = z.object({
  ...BuilderWidgetBase,
  slides: z.array(z.object({
    image_url: z.string().url().describe("Slide image URL"),
    title: z.string().optional().describe("Slide title/heading"),
    text: z.string().optional().describe("Slide description text"),
    button_text: z.string().optional().describe("Slide CTA button text"),
    button_url: z.string().optional().describe("Slide CTA button URL"),
  })).min(1).describe("Slider slides"),
  autoplay: z.boolean().default(true).describe("Auto-play the slider"),
  speed: z.number().default(3000).describe("Autoplay speed in milliseconds"),
  arrows: z.boolean().default(true).describe("Show navigation arrows"),
  dots: z.boolean().default(true).describe("Show pagination dots"),
});

/* ── Security Tools ────────────────────────────────────────────────── */

export const SecurityAuditSchema = z.object({});

export const CheckFilePermissionsSchema = z.object({});

export const ValidateContentSecuritySchema = z.object({
  post_id: z.number().int().positive().describe("WordPress post/page ID to scan"),
  post_type: z.enum(["posts", "pages"]).default("posts").describe("Content type — 'posts' or 'pages'"),
});

/* ── ACF (Advanced Custom Fields) Tools ───────────────────────────── */

export const AcfListFieldGroupsSchema = z.object({
  status: z.enum(["publish", "draft", "all"]).default("all").describe("Filter by field group status"),
  page: z.number().min(1).default(1).describe("Page number"),
  per_page: z.number().min(1).max(100).default(25).describe("Items per page"),
});

export const AcfGetFieldGroupSchema = z.object({
  id: z.number().int().positive().describe("ACF field group ID (post ID of the acf-field-group CPT)"),
});

export const AcfGetPostFieldsSchema = z.object({
  post_id: z.number().int().positive().describe("WordPress post/page ID to get ACF fields from"),
  post_type: z.enum(["posts", "pages", "custom"]).default("posts").describe("Content type — 'posts', 'pages', or 'custom' for CPTs"),
  custom_type: z.string().optional().describe("Custom post type slug (required when post_type is 'custom')"),
});

export const AcfUpdatePostFieldsSchema = z.object({
  post_id: z.number().int().positive().describe("WordPress post/page ID to update ACF fields on"),
  post_type: z.enum(["posts", "pages", "custom"]).default("posts").describe("Content type — 'posts', 'pages', or 'custom' for CPTs"),
  custom_type: z.string().optional().describe("Custom post type slug (required when post_type is 'custom')"),
  fields: z.record(z.string(), z.unknown()).describe("ACF field name-value pairs to update (e.g. {\"hero_title\": \"New Title\", \"show_banner\": true})"),
});

export const AcfListOptionsSchema = z.object({
  page_id: z.string().default("options").describe("ACF options page ID/slug (default: 'options' for main options page)"),
});

export const AcfUpdateOptionsSchema = z.object({
  page_id: z.string().default("options").describe("ACF options page ID/slug (default: 'options' for main options page)"),
  fields: z.record(z.string(), z.unknown()).describe("ACF option field name-value pairs to update"),
});

export const AcfGetRepeaterSchema = z.object({
  post_id: z.number().int().positive().describe("WordPress post/page ID"),
  post_type: z.enum(["posts", "pages", "custom"]).default("posts").describe("Content type"),
  custom_type: z.string().optional().describe("Custom post type slug (required when post_type is 'custom')"),
  field_name: z.string().min(1).describe("ACF repeater field name"),
});

export const AcfGetFlexibleContentSchema = z.object({
  post_id: z.number().int().positive().describe("WordPress post/page ID"),
  post_type: z.enum(["posts", "pages", "custom"]).default("posts").describe("Content type"),
  custom_type: z.string().optional().describe("Custom post type slug (required when post_type is 'custom')"),
  field_name: z.string().min(1).describe("ACF flexible content field name"),
});

export const AcfCloneFieldValuesSchema = z.object({
  source_id: z.number().int().positive().describe("Source post/page ID to copy ACF fields from"),
  target_id: z.number().int().positive().describe("Target post/page ID to copy ACF fields to"),
  post_type: z.enum(["posts", "pages", "custom"]).default("posts").describe("Content type of both posts"),
  custom_type: z.string().optional().describe("Custom post type slug (required when post_type is 'custom')"),
  field_names: z.array(z.string()).optional().describe("Specific field names to copy (copies all ACF fields if omitted)"),
});

export const AcfSearchByFieldSchema = z.object({
  field_name: z.string().min(1).describe("ACF meta field name to search by"),
  field_value: z.string().min(1).describe("Value to match against the ACF field"),
  post_type: z.enum(["posts", "pages", "custom"]).default("posts").describe("Content type to search"),
  custom_type: z.string().optional().describe("Custom post type slug (required when post_type is 'custom')"),
  compare: z.enum(["=", "!=", "LIKE", "NOT LIKE", "EXISTS", "NOT EXISTS"]).default("=").describe("Meta query comparison operator"),
  page: z.number().min(1).default(1).describe("Page number"),
  per_page: z.number().min(1).max(100).default(25).describe("Items per page"),
});

/* ── WP-CLI Bridge Tools ──────────────────────────────────────────── */

export const WpCliRunSchema = z.object({
  command: z.string().min(1).describe("WP-CLI command to execute (e.g., 'cache flush', 'option get blogname', 'user list'). Destructive commands are blocked."),
  args: z.record(z.string(), z.unknown()).optional().describe("Additional named arguments passed to the WP-CLI command (e.g., {\"format\": \"json\", \"fields\": \"ID,user_login\"})"),
});

export const WpCliExportSchema = z.object({
  post_type: z.string().optional().describe("Export only this post type (e.g., 'post', 'page', 'product')"),
  status: z.string().optional().describe("Export only posts with this status (e.g., 'publish', 'draft')"),
  start_date: z.string().optional().describe("Export posts published on or after this date (YYYY-MM-DD)"),
  end_date: z.string().optional().describe("Export posts published on or before this date (YYYY-MM-DD)"),
  author: z.string().optional().describe("Export only posts by this author login or ID"),
});

export const WpCliImportSchema = z.object({
  source: z.string().min(1).describe("URL to a WXR/XML file or inline XML content to import"),
  authors: z.enum(["create", "skip", "mapping"]).default("create").describe("How to handle authors — create new, skip, or map to existing"),
  skip_thumbnails: z.boolean().default(false).describe("Skip downloading featured images/thumbnails during import"),
});

export const WpCliSearchReplaceSchema = z.object({
  search: z.string().min(1).describe("String to search for in the database"),
  replace: z.string().describe("Replacement string"),
  tables: z.array(z.string()).optional().describe("Specific database tables to search (searches all tables if omitted)"),
  dry_run: z.boolean().default(true).describe("Preview changes without modifying the database (default: true for safety)"),
  precise: z.boolean().default(false).describe("Use precise regex matching instead of simple string replacement"),
  skip_columns: z.array(z.string()).optional().describe("Columns to skip during search-replace (e.g., ['guid'])"),
});

export const WpCliMaintenanceModeSchema = z.object({
  enable: z.boolean().describe("Set to true to enable maintenance mode, false to disable it"),
});

export const WpCliCacheFlushSchema = z.object({
  type: z.enum(["all", "object", "transients", "rewrite"]).default("all").describe("Cache type to flush — 'all' flushes everything, or target a specific cache"),
});

/* ── Staging / Migration Tools ────────────────────────────────────── */

export const StagingPushContentSchema = z.object({
  post_id: z.number().int().positive().describe("Post/page ID on the active (source) site to push"),
  post_type: z.enum(["posts", "pages"]).default("posts").describe("Content type — 'posts' or 'pages'"),
  target_site_id: z.string().min(1).describe("Site ID of the target site (use wp_list_sites to see available IDs)"),
  include_media: z.boolean().default(true).describe("Also copy the featured image and inline media to the target site"),
  include_taxonomies: z.boolean().default(true).describe("Also copy category and tag assignments to the target site"),
});

export const StagingPullContentSchema = z.object({
  post_id: z.number().int().positive().describe("Post/page ID on the source site to pull from"),
  post_type: z.enum(["posts", "pages"]).default("posts").describe("Content type — 'posts' or 'pages'"),
  source_site_id: z.string().min(1).describe("Site ID of the source site to pull content from"),
  include_media: z.boolean().default(true).describe("Also copy the featured image and inline media"),
  include_taxonomies: z.boolean().default(true).describe("Also copy category and tag assignments"),
});

export const StagingCompareContentSchema = z.object({
  post_id: z.number().int().positive().describe("Post/page ID to compare (must exist on both sites by ID or slug)"),
  post_type: z.enum(["posts", "pages"]).default("posts").describe("Content type — 'posts' or 'pages'"),
  target_site_id: z.string().min(1).describe("Site ID of the other site to compare against"),
  match_by: z.enum(["id", "slug"]).default("slug").describe("Match posts between sites by ID or slug"),
});

export const StagingSyncTaxonomiesSchema = z.object({
  taxonomy: z.enum(["categories", "tags"]).default("categories").describe("Taxonomy type to sync"),
  target_site_id: z.string().min(1).describe("Site ID of the target site to sync taxonomies to"),
  direction: z.enum(["push", "pull"]).default("push").describe("Push from active to target, or pull from target to active"),
});

export const StagingSyncMediaSchema = z.object({
  media_ids: z.array(z.number().int().positive()).min(1).describe("Media attachment IDs on the source site to copy"),
  target_site_id: z.string().min(1).describe("Site ID of the target site to copy media to"),
});

export const StagingListDifferencesSchema = z.object({
  post_type: z.enum(["posts", "pages"]).default("posts").describe("Content type to compare"),
  target_site_id: z.string().min(1).describe("Site ID of the other site to compare against"),
  page: z.number().min(1).default(1).describe("Page number for paginated results"),
  per_page: z.number().min(1).max(100).default(25).describe("Items per page"),
});

// ═══════════════════════════════════════════════════════════════════════
// Activity Log — track and query changes made via MCP (requires plugin)
// ═══════════════════════════════════════════════════════════════════════

export const ActivityListSchema = z.object({
  user: z.string().optional().describe("Filter by WordPress username or user ID"),
  action: z.enum(["create", "update", "delete"]).optional().describe("Filter by action type — create, update, or delete"),
  resource_type: z.string().optional().describe("Filter by resource type (e.g., 'post', 'page', 'media', 'user', 'comment', 'plugin', 'theme')"),
  date_from: z.string().optional().describe("Start date filter in ISO 8601 format (e.g., '2025-01-01')"),
  date_to: z.string().optional().describe("End date filter in ISO 8601 format (e.g., '2025-12-31')"),
  page: z.number().min(1).default(1).describe("Page number for pagination"),
  per_page: z.number().min(1).max(100).default(25).describe("Number of entries per page"),
});

export const ActivityGetSchema = z.object({
  activity_id: z.number().int().positive().describe("Activity log entry ID to retrieve"),
});

export const ActivityUndoSchema = z.object({
  activity_id: z.number().int().positive().describe("Activity log entry ID to undo — only update/delete actions can be reverted"),
});

export const ActivityStatsSchema = z.object({
  date_from: z.string().optional().describe("Start date for statistics window (ISO 8601, e.g., '2025-01-01')"),
  date_to: z.string().optional().describe("End date for statistics window (ISO 8601, e.g., '2025-12-31')"),
  group_by: z.enum(["day", "week", "month", "hour"]).default("day").describe("Group statistics by time period — day, week, month, or hour"),
});

export const ActivityExportSchema = z.object({
  date_from: z.string().optional().describe("Start date for export range (ISO 8601, e.g., '2025-01-01')"),
  date_to: z.string().optional().describe("End date for export range (ISO 8601, e.g., '2025-12-31')"),
  action: z.enum(["create", "update", "delete"]).optional().describe("Filter exported entries by action type"),
  resource_type: z.string().optional().describe("Filter exported entries by resource type (e.g., 'post', 'page', 'media')"),
  format: z.enum(["json", "csv"]).default("json").describe("Export format — JSON or CSV"),
});

// ═══════════════════════════════════════════════════════════════════════
// Settings & Options — WordPress site configuration management
// ═══════════════════════════════════════════════════════════════════════

export const GetSettingsGroupSchema = z.object({
  group: z.enum(["general", "writing", "reading", "discussion", "media", "permalinks"]).optional().describe("Filter settings by group. Omit to return all settings."),
});

export const UpdateSettingsBatchSchema = z.object({
  settings: z.record(z.string(), z.unknown()).describe("Key-value pairs of settings to update (e.g., {\"title\": \"My Site\", \"description\": \"A great blog\", \"posts_per_page\": 10})"),
});

export const GetOptionSchema = z.object({
  name: z.string().min(1).describe("WordPress option name (e.g., 'blogname', 'blogdescription', 'active_plugins', 'template', 'stylesheet')"),
});

export const UpdateOptionSchema = z.object({
  name: z.string().min(1).describe("WordPress option name to update (e.g., 'blogdescription', 'default_role', 'timezone_string')"),
  value: z.unknown().describe("New value for the option — can be a string, number, boolean, array, or object depending on the option"),
});

export const ListTransientsSchema = z.object({
  search: z.string().optional().describe("Search pattern to filter transient names (partial match)"),
  expired_only: z.boolean().optional().describe("Set to true to show only expired transients"),
  page: z.number().min(1).default(1).describe("Page number for pagination"),
  per_page: z.number().min(1).max(100).default(50).describe("Number of transients per page"),
});

export const DeleteTransientSchema = z.object({
  name: z.string().min(1).describe("Transient name to delete, or '__expired__' to delete all expired transients"),
});

// ═══════════════════════════════════════════════════════════════════════
// Database Management — table sizes, optimization, cleanup
// ═══════════════════════════════════════════════════════════════════════

export const DbGetSizesSchema = z.object({});

export const DbOptimizeTablesSchema = z.object({
  tables: z.array(z.string()).optional().describe("Specific table names to optimize. Omit to optimize all WordPress tables."),
});

export const DbCleanupRevisionsSchema = z.object({
  keep: z.number().min(0).max(100).default(5).describe("Number of revisions to keep per post (default: 5). Set to 0 to remove all revisions."),
});

export const DbCleanupTransientsSchema = z.object({});

export const DbGetInfoSchema = z.object({});

// ═══════════════════════════════════════════════════════════════════════
// Email — test, log, config, deliverability
// ═══════════════════════════════════════════════════════════════════════

export const EmailTestSchema = z.object({
  to: z.string().email().describe("Recipient email address for the test email"),
  subject: z.string().optional().describe("Custom subject line (defaults to 'WordPress Test Email')"),
  body: z.string().optional().describe("Custom email body (defaults to a standard test message)"),
});

export const EmailGetLogSchema = z.object({
  page: z.number().min(1).default(1).describe("Page number for pagination"),
  per_page: z.number().min(1).max(100).default(25).describe("Number of log entries per page"),
  status: z.enum(["sent", "failed", "all"]).default("all").describe("Filter by delivery status"),
  search: z.string().optional().describe("Search in to address or subject"),
});

export const EmailGetConfigSchema = z.object({});

export const EmailCheckDeliverabilitySchema = z.object({
  domain: z.string().optional().describe("Domain to check. Defaults to the site's domain extracted from the WordPress URL."),
});

// ═══════════════════════════════════════════════════════════════════════
// Comment Moderation — bulk moderation, stats, spam detection
// ═══════════════════════════════════════════════════════════════════════

export const CommentBulkModerateSchema = z.object({
  action: z.enum(["approve", "hold", "spam", "trash"]).describe("Moderation action to apply"),
  comment_ids: z.array(z.number()).optional().describe("Specific comment IDs to moderate. Provide this OR use filter criteria below."),
  status: z.enum(["approve", "hold", "spam", "trash"]).optional().describe("Filter: moderate all comments with this current status"),
  post: z.number().optional().describe("Filter: moderate comments on this post ID"),
  before: z.string().optional().describe("Filter: moderate comments before this ISO 8601 date"),
  after: z.string().optional().describe("Filter: moderate comments after this ISO 8601 date"),
  author_email: z.string().optional().describe("Filter: moderate comments by this author email"),
  max: z.number().min(1).max(500).default(100).describe("Maximum number of comments to moderate in one call (safety limit)"),
});

export const CommentGetStatsSchema = z.object({
  post: z.number().optional().describe("Get stats for a specific post ID. Omit for site-wide stats."),
});

export const CommentFindSpamPatternsSchema = z.object({
  status: z.enum(["approve", "hold", "all"]).default("hold").describe("Which comments to analyze for spam patterns"),
  max_scan: z.number().min(1).max(500).default(200).describe("Maximum number of comments to scan"),
});

export const CommentAutoModerateSchema = z.object({
  dry_run: z.boolean().default(true).describe("Preview actions without applying them (default: true for safety)"),
  min_approved_history: z.number().min(1).default(3).describe("Auto-approve if author has at least this many previously approved comments"),
  spam_url_threshold: z.number().min(1).default(3).describe("Flag as spam if comment body contains more than this many URLs"),
  max_process: z.number().min(1).max(500).default(100).describe("Maximum number of pending comments to process"),
});

// ═══════════════════════════════════════════════════════════════════════
// Multisite — network site management
// ═══════════════════════════════════════════════════════════════════════

export const MultisiteListSitesSchema = z.object({
  ...Pg,
  search: z.string().optional().describe("Search sites by domain or path"),
});

export const MultisiteGetSiteSchema = z.object({
  blog_id: z.number().describe("Blog ID of the network site to retrieve"),
});

export const MultisiteCreateSiteSchema = z.object({
  title: z.string().min(1).describe("Title for the new site"),
  slug: z.string().min(1).describe("Site slug (used as subdomain or path depending on multisite config, e.g., 'my-new-site')"),
  domain: z.string().optional().describe("Custom domain for the site (subdomain installs only)"),
  admin_user_id: z.number().optional().describe("User ID to set as site admin. Defaults to current user."),
  admin_email: z.string().email().optional().describe("Admin email for the new site"),
  public: z.boolean().optional().describe("Whether the site should be public (visible in search engines). Defaults to true."),
});

export const MultisiteUpdateSiteSchema = z.object({
  blog_id: z.number().describe("Blog ID of the network site to update"),
  title: z.string().optional().describe("New title for the site"),
  status: z.enum(["active", "archived", "spam", "deleted"]).optional().describe("Site status to set"),
  public: z.boolean().optional().describe("Whether the site should be public (visible in search engines)"),
});

export const MultisiteDeleteSiteSchema = z.object({
  blog_id: z.number().describe("Blog ID of the network site to delete or archive"),
  confirm: z.boolean().default(false).describe("Must be true to proceed. Safety check to prevent accidental deletion."),
  permanent: z.boolean().default(false).describe("If true, permanently deletes the site. If false (default), archives it."),
});

export const MultisiteListNetworkPluginsSchema = z.object({});

export const MultisiteListNetworkThemesSchema = z.object({});

export const MultisiteGetNetworkSettingsSchema = z.object({});

// ═══════════════════════════════════════════════════════════════════════
// Themes — theme management and Customizer
// ═══════════════════════════════════════════════════════════════════════

export const ActivateThemeSchema = z.object({
  stylesheet: z.string().min(1).describe("Stylesheet slug of the theme to activate (e.g., 'twentytwentyfour')"),
});

export const GetThemeModsSchema = z.object({});

export const UpdateThemeModSchema = z.object({
  name: z.string().min(1).describe("Theme modification name (e.g., 'header_image', 'background_color', 'custom_logo')"),
  value: z.unknown().describe("New value for the theme modification — type depends on the specific mod (string, number, boolean, etc.)"),
});

export const ExportCustomizerSchema = z.object({});

export const ImportCustomizerSchema = z.object({
  data: z.record(z.string(), z.unknown()).describe("Customizer settings JSON object to import. Use the format returned by wp_export_customizer."),
});

export const GetThemeSupportSchema = z.object({});

// ═══════════════════════════════════════════════════════════════════════
// Media Advanced — optimization audit, thumbnails, bulk alt text, unused
// ═══════════════════════════════════════════════════════════════════════

export const MediaOptimizeAuditSchema = z.object({
  max_pages: z.number().min(1).max(10).default(5).describe("Maximum number of pages to scan (each page contains per_page items)"),
  per_page: z.number().min(1).max(100).default(50).describe("Number of media items per page to scan"),
  max_width: z.number().min(1).default(2560).describe("Maximum acceptable image width in pixels — images wider are flagged as oversized"),
  max_height: z.number().min(1).default(2560).describe("Maximum acceptable image height in pixels — images taller are flagged as oversized"),
});

export const MediaRegenerateThumbnailsSchema = z.object({
  attachment_ids: z.array(z.number()).min(1).max(50).describe("Array of media attachment IDs to regenerate thumbnails for (max 50 at a time)"),
});

export const MediaBulkAltTextSchema = z.object({
  items: z.array(z.object({
    id: z.number().describe("Media attachment ID"),
    alt_text: z.string().min(1).describe("Alt text to set on this media item"),
  })).min(1).max(100).describe("Array of objects with media ID and alt text to apply"),
});

export const MediaFindUnusedSchema = z.object({
  per_page: z.number().min(1).max(100).default(50).describe("Number of media items per page to scan"),
  max_pages: z.number().min(1).max(20).default(5).describe("Maximum number of pages to scan for unused media"),
  media_type: z.enum(["image", "video", "audio", "application"]).optional().describe("Filter by media type — omit to scan all types"),
});

export const MediaGetSizesSchema = z.object({});

export const MediaReplaceSchema = z.object({
  attachment_id: z.number().describe("ID of the media attachment to replace"),
  source: z.string().min(1).describe("Local file path or URL of the replacement file"),
  filename: z.string().optional().describe("Override filename for the replacement file"),
});

// ═══════════════════════════════════════════════════════════════════════
// WP-Cron Management — events, schedules, status
// ═══════════════════════════════════════════════════════════════════════

export const CronListEventsSchema = z.object({});

export const CronGetSchedulesSchema = z.object({});

export const CronRunEventSchema = z.object({
  hook: z.string().min(1).describe("WP-Cron hook name to trigger (e.g., 'wp_update_plugins', 'wp_scheduled_delete')"),
  timestamp: z.number().optional().describe("Specific Unix timestamp of the event to run — required if multiple instances of the same hook exist"),
});

export const CronDeleteEventSchema = z.object({
  hook: z.string().min(1).describe("WP-Cron hook name to delete (e.g., 'wp_update_plugins')"),
  timestamp: z.number().describe("Unix timestamp of the specific event to delete — use wp_cron_list_events to find this value"),
});

export const CronCheckStatusSchema = z.object({});
