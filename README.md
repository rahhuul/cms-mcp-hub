<p align="center">
  <h1 align="center">CMS MCP Hub</h1>
  <p align="center">
    <strong>439 MCP tools for managing CMS platforms with AI</strong>
  </p>
  <p align="center">
    Connect Claude, Cursor, Windsurf, Copilot, or any MCP client to WordPress, WooCommerce, Shopify, Framer, Strapi, Ghost, and more.
  </p>
</p>

<p align="center">
  <a href="https://github.com/rahhuul/cms-mcp-hub/actions/workflows/ci.yml"><img src="https://github.com/rahhuul/cms-mcp-hub/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@cmsmcp/wordpress"><img src="https://img.shields.io/npm/v/@cmsmcp/wordpress.svg?label=wordpress" alt="npm wordpress"></a>
  <a href="https://www.npmjs.com/package/@cmsmcp/woocommerce"><img src="https://img.shields.io/npm/v/@cmsmcp/woocommerce.svg?label=woocommerce" alt="npm woocommerce"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License"></a>
  <a href="https://www.npmjs.com/package/@cmsmcp/shopify"><img src="https://img.shields.io/npm/v/@cmsmcp/shopify.svg?label=shopify" alt="npm shopify"></a>
  <a href="#packages"><img src="https://img.shields.io/badge/Tools-439-blue.svg" alt="439 Tools"></a>
  <a href="#packages"><img src="https://img.shields.io/badge/Tests-227_passing-brightgreen.svg" alt="227 Tests"></a>
  <img src="https://img.shields.io/badge/TypeScript-strict-blue.svg" alt="TypeScript Strict">
  <img src="https://img.shields.io/badge/Node.js-18+-green.svg" alt="Node 18+">
</p>

---

## What is this?

