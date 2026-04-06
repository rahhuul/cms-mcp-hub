# Changelog

All notable changes to this package will be documented in this file.

## [0.3.0] - 2025-05-15

### Added
- Initial release with full shared utilities coverage
- Common API client, error handling, pagination, rate limiting, environment helpers, and structured logging
- API client with retry logic and rate limiting
- Zod schema validation for all tool inputs
- Error handling with actionable suggestions

### Features
- Base API client with exponential backoff retry (3 attempts)
- Centralized error formatting with actionable fix suggestions
- Pagination helpers for consistent list operations across all CMS packages
- Rate limiting middleware to respect API quotas
- Environment variable helpers for secure credential management
- Structured logging with configurable log levels
