# @cmsmcp/shopify

MCP server for **Shopify** — full Admin REST API coverage with 150+ tools for products, orders, customers, inventory, content, discounts, and more.

Part of [CMS MCP Hub](https://github.com/rahhuul/cms-mcp-hub).

## Quick Start

```json
{
  "mcpServers": {
    "shopify": {
      "command": "npx",
      "args": ["-y", "@cmsmcp/shopify"],
      "env": {
        "SHOPIFY_STORE": "mystore",
        "SHOPIFY_ACCESS_TOKEN": "shpat_xxx"
      }
    }
  }
}
```

Works with: **Claude Desktop, Claude Code, Cursor, Windsurf, Copilot, Cline, Zed**.

## Setup

1. Shopify Admin → Settings → Apps → Develop apps → Create app
2. Configure Admin API scopes (read/write products, orders, customers, etc.)
3. Install app → Copy Admin API access token (`shpat_...`)

## Tools (150+)

| Category | Tools | Description |
|----------|-------|-------------|
| Products | 6 | Full CRUD + count |
| Variants | 6 | Full CRUD + count |
| Product Images | 6 | Full CRUD + count |
| Custom Collections | 5 | Full CRUD |
| Smart Collections | 5 | Full CRUD with rules |
| Collects | 3 | Link products to collections |
| Orders | 7 | CRUD + close + cancel |
| Draft Orders | 7 | CRUD + complete + send invoice |
| Transactions | 4 | List, get, count, create (capture/void/refund) |
| Refunds | 4 | List, get, create, calculate |
| Fulfillments | 6 | Full CRUD + cancel |
| Customers | 7 | Full CRUD + count + search |
| Customer Addresses | 6 | Full CRUD + set default |
| Inventory Items | 3 | List, get, update |
| Inventory Levels | 3 | List, adjust, set |
| Locations | 3 | List, get, count |
| Pages | 6 | Full CRUD + count |
| Blogs | 5 | Full CRUD |
| Articles | 8 | Full CRUD + count + authors + tags |
| Redirects | 6 | Full CRUD + count |
| Themes | 2 | List, get |
| Assets | 4 | List, get, create/update, delete |
| Price Rules | 5 | Full CRUD |
| Discount Codes | 5 | Full CRUD |
| Gift Cards | 6 | Full CRUD + count + search |
| Metafields | 5 | Full CRUD on any resource |
| Webhooks | 6 | Full CRUD + count |
| Shop | 1 | Store info |
| Policies | 1 | Store policies |
| Currencies | 1 | Enabled currencies |
| Countries | 2 | List + get with provinces |
| Events | 3 | Audit log |

## License

MIT