CMS MCP Hub is a monorepo of [Model Context Protocol](https://modelcontextprotocol.io/) servers that let AI assistants manage your CMS content. Each package is a standalone MCP server you can run with one command.

**Your AI assistant can now create posts, manage products, upload images, update SEO, and more - across any CMS.**

```
You: "Create a blog post about AI tools, add a featured image, and optimize SEO"
Claude: Creates post → uploads image → sets categories/tags → writes meta description → publishes
```

## Quick Start

### Claude Desktop

```json
{
  "mcpServers": {
    "wordpress": {
      "command": "npx",
      "args": ["-y", "@cmsmcp/wordpress"],
      "env": {
        "WORDPRESS_URL": "https://yoursite.com",
        "WORDPRESS_USERNAME": "admin",
        "WORDPRESS_APP_PASSWORD": "xxxx xxxx xxxx xxxx"
      }
    }
  }
}
```

### Claude Code

```bash
# Add to .mcp.json in your project
{
  "mcpServers": {
    "wordpress": {
      "command": "npx",
      "args": ["-y", "@cmsmcp/wordpress"],
      "env": {
        "WORDPRESS_URL": "https://yoursite.com",
        "WORDPRESS_USERNAME": "admin",
        "WORDPRESS_APP_PASSWORD": "xxxx xxxx xxxx xxxx"
      }
    }
  }
}
```

### Cursor / Windsurf / Cline / Any MCP Client

Same JSON config format - just add to your client's MCP settings.

## Packages

| Package | CMS | Tools | Status | Install |
|---------|-----|-------|--------|---------|
| [`@cmsmcp/wordpress`](packages/wordpress-mcp/) | WordPress | **143** | Ready | `npx @cmsmcp/wordpress` |
| [`@cmsmcp/woocommerce`](packages/woocommerce-mcp/) | WooCommerce | **95** | Ready | `npx @cmsmcp/woocommerce` |
| [`@cmsmcp/framer`](packages/framer-mcp/) | Framer | **20** | Ready | `npx @cmsmcp/framer` |
| [`@cmsmcp/strapi`](packages/strapi-mcp/) | Strapi | **17** | Ready | `npx @cmsmcp/strapi` |
| [`@cmsmcp/ghost`](packages/ghost-mcp/) | Ghost | **17** | Ready | `npx @cmsmcp/ghost` |
| [`@cmsmcp/gateway`](packages/gateway/) | REST API | - | Ready | `npx @cmsmcp/gateway` |
| [`@cmsmcp/shopify`](packages/shopify-mcp/) | Shopify | **147** | Ready | `npx @cmsmcp/shopify` |
| `@cmsmcp/webflow` | Webflow | - | Planned | - |
| `@cmsmcp/contentful` | Contentful | - | Planned | - |
| `@cmsmcp/payload` | Payload CMS | - | Planned | - |
| `@cmsmcp/sanity` | Sanity | - | Planned | - |
| `@cmsmcp/wix` | Wix | - | Planned | - |
| `@cmsmcp/yoast` | Yoast SEO | - | Planned | - |

## What can you do?

### WordPress (143 tools)

| Category | Examples |
|----------|---------|
| **Content** | Create/edit/delete posts, pages, media with file upload |
| **Taxonomy** | Manage categories, tags, custom post types, custom taxonomies |
| **Users** | Create users, manage roles, application passwords |
| **Menus** | Create navigation menus with items in one call |
| **Plugins** | Install, activate, deactivate, delete plugins |
| **Themes** | List/switch themes |
| **Blocks** | Reusable blocks, block types, patterns, renderer |
| **Site Editor** | Templates, template parts, navigation, global styles |
| **Revisions** | Browse/restore post, page, template revisions |
| **Fonts** | Manage font families and font faces |
| **SEO** | Read/update Yoast SEO fields (title, description, keywords, OG) |
| **ACF** | Read/update Advanced Custom Fields values |
| **Workflows** | One-call post creation with categories + tags + image + SEO |
| **Resources** | 10 browseable data sources (recent posts, drafts, calendar) |
| **Prompts** | 6 templates (blog creator, SEO audit, site health report) |

### WooCommerce (95 tools)

| Category | Examples |
|----------|---------|
| **Products** | CRUD + variations, attributes, terms, shipping classes |
| **Orders** | CRUD + notes, refunds |
| **Customers** | CRUD + downloads |
| **Coupons** | Create percent/fixed/product discounts with limits |
| **Reviews** | Moderate product reviews |
| **Tax** | Tax rates and classes CRUD |
| **Webhooks** | Create event-driven webhooks |
| **Reports** | Sales analytics, top sellers, totals |
| **Settings** | Store settings, payment gateways, shipping zones |
| **System** | System status, diagnostics, data (countries/currencies) |
| **Batch** | Batch create/update/delete up to 100 items per call |
| **Workflows** | Store dashboard, full product creator, order processor |

### Shopify (147 tools)

| Category | Examples |
|----------|---------|
| **Products** | CRUD + variants + images (18 tools) |
| **Collections** | Custom + smart collections + collects (13 tools) |
| **Orders** | CRUD + close + cancel + draft orders + transactions + refunds + fulfillments (34 tools) |
| **Customers** | CRUD + search + addresses + set default (13 tools) |
| **Inventory** | Items, levels (adjust/set), locations (9 tools) |
| **Content** | Pages, blogs, articles, redirects (24 tools) |
| **Store** | Themes, assets, discounts, gift cards, metafields, webhooks, events (36 tools) |

### Framer (20 tools)

CMS collections, pages, code files, publishing/deployment - via WebSocket API.

### Strapi (17 tools)

Dynamic content type discovery, entry CRUD, publish/unpublish, i18n localization, media, components.

### Ghost (17 tools)

Posts, pages, tags, authors, members, newsletters, tiers - with Admin API JWT auth.

## Gateway - Universal REST API

The gateway exposes all MCP tools as a REST API, making them accessible from any platform:

```bash
# Start the gateway
npx @cmsmcp/gateway

# Call any tool via HTTP
curl -X POST http://localhost:4777/api/wordpress/wp_list_posts \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{"per_page": 5}'
```

**Works with:** Python, n8n, Make, Zapier, LangChain, custom apps, any HTTP client.

Features:
- Auto-generated OpenAPI 3.0 spec at `/openapi.json`
- Web dashboard with tool browser and live tester
- API key authentication
- CORS enabled

## Architecture

```
cms-mcp-hub/
├── packages/
│   ├── shared/              # ApiClient, error handling, pagination, rate limiting
│   ├── wordpress-mcp/       # 143 tools - WordPress REST API v2
│   ├── shopify-mcp/         # 147 tools - Shopify Admin REST API
│   ├── woocommerce-mcp/     # 95 tools - WooCommerce REST API v3
│   ├── framer-mcp/          # 20 tools - Framer Server API (WebSocket)
│   ├── strapi-mcp/          # 17 tools - Strapi REST API
│   ├── ghost-mcp/           # 17 tools - Ghost Admin API (JWT)
│   └── gateway/             # REST API gateway with OpenAPI spec
├── turbo.json               # Turborepo build config
├── tsconfig.base.json       # Shared TypeScript config
└── package.json             # Monorepo root
```

**Tech stack:** TypeScript (strict), Node.js 18+, Turborepo, tsup, Zod, Vitest

**Auth per platform:**
| Platform | Auth Method |
|----------|-------------|
| WordPress | Application Passwords (Basic Auth) |
| Shopify | X-Shopify-Access-Token header |
| WooCommerce | OAuth 1.0a (HTTP) / Basic Auth (HTTPS) |
| Framer | API Key (WebSocket) |
| Strapi | Bearer Token |
| Ghost | JWT (HS256) from Admin API Key |

## Development

```bash
git clone https://github.com/rahhuul/cms-mcp-hub.git
cd cms-mcp-hub
npm install
npx turbo build        # Build all packages
npx turbo test         # Run all tests (190 passing)

# Build specific package
npx turbo build --filter=@cmsmcp/wordpress

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node packages/wordpress-mcp/dist/index.js
```

## Environment Variables

### WordPress
```bash
WORDPRESS_URL=https://yoursite.com
WORDPRESS_USERNAME=admin
WORDPRESS_APP_PASSWORD=xxxx xxxx xxxx xxxx   # WP Admin → Users → Profile → Application Passwords
```

### WooCommerce
```bash
WOOCOMMERCE_URL=https://yourstore.com
WOOCOMMERCE_CONSUMER_KEY=ck_xxx              # WP Admin → WooCommerce → Settings → Advanced → REST API
WOOCOMMERCE_CONSUMER_SECRET=cs_xxx
```

### Shopify
```bash
SHOPIFY_STORE=mystore                        # Store name (from mystore.myshopify.com)
SHOPIFY_ACCESS_TOKEN=shpat_xxx               # Admin → Settings → Apps → Develop apps → Custom app
```

### Framer
```bash
FRAMER_PROJECT_URL=https://framer.com/projects/your-project-id
FRAMER_API_KEY=your-api-key                  # Site Settings → General
```

### Strapi
```bash
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your-token                  # Settings → API Tokens
```

### Ghost
```bash
GHOST_URL=https://myblog.com
GHOST_ADMIN_API_KEY=id:secret                # Settings → Integrations → Custom Integration
```

## Why CMS MCP Hub?

- **439 tools** across 7 CMS platforms - the most comprehensive MCP CMS integration
- **No plugins required** - connects directly via official APIs
- **One command** - `npx @cmsmcp/wordpress` and you're connected
- **AI-native** - tool descriptions designed for LLMs to use correctly
- **Full CRUD** - not shallow wrappers, complete API coverage
- **Type-safe** - TypeScript strict mode, Zod validation on all inputs
- **Battle-tested auth** - OAuth 1.0a, JWT, Application Passwords, Bearer tokens
- **Workflows** - multi-step operations in a single tool call
- **Gateway** - REST API makes tools accessible from any platform
- **Open source** - MIT licensed

## Contributing

Contributions welcome! The remaining CMS packages (Webflow, Shopify, Contentful, Payload, Sanity, Wix, Yoast) have stub packages ready for implementation.

```bash
# Add a new CMS package
cd packages/{cms}-mcp
# Follow the pattern in packages/wordpress-mcp or packages/ghost-mcp
```

## License

MIT — see [LICENSE](LICENSE) for details.

---

<p align="center">Built by <a href="https://github.com/rahhuul">@rahhuul</a></p>
