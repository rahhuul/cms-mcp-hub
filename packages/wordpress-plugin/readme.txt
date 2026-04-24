=== CMS MCP Hub - WordPress Connector ===
Contributors: rahhuul
Tags: mcp, ai, page-builder, elementor, divi, bricks, seo, accessibility, content-management
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.0.0
License: MIT
License URI: https://opensource.org/licenses/MIT

Companion plugin for the @cmsmcp/wordpress MCP server. Enables AI agents to manage WordPress content, page builders, snapshots, and run SEO/accessibility analysis.

== Description ==

CMS MCP Hub - WordPress Connector is a companion plugin that works with the [@cmsmcp/wordpress](https://www.npmjs.com/package/@cmsmcp/wordpress) MCP (Model Context Protocol) server. It provides a secure REST API that allows AI agents like Claude, GPT, and Cursor to interact with your WordPress site.

**What is MCP?**

The Model Context Protocol is an open standard that enables AI assistants to connect to external tools and data sources. This plugin turns your WordPress site into an MCP-compatible tool server.

**Key Features:**

* **Secure API Key Authentication** — Generate and manage API keys for MCP server access. Keys are stored as SHA-256 hashes.
* **Page Builder Support** — Full support for Elementor, Divi 4/5, Bricks, Beaver Builder, WPBakery, and Oxygen. Read and write builder data natively.
* **Content Snapshots** — Automatic versioning before AI edits. Create, list, restore, and diff snapshots with full builder data preservation.
* **SEO Analysis** — Server-side SEO audits with support for Yoast SEO, RankMath, and SEOPress. Checks title, meta description, headings, images, links, keywords, schema, and more.
* **Accessibility Scanning** — WCAG 2.1 Level AA compliance checks including image alt text, empty links, form labels, heading hierarchy, color contrast, deprecated elements, and more.
* **Performance Analysis** — Content performance metrics including DOM complexity, image optimization, render-blocking resources, inline CSS, shortcode count, and builder meta size.
* **Tool Governance** — Admin controls to enable/disable tool categories available to AI agents.
* **Builder Detection** — Automatically detects which page builder is used on each post.

**Supported Page Builders:**

* Elementor (full support)
* Divi 4 and Divi 5 (full support)
* Bricks (full support)
* Beaver Builder (standard support)
* WPBakery Page Builder (basic support)
* Oxygen (basic support)
* Gutenberg / Block Editor (full support)

**Supported SEO Plugins:**

* Yoast SEO
* RankMath
* SEOPress

== Installation ==

1. Upload the `cmsmcp-wordpress` folder to `wp-content/plugins/`.
2. Activate the plugin in WordPress admin under Plugins.
3. Go to CMS MCP Hub > API Keys to generate an API key.
4. Install the MCP server: `npm install -g @cmsmcp/wordpress`
5. Configure the MCP server with your site URL and API key.

**MCP Server Configuration:**

Add to your Claude Desktop or Cursor config:

`{
  "mcpServers": {
    "wordpress": {
      "command": "npx",
      "args": ["-y", "@cmsmcp/wordpress"],
      "env": {
        "WORDPRESS_SITE_URL": "https://yoursite.com",
        "WORDPRESS_API_KEY": "cmsmcp_your_api_key_here"
      }
    }
  }
}`

== Frequently Asked Questions ==

= Is this plugin safe to use? =

Yes. API keys are stored as SHA-256 hashes (plaintext keys are never stored). All REST API endpoints require valid authentication. Auto-snapshots create backups before any AI edit, so you can always restore previous content.

= Does it work without a page builder? =

Yes. The plugin works with the standard Gutenberg block editor and classic editor. Page builder support is an additional feature for sites using Elementor, Divi, Bricks, etc.

= Which AI tools can connect to this? =

Any MCP-compatible AI client, including Claude Desktop, Cursor, Windsurf, and other tools that support the Model Context Protocol.

= Does it support multisite? =

The plugin works on individual sites within a multisite network. Each site needs its own API key configuration.

== Screenshots ==

1. Dashboard showing plugin status, active builders, and API key usage.
2. API Keys management page with key generation and revocation.
3. Settings page with snapshot and tool governance controls.

== Changelog ==

= 1.0.0 =
* Initial release.
* API key authentication system.
* Page builder detection and support for 6 builders.
* Content snapshots with create, list, restore, and diff.
* SEO analysis with Yoast, RankMath, and SEOPress support.
* WCAG 2.1 accessibility scanning.
* Performance analysis and recommendations.
* Admin dashboard, API key management, and settings pages.
* Tool governance controls.

== Upgrade Notice ==

= 1.0.0 =
Initial release of the CMS MCP Hub WordPress Connector.
