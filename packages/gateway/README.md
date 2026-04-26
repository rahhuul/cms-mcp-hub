# @cmsmcp/gateway

Universal REST API gateway for [CMS MCP Hub](https://github.com/rahhuul/cms-mcp-hub) -- exposes all MCP tools as HTTP endpoints with auto-generated OpenAPI spec and a web dashboard.

> Part of [CMS MCP Hub](https://github.com/rahhuul/cms-mcp-hub) -- 757 tools across 12 CMS platforms. If this is useful, [give it a star](https://github.com/rahhuul/cms-mcp-hub/stargazers)!

[![npm version](https://img.shields.io/npm/v/@cmsmcp/gateway.svg)](https://www.npmjs.com/package/@cmsmcp/gateway)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](../../LICENSE)

**Works with:** ChatGPT, Gemini, Python, n8n, Make, Zapier, LangChain, cURL, Postman, and any HTTP client.

## Quick Start

```bash
npx @cmsmcp/gateway
```

The gateway spawns MCP servers as child processes, discovers all their tools via the MCP protocol, and exposes them as standard REST endpoints. It auto-generates an OpenAPI 3.0 spec and serves a web dashboard for browsing and testing tools.

## Configuration

### Option 1: gateway.json

Create a `gateway.json` file in your working directory:

```json
{
  "port": 3777,
  "apiKey": "your-secret-key",
  "servers": [
    {
      "name": "wordpress",
      "command": "npx",
      "args": ["-y", "@cmsmcp/wordpress"],
      "env": {
        "WORDPRESS_URL": "https://yoursite.com",
        "WORDPRESS_USERNAME": "admin",
        "WORDPRESS_APP_PASSWORD": "xxxx xxxx xxxx"
      }
    },
    {
      "name": "shopify",
      "command": "npx",
      "args": ["-y", "@cmsmcp/shopify"],
      "env": {
        "SHOPIFY_STORE": "mystore",
        "SHOPIFY_ACCESS_TOKEN": "shpat_xxx"
      }
    }
  ]
}
```

### Option 2: Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GATEWAY_CONFIG` | `gateway.json` | Path to config file |
| `GATEWAY_PORT` | `3777` | HTTP port |
| `GATEWAY_API_KEY` | `cmsmcp-dev-key` | API key for authentication |
| `GATEWAY_BASE_URL` | `http://localhost:{port}` | Public base URL |

Auto-detected CMS environment variables (no `gateway.json` needed):

| Variables | Auto-adds |
|-----------|-----------|
| `WORDPRESS_URL` + `WORDPRESS_USERNAME` | WordPress MCP server |
| `WOOCOMMERCE_URL` + `WOOCOMMERCE_CONSUMER_KEY` | WooCommerce MCP server |

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| `GET` | `/` | Web dashboard -- browse and test all tools |
| `GET` | `/health` | Server health status |
| `GET` | `/openapi.json` | OpenAPI 3.0 spec (import into Postman, Swagger UI, etc.) |
| `GET` | `/api/tools` | List all available tools across all connected servers |
| `POST` | `/api/{server}/{tool}` | Execute any tool with JSON body parameters |

## Authentication

All `/api/*` endpoints require the `X-API-Key` header:

```bash
curl -H "X-API-Key: your-secret-key" http://localhost:3777/api/tools
```

## Examples

### List WordPress posts

```bash
curl -X POST http://localhost:3777/api/wordpress/wp_list_posts \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{"per_page": 5}'
```

### Create a Shopify product

```bash
curl -X POST http://localhost:3777/api/shopify/shopify_create_product \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{"title": "New Product", "body_html": "<p>Description</p>", "vendor": "MyStore"}'
```

### Get WooCommerce store dashboard

```bash
curl -X POST http://localhost:3777/api/woocommerce/woo_store_dashboard \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Use with Python

```python
import requests

BASE = "http://localhost:3777"
HEADERS = {"X-API-Key": "your-key", "Content-Type": "application/json"}

# List all tools
tools = requests.get(f"{BASE}/api/tools", headers=HEADERS).json()

# Call a tool
result = requests.post(
    f"{BASE}/api/wordpress/wp_list_posts",
    headers=HEADERS,
    json={"per_page": 10}
).json()
```

## Architecture

```
HTTP Client / Dashboard
        |
   [ Gateway ]  (:3777)
    /    |    \
  MCP   MCP   MCP    (stdio child processes)
   |     |     |
  WP  Shopify  Woo
```

The gateway communicates with each MCP server over stdio, translating HTTP requests into MCP tool calls and returning the results as JSON.

## Development

```bash
# Build
npx turbo build --filter=@cmsmcp/gateway

# Test
npx turbo test --filter=@cmsmcp/gateway

# Dev mode (watch)
npx turbo dev --filter=@cmsmcp/gateway

# Run locally
node packages/gateway/dist/index.js
```

## License

MIT
