# Reddit Post — r/ClaudeAI / r/ChatGPTPro

**Subreddit:** r/ClaudeAI or r/ChatGPTPro

**Title:** 589 open-source tools to let Claude manage WordPress, Shopify, WooCommerce, and 9 other CMS platforms

---

I built CMS MCP Hub — a set of MCP servers that give Claude (and other AI assistants) full control over 12 CMS platforms.

**Instead of manually logging into your CMS dashboard, you just tell Claude what you want:**

- "List my draft posts and publish the ones about JavaScript"
- "Create a product with 3 size variants and a 20% launch discount"
- "Run a site audit and check which plugins need updates"
- "Create a blog post, upload a featured image, set categories, write SEO meta, and publish"

It handles everything — multiple API calls, proper auth, error handling.

**Supported platforms:**
WordPress, Shopify, WooCommerce, Ghost, Webflow, Payload CMS, Wix, Framer, Contentful, Yoast SEO, Strapi, Sanity

**Setup in Claude Desktop takes 30 seconds** — just add the config:

```json
{
  "mcpServers": {
    "wordpress": {
      "command": "npx",
      "args": ["-y", "@cmsmcp/wordpress"],
      "env": {
        "WORDPRESS_URL": "https://yoursite.com",
        "WORDPRESS_USERNAME": "admin",
        "WORDPRESS_APP_PASSWORD": "your-app-password"
      }
    }
  }
}
```

There's also a REST API Gateway if you want to use these tools from ChatGPT, Python, n8n, or any HTTP client.

GitHub: github.com/rahhuul/cms-mcp-hub

Open source, MIT licensed. Happy to answer questions.
