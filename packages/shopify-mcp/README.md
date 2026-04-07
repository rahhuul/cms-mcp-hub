# @cmsmcp/shopify

MCP server for Shopify -- 147 tools for full Admin REST API coverage including products, orders, customers, inventory, content, discounts, gift cards, metafields, themes, and more.

> Part of [CMS MCP Hub](https://github.com/rahhuul/cms-mcp-hub) -- 589 tools across 12 CMS platforms. If this is useful, [give it a star](https://github.com/rahhuul/cms-mcp-hub/stargazers)!

[![npm version](https://img.shields.io/npm/v/@cmsmcp/shopify.svg)](https://www.npmjs.com/package/@cmsmcp/shopify)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](../../LICENSE)

## Quick Start

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

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

### Claude Code

```bash
claude mcp add shopify -e SHOPIFY_STORE=mystore -e SHOPIFY_ACCESS_TOKEN=shpat_xxx -- npx -y @cmsmcp/shopify
```

### Cursor / Windsurf / Any MCP Client

Same JSON config format -- add to your client's MCP settings file.

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `SHOPIFY_STORE` | Yes | Shopify store name (the `mystore` part of `mystore.myshopify.com`) |
| `SHOPIFY_ACCESS_TOKEN` | Yes | Shopify Admin API access token (`shpat_...`) |

## Available Tools (147 tools)

### Products (12 tools)

| Tool | Description |
|------|-------------|
| `shopify_list_products` | List products with pagination |
| `shopify_get_product` | Get a single product |
| `shopify_count_products` | Count total products |
| `shopify_create_product` | Create a new product |
| `shopify_update_product` | Update a product |
| `shopify_delete_product` | Delete a product |
| `shopify_list_variants` | List product variants |
| `shopify_get_variant` | Get a single variant |
| `shopify_count_variants` | Count variants for a product |
| `shopify_create_variant` | Create a product variant |
| `shopify_update_variant` | Update a variant |
| `shopify_delete_variant` | Delete a variant |

### Product Images (6 tools)

| Tool | Description |
|------|-------------|
| `shopify_list_product_images` | List images for a product |
| `shopify_get_product_image` | Get a single product image |
| `shopify_count_product_images` | Count images for a product |
| `shopify_create_product_image` | Add an image to a product |
| `shopify_update_product_image` | Update a product image |
| `shopify_delete_product_image` | Delete a product image |

### Collections (13 tools)

| Tool | Description |
|------|-------------|
| `shopify_list_custom_collections` | List custom (manual) collections |
| `shopify_get_custom_collection` | Get a custom collection |
| `shopify_create_custom_collection` | Create a custom collection |
| `shopify_update_custom_collection` | Update a custom collection |
| `shopify_delete_custom_collection` | Delete a custom collection |
| `shopify_list_smart_collections` | List smart (automated) collections |
| `shopify_get_smart_collection` | Get a smart collection |
| `shopify_create_smart_collection` | Create a smart collection |
| `shopify_update_smart_collection` | Update a smart collection |
| `shopify_delete_smart_collection` | Delete a smart collection |
| `shopify_list_collects` | List product-collection associations |
| `shopify_create_collect` | Add a product to a collection |
| `shopify_delete_collect` | Remove a product from a collection |

### Orders (7 tools)

| Tool | Description |
|------|-------------|
| `shopify_list_orders` | List orders with filtering |
| `shopify_get_order` | Get a single order |
| `shopify_count_orders` | Count total orders |
| `shopify_create_order` | Create a new order |
| `shopify_update_order` | Update an order |
| `shopify_close_order` | Close an order |
| `shopify_cancel_order` | Cancel an order |

### Draft Orders (7 tools)

| Tool | Description |
|------|-------------|
| `shopify_list_draft_orders` | List draft orders |
| `shopify_get_draft_order` | Get a single draft order |
| `shopify_create_draft_order` | Create a draft order |
| `shopify_update_draft_order` | Update a draft order |
| `shopify_delete_draft_order` | Delete a draft order |
| `shopify_complete_draft_order` | Convert a draft order to a real order |
| `shopify_send_draft_invoice` | Email the draft order invoice |

### Transactions (4 tools)

| Tool | Description |
|------|-------------|
| `shopify_list_transactions` | List transactions for an order |
| `shopify_get_transaction` | Get a single transaction |
| `shopify_count_transactions` | Count transactions for an order |
| `shopify_create_transaction` | Create a transaction |

### Refunds (4 tools)

| Tool | Description |
|------|-------------|
| `shopify_list_refunds` | List refunds for an order |
| `shopify_get_refund` | Get a single refund |
| `shopify_create_refund` | Create a refund |
| `shopify_calculate_refund` | Calculate a refund amount |

### Fulfillments (6 tools)

| Tool | Description |
|------|-------------|
| `shopify_list_fulfillments` | List fulfillments for an order |
| `shopify_get_fulfillment` | Get a single fulfillment |
| `shopify_count_fulfillments` | Count fulfillments for an order |
| `shopify_create_fulfillment` | Create a fulfillment |
| `shopify_update_fulfillment` | Update tracking info |
| `shopify_cancel_fulfillment` | Cancel a fulfillment |

### Customers (8 tools)

| Tool | Description |
|------|-------------|
| `shopify_list_customers` | List customers |
| `shopify_get_customer` | Get a single customer |
| `shopify_count_customers` | Count total customers |
| `shopify_search_customers` | Search customers by query |
| `shopify_create_customer` | Create a customer |
| `shopify_update_customer` | Update a customer |
| `shopify_delete_customer` | Delete a customer |

### Customer Addresses (5 tools)

| Tool | Description |
|------|-------------|
| `shopify_list_customer_addresses` | List addresses for a customer |
| `shopify_get_customer_address` | Get a single address |
| `shopify_create_customer_address` | Add an address |
| `shopify_update_customer_address` | Update an address |
| `shopify_delete_customer_address` | Delete an address |
| `shopify_set_default_address` | Set the default address |

### Inventory (7 tools)

| Tool | Description |
|------|-------------|
| `shopify_list_inventory_items` | List inventory items |
| `shopify_get_inventory_item` | Get a single inventory item |
| `shopify_update_inventory_item` | Update an inventory item |
| `shopify_list_inventory_levels` | List inventory levels |
| `shopify_adjust_inventory` | Adjust inventory quantity |
| `shopify_set_inventory` | Set absolute inventory level |
| `shopify_list_locations` | List store locations |
| `shopify_get_location` | Get a single location |
| `shopify_count_locations` | Count locations |

### Content (16 tools)

| Tool | Description |
|------|-------------|
| `shopify_list_pages` | List store pages |
| `shopify_get_page` | Get a single page |
| `shopify_count_pages` | Count pages |
| `shopify_create_page` | Create a page |
| `shopify_update_page` | Update a page |
| `shopify_delete_page` | Delete a page |
| `shopify_list_blogs` | List blogs |
| `shopify_get_blog` | Get a single blog |
| `shopify_create_blog` | Create a blog |
| `shopify_update_blog` | Update a blog |
| `shopify_delete_blog` | Delete a blog |
| `shopify_list_articles` | List blog articles |
| `shopify_get_article` | Get a single article |
| `shopify_count_articles` | Count articles |
| `shopify_create_article` | Create an article |
| `shopify_update_article` | Update an article |
| `shopify_delete_article` | Delete an article |
| `shopify_list_article_authors` | List article authors |
| `shopify_list_article_tags` | List article tags |
| `shopify_list_redirects` | List URL redirects |
| `shopify_get_redirect` | Get a single redirect |
| `shopify_count_redirects` | Count redirects |
| `shopify_create_redirect` | Create a URL redirect |
| `shopify_update_redirect` | Update a redirect |
| `shopify_delete_redirect` | Delete a redirect |

### Themes & Assets (6 tools)

| Tool | Description |
|------|-------------|
| `shopify_list_themes` | List store themes |
| `shopify_get_theme` | Get a single theme |
| `shopify_list_assets` | List theme assets |
| `shopify_get_asset` | Get a single theme asset |
| `shopify_create_or_update_asset` | Create or update a theme asset |
| `shopify_delete_asset` | Delete a theme asset |

### Discounts & Price Rules (10 tools)

| Tool | Description |
|------|-------------|
| `shopify_list_price_rules` | List price rules |
| `shopify_get_price_rule` | Get a single price rule |
| `shopify_create_price_rule` | Create a price rule |
| `shopify_update_price_rule` | Update a price rule |
| `shopify_delete_price_rule` | Delete a price rule |
| `shopify_list_discount_codes` | List discount codes for a price rule |
| `shopify_get_discount_code` | Get a single discount code |
| `shopify_create_discount_code` | Create a discount code |
| `shopify_update_discount_code` | Update a discount code |
| `shopify_delete_discount_code` | Delete a discount code |

### Gift Cards (6 tools)

| Tool | Description |
|------|-------------|
| `shopify_list_gift_cards` | List gift cards |
| `shopify_get_gift_card` | Get a single gift card |
| `shopify_count_gift_cards` | Count gift cards |
| `shopify_create_gift_card` | Create a gift card |
| `shopify_update_gift_card` | Update a gift card |
| `shopify_search_gift_cards` | Search gift cards |

### Metafields (5 tools)

| Tool | Description |
|------|-------------|
| `shopify_list_metafields` | List metafields for a resource |
| `shopify_get_metafield` | Get a single metafield |
| `shopify_create_metafield` | Create a metafield |
| `shopify_update_metafield` | Update a metafield |
| `shopify_delete_metafield` | Delete a metafield |

### Webhooks (6 tools)

| Tool | Description |
|------|-------------|
| `shopify_list_webhooks` | List webhooks |
| `shopify_get_webhook` | Get a single webhook |
| `shopify_count_webhooks` | Count webhooks |
| `shopify_create_webhook` | Create a webhook |
| `shopify_update_webhook` | Update a webhook |
| `shopify_delete_webhook` | Delete a webhook |

### Store (7 tools)

| Tool | Description |
|------|-------------|
| `shopify_get_shop` | Get store details |
| `shopify_list_policies` | List store policies |
| `shopify_list_currencies` | List enabled currencies |
| `shopify_list_countries` | List shipping countries |
| `shopify_get_country` | Get a single country |
| `shopify_list_events` | List store events |
| `shopify_get_event` | Get a single event |
| `shopify_count_events` | Count events |

## Examples

```
You: "Show me my store info"
AI: Uses shopify_get_shop to display store name, domain, plan, and settings.

You: "Create a new product with two variants"
AI: Uses shopify_create_product to create the product,
    then shopify_create_variant for each additional variant.

You: "List all unfulfilled orders"
AI: Uses shopify_list_orders with fulfillment_status filter set to "unfulfilled".

You: "Create a 20% discount code"
AI: Uses shopify_create_price_rule to set up the 20% rule,
    then shopify_create_discount_code to generate the code.
```

## Development

```bash
# Build
npx turbo build --filter=@cmsmcp/shopify

# Test
npx turbo test --filter=@cmsmcp/shopify

# Dev mode
npx turbo dev --filter=@cmsmcp/shopify

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node packages/shopify-mcp/dist/index.js
```

## License

MIT
