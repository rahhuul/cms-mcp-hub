# @cmsmcp/wix

MCP server for Wix -- 21 tools for data collections, e-commerce, contacts, blog, bookings, and site management via the Wix REST API.

[![npm version](https://img.shields.io/npm/v/@cmsmcp/wix.svg)](https://www.npmjs.com/package/@cmsmcp/wix)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](../../LICENSE)

## Quick Start

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "wix": {
      "command": "npx",
      "args": ["-y", "@cmsmcp/wix"],
      "env": {
        "WIX_API_KEY": "your-api-key",
        "WIX_SITE_ID": "your-site-id"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add wix -e WIX_API_KEY=your-key -e WIX_SITE_ID=your-site-id -- npx -y @cmsmcp/wix
```

### Cursor / Windsurf / Any MCP Client

Same JSON config format -- add to your client's MCP settings file.

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `WIX_API_KEY` | Yes | Wix API key |
| `WIX_SITE_ID` | Yes | Wix site ID |

## Available Tools (21 tools)

### Data Collections (8 tools)

| Tool | Description |
|------|-------------|
| `wix_list_data_collections` | List all data collections |
| `wix_get_data_collection` | Get a data collection schema |
| `wix_query_data_items` | Query data items with filters |
| `wix_get_data_item` | Get a single data item by ID |
| `wix_insert_data_item` | Insert a new data item |
| `wix_update_data_item` | Update an existing data item |
| `wix_remove_data_item` | Remove a data item |
| `wix_bulk_insert_data_items` | Bulk insert multiple data items |

### Contacts (5 tools)

| Tool | Description |
|------|-------------|
| `wix_list_contacts` | List all contacts |
| `wix_get_contact` | Get a single contact |
| `wix_create_contact` | Create a new contact |
| `wix_update_contact` | Update a contact |
| `wix_delete_contact` | Delete a contact |

### E-Commerce (4 tools)

| Tool | Description |
|------|-------------|
| `wix_list_products` | List store products |
| `wix_get_product` | Get a single product |
| `wix_list_orders` | List store orders |
| `wix_get_order` | Get a single order |

### Blog (2 tools)

| Tool | Description |
|------|-------------|
| `wix_list_blog_posts` | List blog posts |
| `wix_create_blog_post` | Create a new blog post |

### Bookings & Site (2 tools)

| Tool | Description |
|------|-------------|
| `wix_list_booking_services` | List booking services |
| `wix_get_site_properties` | Get site properties and settings |

## Examples

```
You: "List all my data collections"
AI: Uses wix_list_data_collections to show all collections with their schemas and field definitions.

You: "Add a new item to my Products collection"
AI: Uses wix_get_data_collection to check the schema,
    then wix_insert_data_item to add the new item with the required fields.

You: "Show me all contacts from the last month"
AI: Uses wix_list_contacts with date filtering to retrieve recent contacts.

You: "Create a new blog post"
AI: Uses wix_create_blog_post with the provided title, content, and metadata.
```

## Development

```bash
# Build
npx turbo build --filter=@cmsmcp/wix

# Test
npx turbo test --filter=@cmsmcp/wix

# Dev mode
npx turbo dev --filter=@cmsmcp/wix

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node packages/wix-mcp/dist/index.js
```

## License

MIT
