# @cmsmcp/webflow

MCP (Model Context Protocol) server for the **Webflow** CMS platform. Provides 20 tools for AI agents to manage Webflow sites, CMS collections, pages, e-commerce products, orders, and publishing.

## Tools (20)

### Sites (2)
| Tool | Description |
|------|-------------|
| `webflow_list_sites` | List all accessible Webflow sites |
| `webflow_get_site` | Get site details by ID |

### Collections (2)
| Tool | Description |
|------|-------------|
| `webflow_list_collections` | List CMS collections for a site |
| `webflow_get_collection` | Get collection details and field schema |

### Collection Items (6)
| Tool | Description |
|------|-------------|
| `webflow_list_items` | List items in a collection with pagination |
| `webflow_get_item` | Get a single collection item |
| `webflow_create_item` | Create a new collection item |
| `webflow_update_item` | Update an existing collection item |
| `webflow_delete_item` | Delete a collection item |
| `webflow_publish_items` | Publish collection items to make them live |

### Pages (3)
| Tool | Description |
|------|-------------|
| `webflow_list_pages` | List all pages for a site |
| `webflow_get_page` | Get page details including SEO settings |
| `webflow_update_page` | Update page title, slug, and SEO metadata |

### E-commerce Products (2)
| Tool | Description |
|------|-------------|
| `webflow_list_products` | List products for a site |
| `webflow_create_product` | Create a new product with SKU |

### E-commerce Orders (2)
| Tool | Description |
|------|-------------|
| `webflow_list_orders` | List orders with optional status filter |
| `webflow_get_order` | Get order details |

### Publishing (1)
| Tool | Description |
|------|-------------|
| `webflow_publish_site` | Publish site to make staged changes live |

### Domains (1)
| Tool | Description |
|------|-------------|
| `webflow_list_domains` | List custom domains for a site |

### Webhooks (1)
| Tool | Description |
|------|-------------|
| `webflow_list_webhooks` | List configured webhooks |

## Configuration

Set the following environment variable:

```bash
WEBFLOW_API_TOKEN=your_webflow_api_token
```

Get your API token from the [Webflow Dashboard](https://webflow.com/dashboard) under Site Settings > Integrations > API Access.

## Usage

### With Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "webflow": {
      "command": "npx",
      "args": ["-y", "@cmsmcp/webflow"],
      "env": {
        "WEBFLOW_API_TOKEN": "your_token_here"
      }
    }
  }
}
```

### With MCP Inspector

```bash
WEBFLOW_API_TOKEN=your_token npx @modelcontextprotocol/inspector node dist/index.js
```

## API Reference

This package uses the [Webflow Data API v2](https://developers.webflow.com/data/reference). Rate limit: 60 requests per minute.

## Development

```bash
# Build
npm run build

# Dev mode (watch)
npm run dev

# Run tests
npm run test

# Type check
npm run typecheck
```

## License

MIT
