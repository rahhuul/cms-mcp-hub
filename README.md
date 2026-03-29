# CMS MCP Hub

> MCP servers for every major CMS platform. Connect AI agents to your CMS.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## What is this?

CMS MCP Hub is a collection of [Model Context Protocol](https://modelcontextprotocol.io/) servers that let AI assistants (Claude, Cursor, Claude Code, VS Code Copilot) manage your CMS content programmatically.

**One `npx` command. Your AI can manage your website.**

## Packages

| Package | CMS | Status | Install |
|---------|-----|--------|---------|
| `@cmsmcp/framer` | Framer | 🚧 Building | `npx @cmsmcp/framer` |
| `@cmsmcp/woocommerce` | WooCommerce | 🚧 Building | `npx @cmsmcp/woocommerce` |
| `@cmsmcp/strapi` | Strapi | 🚧 Building | `npx @cmsmcp/strapi` |
| `@cmsmcp/ghost` | Ghost | 🚧 Building | `npx @cmsmcp/ghost` |
| `@cmsmcp/webflow` | Webflow | 📋 Planned | `npx @cmsmcp/webflow` |
| `@cmsmcp/payload` | Payload CMS | 📋 Planned | `npx @cmsmcp/payload` |
| `@cmsmcp/shopify` | Shopify | 📋 Planned | `npx @cmsmcp/shopify` |
| `@cmsmcp/contentful` | Contentful | 📋 Planned | `npx @cmsmcp/contentful` |
| `@cmsmcp/wix` | Wix | 📋 Planned | `npx @cmsmcp/wix` |
| `@cmsmcp/yoast` | Yoast SEO | 📋 Planned | `npx @cmsmcp/yoast` |
| `@cmsmcp/sanity` | Sanity | 📋 Planned | `npx @cmsmcp/sanity` |

## Quick Start

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "framer": {
      "command": "npx",
      "args": ["-y", "@cmsmcp/framer"],
      "env": {
        "FRAMER_PROJECT_URL": "https://framer.com/projects/your-project-id",
        "FRAMER_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add framer -- npx -y @cmsmcp/framer
```

### Cursor

Add to `.cursor/mcp.json` in your project:

```json
{
  "mcpServers": {
    "framer": {
      "command": "npx",
      "args": ["-y", "@cmsmcp/framer"],
      "env": {
        "FRAMER_PROJECT_URL": "https://framer.com/projects/your-project-id",
        "FRAMER_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Why CMS MCP Hub?

- **One command per CMS** — No complex setup. Just `npx` and go.
- **Deep integrations** — Not shallow wrappers. Full CRUD, pagination, batch ops.
- **AI-native** — Tool descriptions designed for LLMs to understand and use correctly.
- **TypeScript-first** — Full type safety, Zod validation on all inputs.
- **Open source** — MIT licensed. Contribute, fork, extend.

## Development

```bash
# Clone
git clone https://github.com/rahhuul/cms-mcp-hub.git
cd cms-mcp-hub

# Install
npm install

# Build all
npx turbo build

# Build specific package
npx turbo build --filter=@cmsmcp/framer

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node packages/framer-mcp/dist/index.js
```

## Contributing

Contributions welcome! See [CONTRIBUTING.md](docs/contributing.md) for guidelines.

## License

MIT — see [LICENSE](LICENSE) for details.

---

Built by [@rahhuul](https://github.com/rahhuul)
