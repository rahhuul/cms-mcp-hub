# @cmsmcp/gateway

Universal REST API gateway for [CMS MCP Hub](https://github.com/rahhuul/cms-mcp-hub) — exposes all MCP tools as HTTP endpoints with auto-generated OpenAPI spec.

**Works with:** Python, n8n, Make, Zapier, LangChain, cURL, any HTTP client.

## Quick Start

```bash
npx @cmsmcp/gateway
```

Configure via `gateway.json`:

```json
{
  "port": 4777,
  "apiKey": "your-secret-key",
  "servers": [
    {
      "name": "wordpress",
      "command": "npx",
      "args": ["-y", "@cmsmcp/wordpress"],
      "env": {
        "WORDPRESS_URL": "https://yoursite.com",
        "WORDPRESS_USERNAME": "admin",
        "WORDPRESS_APP_PASSWORD": "xxxx xxxx xxxx"
      }
    }
  ]
}
```

## Endpoints

| URL | Description |
|-----|-------------|
| `GET /` | Web dashboard — browse and test all tools |
| `GET /health` | Server status |
| `GET /openapi.json` | OpenAPI 3.0 spec (import into Postman, etc.) |
| `GET /api/tools` | List all available tools |
| `POST /api/{server}/{tool}` | Call any tool |

## Example

```bash
curl -X POST http://localhost:4777/api/wordpress/wp_list_posts \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{"per_page": 5}'
```

## License

MIT
