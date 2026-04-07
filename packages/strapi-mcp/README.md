# @cmsmcp/strapi

MCP server for Strapi -- 17 tools for managing content types, entries, media, users, roles, localization, and publish workflows.

> Part of [CMS MCP Hub](https://github.com/rahhuul/cms-mcp-hub) -- 589 tools across 12 CMS platforms. If this is useful, [give it a star](https://github.com/rahhuul/cms-mcp-hub/stargazers)!

[![npm version](https://img.shields.io/npm/v/@cmsmcp/strapi.svg)](https://www.npmjs.com/package/@cmsmcp/strapi)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](../../LICENSE)

## Quick Start

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "strapi": {
      "command": "npx",
      "args": ["-y", "@cmsmcp/strapi"],
      "env": {
        "STRAPI_URL": "http://localhost:1337",
        "STRAPI_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add strapi -e STRAPI_URL=http://localhost:1337 -e STRAPI_API_TOKEN=your-token -- npx -y @cmsmcp/strapi
```

### Cursor / Windsurf / Any MCP Client

Same JSON config format -- add to your client's MCP settings file.

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `STRAPI_URL` | Yes | Strapi server URL (e.g., `http://localhost:1337`) |
| `STRAPI_API_TOKEN` | Yes | Strapi API token (full access recommended) |

## Available Tools (17 tools)

### Content (9 tools)

| Tool | Description |
|------|-------------|
| `strapi_list_content_types` | List all content types with their schemas |
| `strapi_list_entries` | List entries for a content type with pagination |
| `strapi_get_entry` | Get a single entry by ID |
| `strapi_create_entry` | Create a new entry in a content type |
| `strapi_update_entry` | Update an existing entry |
| `strapi_delete_entry` | Delete an entry |
| `strapi_bulk_delete` | Bulk delete multiple entries |
| `strapi_publish_entry` | Publish a draft entry |
| `strapi_unpublish_entry` | Unpublish a published entry |

### System & Media (8 tools)

| Tool | Description |
|------|-------------|
| `strapi_list_components` | List all reusable components |
| `strapi_list_media` | List uploaded media files |
| `strapi_upload_media` | Upload a media file |
| `strapi_delete_media` | Delete a media file |
| `strapi_list_users` | List admin users |
| `strapi_list_roles` | List user roles |
| `strapi_get_locales` | Get available locales for i18n |
| `strapi_create_localized_entry` | Create a localized version of an entry |

## Examples

```
You: "List all my content types"
AI: Uses strapi_list_content_types to show all registered content types and their field schemas.

You: "Create a new blog post"
AI: Uses strapi_list_content_types to find the blog content type,
    then strapi_create_entry to create the post with the provided data.

You: "Publish my draft article"
AI: Uses strapi_publish_entry to change the entry status from draft to published.
```

## Development

```bash
# Build
npx turbo build --filter=@cmsmcp/strapi

# Test
npx turbo test --filter=@cmsmcp/strapi

# Dev mode
npx turbo dev --filter=@cmsmcp/strapi

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node packages/strapi-mcp/dist/index.js
```

## License

MIT
