# @cmsmcp/sanity

MCP (Model Context Protocol) server for **Sanity CMS**. Provides 12 tools for AI agents to interact with the Sanity Content Lake via GROQ queries, document CRUD, asset management, transactions, and publishing.

## Tools (12)

| Tool | Description |
|------|-------------|
| `sanity_query` | Execute GROQ queries against the dataset |
| `sanity_get_document` | Get a document by ID |
| `sanity_create_document` | Create a new document |
| `sanity_update_document` | Update document fields (set/unset) |
| `sanity_delete_document` | Delete a document by ID |
| `sanity_list_datasets` | List all project datasets |
| `sanity_list_document_types` | List all unique document types |
| `sanity_list_assets` | List image or file assets with pagination |
| `sanity_upload_image` | Upload an image from URL |
| `sanity_create_transaction` | Execute atomic mutations in a transaction |
| `sanity_get_history` | Get transaction history for a document |
| `sanity_publish_draft` | Publish a draft document |

## Configuration

Set the following environment variables:

```bash
SANITY_PROJECT_ID=your-project-id    # Required
SANITY_TOKEN=your-api-token          # Required
SANITY_DATASET=production            # Optional (default: "production")
SANITY_API_VERSION=2024-01           # Optional (default: "2024-01")
```

## Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "sanity": {
      "command": "npx",
      "args": ["-y", "@cmsmcp/sanity"],
      "env": {
        "SANITY_PROJECT_ID": "your-project-id",
        "SANITY_TOKEN": "your-api-token",
        "SANITY_DATASET": "production"
      }
    }
  }
}
```

## GROQ Examples

```
# List all posts
*[_type == "post"] | order(_createdAt desc) [0...10]

# Get post by slug
*[_type == "post" && slug.current == "hello-world"][0]

# Count documents by type
count(*[_type == "post"])

# Full-text search
*[_type == "post" && title match "sanity*"]
```

## Development

```bash
npm install
npm run build
npm test
```

## License

MIT
