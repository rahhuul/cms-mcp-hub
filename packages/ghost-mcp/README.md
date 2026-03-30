# @cmsmcp/ghost

MCP server for **Ghost** publishing platform. Enables AI agents to manage posts, pages, tags, members, and more through 17 tools using Ghost's Admin API with JWT authentication.

## Requirements

- Node.js 18+
- Ghost v5+
- Admin API key (Ghost Admin → Settings → Integrations → Custom Integration)

## Configuration

```bash
GHOST_URL=https://myblog.com
GHOST_ADMIN_API_KEY=id:secret
GHOST_CONTENT_API_KEY=optional_content_key   # optional, for read-only operations
```

### Claude Desktop

```json
{
  "mcpServers": {
    "ghost": {
      "command": "npx",
      "args": ["@cmsmcp/ghost"],
      "env": {
        "GHOST_URL": "https://myblog.com",
        "GHOST_ADMIN_API_KEY": "your_id:your_secret"
      }
    }
  }
}
```

## Tools (17)

### Posts (5)

| Tool | Description |
|------|-------------|
| `ghost_list_posts` | List posts with NQL filters, pagination, sorting |
| `ghost_get_post` | Get post by ID or slug |
| `ghost_create_post` | Create post (Lexical/HTML content) |
| `ghost_update_post` | Update post (requires updated_at for collision detection) |
| `ghost_delete_post` | Delete post |

### Pages (3)

| Tool | Description |
|------|-------------|
| `ghost_list_pages` | List pages |
| `ghost_create_page` | Create page |
| `ghost_update_page` | Update page |

### Tags (2)

| Tool | Description |
|------|-------------|
| `ghost_list_tags` | List tags with post counts |
| `ghost_create_tag` | Create tag |

### Authors & Members (3)

| Tool | Description |
|------|-------------|
| `ghost_list_authors` | List staff/authors |
| `ghost_list_members` | List newsletter members |
| `ghost_create_member` | Add newsletter member |

### Tiers & Newsletters (2)

| Tool | Description |
|------|-------------|
| `ghost_list_tiers` | List membership tiers |
| `ghost_list_newsletters` | List newsletters |

### Images & Site (2)

| Tool | Description |
|------|-------------|
| `ghost_upload_image` | Upload image |
| `ghost_get_site` | Get site metadata and settings |

### Authentication

Ghost uses JWT (HS256) for Admin API authentication. The server automatically:
1. Splits your Admin API key into ID and secret
2. Signs a JWT with the hex-decoded secret
3. Refreshes tokens before they expire (5-minute lifetime)

### Ghost NQL Filters

Use Ghost's filter syntax in list tools:
```
tag:news                    — posts with "news" tag
featured:true               — featured posts
status:draft                — draft posts
tag:news+featured:true      — AND filter
author:john,author:jane     — OR filter
created_at:>'2024-01-01'    — date comparisons
```

## License

MIT
