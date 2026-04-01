# @cmsmcp/wix

MCP server for **Wix** -- 18 tools for data collections, eCommerce, contacts, blog, bookings, and site management via the Wix REST API v2.

Part of [CMS MCP Hub](https://github.com/rahhuul/cms-mcp-hub).

## Quick Start

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

Works with: **Claude Desktop, Claude Code, Cursor, Windsurf, Copilot, Cline, Zed**.

## Setup

1. Go to [Wix Dev Center](https://dev.wix.com/) and create an API key
2. Select the permissions your tools need (Data, Stores, eCommerce, Contacts, Blog, Bookings, Site)
3. Copy the API key and your site ID
4. Set `WIX_API_KEY` and `WIX_SITE_ID` environment variables

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `WIX_API_KEY` | Yes | Wix API key from Dev Center |
| `WIX_SITE_ID` | Yes | Wix site ID |

## Tools (18)

| Category | Tools | Description |
|----------|-------|-------------|
| Data Collections | 2 | List and get collection schemas |
| Data Items | 6 | Query, get, insert, update, remove, bulk insert |
| Contacts | 2 | Query contacts, create contact |
| Products | 2 | List and get store products |
| Orders | 2 | List and get eCommerce orders |
| Blog | 2 | List posts, create draft/published post |
| Bookings | 1 | List booking services |
| Site | 1 | Get site properties |

### Data Collections

| Tool | Description |
|------|-------------|
| `wix_list_data_collections` | List all data collections with schemas and item counts |
| `wix_get_data_collection` | Get a specific collection by ID |

### Data Items

| Tool | Description |
|------|-------------|
| `wix_query_data_items` | Query items with WQL filters, sorting, and pagination |
| `wix_get_data_item` | Get a single item by ID |
| `wix_insert_data_item` | Insert a new item into a collection |
| `wix_update_data_item` | Update an existing item |
| `wix_remove_data_item` | Remove an item from a collection |
| `wix_bulk_insert_data_items` | Insert up to 50 items at once |

### Contacts

| Tool | Description |
|------|-------------|
| `wix_list_contacts` | Query contacts with WQL filters |
| `wix_create_contact` | Create a new contact with name, email, phone |

### Products (Wix Stores)

| Tool | Description |
|------|-------------|
| `wix_list_products` | List store products with pagination |
| `wix_get_product` | Get product details with optional variants |

### Orders (Wix eCommerce)

| Tool | Description |
|------|-------------|
| `wix_list_orders` | List eCommerce orders |
| `wix_get_order` | Get order details by ID |

### Blog

| Tool | Description |
|------|-------------|
| `wix_list_blog_posts` | List posts, filter by featured/status |
| `wix_create_blog_post` | Create a blog post (draft or published) |

### Bookings

| Tool | Description |
|------|-------------|
| `wix_list_booking_services` | List all booking services |

### Site

| Tool | Description |
|------|-------------|
| `wix_get_site_properties` | Get site name, URL, locale, business info |

## WQL (Wix Query Language)

Data items and contacts support WQL filtering:

```json
{
  "filter": {
    "status": { "$eq": "active" }
  }
}
```

### Supported Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `$eq` | Equals | `{"field": {"$eq": "value"}}` |
| `$ne` | Not equals | `{"field": {"$ne": "value"}}` |
| `$gt` | Greater than | `{"price": {"$gt": 10}}` |
| `$gte` | Greater than or equal | `{"price": {"$gte": 10}}` |
| `$lt` | Less than | `{"price": {"$lt": 100}}` |
| `$lte` | Less than or equal | `{"price": {"$lte": 100}}` |
| `$in` | In list | `{"status": {"$in": ["a", "b"]}}` |
| `$contains` | Contains substring | `{"name": {"$contains": "widget"}}` |
| `$startsWith` | Starts with | `{"name": {"$startsWith": "A"}}` |

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
