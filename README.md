<p align="center">
  <h1 align="center">CMS MCP Hub</h1>
  <p align="center">
    <strong>757 MCP tools for managing CMS platforms with AI</strong>
  </p>
  <p align="center">
    Connect Claude, Cursor, Windsurf, Copilot, or any MCP client to WordPress, WooCommerce, Shopify, Framer, Strapi, Ghost, Webflow, Payload, Contentful, Wix, Yoast, and Sanity.
  </p>
</p>

<p align="center">
  <a href="https://github.com/rahhuul/cms-mcp-hub/actions/workflows/ci.yml"><img src="https://github.com/rahhuul/cms-mcp-hub/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@cmsmcp/wordpress"><img src="https://img.shields.io/npm/v/@cmsmcp/wordpress.svg?label=wordpress" alt="npm wordpress"></a>
  <a href="https://www.npmjs.com/package/@cmsmcp/shopify"><img src="https://img.shields.io/npm/v/@cmsmcp/shopify.svg?label=shopify" alt="npm shopify"></a>
  <a href="https://www.npmjs.com/package/@cmsmcp/woocommerce"><img src="https://img.shields.io/npm/v/@cmsmcp/woocommerce.svg?label=woocommerce" alt="npm woocommerce"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License"></a>
  <a href="#packages"><img src="https://img.shields.io/badge/Tools-757-blue.svg" alt="757 Tools"></a>
  <a href="#packages"><img src="https://img.shields.io/badge/Platforms-12-orange.svg" alt="12 Platforms"></a>
  <img src="https://img.shields.io/badge/TypeScript-strict-blue.svg" alt="TypeScript Strict">
  <img src="https://img.shields.io/badge/Node.js-18+-green.svg" alt="Node 18+">
</p>

---

## What is this?

