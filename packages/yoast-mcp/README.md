# @cmsmcp/yoast

MCP server for **Yoast SEO** — manage WordPress SEO metadata, scores, redirects, social sharing data, structured data, and sitemaps through the Model Context Protocol.

Part of the [CMS MCP Hub](https://github.com/rahhuul/cms-mcp-hub) monorepo.

## Tools (13)

| Tool | Description |
|------|-------------|
| `yoast_get_seo_data` | Get SEO title, meta description, focus keyword, and canonical URL for a post/page |
| `yoast_update_seo_data` | Update SEO metadata (title, description, keyword, canonical) |
| `yoast_get_seo_score` | Get Yoast SEO and readability scores with traffic-light ratings |
| `yoast_bulk_get_seo` | Get SEO data for multiple posts at once (max 50) |
| `yoast_bulk_update_seo` | Update SEO data for multiple posts at once (max 25) |
| `yoast_get_indexable_status` | Check noindex setting and canonical URL |
| `yoast_update_indexable` | Set noindex flag and canonical URL |
| `yoast_list_redirects` | List all URL redirects (Yoast Premium) |
| `yoast_create_redirect` | Create a 301/302/307/410 redirect (Yoast Premium) |
| `yoast_get_social_data` | Get Open Graph and Twitter Card metadata |
| `yoast_update_social_data` | Update OG and Twitter metadata |
| `yoast_get_schema` | Get JSON-LD structured data for a URL |
| `yoast_get_sitemap_index` | Fetch and parse the XML sitemap index |

## Prerequisites

- WordPress site with [Yoast SEO](https://yoast.com/wordpress/plugins/seo/) plugin installed and activated
- WordPress [Application Password](https://make.wordpress.org/core/2020/11/05/application-passwords-integration-guide/) for a user with Editor or Administrator role
- For redirect tools: Yoast SEO Premium required

## Configuration

Set these environment variables:

```bash
YOAST_SITE_URL=https://your-wordpress-site.com
YOAST_USERNAME=your-wp-username
YOAST_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx
```

### Generating an Application Password

1. Log in to WordPress admin
2. Go to **Users > Profile**
3. Scroll to **Application Passwords**
4. Enter a name (e.g., "MCP Server") and click **Add New Application Password**
5. Copy the generated password (spaces are optional)

## Usage

### With Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "yoast": {
      "command": "npx",
      "args": ["-y", "@cmsmcp/yoast"],
      "env": {
        "YOAST_SITE_URL": "https://your-site.com",
        "YOAST_USERNAME": "admin",
        "YOAST_APP_PASSWORD": "xxxx xxxx xxxx xxxx xxxx xxxx"
      }
    }
  }
}
```

### With MCP Inspector

```bash
YOAST_SITE_URL=https://your-site.com \
YOAST_USERNAME=admin \
YOAST_APP_PASSWORD="xxxx xxxx xxxx xxxx" \
npx @modelcontextprotocol/inspector node dist/index.js
```

## Build

```bash
npm install
npx turbo build --filter=@cmsmcp/yoast
```

## Test

```bash
npx turbo test --filter=@cmsmcp/yoast
```

## WordPress REST API Notes

This server uses two API namespaces:

- **`wp/v2/`** — Standard WordPress REST API for reading and writing post meta (where Yoast stores SEO fields)
- **`yoast/v1/`** — Yoast SEO REST API for head data, schema output, site configuration, and redirects

### Yoast Meta Fields

SEO data is stored in WordPress post meta under these keys:

| Meta Key | Purpose |
|----------|---------|
| `_yoast_wpseo_title` | SEO title template |
| `_yoast_wpseo_metadesc` | Meta description |
| `_yoast_wpseo_focuskw` | Focus keyphrase |
| `_yoast_wpseo_canonical` | Canonical URL |
| `_yoast_wpseo_meta-robots-noindex` | Noindex flag (1=noindex) |
| `_yoast_wpseo_opengraph-title` | Open Graph title |
| `_yoast_wpseo_opengraph-description` | Open Graph description |
| `_yoast_wpseo_opengraph-image` | Open Graph image URL |
| `_yoast_wpseo_twitter-title` | Twitter card title |
| `_yoast_wpseo_twitter-description` | Twitter card description |
| `_yoast_wpseo_twitter-image` | Twitter card image URL |
| `_yoast_wpseo_linkdex` | SEO score (0-100) |
| `_yoast_wpseo_content_score` | Readability score (0-100) |

## License

MIT
