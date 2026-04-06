# @cmsmcp/contentful

MCP server for Contentful -- 20 tools for managing content types, entries, assets, environments, locales, tags, and bulk operations via the Content Management API.

[![npm version](https://img.shields.io/npm/v/@cmsmcp/contentful.svg)](https://www.npmjs.com/package/@cmsmcp/contentful)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](../../LICENSE)

## Quick Start

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "contentful": {
      "command": "npx",
      "args": ["-y", "@cmsmcp/contentful"],
      "env": {
        "CONTENTFUL_SPACE_ID": "your-space-id",
        "CONTENTFUL_MANAGEMENT_TOKEN": "your-management-token",
        "CONTENTFUL_ENVIRONMENT": "master"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add contentful -e CONTENTFUL_SPACE_ID=xxx -e CONTENTFUL_MANAGEMENT_TOKEN=xxx -e CONTENTFUL_ENVIRONMENT=master -- npx -y @cmsmcp/contentful
```

### Cursor / Windsurf / Any MCP Client

Same JSON config format -- add to your client's MCP settings file.

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `CONTENTFUL_SPACE_ID` | Yes | Contentful space ID |
| `CONTENTFUL_MANAGEMENT_TOKEN` | Yes | Content Management API (CMA) token |
| `CONTENTFUL_ENVIRONMENT` | No | Environment name (default: `master`) |

## Available Tools (20 tools)

### Content Types (6 tools)

| Tool | Description |
|------|-------------|
| `contentful_list_content_types` | List all content types in the space |
| `contentful_get_content_type` | Get a content type with its field definitions |
| `contentful_create_content_type` | Create a new content type |
| `contentful_update_content_type` | Update an existing content type |
| `contentful_delete_content_type` | Delete a content type |
| `contentful_publish_content_type` | Publish a content type (required before creating entries) |

### Entries (7 tools)

| Tool | Description |
|------|-------------|
| `contentful_list_entries` | List entries with filtering and pagination |
| `contentful_get_entry` | Get a single entry by ID |
| `contentful_create_entry` | Create a new entry |
| `contentful_update_entry` | Update an existing entry |
| `contentful_delete_entry` | Delete an entry |
| `contentful_publish_entry` | Publish an entry |
| `contentful_unpublish_entry` | Unpublish an entry |

### Assets & Media (3 tools)

| Tool | Description |
|------|-------------|
| `contentful_list_assets` | List all assets in the space |
| `contentful_upload_asset` | Upload a new asset (image, file, etc.) |
| `contentful_bulk_publish` | Bulk publish multiple entries or assets |

### Space & Environment (4 tools)

| Tool | Description |
|------|-------------|
| `contentful_list_spaces` | List accessible spaces |
| `contentful_list_environments` | List environments in the space |
| `contentful_list_locales` | List configured locales |
| `contentful_list_tags` | List content tags |

## Examples

```
You: "List all content types"
AI: Uses contentful_list_content_types to show all content types with their field definitions.

You: "Create a new blog post entry"
AI: Uses contentful_get_content_type to check the blogPost schema,
    then contentful_create_entry to create the entry with the required fields.

You: "Publish all draft entries"
AI: Uses contentful_list_entries to find unpublished entries,
    then contentful_bulk_publish to publish them all at once.
```

## Development

```bash
# Build
npx turbo build --filter=@cmsmcp/contentful

# Test
npx turbo test --filter=@cmsmcp/contentful

# Dev mode
npx turbo dev --filter=@cmsmcp/contentful

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node packages/contentful-mcp/dist/index.js
```

## License

MIT
