# @cmsmcp/payload

MCP server for Payload CMS -- 21 tools for managing collections, entries, globals, media, access control, versions, and bulk operations.

> Part of [CMS MCP Hub](https://github.com/rahhuul/cms-mcp-hub) -- 757 tools across 12 CMS platforms. If this is useful, [give it a star](https://github.com/rahhuul/cms-mcp-hub/stargazers)!

[![npm version](https://img.shields.io/npm/v/@cmsmcp/payload.svg)](https://www.npmjs.com/package/@cmsmcp/payload)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](../../LICENSE)

## Quick Start

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "payload": {
      "command": "npx",
      "args": ["-y", "@cmsmcp/payload"],
      "env": {
        "PAYLOAD_URL": "http://localhost:3000",
        "PAYLOAD_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add payload -e PAYLOAD_URL=http://localhost:3000 -e PAYLOAD_API_KEY=your-key -- npx -y @cmsmcp/payload
```

### Cursor / Windsurf / Any MCP Client

Same JSON config format -- add to your client's MCP settings file.

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `PAYLOAD_URL` | Yes | Payload CMS server URL |
| `PAYLOAD_API_KEY` | Yes | Payload API key |

## Available Tools (21 tools)

### Content (9 tools)

| Tool | Description |
|------|-------------|
| `payload_list_collections` | List all collections with their schemas |
| `payload_list_entries` | List entries in a collection with pagination |
| `payload_get_entry` | Get a single entry by ID |
| `payload_create_entry` | Create a new entry in a collection |
| `payload_update_entry` | Update an existing entry |
| `payload_delete_entry` | Delete an entry |
| `payload_get_version` | Get a specific version of an entry |
| `payload_publish_entry` | Publish a draft entry |
| `payload_unpublish_entry` | Unpublish a published entry |

### Globals (3 tools)

| Tool | Description |
|------|-------------|
| `payload_list_globals` | List all global documents |
| `payload_get_global` | Get a global document by slug |
| `payload_update_global` | Update a global document |

### Media (2 tools)

| Tool | Description |
|------|-------------|
| `payload_list_media` | List uploaded media files |
| `payload_upload_media` | Upload a media file |

### Access & System (4 tools)

| Tool | Description |
|------|-------------|
| `payload_get_access` | Get current access control permissions |
| `payload_list_versions` | List versions for a collection entry |
| `payload_restore_version` | Restore a previous version |
| `payload_get_current_user` | Get the currently authenticated user |

### Bulk Operations (3 tools)

| Tool | Description |
|------|-------------|
| `payload_bulk_create` | Bulk create multiple entries at once |
| `payload_bulk_update` | Bulk update multiple entries |
| `payload_bulk_delete` | Bulk delete multiple entries |

## Examples

```
You: "List all collections in my Payload CMS"
AI: Uses payload_list_collections to show all registered collections and their field schemas.

You: "Create a new blog post"
AI: Uses payload_create_entry with the blog collection slug and the post data.

You: "Restore the previous version of this page"
AI: Uses payload_list_versions to find available versions,
    then payload_restore_version to roll back to the selected version.
```

## Development

```bash
# Build
npx turbo build --filter=@cmsmcp/payload

# Test
npx turbo test --filter=@cmsmcp/payload

# Dev mode
npx turbo dev --filter=@cmsmcp/payload

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node packages/payload-mcp/dist/index.js
```

## License

MIT
