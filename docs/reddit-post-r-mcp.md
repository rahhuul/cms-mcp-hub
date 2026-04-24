# Reddit Post — r/MCP

**Subreddit:** r/MCP (Model Context Protocol)

**Title:** I built 589 MCP tools for managing 12 CMS platforms — open source

---

Hey everyone! I've been building CMS MCP Hub — a monorepo of MCP servers that let AI assistants manage CMS content across 12 platforms.

**What it does:**
Your AI assistant (Claude, Cursor, Windsurf, Copilot) gets full CRUD access to your CMS. You say "create a blog post, add a featured image, optimize SEO, and publish" — it does all of it.

**Platforms & tool counts:**
- WordPress — 169 tools
- Shopify — 147 tools
- WooCommerce — 95 tools
- Ghost — 24
- Webflow — 21
- Payload CMS — 21
- Wix — 21
- Framer — 20
- Contentful — 20
- Yoast SEO — 18
- Strapi — 17
- Sanity — 16

**How it works:**
Each package is a standalone MCP server. Install with one command:

```bash
npx @cmsmcp/wordpress
```

Connects directly via official APIs — no CMS plugins required. Supports all auth methods (OAuth 1.0a, JWT, Bearer tokens, API keys, Application Passwords).

There's also a REST API Gateway that exposes all tools as HTTP endpoints with auto-generated OpenAPI spec — so you can use these from Python, n8n, Make, LangChain, or any HTTP client.

**Tech stack:** TypeScript (strict), Zod validation, 462+ tests, MIT licensed.

GitHub: github.com/rahhuul/cms-mcp-hub
npm: all 14 packages live under @cmsmcp scope

Would love feedback. What CMS integrations would you find most useful?
