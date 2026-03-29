# @cmsmcp/woocommerce

MCP server for **WooCommerce** stores with **full REST API v3 coverage** — 92 tools spanning every resource.

## Requirements

- Node.js 18+
- WooCommerce REST API v3 enabled
- Consumer Key + Consumer Secret (WP Admin → WooCommerce → Settings → Advanced → REST API)

## Configuration

```bash
WOOCOMMERCE_URL=https://mystore.com
WOOCOMMERCE_CONSUMER_KEY=ck_your_key_here
WOOCOMMERCE_CONSUMER_SECRET=cs_your_secret_here
```

### Authentication

- **HTTPS sites** → Basic Auth (automatic)
- **HTTP sites** → OAuth 1.0a HMAC-SHA256 (automatic)

### Claude Desktop

```json
{
  "mcpServers": {
    "woocommerce": {
      "command": "npx",
      "args": ["@cmsmcp/woocommerce"],
      "env": {
        "WOOCOMMERCE_URL": "https://mystore.com",
        "WOOCOMMERCE_CONSUMER_KEY": "ck_your_key",
        "WOOCOMMERCE_CONSUMER_SECRET": "cs_your_secret"
      }
    }
  }
}
```

## Tools (92)

### Products (10)

| Tool | Description |
|------|-------------|
| `woo_list_products` | List products with filters (search, status, category, tag, SKU, sort) |
| `woo_get_product` | Get product details |
| `woo_create_product` | Create product (simple, variable, grouped, external) |
| `woo_update_product` | Update product fields |
| `woo_delete_product` | Delete product |
| `woo_list_product_variations` | List variations of a variable product |
| `woo_get_product_variation` | Get variation details |
| `woo_create_product_variation` | Create a variation |
| `woo_update_product_variation` | Update a variation |
| `woo_delete_product_variation` | Delete a variation |

### Product Attributes & Terms (10)

| Tool | Description |
|------|-------------|
| `woo_list_product_attributes` | List attributes (Color, Size, etc.) |
| `woo_get_product_attribute` | Get attribute details |
| `woo_create_product_attribute` | Create attribute |
| `woo_update_product_attribute` | Update attribute |
| `woo_delete_product_attribute` | Delete attribute |
| `woo_list_attribute_terms` | List terms for an attribute (Red, Blue, etc.) |
| `woo_get_attribute_term` | Get term details |
| `woo_create_attribute_term` | Create term |
| `woo_update_attribute_term` | Update term |
| `woo_delete_attribute_term` | Delete term |

### Product Categories (5)

| Tool | Description |
|------|-------------|
| `woo_list_categories` | List categories |
| `woo_get_category` | Get category |
| `woo_create_category` | Create category (supports nesting) |
| `woo_update_category` | Update category |
| `woo_delete_category` | Delete category |

### Product Tags (5)

| Tool | Description |
|------|-------------|
| `woo_list_tags` | List tags |
| `woo_get_tag` | Get tag |
| `woo_create_tag` | Create tag |
| `woo_update_tag` | Update tag |
| `woo_delete_tag` | Delete tag |

### Product Shipping Classes (5)

| Tool | Description |
|------|-------------|
| `woo_list_shipping_classes` | List shipping classes |
| `woo_get_shipping_class` | Get shipping class |
| `woo_create_shipping_class` | Create shipping class |
| `woo_update_shipping_class` | Update shipping class |
| `woo_delete_shipping_class` | Delete shipping class |

### Product Reviews (5)

| Tool | Description |
|------|-------------|
| `woo_list_product_reviews` | List reviews (filter by product, status) |
| `woo_get_product_review` | Get review |
| `woo_create_product_review` | Create review with rating |
| `woo_update_product_review` | Update review (content, rating, status) |
| `woo_delete_product_review` | Delete review |

### Orders (5)

| Tool | Description |
|------|-------------|
| `woo_list_orders` | List orders (status, customer, date range) |
| `woo_get_order` | Get full order details |
| `woo_create_order` | Create order with line items, coupons |
| `woo_update_order` | Update order status/metadata |
| `woo_delete_order` | Delete order |

### Order Notes (4)

| Tool | Description |
|------|-------------|
| `woo_list_order_notes` | List order notes |
| `woo_get_order_note` | Get specific note |
| `woo_create_order_note` | Add note (private or customer-facing) |
| `woo_delete_order_note` | Delete note |

### Order Refunds (4)

| Tool | Description |
|------|-------------|
| `woo_list_order_refunds` | List refunds for an order |
| `woo_get_order_refund` | Get refund details |
| `woo_create_order_refund` | Create refund (full or partial, via gateway) |
| `woo_delete_order_refund` | Delete refund record |

### Customers (6)

| Tool | Description |
|------|-------------|
| `woo_list_customers` | List customers |
| `woo_get_customer` | Get customer profile |
| `woo_create_customer` | Create customer |
| `woo_update_customer` | Update customer |
| `woo_delete_customer` | Delete customer |
| `woo_get_customer_downloads` | Get customer's downloadable files |

### Coupons (5)

| Tool | Description |
|------|-------------|
| `woo_list_coupons` | List coupons |
| `woo_get_coupon` | Get coupon details |
| `woo_create_coupon` | Create coupon (percent, fixed_cart, fixed_product) |
| `woo_update_coupon` | Update coupon |
| `woo_delete_coupon` | Delete coupon |

### Tax Rates & Classes (8)

| Tool | Description |
|------|-------------|
| `woo_list_tax_rates` | List tax rates |
| `woo_get_tax_rate` | Get tax rate |
| `woo_create_tax_rate` | Create tax rate |
| `woo_update_tax_rate` | Update tax rate |
| `woo_delete_tax_rate` | Delete tax rate |
| `woo_list_tax_classes` | List tax classes |
| `woo_create_tax_class` | Create tax class |
| `woo_delete_tax_class` | Delete tax class |

### Webhooks (5)

| Tool | Description |
|------|-------------|
| `woo_list_webhooks` | List webhooks |
| `woo_get_webhook` | Get webhook |
| `woo_create_webhook` | Create webhook (order.created, product.updated, etc.) |
| `woo_update_webhook` | Update webhook |
| `woo_delete_webhook` | Delete webhook |

### Reports (3)

| Tool | Description |
|------|-------------|
| `woo_get_reports_sales` | Sales analytics |
| `woo_get_reports_top_sellers` | Top-selling products |
| `woo_get_reports_totals` | Totals for coupons/customers/orders/products/reviews |

### Settings & Payments (5)

| Tool | Description |
|------|-------------|
| `woo_list_shipping_zones` | List shipping zones |
| `woo_get_payment_gateways` | List payment gateways |
| `woo_update_payment_gateway` | Enable/disable/configure gateway |
| `woo_get_settings` | Get store settings by group |
| `woo_update_setting` | Update a setting value |

### System Status & Data (6)

| Tool | Description |
|------|-------------|
| `woo_get_system_status` | Full system diagnostics |
| `woo_list_system_tools` | List available system tools |
| `woo_run_system_tool` | Run system tool (clear transients, etc.) |
| `woo_list_data` | List continents/countries/currencies |
| `woo_get_data_item` | Get specific continent/country/currency |
| `woo_get_current_currency` | Get store's current currency |

### Batch Operations (1)

| Tool | Description |
|------|-------------|
| `woo_batch_update` | Batch create/update/delete (100 ops max) |

Supports: products, orders, coupons, customers, categories, tags, attributes, reviews, taxes, webhooks, shipping classes.

## License

MIT
