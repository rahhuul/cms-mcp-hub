# Reddit Post — r/webdev

**Subreddit:** r/webdev

**Title:** I built 589 tools that let AI assistants manage 12 CMS platforms — WordPress, Shopify, WooCommerce, Ghost, and more

---

I've spent a lot of time dealing with CMS APIs — every platform has its own auth, pagination quirks, and error handling. So I built a unified layer that lets AI assistants handle it all.

**CMS MCP Hub** is a monorepo of MCP (Model Context Protocol) servers. Each one gives AI full CRUD access to a CMS platform.

You tell your AI: "Create a landing page with a hero section, features grid, and pricing table" — and it builds it using actual WordPress block editor APIs, not just dumping HTML.

**12 platforms covered:**
WordPress (169 tools), Shopify (147), WooCommerce (95), Ghost (24), Webflow (21), Payload (21), Wix (21), Framer (20), Contentful (20), Yoast SEO (18), Strapi (17), Sanity (16)

**Why this is different from other MCP servers:**
- Full API coverage, not just basic CRUD — WordPress alone has blocks, templates, fonts, widgets, revisions, menus, plugins
- Proper error handling with actionable suggestions
- Rate limiting, retry with backoff, pagination built in
- REST API Gateway with auto-generated OpenAPI spec
- Works with Claude, Cursor, Windsurf, Copilot, or any MCP client

**Tech:** TypeScript strict, Zod validation, 462+ tests, zero CMS plugins needed.

```bash
npx @cmsmcp/wordpress
```

GitHub: github.com/rahhuul/cms-mcp-hub

Open source, MIT licensed. Feedback welcome — especially on which platforms you'd want deeper coverage for.
