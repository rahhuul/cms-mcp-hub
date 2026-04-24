/**
 * MCP server instructions for @cmsmcp/wordpress.
 * Tells AI clients how to use the 169+ WordPress tools effectively.
 */

export function getServerInstructions(): string {
  return `@cmsmcp/wordpress — 169+ tools for full WordPress REST API v2 coverage.
No WordPress plugin required for core tools. Optional companion plugin for page builder support and advanced analysis.

## Getting Started
- wp_get_site_health — check site status and connectivity first
- wp_search — find content across all post types
- wp_list_posts / wp_list_pages — browse existing content

## Content Management

### Posts & Pages
- wp_create_post / wp_create_page — create with basic fields
- wp_create_full_post / wp_create_full_page — workflow: create with categories, tags, featured image, SEO in one call
- wp_create_landing_page — create a page with block-based layout
- wp_clone_post — duplicate existing content before major edits

### Media
- wp_list_media — browse media library
- wp_upload_media — upload via URL
- wp_get_media / wp_update_media / wp_delete_media

### Block Editor
- wp_build_block_content — generate Gutenberg block markup from structured data
- wp_create_block_post — create a post with block content
- wp_list_block_types / wp_get_block_type — discover available blocks

### Components (pre-built block patterns)
- wp_component_hero, wp_component_pricing, wp_component_features, wp_component_testimonials, wp_component_cta, wp_component_faq, wp_component_team, wp_component_stats, wp_component_gallery, wp_component_contact, wp_component_footer

## Common Tasks
- "Create a blog post with SEO" -> wp_create_full_post
- "Build a landing page" -> wp_create_landing_page or wp_create_full_page
- "Update site settings" -> wp_get_settings / wp_update_settings
- "Manage plugins" -> wp_list_plugins / wp_install_plugin / wp_update_plugin
- "Set up navigation" -> wp_setup_menu
- "Run site audit" -> wp_site_audit
- "Manage fonts" -> wp_list_font_families / wp_create_font_family
- "Edit templates" -> wp_list_templates / wp_update_template
- "Clone content" -> wp_clone_post
- "Bulk update" -> wp_bulk_update_posts
- "Check SEO" -> wp_get_yoast_seo / wp_update_yoast_seo

## Multi-Site (if configured)
- wp_list_sites — see all configured sites
- wp_switch_site — switch active site
- wp_get_active_site — check current site

## Safety
- Always check before deleting (use force: false first)
- Use wp_clone_post before major edits
- Use wp_list_revisions to review change history

## Tool Categories
Posts (5), Pages (5), Media (5), Comments (5), Menus (12), Taxonomy (10), Users (9), Block Editor (15), Blocks (5), Reusable Blocks (5), Components (11), Site Editor (19), Revisions (6), Fonts (8), Custom Post Types (9), Admin & Plugins (11), Yoast SEO (5), Widgets (10), Statuses & Directories (4), Workflows (6)`;
}
