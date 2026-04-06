# Changelog

All notable changes to this package will be documented in this file.

## [0.3.0] - 2025-05-15

### Added
- Initial release with full Gateway API coverage
- REST API gateway, OpenAPI 3.0 spec generation, web dashboard, MCP process bridge, CORS support, and API key auth
- API client with retry logic and rate limiting
- Zod schema validation for all tool inputs
- Error handling with actionable suggestions

### Features
- REST API gateway exposing all MCP tools as HTTP endpoints
- Auto-generated OpenAPI 3.0 specification for all registered tools
- Web dashboard for browsing and testing MCP tools
- MCP process bridge for managing stdio-based MCP server lifecycles
- CORS support for cross-origin browser access
