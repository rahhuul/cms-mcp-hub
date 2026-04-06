# Contributing to CMS MCP Hub

Thank you for your interest in contributing! This guide will help you get started.

## Getting Started

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Build all packages: `npx turbo build`
4. Run tests: `npx turbo test`

## Project Structure

This is a Turborepo monorepo with packages under `packages/`. Each CMS package follows the same structure:

```
packages/{cms}-mcp/
├── src/
│   ├── index.ts          # Entry point, server setup
│   ├── tools/            # Tool implementations
│   ├── api/              # API client
│   │   └── client.ts
│   ├── schemas/          # Zod input schemas
│   │   └── index.ts
│   └── types/            # TypeScript types
│       └── index.ts
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── README.md
└── CHANGELOG.md
```

## Development Workflow

### Adding a New Tool

1. Define the Zod schema in `src/schemas/index.ts`
2. Implement the tool in the appropriate `src/tools/*.ts` file
3. Register it with the MCP server using `server.tool()`
4. Add tests in `src/__tests__/`
5. Update the README with the new tool

### Adding a New CMS Package

1. Copy an existing package as a template (e.g., `packages/ghost-mcp/`)
2. Update `package.json` with the new package name
3. Implement the API client in `src/api/client.ts`
4. Add tools in `src/tools/`
5. Add schemas in `src/schemas/`
6. Write tests
7. Update the root README

## Code Standards

- **TypeScript strict mode** — no `any` types
- **Named exports only** — no default exports
- **Zod validation** on all tool inputs
- **Error handling** — all errors caught and returned as MCP error responses
- **Naming conventions:**
  - Tool names: `{cms}_{action}_{resource}` (e.g., `wp_list_posts`)
  - Files: kebab-case (e.g., `api-client.ts`)
  - Functions: camelCase
  - Types: PascalCase
  - Constants: SCREAMING_SNAKE_CASE

## Testing

```bash
# Run all tests
npx turbo test

# Test specific package
npx turbo test --filter=@cmsmcp/wordpress

# Watch mode
cd packages/wordpress-mcp && npx vitest

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node packages/wordpress-mcp/dist/index.js
```

## Commit Messages

Use clear, descriptive commit messages:
- `Add {tool_name} tool to {package}`
- `Fix {description} in {package}`
- `Update {package} API client for {reason}`

## Pull Requests

1. Create a feature branch from `master`
2. Make your changes
3. Run `npx turbo build test lint typecheck`
4. Submit a PR with a clear description

## Questions?

Open an issue on GitHub — we're happy to help!
