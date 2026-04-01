# @cmsmcp/payload

MCP (Model Context Protocol) server for **Payload CMS** — enables AI agents to manage collections, entries, globals, media, and versions through 14 tools.

## Tools (14)

| Tool | Description |
|------|-------------|
| `payload_list_collections` | Discover all available collections and their field schemas |
| `payload_list_entries` | List entries with filtering, sorting, pagination, and depth |
| `payload_get_entry` | Get a single entry by ID with relationship population |
| `payload_create_entry` | Create a new entry in any collection |
| `payload_update_entry` | Update an existing entry's fields |
| `payload_delete_entry` | Delete a single entry by ID |
| `payload_list_globals` | Discover all available globals and their schemas |
| `payload_get_global` | Get a global document by slug |
| `payload_update_global` | Update a global document's fields |
| `payload_list_media` | List uploaded media files with pagination |
| `payload_upload_media` | Upload a media file from a URL |
| `payload_get_access` | Get current user's access permissions |
| `payload_list_versions` | List version history for an entry |
| `payload_restore_version` | Restore a specific version |

## Configuration

Set environment variables:

```bash
# Required
PAYLOAD_URL=http://localhost:3000

# Auth Option 1: API Key
PAYLOAD_API_KEY=your-api-key

# Auth Option 2: Email/Password (gets JWT)
PAYLOAD_EMAIL=admin@example.com
PAYLOAD_PASSWORD=your-password
```

## Usage with Claude Desktop

```json
{
  "mcpServers": {
    "payload": {
      "command": "npx",
      "args": ["@cmsmcp/payload"],
      "env": {
        "PAYLOAD_URL": "http://localhost:3000",
        "PAYLOAD_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Usage with MCP Inspector

```bash
npx @modelcontextprotocol/inspector node packages/payload-mcp/dist/index.js
```

## Key Features

- **Dynamic collection discovery** — Automatically detects all collections and their schemas
- **Flexible authentication** — Supports API Key or email/password (JWT) auth
- **Relationship depth** — Control how deep relationships are populated (0-10)
- **Where queries** — Full Payload query syntax for filtering entries
- **Version management** — List and restore entry versions
- **Globals support** — Read and update global documents (settings, navigation, etc.)

## Development

```bash
npm install
npx turbo build --filter=@cmsmcp/payload
npx turbo test --filter=@cmsmcp/payload
```

## License

MIT
