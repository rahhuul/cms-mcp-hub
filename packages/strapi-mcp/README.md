# @cmsmcp/strapi

MCP server for **Strapi** headless CMS. Enables AI agents to manage content across dynamic content types with 17 tools, including full CRUD, publish/unpublish workflow, i18n localization, and media management.

## Requirements

- Node.js 18+
- Strapi v4+
- API Token (Settings → API Tokens in Strapi Admin)

## Configuration

```bash
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your_api_token_here
```

### Claude Desktop

```json
{
  "mcpServers": {
    "strapi": {
      "command": "npx",
      "args": ["@cmsmcp/strapi"],
      "env": {
        "STRAPI_URL": "http://localhost:1337",
        "STRAPI_API_TOKEN": "your_api_token_here"
      }
    }
  }
}
```

## Tools (17)

### Discovery (2)

| Tool | Description |
|------|-------------|
| `strapi_list_content_types` | Discover all content types and their field schemas |
| `strapi_list_components` | List reusable component schemas |

### Content CRUD (5)

| Tool | Description |
|------|-------------|
| `strapi_list_entries` | List entries with filters, sorting, pagination, population |
| `strapi_get_entry` | Get single entry with relations |
| `strapi_create_entry` | Create entry for any content type |
| `strapi_update_entry` | Update entry fields |
| `strapi_delete_entry` | Delete entry |

### Workflow (3)

| Tool | Description |
|------|-------------|
| `strapi_bulk_delete` | Delete multiple entries at once |
| `strapi_publish_entry` | Publish a draft entry |
| `strapi_unpublish_entry` | Revert entry to draft |

### Media (3)

| Tool | Description |
|------|-------------|
| `strapi_list_media` | List uploaded media files |
| `strapi_upload_media` | Upload media file |
| `strapi_delete_media` | Delete media file |

### Users & Roles (2)

| Tool | Description |
|------|-------------|
| `strapi_list_users` | List admin/content manager users |
| `strapi_list_roles` | List roles and permissions |

### i18n (2)

| Tool | Description |
|------|-------------|
| `strapi_get_locales` | List available locales |
| `strapi_create_localized_entry` | Create localized version of an entry |

### Dynamic Content Types

Strapi content types are dynamic — use `strapi_list_content_types` first to discover what's available, then use the `contentType` parameter in other tools to target any type.

### Filtering

Supports Strapi's full filter syntax:
```json
{ "filters": { "title": { "$contains": "hello" } } }
```

Operators: `$eq`, `$ne`, `$lt`, `$lte`, `$gt`, `$gte`, `$in`, `$contains`, `$null`, `$between`, `$startsWith`, `$endsWith`

## License

MIT
