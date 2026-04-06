# @cmsmcp/woocommerce

MCP server for WooCommerce -- 95 tools for complete store management including products, orders, customers, coupons, taxes, shipping, webhooks, and more.

[![npm version](https://img.shields.io/npm/v/@cmsmcp/woocommerce.svg)](https://www.npmjs.com/package/@cmsmcp/woocommerce)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](../../LICENSE)

## Quick Start

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "woocommerce": {
      "command": "npx",
      "args": ["-y", "@cmsmcp/woocommerce"],
      "env": {
        "WOOCOMMERCE_URL": "https://mystore.com",
        "WOOCOMMERCE_CONSUMER_KEY": "ck_xxx",
        "WOOCOMMERCE_CONSUMER_SECRET": "cs_xxx"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add woocommerce -e WOOCOMMERCE_URL=https://mystore.com -e WOOCOMMERCE_CONSUMER_KEY=ck_xxx -e WOOCOMMERCE_CONSUMER_SECRET=cs_xxx -- npx -y @cmsmcp/woocommerce
```

### Cursor / Windsurf / Any MCP Client

Same JSON config format -- add to your client's MCP settings file.

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `WOOCOMMERCE_URL` | Yes | Your WordPress/WooCommerce store URL |
| `WOOCOMMERCE_CONSUMER_KEY` | Yes | WooCommerce REST API consumer key (`ck_...`) |
| `WOOCOMMERCE_CONSUMER_SECRET` | Yes | WooCommerce REST API consumer secret (`cs_...`) |

## Available Tools (95 tools)

### Products (10 tools)

| Tool | Description |
|------|-------------|
| `woo_list_products` | List products with filtering and pagination |
| `woo_get_product` | Get a single product by ID |
| `woo_create_product` | Create a new product |
| `woo_update_product` | Update an existing product |
| `woo_delete_product` | Delete a product |
| `woo_list_product_variations` | List variations of a variable product |
| `woo_get_product_variation` | Get a single product variation |
| `woo_create_product_variation` | Create a product variation |
| `woo_update_product_variation` | Update a product variation |
| `woo_delete_product_variation` | Delete a product variation |

### Product Attributes (10 tools)

| Tool | Description |
|------|-------------|
| `woo_list_product_attributes` | List all product attributes |
| `woo_get_product_attribute` | Get a single product attribute |
| `woo_create_product_attribute` | Create a new attribute (e.g., Color, Size) |
| `woo_update_product_attribute` | Update a product attribute |
| `woo_delete_product_attribute` | Delete a product attribute |
| `woo_list_attribute_terms` | List terms for an attribute (e.g., Red, Blue) |
| `woo_get_attribute_term` | Get a single attribute term |
| `woo_create_attribute_term` | Create a new attribute term |
| `woo_update_attribute_term` | Update an attribute term |
| `woo_delete_attribute_term` | Delete an attribute term |

### Orders (5 tools)

| Tool | Description |
|------|-------------|
| `woo_list_orders` | List orders with filtering and pagination |
| `woo_get_order` | Get a single order by ID |
| `woo_create_order` | Create a new order |
| `woo_update_order` | Update an existing order |
| `woo_delete_order` | Delete an order |

### Order Notes (4 tools)

| Tool | Description |
|------|-------------|
| `woo_list_order_notes` | List notes for an order |
| `woo_get_order_note` | Get a single order note |
| `woo_create_order_note` | Add a note to an order |
| `woo_delete_order_note` | Delete an order note |

### Order Refunds (4 tools)

| Tool | Description |
|------|-------------|
| `woo_list_order_refunds` | List refunds for an order |
| `woo_get_order_refund` | Get a single order refund |
| `woo_create_order_refund` | Create a refund for an order |
| `woo_delete_order_refund` | Delete an order refund |

### Customers (6 tools)

| Tool | Description |
|------|-------------|
| `woo_list_customers` | List customers with filtering |
| `woo_get_customer` | Get a single customer by ID |
| `woo_create_customer` | Create a new customer |
| `woo_update_customer` | Update a customer |
| `woo_delete_customer` | Delete a customer |
| `woo_get_customer_downloads` | Get downloads for a customer |

### Coupons (5 tools)

| Tool | Description |
|------|-------------|
| `woo_list_coupons` | List all coupons |
| `woo_get_coupon` | Get a single coupon |
| `woo_create_coupon` | Create a new coupon |
| `woo_update_coupon` | Update a coupon |
| `woo_delete_coupon` | Delete a coupon |

### Product Reviews (5 tools)

| Tool | Description |
|------|-------------|
| `woo_list_product_reviews` | List all product reviews |
| `woo_get_product_review` | Get a single review |
| `woo_create_product_review` | Create a product review |
| `woo_update_product_review` | Update a product review |
| `woo_delete_product_review` | Delete a product review |

### Taxonomy (10 tools)

| Tool | Description |
|------|-------------|
| `woo_list_categories` | List product categories |
| `woo_get_category` | Get a single category |
| `woo_create_category` | Create a product category |
| `woo_update_category` | Update a product category |
| `woo_delete_category` | Delete a product category |
| `woo_list_tags` | List product tags |
| `woo_get_tag` | Get a single tag |
| `woo_create_tag` | Create a product tag |
| `woo_update_tag` | Update a product tag |
| `woo_delete_tag` | Delete a product tag |

### Tax (8 tools)

| Tool | Description |
|------|-------------|
| `woo_list_tax_rates` | List all tax rates |
| `woo_get_tax_rate` | Get a single tax rate |
| `woo_create_tax_rate` | Create a tax rate |
| `woo_update_tax_rate` | Update a tax rate |
| `woo_delete_tax_rate` | Delete a tax rate |
| `woo_list_tax_classes` | List tax classes |
| `woo_create_tax_class` | Create a tax class |
| `woo_delete_tax_class` | Delete a tax class |

### Shipping (6 tools)

| Tool | Description |
|------|-------------|
| `woo_list_shipping_zones` | List all shipping zones |
| `woo_list_shipping_classes` | List shipping classes |
| `woo_get_shipping_class` | Get a single shipping class |
| `woo_create_shipping_class` | Create a shipping class |
| `woo_update_shipping_class` | Update a shipping class |
| `woo_delete_shipping_class` | Delete a shipping class |

### Webhooks (5 tools)

| Tool | Description |
|------|-------------|
| `woo_list_webhooks` | List all webhooks |
| `woo_get_webhook` | Get a single webhook |
| `woo_create_webhook` | Create a webhook |
| `woo_update_webhook` | Update a webhook |
| `woo_delete_webhook` | Delete a webhook |

### Reports (3 tools)

| Tool | Description |
|------|-------------|
| `woo_get_reports_sales` | Get sales reports |
| `woo_get_reports_top_sellers` | Get top-selling products |
| `woo_get_reports_totals` | Get report totals (orders, products, customers) |

### Settings & System (10 tools)

| Tool | Description |
|------|-------------|
| `woo_get_settings` | Get store settings by group |
| `woo_update_setting` | Update a store setting |
| `woo_get_payment_gateways` | List payment gateways |
| `woo_update_payment_gateway` | Update a payment gateway |
| `woo_get_system_status` | Get system status info |
| `woo_list_system_tools` | List available system tools |
| `woo_run_system_tool` | Run a system tool |
| `woo_list_data` | List data endpoints |
| `woo_get_data_item` | Get a data item |
| `woo_get_current_currency` | Get the store's current currency |

### Batch & Workflows (4 tools)

| Tool | Description |
|------|-------------|
| `woo_batch_update` | Batch create, update, or delete resources |
| `woo_store_dashboard` | Get a complete store overview (orders, revenue, products) |
| `woo_create_full_product` | Create a product with all details in one call |
| `woo_process_order` | Process order workflow (fulfill, complete, etc.) |

## Examples

```
You: "Show me my store dashboard"
AI: Uses woo_store_dashboard to get an overview of recent orders, revenue, and inventory.

You: "Create a new T-shirt product with sizes S, M, L"
AI: Uses woo_create_full_product to create the product with variations for each size.

You: "List all pending orders"
AI: Uses woo_list_orders with status filter set to "pending".
```

## Development

```bash
# Build
npx turbo build --filter=@cmsmcp/woocommerce

# Test
npx turbo test --filter=@cmsmcp/woocommerce

# Dev mode
npx turbo dev --filter=@cmsmcp/woocommerce

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node packages/woocommerce-mcp/dist/index.js
```

## License

MIT
