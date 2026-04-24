# @cmsmcp/wordpress

MCP server for WordPress — **337 tools** for complete WordPress management: content, media, blocks, themes, plugins, SEO analysis, page builders (Elementor, Bricks, Divi), ACF deep integration, WP-CLI bridge, staging workflows, multisite networks, security audits, database tools, and more.

> Part of [CMS MCP Hub](https://github.com/rahhuul/cms-mcp-hub) — 757 tools across 12 CMS platforms. If this is useful, [give it a star](https://github.com/rahhuul/cms-mcp-hub/stargazers)!

[![npm version](https://img.shields.io/npm/v/@cmsmcp/wordpress.svg)](https://www.npmjs.com/package/@cmsmcp/wordpress)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](../../LICENSE)

## Quick Start

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "wordpress": {
      "command": "npx",
      "args": ["-y", "@cmsmcp/wordpress"],
      "env": {
        "WORDPRESS_URL": "https://mysite.com",
        "WORDPRESS_USERNAME": "admin",
        "WORDPRESS_APP_PASSWORD": "xxxx xxxx xxxx"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add wordpress -e WORDPRESS_URL=https://mysite.com -e WORDPRESS_USERNAME=admin -e WORDPRESS_APP_PASSWORD=xxxx -- npx -y @cmsmcp/wordpress
```

### Cursor / Windsurf / Any MCP Client

Same JSON config format — add to your client's MCP settings file.

## Configuration

### Single Site (Basic)

| Variable | Required | Description |
|----------|----------|-------------|
| `WORDPRESS_URL` | Yes | Your WordPress site URL |
| `WORDPRESS_USERNAME` | Yes | WordPress username |
| `WORDPRESS_APP_PASSWORD` | Yes | WordPress application password (generate in WP Admin → Users → Application Passwords) |

### Multi-Site & Advanced

| Variable | Required | Description |
|----------|----------|-------------|
| `CMSMCP_CONFIG_B64` | No | Base64-encoded JSON config for multi-site setup |
| `CMSMCP_CONFIG_FILE` | No | Path to a JSON config file for multi-site setup |
| `CMSMCP_SITES` | No | Comma-separated hostnames to filter which sites are active |
| `WORDPRESS_ENABLED_TOOLS` | No | Comma-separated list of tool names to enable (allowlist) |
| `WP_WEBHOOK_PORT` | No | Webhook server port (default: 9456) |

### CMS MCP Hub Plugin (Optional — unlocks 100+ extra tools)

Install the companion WordPress plugin to unlock plugin-dependent tools (WP-CLI bridge, database tools, cron management, activity log, staging workflows, Bricks builder, and more):

```json
{
  "env": {
    "WORDPRESS_URL": "https://mysite.com",
    "WORDPRESS_USERNAME": "admin",
    "WORDPRESS_APP_PASSWORD": "xxxx xxxx xxxx",
    "CMSMCP_PLUGIN_URL": "https://mysite.com/wp-json/cmsmcp/v1",
    "CMSMCP_PLUGIN_SECRET": "your-plugin-secret"
  }
}
```

## Available Tools (337 tools)

### Posts (5 tools)

| Tool | Description |
|------|-------------|
| `wp_list_posts` | List posts with filtering and pagination |
| `wp_get_post` | Get a single post by ID |
| `wp_create_post` | Create a new post |
| `wp_update_post` | Update an existing post |
| `wp_delete_post` | Delete a post |

### Pages (5 tools)

| Tool | Description |
|------|-------------|
| `wp_list_pages` | List pages with filtering and pagination |
| `wp_get_page` | Get a single page by ID |
| `wp_create_page` | Create a new page |
| `wp_update_page` | Update an existing page |
| `wp_delete_page` | Delete a page |

### Media (5 tools)

| Tool | Description |
|------|-------------|
| `wp_list_media` | List media library items with type and search filters |
| `wp_get_media` | Get a single media item by ID |
| `wp_upload_media` | Upload a new media file |
| `wp_update_media` | Update media metadata (title, caption, alt text) |
| `wp_delete_media` | Permanently delete a media item |

### Comments (5 tools)

| Tool | Description |
|------|-------------|
| `wp_list_comments` | List comments with filtering |
| `wp_get_comment` | Get a single comment |
| `wp_create_comment` | Create a new comment |
| `wp_update_comment` | Update a comment |
| `wp_delete_comment` | Delete a comment |

### Menus (12 tools)

| Tool | Description |
|------|-------------|
| `wp_list_menus` | List all navigation menus |
| `wp_get_menu` | Get a single menu |
| `wp_create_menu` | Create a new menu |
| `wp_update_menu` | Update a menu |
| `wp_delete_menu` | Delete a menu |
| `wp_list_menu_items` | List items in a menu |
| `wp_get_menu_item` | Get a single menu item |
| `wp_create_menu_item` | Add an item to a menu |
| `wp_update_menu_item` | Update a menu item |
| `wp_delete_menu_item` | Delete a menu item |
| `wp_list_menu_locations` | List registered menu locations |
| `wp_get_menu_location` | Get a menu location and its assigned menu |

### Taxonomy (10 tools)

| Tool | Description |
|------|-------------|
| `wp_list_categories` | List categories |
| `wp_get_category` | Get a single category |
| `wp_create_category` | Create a new category |
| `wp_update_category` | Update a category |
| `wp_delete_category` | Delete a category |
| `wp_list_tags` | List tags |
| `wp_get_tag` | Get a single tag |
| `wp_create_tag` | Create a new tag |
| `wp_update_tag` | Update a tag |
| `wp_delete_tag` | Delete a tag |

### Users (9 tools)

| Tool | Description |
|------|-------------|
| `wp_list_users` | List users |
| `wp_get_user` | Get a single user |
| `wp_get_me` | Get the currently authenticated user |
| `wp_create_user` | Create a new user |
| `wp_update_user` | Update a user |
| `wp_delete_user` | Delete a user |
| `wp_list_app_passwords` | List application passwords for a user |
| `wp_create_app_password` | Create an application password |
| `wp_delete_app_password` | Delete an application password |

### Block Editor (15 tools)

| Tool | Description |
|------|-------------|
| `wp_build_block_content` | Build Gutenberg block content from structured data |
| `wp_create_block_post` | Create a post with Gutenberg blocks |
| `wp_create_landing_page` | Create a landing page with block layout |
| `wp_list_pattern_categories` | List block pattern categories |
| `wp_get_pattern_category` | Get a pattern category |
| `wp_create_pattern_category` | Create a pattern category |
| `wp_update_pattern_category` | Update a pattern category |
| `wp_delete_pattern_category` | Delete a pattern category |
| `wp_get_url_details` | Get URL embed/preview details |
| `wp_get_navigation_fallback` | Get the default navigation fallback |
| `wp_export_site` | Export full site content |
| `wp_list_font_collections` | List available font collections |
| `wp_get_font_collection` | Get a font collection |
| `wp_detect_page_builder` | Detect which page builder a site uses |
| `wp_render_widget_type` | Render a widget type preview |

### Blocks (5 tools)

| Tool | Description |
|------|-------------|
| `wp_list_block_types` | List registered block types |
| `wp_get_block_type` | Get a single block type |
| `wp_list_block_patterns` | List available block patterns |
| `wp_list_block_pattern_categories` | List block pattern categories |
| `wp_render_block` | Render a block to HTML |

### Reusable Blocks (5 tools)

| Tool | Description |
|------|-------------|
| `wp_list_blocks` | List reusable blocks |
| `wp_get_block` | Get a single reusable block |
| `wp_create_block` | Create a reusable block |
| `wp_update_block` | Update a reusable block |
| `wp_delete_block` | Delete a reusable block |

### Components (11 tools)

| Tool | Description |
|------|-------------|
| `wp_component_hero` | Generate a hero section with Gutenberg blocks |
| `wp_component_features` | Generate a features grid section |
| `wp_component_pricing` | Generate a pricing table section |
| `wp_component_team` | Generate a team members section |
| `wp_component_faq` | Generate an FAQ section |
| `wp_component_cta` | Generate a call-to-action section |
| `wp_component_testimonials` | Generate a testimonials section |
| `wp_component_stats` | Generate a statistics section |
| `wp_component_contact` | Generate a contact section |
| `wp_create_full_page` | Create a full page from component sections |
| `wp_save_component_as_pattern` | Save a component as a reusable block pattern |

### Site Editor (19 tools)

| Tool | Description |
|------|-------------|
| `wp_list_templates` | List block templates |
| `wp_get_template` | Get a single template |
| `wp_create_template` | Create a template |
| `wp_update_template` | Update a template |
| `wp_delete_template` | Delete a template |
| `wp_list_template_parts` | List template parts (header, footer, etc.) |
| `wp_get_template_part` | Get a single template part |
| `wp_create_template_part` | Create a template part |
| `wp_update_template_part` | Update a template part |
| `wp_delete_template_part` | Delete a template part |
| `wp_list_navigations` | List navigation menus (block-based) |
| `wp_get_navigation` | Get a navigation menu |
| `wp_create_navigation` | Create a navigation menu |
| `wp_update_navigation` | Update a navigation menu |
| `wp_delete_navigation` | Delete a navigation menu |
| `wp_get_global_styles` | Get global styles (theme.json) |
| `wp_update_global_styles` | Update global styles |
| `wp_get_theme_global_styles` | Get the theme's default global styles |
| `wp_list_global_style_variations` | List global style variations |

### Revisions (6 tools)

| Tool | Description |
|------|-------------|
| `wp_list_revisions` | List revisions for a post/page |
| `wp_get_revision` | Get a single revision |
| `wp_delete_revision` | Delete a revision |
| `wp_list_template_revisions` | List revisions for a template |
| `wp_get_template_revision` | Get a template revision |
| `wp_delete_template_revision` | Delete a template revision |

### Fonts (8 tools)

| Tool | Description |
|------|-------------|
| `wp_list_font_families` | List installed font families |
| `wp_get_font_family` | Get a single font family |
| `wp_create_font_family` | Install a new font family |
| `wp_delete_font_family` | Delete a font family |
| `wp_list_font_faces` | List font faces (weights/styles) for a family |
| `wp_get_font_face` | Get a single font face |
| `wp_create_font_face` | Add a font face to a family |
| `wp_delete_font_face` | Delete a font face |

### Custom Post Types (9 tools)

| Tool | Description |
|------|-------------|
| `wp_list_post_types` | List all registered post types |
| `wp_get_post_type` | Get a single post type definition |
| `wp_list_taxonomies` | List all registered taxonomies |
| `wp_get_taxonomy` | Get a single taxonomy definition |
| `wp_list_custom_posts` | List posts of a custom post type |
| `wp_get_custom_post` | Get a single custom post |
| `wp_create_custom_post` | Create a custom post |
| `wp_update_custom_post` | Update a custom post |
| `wp_delete_custom_post` | Delete a custom post |

### Widgets (10 tools)

| Tool | Description |
|------|-------------|
| `wp_list_sidebars` | List widget areas/sidebars |
| `wp_get_sidebar` | Get a single sidebar |
| `wp_update_sidebar` | Update a sidebar |
| `wp_list_widgets` | List widgets |
| `wp_get_widget` | Get a single widget |
| `wp_create_widget` | Create a widget |
| `wp_update_widget` | Update a widget |
| `wp_delete_widget` | Delete a widget |
| `wp_list_widget_types` | List available widget types |
| `wp_get_widget_type` | Get a widget type definition |

### Widget Shortcuts (15 tools)

Shorthand tools for quickly adding common block types without full Gutenberg syntax.

| Tool | Description |
|------|-------------|
| `wp_add_heading` | Add a heading block |
| `wp_add_paragraph` | Add a paragraph block |
| `wp_add_image` | Add an image block |
| `wp_add_button` | Add a button block |
| `wp_add_list` | Add a list block |
| `wp_add_quote` | Add a blockquote |
| `wp_add_code` | Add a code block |
| `wp_add_table` | Add a table block |
| `wp_add_separator` | Add a separator block |
| `wp_add_spacer` | Add a spacer block |
| `wp_add_columns` | Add a columns block |
| `wp_add_gallery` | Add a gallery block |
| `wp_add_video` | Add a video block |
| `wp_add_embed` | Add an embed block |
| `wp_add_html` | Add a custom HTML block |

### Statuses & Directories (4 tools)

| Tool | Description |
|------|-------------|
| `wp_list_post_statuses` | List all post statuses |
| `wp_get_post_status` | Get a single post status |
| `wp_search_block_directory` | Search the block directory |
| `wp_search_pattern_directory` | Search the pattern directory |

### Admin & Plugins (9 tools)

| Tool | Description |
|------|-------------|
| `wp_list_plugins` | List installed plugins |
| `wp_get_plugin` | Get a single plugin |
| `wp_update_plugin` | Activate/deactivate a plugin |
| `wp_delete_plugin` | Delete a plugin |
| `wp_install_plugin` | Install a plugin from the directory |
| `wp_get_settings` | Get site settings |
| `wp_update_settings` | Update site settings |
| `wp_search` | Search across all content types |
| `wp_get_site_health` | Get site health status |

### Plugins — Yoast SEO & ACF (Basic) (5 tools)

| Tool | Description |
|------|-------------|
| `wp_get_yoast_seo` | Get Yoast SEO data for a post/page |
| `wp_update_yoast_seo` | Update Yoast SEO data for a post/page |
| `wp_get_acf_fields` | Get ACF custom fields for a post/page |
| `wp_update_acf_fields` | Update ACF custom fields |
| `wp_list_acf_field_groups` | List ACF field groups |

### Workflows (6 tools)

| Tool | Description |
|------|-------------|
| `wp_create_full_post` | Create a complete post with blocks, categories, tags, and SEO |
| `wp_clone_post` | Clone an existing post |
| `wp_bulk_update_posts` | Bulk update multiple posts |
| `wp_export_content` | Export content as structured data |
| `wp_site_audit` | Run a comprehensive site audit |
| `wp_setup_menu` | Set up a complete navigation menu |

### Advanced Content (5 tools)

| Tool | Description |
|------|-------------|
| `wp_schedule_post` | Schedule a post for future publishing |
| `wp_moderate_comments` | Bulk moderate comments (approve, spam, trash) |
| `wp_get_content_stats` | Get word count, reading time, headings, block analysis |
| `wp_find_content` | Advanced search across multiple content types |
| `wp_get_preview_url` | Generate a preview URL for a draft/pending post |

### Analysis — Content (4 tools)

| Tool | Description |
|------|-------------|
| `wp_analyze_readability` | Flesch Reading Ease, grade level, passive voice analysis |
| `wp_analyze_content_quality` | Quality score (0–100), structure ratings, recommendations |
| `wp_content_calendar` | Editorial calendar view of scheduled/draft/recent content |
| `wp_find_thin_content` | Find posts below word-count threshold or missing key elements |

### Analysis — Links & Images (3 tools)

| Tool | Description |
|------|-------------|
| `wp_check_broken_links` | Scan posts/pages for broken links and redirects |
| `wp_analyze_images` | Audit images for alt text, format, lazy loading, SEO (0–100 score) |
| `wp_check_structured_data` | Detect and validate JSON-LD Schema.org markup |

### Analysis — SEO (3 tools)

| Tool | Description |
|------|-------------|
| `wp_analyze_seo` | Comprehensive SEO audit: title, meta, headings, links, word count |
| `wp_get_rankmath_score` | Get RankMath SEO score (requires RankMath plugin) |
| `wp_get_seo_overview` | Site-wide SEO snapshot across recent posts/pages |

### Page Builder Integration (3 tools)

| Tool | Description |
|------|-------------|
| `wp_build_page` | Create a complete page from a declarative block structure |
| `wp_convert_html_to_blocks` | Convert raw HTML to Gutenberg block markup |
| `wp_get_page_structure` | Analyze a page's Gutenberg block hierarchy |

### Builder Tools — Elementor / Divi / Beaver (9 tools)

Requires the CMS MCP Hub companion plugin.

| Tool | Description |
|------|-------------|
| `wp_get_plugin_status` | Check companion plugin status and active builders |
| `wp_detect_active_builders` | Detect all active page builders (Elementor, Divi, Bricks, etc.) |
| `wp_get_builder_content` | Extract native builder JSON from a page |
| `wp_set_builder_content` | Inject builder-native JSON content into a page |
| `wp_find_elements` | Find elements by type, class, text, or ID |
| `wp_update_element` | Update an element's settings/styles |
| `wp_move_element` | Move an element to a different position |
| `wp_duplicate_element` | Clone an element in a page |
| `wp_remove_element` | Remove an element and its children |

### Builder Shortcuts — Universal (12 tools)

Builder-aware shortcuts that translate to the active builder's native format (Elementor, Divi, Bricks, etc.). Requires the companion plugin.

| Tool | Description |
|------|-------------|
| `wp_builder_add_heading` | Add a heading widget via the active builder |
| `wp_builder_add_text` | Add a text/paragraph widget |
| `wp_builder_add_image` | Add an image widget |
| `wp_builder_add_button` | Add a button widget |
| `wp_builder_add_video` | Add a video embed widget |
| `wp_builder_add_section` | Add a section/container |
| `wp_builder_add_divider` | Add a divider/separator |
| `wp_builder_add_spacer` | Add vertical space |
| `wp_builder_add_icon` | Add an icon widget |
| `wp_builder_add_form` | Add a contact form widget |
| `wp_builder_add_slider` | Add an image slider |
| `wp_builder_add_gallery` | Add an image gallery |

### Bricks Page Builder (17 tools)

Deep Bricks Builder integration. Requires Bricks theme and the companion plugin.

| Tool | Description |
|------|-------------|
| `wp_bricks_list_global_classes` | List all Bricks global CSS classes |
| `wp_bricks_create_global_class` | Create a new global CSS class |
| `wp_bricks_update_global_class` | Update a global CSS class |
| `wp_bricks_delete_global_class` | Delete a global CSS class |
| `wp_bricks_get_theme_styles` | Get Bricks theme styles (colors, typography, spacing) |
| `wp_bricks_update_theme_styles` | Update Bricks theme styles |
| `wp_bricks_get_color_palette` | Get the Bricks color palette |
| `wp_bricks_update_color_palette` | Update the Bricks color palette |
| `wp_bricks_get_typography` | Get Bricks typography settings |
| `wp_bricks_update_typography` | Update Bricks typography settings |
| `wp_bricks_list_components` | List saved Bricks components/templates |
| `wp_bricks_get_component` | Get a Bricks component by ID |
| `wp_bricks_apply_component` | Apply a component to a page element |
| `wp_bricks_search_elements` | Search elements in a page by type or attribute |
| `wp_bricks_health_check` | Check Bricks installation health |
| `wp_bricks_style_profile` | Get a page's style usage profile |
| `wp_bricks_design_system` | Export the full Bricks design system |

### Bulk Operations (6 tools)

| Tool | Description |
|------|-------------|
| `wp_bulk_find_replace` | Find/replace text across multiple posts (dry_run=true by default) |
| `wp_bulk_update_meta` | Batch update post meta across multiple posts |
| `wp_bulk_manage_media` | Batch update media metadata; fix missing alt text |
| `wp_bulk_change_status` | Change status of multiple posts at once |
| `wp_bulk_assign_terms` | Batch assign categories/tags to multiple posts |
| `wp_bulk_delete` | Delete multiple posts/pages at once |

### Snapshots & Backup (6 tools)

| Tool | Description |
|------|-------------|
| `wp_list_snapshots` | List all content snapshots |
| `wp_get_snapshot` | Get a specific snapshot |
| `wp_diff_content` | Compare two snapshots or a snapshot vs. live content |
| `wp_restore_snapshot` | Restore content from a snapshot |
| `wp_create_backup` | Create a full site backup snapshot |
| `wp_safe_update` | Update content with automatic rollback on error |

### Plugin Snapshots (4 tools)

| Tool | Description |
|------|-------------|
| `wp_plugin_create_snapshot` | Snapshot the current plugin list and versions |
| `wp_plugin_list_snapshots` | List all plugin snapshots |
| `wp_plugin_restore_snapshot` | Restore plugins to a previous snapshot state |
| `wp_plugin_diff_snapshots` | Compare two plugin snapshots |

### Plugin Analysis (3 tools)

| Tool | Description |
|------|-------------|
| `wp_deep_seo_audit` | Deep multi-plugin SEO audit (Yoast + RankMath + raw meta) |
| `wp_scan_accessibility` | Scan content for WCAG accessibility issues |
| `wp_analyze_performance` | Analyze page performance metrics and bottlenecks |

### Multi-Site Manager (3 tools)

| Tool | Description |
|------|-------------|
| `wp_list_sites` | List configured WordPress sites |
| `wp_switch_site` | Switch the active site for subsequent requests |
| `wp_get_active_site` | Get the currently active site configuration |

### Stock Images (4 tools)

| Tool | Description |
|------|-------------|
| `wp_search_stock_images` | Search Openverse for free stock images |
| `wp_sideload_image` | Sideload an image URL into the WP media library |
| `wp_search_and_sideload` | Search + automatically sideload the best match |
| `wp_get_stock_image_details` | Get full details of a stock image by ID |

### ACF Deep Integration (10 tools)

Requires Advanced Custom Fields (ACF) plugin.

| Tool | Description |
|------|-------------|
| `wp_acf_list_field_groups` | List all ACF field groups with fields, location rules, and status |
| `wp_acf_get_field_group` | Get a specific ACF field group definition |
| `wp_acf_get_post_fields` | Get all ACF field values for a post/page |
| `wp_acf_update_post_fields` | Update ACF field values on a post/page |
| `wp_acf_list_options` | List all ACF options page fields (ACF Pro) |
| `wp_acf_update_options` | Update ACF options page fields (ACF Pro) |
| `wp_acf_get_repeater` | Get ACF repeater field rows with sub-field values |
| `wp_acf_get_flexible_content` | Get ACF flexible content layout blocks |
| `wp_acf_clone_field_values` | Copy ACF fields from one post to another |
| `wp_acf_search_by_field` | Search posts by ACF field value using meta queries |

### WP-CLI Bridge (6 tools)

Requires WP-CLI installed on the server and the companion plugin.

| Tool | Description |
|------|-------------|
| `wp_cli_run` | Execute a WP-CLI command on the server |
| `wp_cli_export` | Export content via WP-CLI (wp export → WXR) |
| `wp_cli_import` | Import WXR content via WP-CLI |
| `wp_cli_search_replace` | Database search-replace via WP-CLI (dry_run=true by default) |
| `wp_cli_maintenance_mode` | Toggle WordPress maintenance mode |
| `wp_cli_cache_flush` | Flush WordPress object cache |

### Staging & Migration (6 tools)

Requires 2+ sites configured (use `CMSMCP_CONFIG_B64` or `CMSMCP_CONFIG_FILE`).

| Tool | Description |
|------|-------------|
| `wp_staging_push_content` | Push a post/page from active site to another site |
| `wp_staging_pull_content` | Pull a post/page from another site to active site |
| `wp_staging_compare_content` | Compare a post between two configured sites |
| `wp_staging_sync_taxonomies` | Sync categories/tags between two sites |
| `wp_staging_sync_media` | Copy media attachments between sites |
| `wp_staging_list_differences` | List all posts/pages that differ between two sites |

### Activity Log (5 tools)

Requires the companion plugin with activity logging enabled.

| Tool | Description |
|------|-------------|
| `wp_activity_list` | List recent activity log entries with filters |
| `wp_activity_get` | Get detailed info about a specific activity entry |
| `wp_activity_undo` | Undo an activity by restoring the previous state |
| `wp_activity_stats` | Activity statistics by user, resource, and time period |
| `wp_activity_export` | Export activity log as JSON for a date range |

### Settings & Options (7 tools)

| Tool | Description |
|------|-------------|
| `wp_get_settings` | Get WordPress site settings (general, writing, reading, etc.) |
| `wp_update_settings` | Update WordPress settings via REST API |
| `wp_get_option` | Get a specific wp_options entry by name |
| `wp_update_option` | Update a specific wp_options entry |
| `wp_list_transients` | List WordPress transients (cached data in wp_options) |
| `wp_delete_transient` | Delete a transient or clear all expired transients |
| `wp_get_site_health` | Get Site Health status and recommendations |

### Comment Moderation (4 tools)

| Tool | Description |
|------|-------------|
| `wp_comment_bulk_moderate` | Bulk approve/spam/trash comments by IDs or filters |
| `wp_comment_get_stats` | Comment statistics: total, approved, pending, spam |
| `wp_comment_find_spam_patterns` | Analyze comments for spam patterns and suspicious content |
| `wp_comment_auto_moderate` | Apply moderation rules to pending comments (dry_run=true by default) |

### WP-Cron (5 tools)

Requires the companion plugin.

| Tool | Description |
|------|-------------|
| `wp_cron_list_events` | List all scheduled WP-Cron events with next run time |
| `wp_cron_get_schedules` | List all cron schedules (hourly, daily, custom, etc.) |
| `wp_cron_run_event` | Manually trigger a scheduled cron event |
| `wp_cron_delete_event` | Remove a scheduled cron event |
| `wp_cron_check_status` | Check if WP-Cron is working and report overdue events |

### Database Tools (5 tools)

Requires the companion plugin.

| Tool | Description |
|------|-------------|
| `wp_db_get_sizes` | Get table sizes, row counts, and total DB size |
| `wp_db_optimize_tables` | Run OPTIMIZE TABLE on WordPress database tables |
| `wp_db_cleanup_revisions` | Delete excess revisions, keeping N most recent per post |
| `wp_db_cleanup_transients` | Delete all expired transients from the database |
| `wp_db_get_info` | Get DB server info (MySQL version, charset, collation) |

### Email Tools (4 tools)

| Tool | Description |
|------|-------------|
| `wp_email_test` | Send a test email to verify delivery is working |
| `wp_email_get_log` | Get recent email log entries (requires SMTP plugin with logging) |
| `wp_email_get_config` | Get current email/SMTP configuration |
| `wp_email_check_deliverability` | Check DNS records (MX, SPF, DKIM, DMARC) for deliverability |

### Security (3 tools)

| Tool | Description |
|------|-------------|
| `wp_security_audit` | Comprehensive security audit: versions, users, SSL, REST API exposure |
| `wp_check_file_permissions` | Check for dangerous file permission issues |
| `wp_validate_content_security` | Scan post content for XSS vectors and unsafe code |

### Themes & Customizer (8 tools)

| Tool | Description |
|------|-------------|
| `wp_list_themes` | List all installed themes with status and version |
| `wp_get_theme` | Get detailed theme info by stylesheet slug |
| `wp_activate_theme` | Switch to a different installed theme |
| `wp_get_theme_mods` | Get all Customizer settings for the active theme |
| `wp_update_theme_mod` | Update a single Customizer setting |
| `wp_export_customizer` | Export all Customizer settings as JSON |
| `wp_import_customizer` | Import Customizer settings from JSON |
| `wp_get_theme_support` | Get the list of features supported by the active theme |

### Multisite Network (8 tools)

Requires WordPress Multisite installation.

| Tool | Description |
|------|-------------|
| `wp_multisite_list_sites` | List all sites in the multisite network |
| `wp_multisite_get_site` | Get details about a specific network site |
| `wp_multisite_create_site` | Create a new site in the network |
| `wp_multisite_update_site` | Update a network site (title, status, visibility) |
| `wp_multisite_delete_site` | Delete or archive a network site (confirm=true required) |
| `wp_multisite_list_network_plugins` | List network-activated plugins |
| `wp_multisite_list_network_themes` | List network-enabled themes |
| `wp_multisite_get_network_settings` | Get network-wide settings and limits |

### Advanced Media (6 tools)

| Tool | Description |
|------|-------------|
| `wp_media_optimize_audit` | Audit media library: missing alt text, oversized images, unused files |
| `wp_media_regenerate_thumbnails` | Regenerate thumbnails for one or more media items |
| `wp_media_bulk_alt_text` | Set alt text on multiple media items at once |
| `wp_media_find_unused` | Find media not attached to any post or page |
| `wp_media_get_sizes` | Get all registered image sizes on the site |
| `wp_media_replace` | Replace a media file while keeping the same attachment ID |

## Examples

```
You: "List all my published posts"
AI: Uses wp_list_posts with status filter set to "publish".

You: "Create a landing page with hero, features, and pricing sections"
AI: Uses wp_component_hero, wp_component_features, and wp_component_pricing,
    then wp_create_full_page to assemble the page.

You: "Run a security audit on my site"
AI: Uses wp_security_audit for a full read-only security check.

You: "Find all posts with broken links"
AI: Uses wp_list_posts to get post IDs, then wp_check_broken_links on each.

You: "Push my staging post to production"
AI: Uses wp_staging_push_content to copy the post between configured sites.

You: "Show me this month's editorial calendar"
AI: Uses wp_content_calendar to display scheduled, recent, and draft content.

You: "Clean up the database — remove old revisions and expired transients"
AI: Uses wp_db_cleanup_revisions and wp_db_cleanup_transients.

You: "Scan ACF field group 'Team Members' and copy values to a new post"
AI: Uses wp_acf_get_field_group, wp_acf_get_post_fields, then wp_acf_clone_field_values.
```

## Development

```bash
# Build
npx turbo build --filter=@cmsmcp/wordpress

# Test
npx turbo test --filter=@cmsmcp/wordpress

# Dev mode
npx turbo dev --filter=@cmsmcp/wordpress

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node packages/wordpress-mcp/dist/index.js
```

## License

MIT
