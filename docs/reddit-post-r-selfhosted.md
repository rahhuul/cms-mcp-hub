# Reddit Post — r/selfhosted

**Subreddit:** r/selfhosted

**Title:** Open-source MCP gateway that lets AI manage your self-hosted CMS (WordPress, Ghost, Strapi, Payload, Sanity)

---

Built an open-source project that bridges AI assistants with self-hosted CMS platforms.

If you self-host WordPress, Ghost, Strapi, Payload, or Sanity you can now connect Claude, Cursor, or any MCP-compatible AI to manage your content directly via API.

**Example workflow in one prompt:**
"Create a blog post about homelab setups, add tags, set a featured image, write an SEO description, and publish"

The AI handles all the API calls.

**Self-hosted friendly platforms supported:**
- WordPress (169 tools) - posts, pages, media, plugins, themes, menus, blocks, users, SEO
- Ghost (24 tools) - posts, pages, tags, members, newsletters
- Strapi (17 tools) - dynamic content types, entries, media, i18n
- Payload CMS (21 tools) - collections, globals, media, versions
- Sanity (16 tools) - GROQ queries, documents, assets, datasets

Also includes a REST API Gateway you can self-host exposes everything as HTTP endpoints with OpenAPI spec. Works with Python, n8n, Make, or any HTTP client.

No external dependencies beyond the CMS APIs themselves. TypeScript, MIT licensed, 462+ tests.

```bash
npx @cmsmcp/wordpress
```

One command, connects to your instance.

GitHub: github.com/rahhuul/cms-mcp-hub

What CMS are you all self-hosting? Curious which integrations would be most valuable.