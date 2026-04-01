# @cmsmcp/contentful

MCP (Model Context Protocol) server for **Contentful** CMS platform. Provides 17 tools for AI agents to manage content types, entries, assets, environments, locales, tags, and bulk operations via the Contentful Content Management API (CMA).

## Tools (17)

| # | Tool | Description |
|---|------|-------------|
| 1 | `contentful_list_spaces` | Get current space details |
| 2 | `contentful_list_content_types` | List all content types with field schemas |
| 3 | `contentful_get_content_type` | Get a content type by ID |
| 4 | `contentful_create_content_type` | Create a new content type with fields |
| 5 | `contentful_list_entries` | List entries with filtering and search |
| 6 | `contentful_get_entry` | Get an entry by ID |
| 7 | `contentful_create_entry` | Create a new draft entry |
| 8 | `contentful_update_entry` | Update an entry (version required) |
| 9 | `contentful_delete_entry` | Delete an entry (must be unpublished) |
| 10 | `contentful_publish_entry` | Publish an entry |
| 11 | `contentful_unpublish_entry` | Unpublish an entry |
| 12 | `contentful_list_assets` | List assets with MIME type filtering |
| 13 | `contentful_upload_asset` | Create an asset from a public URL |
| 14 | `contentful_list_environments` | List all environments |
| 15 | `contentful_list_locales` | List configured locales |
| 16 | `contentful_list_tags` | List content tags |
| 17 | `contentful_bulk_publish` | Publish up to 200 entities at once |

## Setup

### Environment Variables

```bash
CONTENTFUL_SPACE_ID=your_space_id          # Required
CONTENTFUL_MANAGEMENT_TOKEN=your_cma_token # Required
CONTENTFUL_ENVIRONMENT=master              # Optional, defaults to "master"
```

### Getting Your Credentials

1. Go to **Settings > API keys** in the Contentful web app
2. Create a **Content Management API** personal access token at [app.contentful.com/account/profile/cma_tokens](https://app.contentful.com/account/profile/cma_tokens)
3. Your Space ID is in **Settings > General settings**

### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "contentful": {
      "command": "npx",
      "args": ["-y", "@cmsmcp/contentful"],
      "env": {
        "CONTENTFUL_SPACE_ID": "your_space_id",
        "CONTENTFUL_MANAGEMENT_TOKEN": "your_cma_token",
        "CONTENTFUL_ENVIRONMENT": "master"
      }
    }
  }
}
```

## API Details

- **API:** Contentful Content Management API (CMA)
- **Base URL:** `https://api.contentful.com/spaces/{spaceId}/environments/{environmentId}/`
- **Auth:** Bearer token
- **Content-Type:** `application/vnd.contentful.management.v1+json`
- **Rate Limit:** 10 requests/second (with automatic retry on 429)
- **Versioning:** Uses `X-Contentful-Version` header for optimistic locking on updates

## Key Concepts

### Localized Fields

All entry fields in Contentful are localized. When creating or updating entries, provide values per locale:

```json
{
  "fields": {
    "title": { "en-US": "Hello World" },
    "body": { "en-US": "Content here", "de-DE": "Inhalt hier" }
  }
}
```

### Optimistic Locking

Update, delete, publish, and unpublish operations require the current `version` number (from `sys.version`). Fetch the entry first to get its version.

### Draft/Published Workflow

Entries are created as drafts. Use `contentful_publish_entry` to publish and `contentful_unpublish_entry` to revert to draft. Entries must be unpublished before deletion.

## Development

```bash
# Build
npx turbo build --filter=@cmsmcp/contentful

# Test
npx turbo test --filter=@cmsmcp/contentful

# Dev mode
npx turbo dev --filter=@cmsmcp/contentful

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node packages/contentful-mcp/dist/index.js
```

## License

MIT