CMS MCP Hub is a monorepo of [Model Context Protocol](https://modelcontextprotocol.io/) servers that let AI assistants manage your CMS content. Each package is a standalone MCP server you can run with one command.

**Your AI assistant can now create posts, manage products, upload images, update SEO, and more — across 12 CMS platforms.**

```
You: "Create a blog post about AI tools, add a featured image, and optimize SEO"
Claude: Creates post -> uploads image -> sets categories/tags -> writes meta description -> publishes
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
claude mcp add wordpress -e WORDPRESS_URL=https://yoursite.com \
  -e WORDPRESS_USERNAME=admin \
  -e WORDPRESS_APP_PASSWORD="xxxx xxxx xxxx xxxx" \
  -- npx -y @cmsmcp/wordpress
```

### Cursor / Windsurf / Cline / Any MCP Client

Same JSON config format — just add to your client's MCP settings.

## Packages

| Package | CMS | Tools | Status | Install |
|---------|-----|-------|--------|---------|
| [`@cmsmcp/wordpress`](packages/wordpress-mcp/) | WordPress | **337** | Ready | `npx @cmsmcp/wordpress` |
| [`@cmsmcp/shopify`](packages/shopify-mcp/) | Shopify | **147** | Ready | `npx @cmsmcp/shopify` |
| [`@cmsmcp/woocommerce`](packages/woocommerce-mcp/) | WooCommerce | **95** | Ready | `npx @cmsmcp/woocommerce` |
| [`@cmsmcp/ghost`](packages/ghost-mcp/) | Ghost | **24** | Ready | `npx @cmsmcp/ghost` |
| [`@cmsmcp/webflow`](packages/webflow-mcp/) | Webflow | **21** | Ready | `npx @cmsmcp/webflow` |
| [`@cmsmcp/payload`](packages/payload-mcp/) | Payload CMS | **21** | Ready | `npx @cmsmcp/payload` |
| [`@cmsmcp/wix`](packages/wix-mcp/) | Wix | **21** | Ready | `npx @cmsmcp/wix` |
| [`@cmsmcp/framer`](packages/framer-mcp/) | Framer | **20** | Ready | `npx @cmsmcp/framer` |
| [`@cmsmcp/contentful`](packages/contentful-mcp/) | Contentful | **20** | Ready | `npx @cmsmcp/contentful` |
| [`@cmsmcp/yoast`](packages/yoast-mcp/) | Yoast SEO | **18** | Ready | `npx @cmsmcp/yoast` |
| [`@cmsmcp/strapi`](packages/strapi-mcp/) | Strapi | **17** | Ready | `npx @cmsmcp/strapi` |
| [`@cmsmcp/sanity`](packages/sanity-mcp/) | Sanity | **16** | Ready | `npx @cmsmcp/sanity` |
| [`@cmsmcp/gateway`](packages/gateway/) | REST API | - | Ready | `npx @cmsmcp/gateway` |

## What can you do?

### WordPress (337 tools)

| Category | Examples |
|----------|---------|
| **Content** | Create/edit/delete posts, pages, media with file upload |
| **Taxonomy** | Manage categories, tags, custom post types, custom taxonomies |
| **Users** | Create users, manage roles, application passwords |
| **Menus** | Create navigation menus with items in one call |
| **Plugins** | Install, activate, deactivate, delete plugins |
| **Themes & Customizer** | List/switch themes, read/write Customizer settings, export/import |
| **Blocks & Patterns** | Reusable blocks, block types, patterns, block renderer, pattern directory |
| **Block Editor** | Build Gutenberg content, create landing pages, component library (hero, pricing, FAQ…) |
| **Site Editor** | Templates, template parts, navigation, global styles |
| **Revisions** | Browse/restore post, page, and template revisions |
| **Fonts** | Manage font families and font faces |
| **Widgets** | Manage widget areas and widget instances; block shortcuts |
| **Custom Post Types** | Discover and CRUD any registered post type or taxonomy |
| **ACF Deep Integration** | Read/write ACF fields, repeaters, flexible content; clone values; options pages |
| **Page Builders** | Elementor, Divi, Bricks — read/write native JSON, update elements, design system |
| **SEO & Analysis** | Yoast SEO, RankMath score, readability, broken links, image audit, structured data |
| **WP-CLI Bridge** | Run WP-CLI commands, export/import WXR, database search-replace, cache flush |
| **Staging & Migration** | Push/pull content between sites, compare, sync taxonomies and media |
| **Bulk Operations** | Find/replace, meta updates, status changes, term assignment, mass delete |
| **Snapshots & Backup** | Content snapshots, plugin snapshots, diff, restore, safe-update with rollback |
| **Activity Log** | Log entries, undo actions, stats, export |
| **Database Tools** | Table sizes, optimize, cleanup revisions/transients |
| **WP-Cron** | List/run/delete scheduled events, schedule status check |
| **Security** | Comprehensive security audit, file permissions, content XSS scan |
| **Multisite** | List/create/update/delete network sites, network plugins/themes |
| **Email Tools** | Test delivery, check DNS (SPF/DKIM/DMARC), get email log |
| **Stock Images** | Search Openverse, sideload into media library |
| **Advanced Media** | Audit, regenerate thumbnails, bulk alt text, find unused, replace media |
| **Multi-Site Manager** | Switch active site, list configured sites |
| **Workflows** | One-call full post creation with categories + tags + image + SEO |

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

### Ghost (24 tools)

| Category | Examples |
|----------|---------|
| **Posts** | Create/edit/delete posts with Lexical JSON support |
| **Pages** | Create and manage pages |
| **Tags** | Create and organize tags |
| **Members** | Subscriber and member management |
| **Newsletters** | Newsletter and tier configuration |
| **Images** | Upload and manage site images |
| **Webhooks** | Webhook management for integrations |

### Webflow (21 tools)

Sites, collections, collection items, pages, products, orders, publishing, domains, and webhooks — via Webflow API v2.

### Payload CMS (21 tools)

Collections, entries, globals, media, access control, version management, bulk operations — with API key or email/password auth.

### Wix (21 tools)

Data collections, eCommerce products, blog posts, contacts/CRM, bookings, orders — with WQL query support.

### Framer (20 tools)

CMS collections, pages, code files, publishing/deployment — via WebSocket API.

### Contentful (20 tools)

Content types, entries, assets, environments, locales, tags, bulk publishing — via Content Management API.

### Yoast SEO (18 tools)

SEO metadata, scores, readability, redirects, social data, schema markup, sitemaps — via WordPress REST API.

### Strapi (17 tools)

Dynamic content type discovery, entry CRUD, publish/unpublish, i18n localization, media, components.

### Sanity (16 tools)

GROQ queries, document CRUD, assets, datasets, publishing, transactions — via Content Lake API.

## Gateway — Universal REST API

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
- Pre-built action packs for ChatGPT's 30-action limit
- Web dashboard with tool browser and live tester
- API key authentication
- CORS enabled

## Architecture

```
cms-mcp-hub/
├── packages/
│   ├── shared/              # ApiClient, error handling, pagination, rate limiting
│   ├── wordpress-mcp/       # 337 tools — WordPress REST API v2 + companion plugin
│   ├── shopify-mcp/         # 147 tools — Shopify Admin REST API
│   ├── woocommerce-mcp/     # 95 tools — WooCommerce REST API v3
│   ├── ghost-mcp/           # 24 tools — Ghost Admin API (JWT)
│   ├── webflow-mcp/         # 21 tools — Webflow API v2
│   ├── payload-mcp/         # 21 tools — Payload REST API
│   ├── wix-mcp/             # 21 tools — Wix REST API v2
│   ├── framer-mcp/          # 20 tools — Framer Server API (WebSocket)
│   ├── contentful-mcp/      # 20 tools — Contentful CMA
│   ├── yoast-mcp/           # 18 tools — Yoast SEO via WP REST API
│   ├── strapi-mcp/          # 17 tools — Strapi REST API
│   ├── sanity-mcp/          # 16 tools — Sanity Content Lake API
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
| Ghost | JWT (HS256) from Admin API Key |
| Webflow | Bearer Token |
| Payload | API Key or Email/Password (JWT) |
| Wix | API Key + Site ID headers |
| Framer | API Key (WebSocket) |
| Contentful | Bearer Token (CMA) |
| Yoast | Application Passwords (Basic Auth) |
| Strapi | Bearer Token |
| Sanity | Bearer Token |

## Development

```bash
git clone https://github.com/rahhuul/cms-mcp-hub.git
cd cms-mcp-hub
npm install
npx turbo build        # Build all packages
npx turbo test         # Run all tests

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
WORDPRESS_APP_PASSWORD=xxxx xxxx xxxx xxxx   # WP Admin -> Users -> Profile -> Application Passwords
```

### Shopify
```bash
SHOPIFY_STORE=mystore                        # Store name (from mystore.myshopify.com)
SHOPIFY_ACCESS_TOKEN=shpat_xxx               # Admin -> Settings -> Apps -> Develop apps -> Custom app
```

### WooCommerce
```bash
WOOCOMMERCE_URL=https://yourstore.com
WOOCOMMERCE_CONSUMER_KEY=ck_xxx              # WP Admin -> WooCommerce -> Settings -> Advanced -> REST API
WOOCOMMERCE_CONSUMER_SECRET=cs_xxx
```

### Ghost
```bash
GHOST_URL=https://myblog.com
GHOST_ADMIN_API_KEY=id:secret                # Settings -> Integrations -> Custom Integration
GHOST_CONTENT_API_KEY=xxx                    # Optional — for read-only access
```

### Webflow
```bash
WEBFLOW_API_TOKEN=xxx                        # Site Settings -> Integrations -> API Access
```

### Payload CMS
```bash
PAYLOAD_URL=http://localhost:3000
PAYLOAD_API_KEY=xxx                          # Or use PAYLOAD_EMAIL + PAYLOAD_PASSWORD
```

### Wix
```bash
WIX_API_KEY=xxx                              # Wix Developers -> API Keys
WIX_SITE_ID=xxx
```

### Framer
```bash
FRAMER_PROJECT_URL=https://framer.com/projects/your-project-id
FRAMER_API_KEY=your-api-key                  # Site Settings -> General
```

### Contentful
```bash
CONTENTFUL_SPACE_ID=xxx
CONTENTFUL_MANAGEMENT_TOKEN=xxx              # Settings -> CMA Tokens
CONTENTFUL_ENVIRONMENT=master                # Optional, defaults to master
```

### Yoast SEO
```bash
YOAST_SITE_URL=https://mysite.com
YOAST_USERNAME=admin
YOAST_APP_PASSWORD=xxx                       # Same as WordPress Application Passwords
```

### Strapi
```bash
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your-token                  # Settings -> API Tokens
```

### Sanity
```bash
SANITY_PROJECT_ID=xxx
SANITY_TOKEN=xxx                             # manage.sanity.io -> API -> Tokens
SANITY_DATASET=production                    # Optional, defaults to production
```

## Why CMS MCP Hub?

- **757 tools** across 12 CMS platforms — the most comprehensive MCP CMS integration
- **No plugins required** — connects directly via official APIs
- **One command** — `npx @cmsmcp/wordpress` and you're connected
- **AI-native** — tool descriptions designed for LLMs to use correctly
- **Full CRUD** — not shallow wrappers, complete API coverage
- **Type-safe** — TypeScript strict mode, Zod validation on all inputs
- **Battle-tested auth** — OAuth 1.0a, JWT, Application Passwords, Bearer tokens, API keys
- **Workflows** — multi-step operations in a single tool call
- **Gateway** — REST API makes tools accessible from any platform
- **Open source** — MIT licensed

## Like This Project?

If CMS MCP Hub is useful to you, please consider giving it a **[star on GitHub](https://github.com/rahhuul/cms-mcp-hub)**. It helps others discover the project and motivates continued development.

You can also help by:
- Sharing this project with developers who work with CMS platforms
- [Reporting bugs or requesting features](https://github.com/rahhuul/cms-mcp-hub/issues)
- Contributing new CMS integrations or improvements

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```bash
# Add a new CMS package
cd packages/{cms}-mcp
# Follow the pattern in packages/ghost-mcp or packages/wordpress-mcp
```

## License

MIT — see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built by <a href="https://github.com/rahhuul">@rahhuul</a>
  <br/>
  If this helped you, <a href="https://github.com/rahhuul/cms-mcp-hub/stargazers">give it a star</a>
</p>
