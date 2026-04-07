# @cmsmcp/ghost

MCP server for Ghost -- 24 tools for managing posts, pages, tags, members, newsletters, tiers, webhooks, and site settings.

> Part of [CMS MCP Hub](https://github.com/rahhuul/cms-mcp-hub) -- 589 tools across 12 CMS platforms. If this is useful, [give it a star](https://github.com/rahhuul/cms-mcp-hub/stargazers)!

[![npm version](https://img.shields.io/npm/v/@cmsmcp/ghost.svg)](https://www.npmjs.com/package/@cmsmcp/ghost)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](../../LICENSE)

## Quick Start

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "ghost": {
      "command": "npx",
      "args": ["-y", "@cmsmcp/ghost"],
      "env": {
        "GHOST_URL": "https://myblog.com",
        "GHOST_ADMIN_API_KEY": "your-admin-api-key",
        "GHOST_CONTENT_API_KEY": "your-content-api-key"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add ghost -e GHOST_URL=https://myblog.com -e GHOST_ADMIN_API_KEY=key:secret -e GHOST_CONTENT_API_KEY=content_key -- npx -y @cmsmcp/ghost
```

### Cursor / Windsurf / Any MCP Client

Same JSON config format -- add to your client's MCP settings file.

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `GHOST_URL` | Yes | Your Ghost site URL |
| `GHOST_ADMIN_API_KEY` | Yes | Ghost Admin API key (`id:secret` format) |
| `GHOST_CONTENT_API_KEY` | No | Ghost Content API key (for read-only access) |

## Available Tools (24 tools)

### Posts (5 tools)

| Tool | Description |
|------|-------------|
| `ghost_list_posts` | List posts with filtering and pagination |
| `ghost_get_post` | Get a single post by ID or slug |
| `ghost_create_post` | Create a new post |
| `ghost_update_post` | Update an existing post |
| `ghost_delete_post` | Delete a post |

### Pages (3 tools)

| Tool | Description |
|------|-------------|
| `ghost_list_pages` | List all pages |
| `ghost_create_page` | Create a new page |
| `ghost_update_page` | Update an existing page |

### Tags (2 tools)

| Tool | Description |
|------|-------------|
| `ghost_list_tags` | List all tags |
| `ghost_create_tag` | Create a new tag |

### Members (4 tools)

| Tool | Description |
|------|-------------|
| `ghost_list_members` | List members with filtering |
| `ghost_get_member` | Get a single member by ID |
| `ghost_create_member` | Create a new member |
| `ghost_update_member` | Update a member's details |

### Webhooks (4 tools)

| Tool | Description |
|------|-------------|
| `ghost_list_webhooks` | List all webhooks |
| `ghost_create_webhook` | Create a new webhook |
| `ghost_update_webhook` | Update a webhook |
| `ghost_delete_webhook` | Delete a webhook |

### System & Publishing (6 tools)

| Tool | Description |
|------|-------------|
| `ghost_list_authors` | List all authors/staff |
| `ghost_list_tiers` | List membership tiers |
| `ghost_list_newsletters` | List all newsletters |
| `ghost_list_offers` | List membership offers |
| `ghost_upload_image` | Upload an image |
| `ghost_get_site` | Get site configuration and metadata |

## Examples

```
You: "List all published posts"
AI: Uses ghost_list_posts to retrieve posts with their titles, slugs, and publish dates.

You: "Create a new blog post about TypeScript"
AI: Uses ghost_create_post to create a new post with the provided title, content, and tags.

You: "Show me my site's membership tiers"
AI: Uses ghost_list_tiers to display all configured membership tiers and pricing.
```

## Development

```bash
# Build
npx turbo build --filter=@cmsmcp/ghost

# Test
npx turbo test --filter=@cmsmcp/ghost

# Dev mode
npx turbo dev --filter=@cmsmcp/ghost

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node packages/ghost-mcp/dist/index.js
```

## License

MIT
