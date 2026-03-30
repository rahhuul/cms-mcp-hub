# @cmsmcp/framer

MCP (Model Context Protocol) server for the **Framer** CMS platform. Enables AI agents to manage Framer projects — CMS collections, pages, code files, and publishing — through 20 tools.

## Requirements

- Node.js 18+
- Framer API key (Site Settings → General)
- Framer project URL (e.g., `https://framer.com/projects/abc123`)

## Installation

```bash
npm install @cmsmcp/framer
```

## Configuration

Set the following environment variables:

```bash
FRAMER_PROJECT_URL=https://framer.com/projects/your-project-id
FRAMER_API_KEY=your_api_key_here
```

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "framer": {
      "command": "npx",
      "args": ["@cmsmcp/framer"],
      "env": {
        "FRAMER_PROJECT_URL": "https://framer.com/projects/your-project-id",
        "FRAMER_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Claude Code

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "framer": {
      "command": "npx",
      "args": ["@cmsmcp/framer"],
      "env": {
        "FRAMER_PROJECT_URL": "https://framer.com/projects/your-project-id",
        "FRAMER_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Cursor

Add to your Cursor MCP settings:

```json
{
  "framer": {
    "command": "npx",
    "args": ["@cmsmcp/framer"],
    "env": {
      "FRAMER_PROJECT_URL": "https://framer.com/projects/your-project-id",
      "FRAMER_API_KEY": "your_api_key_here"
    }
  }
}
```

## Tools (20)

### Project (3)

| Tool | Description |
|------|-------------|
| `framer_get_project_info` | Get project name, ID, and URL |
| `framer_get_project_settings` | Get publish info and custom code settings |
| `framer_update_project_settings` | Update custom code injection |

### CMS Collections (7)

| Tool | Description |
|------|-------------|
| `framer_list_collections` | List all CMS collections |
| `framer_get_collection` | Get collection with fields and items |
| `framer_create_collection` | Create a new CMS collection |
| `framer_create_collection_field` | Add a field to a collection schema |
| `framer_create_collection_item` | Add an item to a collection |
| `framer_update_collection_item` | Update an existing collection item |
| `framer_delete_collection_item` | Remove items from a collection |

### Pages (3)

| Tool | Description |
|------|-------------|
| `framer_list_pages` | List all web pages |
| `framer_get_page` | Get page details and children |
| `framer_update_page` | Update page title, path, or visibility |

### Code Files (4)

| Tool | Description |
|------|-------------|
| `framer_list_code_files` | List all code components and overrides |
| `framer_get_code_file` | Read a code file's content |
| `framer_create_code_file` | Create a new React component |
| `framer_update_code_file` | Update a code file's content |

### Publishing (3)

| Tool | Description |
|------|-------------|
| `framer_get_changes` | Diff current state vs last publish |
| `framer_publish_preview` | Publish to preview/staging |
| `framer_promote_to_production` | Promote a deployment to production |

## Example Usage

```
User: List all my CMS collections

Agent: I'll use framer_list_collections to get your collections.
→ Returns: [{id: "abc", name: "Blog Posts", ...}, {id: "def", name: "Team Members", ...}]

User: Add a new blog post

Agent: First, let me get the collection fields with framer_get_collection.
Then I'll use framer_create_collection_item to add the post.
→ Creates item with the provided field data

User: Publish the changes

Agent: Let me check what changed with framer_get_changes.
→ Shows 2 added, 0 removed, 1 modified
Then I'll use framer_publish_preview to publish.
→ Returns deployment ID and preview URL
```

## Testing with MCP Inspector

```bash
npx @modelcontextprotocol/inspector node packages/framer-mcp/dist/index.js
```

## License

MIT
