# @cmsmcp/wordpress

MCP server for **WordPress** with **full REST API v2 coverage** — 143 tools, 10 resources, 6 prompts. No WordPress plugin required.

Part of [CMS MCP Hub](https://github.com/rahhuul/cms-mcp-hub).

## Quick Start

### Claude Desktop

```json
{
  "mcpServers": {
    "wordpress": {
      "command": "npx",
      "args": ["-y", "@cmsmcp/wordpress"],
      "env": {
        "WORDPRESS_URL": "https://yoursite.com",
        "WORDPRESS_USERNAME": "admin",
        "WORDPRESS_APP_PASSWORD": "xxxx xxxx xxxx xxxx"
      }
    }
  }
}
```

Works with: **Claude Desktop, Claude Code, Cursor, Windsurf, Cline, Zed, GitHub Copilot** — any MCP client.

## Setup

1. Go to **WP Admin → Users → Profile → Application Passwords**
2. Create a new password named "MCP"
3. Copy the generated password

> For HTTP (localhost) sites, add `define('WP_ENVIRONMENT_TYPE', 'local');` to `wp-config.php`

## Tools (143)

| Category | Tools | Examples |
|----------|-------|---------|
| **Posts** | 5 | Create, edit, delete, list, get |
| **Pages** | 5 | Full CRUD with parent/template support |
| **Media** | 5 | Upload files from URL/path, manage library |
| **Comments** | 5 | Moderate, reply, approve/spam/trash |
| **Categories** | 5 | Full CRUD with nesting |
| **Tags** | 5 | Full CRUD |
| **Users** | 9 | CRUD + roles + application passwords |
| **Custom Post Types** | 9 | Discover types + dynamic CRUD |
| **Menus** | 12 | Menus + items + locations |
| **Plugins** | 5 | Install, activate, deactivate, delete |
| **Themes** | 2 | List, get details |
| **Settings** | 2 | Read/update site settings |
| **Blocks** | 10 | Block types, patterns, reusable blocks, renderer |
| **Widgets** | 10 | Widget types, widgets, sidebars |
| **Site Editor** | 19 | Templates, template parts, navigation, global styles |
| **Revisions** | 6 | Post/page/block/template revisions |
| **Fonts** | 8 | Font families and faces |
| **SEO (Yoast)** | 2 | Read/update SEO title, description, keywords |
| **ACF** | 3 | Read/update custom fields |
| **Workflows** | 6 | Full post creator, clone, bulk update, export, site audit, menu setup |
| **Directories** | 2 | Block/pattern directory search |
| **Statuses** | 2 | Post status management |
| **Search** | 1 | Global search |
| **Site Health** | 1 | Health diagnostics |
| **Webhooks** | 4 | Local webhook listener + event management |

Plus **10 MCP Resources** (browseable data) and **6 MCP Prompts** (guided templates).

## License

MIT
