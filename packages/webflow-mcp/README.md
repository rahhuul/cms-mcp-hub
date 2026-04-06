# @cmsmcp/webflow

MCP server for Webflow -- 21 tools for managing sites, CMS collections, items, pages, e-commerce products, orders, publishing, and webhooks.

[![npm version](https://img.shields.io/npm/v/@cmsmcp/webflow.svg)](https://www.npmjs.com/package/@cmsmcp/webflow)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](../../LICENSE)

## Quick Start

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "webflow": {
      "command": "npx",
      "args": ["-y", "@cmsmcp/webflow"],
      "env": {
        "WEBFLOW_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add webflow -e WEBFLOW_API_TOKEN=your-token -- npx -y @cmsmcp/webflow
```

### Cursor / Windsurf / Any MCP Client

Same JSON config format -- add to your client's MCP settings file.

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `WEBFLOW_API_TOKEN` | Yes | Webflow API v2 bearer token |

## Available Tools (21 tools)

### Sites & Collections (7 tools)

| Tool | Description |
|------|-------------|
| `webflow_list_sites` | List all authorized Webflow sites |
| `webflow_get_site` | Get details for a specific site |
| `webflow_list_collections` | List CMS collections for a site |
| `webflow_get_collection` | Get a collection's schema and fields |
| `webflow_list_collection_fields` | List all fields in a collection |

### CMS Items (5 tools)

| Tool | Description |
|------|-------------|
| `webflow_list_items` | List items in a CMS collection with pagination |
| `webflow_get_item` | Get a single CMS item by ID |
| `webflow_create_item` | Create a new CMS item |
| `webflow_update_item` | Update an existing CMS item |
| `webflow_delete_item` | Delete a CMS item |

### Pages (3 tools)

| Tool | Description |
|------|-------------|
| `webflow_list_pages` | List all pages for a site |
| `webflow_get_page` | Get details for a specific page |
| `webflow_update_page` | Update page metadata and SEO settings |

### E-Commerce (4 tools)

| Tool | Description |
|------|-------------|
| `webflow_list_products` | List all e-commerce products |
| `webflow_create_product` | Create a new product |
| `webflow_list_orders` | List all orders |
| `webflow_get_order` | Get details for a specific order |

### Publishing & System (3 tools)

| Tool | Description |
|------|-------------|
| `webflow_publish_items` | Publish staged CMS items |
| `webflow_publish_site` | Publish the site to a domain |
| `webflow_list_domains` | List domains for a site |
| `webflow_list_webhooks` | List configured webhooks |

## Examples

```
You: "List all my Webflow sites"
AI: Uses webflow_list_sites to show all authorized sites with their names and domains.

You: "Add a new blog post to my CMS"
AI: Uses webflow_list_collections to find the blog collection,
    then webflow_create_item to create the new post with title, content, and slug.

You: "Publish my site"
AI: Uses webflow_publish_site to deploy the latest changes to your domain.
```

## Development

```bash
# Build
npx turbo build --filter=@cmsmcp/webflow

# Test
npx turbo test --filter=@cmsmcp/webflow

# Dev mode
npx turbo dev --filter=@cmsmcp/webflow

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node packages/webflow-mcp/dist/index.js
```

## License

MIT
