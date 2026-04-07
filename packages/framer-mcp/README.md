# @cmsmcp/framer

MCP server for Framer -- 20 tools for managing CMS collections, pages, code components, project settings, and publishing.

> Part of [CMS MCP Hub](https://github.com/rahhuul/cms-mcp-hub) -- 589 tools across 12 CMS platforms. If this is useful, [give it a star](https://github.com/rahhuul/cms-mcp-hub/stargazers)!

[![npm version](https://img.shields.io/npm/v/@cmsmcp/framer.svg)](https://www.npmjs.com/package/@cmsmcp/framer)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](../../LICENSE)

## Quick Start

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "framer": {
      "command": "npx",
      "args": ["-y", "@cmsmcp/framer"],
      "env": {
        "FRAMER_PROJECT_URL": "https://framer.com/projects/abc123",
        "FRAMER_API_KEY": "framer_xxx"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add framer -e FRAMER_PROJECT_URL=https://framer.com/projects/abc123 -e FRAMER_API_KEY=framer_xxx -- npx -y @cmsmcp/framer
```

### Cursor / Windsurf / Any MCP Client

Same JSON config format -- add to your client's MCP settings file.

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `FRAMER_PROJECT_URL` | Yes | Your Framer project URL |
| `FRAMER_API_KEY` | Yes | Framer API key |

## Available Tools (20 tools)

### Collections (8 tools)

| Tool | Description |
|------|-------------|
| `framer_list_collections` | List all CMS collections in the project |
| `framer_get_collection` | Get a collection with its fields and items |
| `framer_create_collection` | Create a new CMS collection |
| `framer_create_collection_field` | Add a field to an existing collection |
| `framer_create_collection_item` | Create a new item in a collection |
| `framer_update_collection_item` | Update an existing collection item |
| `framer_delete_collection_item` | Delete an item from a collection |

### Pages (3 tools)

| Tool | Description |
|------|-------------|
| `framer_list_pages` | List all web pages with IDs, names, paths, and visibility |
| `framer_get_page` | Get detailed page info including properties and metadata |
| `framer_update_page` | Update a page's title, URL path, or visibility |

### Code Components (4 tools)

| Tool | Description |
|------|-------------|
| `framer_list_code_files` | List all code components and overrides |
| `framer_get_code_file` | Get the content of a specific code file |
| `framer_create_code_file` | Create a new React component or override |
| `framer_update_code_file` | Update the content of an existing code file |

### Project (3 tools)

| Tool | Description |
|------|-------------|
| `framer_get_project_info` | Get project name, ID, and URL |
| `framer_get_project_settings` | Get project config including publish info and custom code |
| `framer_update_project_settings` | Update project settings (custom code injection, etc.) |

### Publishing (3 tools)

| Tool | Description |
|------|-------------|
| `framer_get_changes` | Get diff of changes since last publish |
| `framer_publish_preview` | Publish to preview/staging |
| `framer_promote_to_production` | Promote a preview deployment to production |

## Examples

```
You: "List all my CMS collections"
AI: Uses framer_list_collections to retrieve all collections with their names, slugs, and item counts.

You: "Add a new blog post to my Blog collection"
AI: Uses framer_get_collection to find the Blog collection schema,
    then framer_create_collection_item to add the new entry.

You: "Publish my changes to staging"
AI: Uses framer_get_changes to show what will be published,
    then framer_publish_preview to deploy to staging.
```

## Development

```bash
# Build
npx turbo build --filter=@cmsmcp/framer

# Test
npx turbo test --filter=@cmsmcp/framer

# Dev mode
npx turbo dev --filter=@cmsmcp/framer

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node packages/framer-mcp/dist/index.js
```

## License

MIT
