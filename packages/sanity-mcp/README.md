# @cmsmcp/sanity

MCP server for Sanity -- 16 tools for GROQ queries, document CRUD, asset management, datasets, transactions, publishing, and history.

[![npm version](https://img.shields.io/npm/v/@cmsmcp/sanity.svg)](https://www.npmjs.com/package/@cmsmcp/sanity)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](../../LICENSE)

## Quick Start

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "sanity": {
      "command": "npx",
      "args": ["-y", "@cmsmcp/sanity"],
      "env": {
        "SANITY_PROJECT_ID": "your-project-id",
        "SANITY_DATASET": "production",
        "SANITY_TOKEN": "your-token"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add sanity -e SANITY_PROJECT_ID=xxx -e SANITY_DATASET=production -e SANITY_TOKEN=xxx -- npx -y @cmsmcp/sanity
```

### Cursor / Windsurf / Any MCP Client

Same JSON config format -- add to your client's MCP settings file.

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `SANITY_PROJECT_ID` | Yes | Sanity project ID |
| `SANITY_DATASET` | No | Dataset name (default: `production`) |
| `SANITY_TOKEN` | Yes | Sanity API token with write access |

## Available Tools (16 tools)

### Content (7 tools)

| Tool | Description |
|------|-------------|
| `sanity_query` | Execute a GROQ query against the Content Lake |
| `sanity_get_document` | Get a single document by ID |
| `sanity_create_document` | Create a new document |
| `sanity_update_document` | Update (patch) an existing document |
| `sanity_delete_document` | Delete a document |
| `sanity_publish_draft` | Publish a draft document |
| `sanity_increment_field` | Increment a numeric field value |
| `sanity_decrement_field` | Decrement a numeric field value |

### Datasets & System (3 tools)

| Tool | Description |
|------|-------------|
| `sanity_list_datasets` | List all datasets in the project |
| `sanity_list_document_types` | List all document types |
| `sanity_export_dataset` | Export a dataset |

### Assets (3 tools)

| Tool | Description |
|------|-------------|
| `sanity_list_assets` | List uploaded assets (images, files) |
| `sanity_upload_image` | Upload an image asset |
| `sanity_upload_file` | Upload a file asset |

### Transactions & History (2 tools)

| Tool | Description |
|------|-------------|
| `sanity_create_transaction` | Execute a multi-document transaction |
| `sanity_get_history` | Get document revision history |

## Examples

```
You: "Find all published blog posts"
AI: Uses sanity_query with a GROQ query like *[_type == "post" && !(_id in path("drafts.**"))]

You: "Create a new author document"
AI: Uses sanity_create_document with _type: "author" and the provided fields.

You: "Publish my draft post"
AI: Uses sanity_publish_draft to move the draft to the published state.

You: "Show the revision history for this document"
AI: Uses sanity_get_history to display all revisions with timestamps and authors.
```

## Development

```bash
# Build
npx turbo build --filter=@cmsmcp/sanity

# Test
npx turbo test --filter=@cmsmcp/sanity

# Dev mode
npx turbo dev --filter=@cmsmcp/sanity

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node packages/sanity-mcp/dist/index.js
```

## License

MIT
