# @cmsmcp/yoast

MCP server for Yoast SEO -- 18 tools for managing SEO metadata, scores, redirects, social data, schema markup, sitemaps, and indexability via WordPress REST API.

> Part of [CMS MCP Hub](https://github.com/rahhuul/cms-mcp-hub) -- 757 tools across 12 CMS platforms. If this is useful, [give it a star](https://github.com/rahhuul/cms-mcp-hub/stargazers)!

[![npm version](https://img.shields.io/npm/v/@cmsmcp/yoast.svg)](https://www.npmjs.com/package/@cmsmcp/yoast)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](../../LICENSE)

## Quick Start

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "yoast": {
      "command": "npx",
      "args": ["-y", "@cmsmcp/yoast"],
      "env": {
        "YOAST_SITE_URL": "https://mysite.com",
        "YOAST_USERNAME": "admin",
        "YOAST_APP_PASSWORD": "xxxx xxxx xxxx"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add yoast -e YOAST_SITE_URL=https://mysite.com -e YOAST_USERNAME=admin -e YOAST_APP_PASSWORD=xxxx -- npx -y @cmsmcp/yoast
```

### Cursor / Windsurf / Any MCP Client

Same JSON config format -- add to your client's MCP settings file.

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `YOAST_SITE_URL` | Yes | WordPress site URL |
| `YOAST_USERNAME` | Yes | WordPress username |
| `YOAST_APP_PASSWORD` | Yes | WordPress application password |

## Available Tools (18 tools)

### SEO Data (8 tools)

| Tool | Description |
|------|-------------|
| `yoast_get_site_config` | Get Yoast site-wide SEO configuration |
| `yoast_get_seo_data` | Get SEO metadata for a post/page (title, description, focus keyphrase) |
| `yoast_update_seo_data` | Update SEO metadata for a post/page |
| `yoast_get_seo_score` | Get the SEO and readability scores for a post/page |
| `yoast_get_indexable_status` | Get the indexability status of a post/page |
| `yoast_update_indexable` | Update indexability settings (noindex, nofollow, etc.) |
| `yoast_get_social_data` | Get social sharing metadata (Open Graph, Twitter Card) |
| `yoast_update_social_data` | Update social sharing metadata |

### Bulk Operations (2 tools)

| Tool | Description |
|------|-------------|
| `yoast_bulk_get_seo` | Get SEO data for multiple posts/pages at once |
| `yoast_bulk_update_seo` | Update SEO data for multiple posts/pages at once |

### Redirects (4 tools)

| Tool | Description |
|------|-------------|
| `yoast_list_redirects` | List all URL redirects |
| `yoast_create_redirect` | Create a new URL redirect |
| `yoast_update_redirect` | Update an existing redirect |
| `yoast_delete_redirect` | Delete a redirect |

### Schema & Technical SEO (4 tools)

| Tool | Description |
|------|-------------|
| `yoast_check_premium` | Check if Yoast Premium is active |
| `yoast_list_variables` | List available Yoast template variables |
| `yoast_get_schema` | Get structured data (JSON-LD schema) for a URL |
| `yoast_get_sitemap_index` | Get the XML sitemap index |

## Examples

```
You: "Check the SEO score for my homepage"
AI: Uses yoast_get_seo_score to show the SEO and readability scores with improvement suggestions.

You: "Update the meta description for all my blog posts"
AI: Uses yoast_bulk_get_seo to retrieve current SEO data,
    then yoast_bulk_update_seo to update descriptions in batch.

You: "Create a redirect from /old-page to /new-page"
AI: Uses yoast_create_redirect to set up a 301 redirect.

You: "Show me the schema markup for my about page"
AI: Uses yoast_get_schema to retrieve the JSON-LD structured data for the page.
```

## Development

```bash
# Build
npx turbo build --filter=@cmsmcp/yoast

# Test
npx turbo test --filter=@cmsmcp/yoast

# Dev mode
npx turbo dev --filter=@cmsmcp/yoast

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node packages/yoast-mcp/dist/index.js
```

## License

MIT
