import { z } from "zod";

const Pg = { page: z.number().min(1).default(1).describe("Page number"), per_page: z.number().min(1).max(100).default(25).describe("Items per page") };
const Id = (n: string) => z.object({ id: z.number().describe(`${n} ID`) });
const Force = { force: z.boolean().default(false).describe("Bypass trash, permanently delete") };

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
export const ListThemesSchema = z.object({ status: z.enum(["active","inactive"]).optional() });
export const GetThemeSchema = z.object({ stylesheet: z.string().describe("Theme stylesheet slug") });

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
