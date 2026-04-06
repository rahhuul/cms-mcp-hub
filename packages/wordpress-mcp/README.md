# @cmsmcp/wordpress

MCP server for WordPress -- 165 tools for full REST API v2 coverage including posts, pages, media, menus, block editor, site editor, templates, fonts, users, widgets, plugins, taxonomy, and more. No WordPress plugin required.

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

Same JSON config format -- add to your client's MCP settings file.

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `WORDPRESS_URL` | Yes | Your WordPress site URL |
| `WORDPRESS_USERNAME` | Yes | WordPress username |
| `WORDPRESS_APP_PASSWORD` | Yes | WordPress application password (generate in WP Admin > Users > Application Passwords) |

## Available Tools (165 tools)

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
| `wp_list_media` | List media files |
| `wp_get_media` | Get a single media item |
| `wp_update_media` | Update media metadata |
| `wp_delete_media` | Delete a media item |

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

### Admin & Plugins (11 tools)

| Tool | Description |
|------|-------------|
| `wp_list_plugins` | List installed plugins |
| `wp_get_plugin` | Get a single plugin |
| `wp_update_plugin` | Activate/deactivate a plugin |
| `wp_delete_plugin` | Delete a plugin |
| `wp_install_plugin` | Install a plugin from the directory |
| `wp_list_themes` | List installed themes |
| `wp_get_theme` | Get a single theme |
| `wp_get_settings` | Get site settings |
| `wp_update_settings` | Update site settings |
| `wp_search` | Search across all content types |
| `wp_get_site_health` | Get site health status |

### Plugins - Yoast SEO (5 tools)

| Tool | Description |
|------|-------------|
| `wp_get_yoast_seo` | Get Yoast SEO data for a post/page |
| `wp_update_yoast_seo` | Update Yoast SEO data for a post/page |
| `wp_get_acf_fields` | Get ACF custom fields for a post/page |
| `wp_update_acf_fields` | Update ACF custom fields |
| `wp_list_acf_field_groups` | List ACF field groups |

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

### Statuses & Directories (4 tools)

| Tool | Description |
|------|-------------|
| `wp_list_post_statuses` | List all post statuses |
| `wp_get_post_status` | Get a single post status |
| `wp_search_block_directory` | Search the block directory |
| `wp_search_pattern_directory` | Search the pattern directory |

### Workflows (6 tools)

| Tool | Description |
|------|-------------|
| `wp_create_full_post` | Create a complete post with blocks, categories, tags, and SEO |
| `wp_clone_post` | Clone an existing post |
| `wp_bulk_update_posts` | Bulk update multiple posts |
| `wp_export_content` | Export content as structured data |
| `wp_site_audit` | Run a comprehensive site audit |
| `wp_setup_menu` | Set up a complete navigation menu |

## Examples

```
You: "List all my published posts"
AI: Uses wp_list_posts with status filter set to "publish".

You: "Create a landing page with hero, features, and pricing sections"
AI: Uses wp_component_hero, wp_component_features, and wp_component_pricing
    to generate block content, then wp_create_full_page to assemble the page.

You: "Install and activate the WooCommerce plugin"
AI: Uses wp_install_plugin to install WooCommerce from the directory,
    then wp_update_plugin to activate it.

You: "Set up my main navigation menu"
AI: Uses wp_setup_menu to create a complete navigation with menu items.

You: "Run a site audit"
AI: Uses wp_site_audit to check site health, plugins, themes, and configuration.
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
