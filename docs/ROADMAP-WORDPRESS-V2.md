# WordPress MCP Server v2.0 — Upgrade Roadmap

## Vision
Transform @cmsmcp/wordpress from a REST API wrapper into the most powerful WordPress MCP server available — surpassing Respira with deeper coverage, page builder support, safety systems, and analysis tools while maintaining our unique advantage: 12 CMS platforms in one monorepo, no plugin required for basic ops.

## Architecture Decision
- **Phase 1 (Sprints 1-4):** No-plugin features — ship fast, immediate value
- **Phase 2 (Sprints 5-8):** WordPress plugin + plugin-dependent MCP features
- **Phase 3 (Sprints 9-10):** Advanced features, polish, surpass competitor

---

## Sprint 1: Foundation — Multi-Site, CLI, Instructions, Tool Governance (Week 1)
**Goal:** Ship the infrastructure that makes everything else possible
**Version:** 0.4.0

### Tasks
| # | Task | Type | Est. | Priority |
|---|------|------|------|----------|
| 1.1 | Multi-site config system (~/.cmsmcp/config.json) | Dev | 3hr | P1 |
| 1.2 | Add wp_list_sites, wp_switch_site, wp_get_active_site tools | Dev | 2hr | P1 |
| 1.3 | CMSMCP_SITES env var filtering for agencies | Dev | 1hr | P1 |
| 1.4 | Base64 config support (CMSMCP_CONFIG_B64) | Dev | 1hr | P2 |
| 1.5 | CLI: --setup interactive wizard (auto-detect AI client) | Dev | 3hr | P1 |
| 1.6 | CLI: --doctor health diagnostics | Dev | 2hr | P1 |
| 1.7 | CLI: --test connection testing | Dev | 1hr | P1 |
| 1.8 | CLI: --list show configured sites | Dev | 30min | P2 |
| 1.9 | CLI: --version flag | Dev | 15min | P2 |
| 1.10 | enabledTools config filtering | Dev | 2hr | P1 |
| 1.11 | Rich MCP server instructions field | Dev | 3hr | P1 |
| 1.12 | Tests for all new features | QA | 3hr | P1 |
| 1.13 | Update README, CHANGELOG | Docs | 1hr | P1 |

**Total: ~22 hours**
**Deliverable:** v0.4.0 with multi-site, CLI tools, instructions, tool governance

---

## Sprint 2: Stock Images, Bulk Ops, Content Safety (Week 2)
**Goal:** Add high-value content management tools that work without plugin
**Version:** 0.5.0

### Tasks
| # | Task | Type | Est. | Priority |
|---|------|------|------|----------|
| 2.1 | Openverse API client (Creative Commons image search) | Dev | 2hr | P1 |
| 2.2 | wp_search_stock_images tool | Dev | 2hr | P1 |
| 2.3 | wp_sideload_image tool (download + upload to WP media library) | Dev | 2hr | P1 |
| 2.4 | Auto-attribution for CC-licensed images | Dev | 1hr | P2 |
| 2.5 | wp_bulk_find_replace tool (across posts/pages) | Dev | 3hr | P1 |
| 2.6 | wp_bulk_update_meta tool (batch meta updates) | Dev | 2hr | P2 |
| 2.7 | wp_bulk_manage_media tool (batch alt text, captions) | Dev | 2hr | P2 |
| 2.8 | Snapshot system foundation (revision-based, no plugin) | Dev | 3hr | P1 |
| 2.9 | wp_list_snapshots, wp_restore_snapshot tools | Dev | 2hr | P1 |
| 2.10 | wp_diff_content tool (compare two revisions) | Dev | 2hr | P2 |
| 2.11 | Duplicate-before-edit option (create draft copy) | Dev | 2hr | P1 |
| 2.12 | Tests for all new features | QA | 3hr | P1 |
| 2.13 | Update README, CHANGELOG | Docs | 1hr | P1 |

**Total: ~25 hours**
**Deliverable:** v0.5.0 with stock images, bulk ops, safety system

---

## Sprint 3: Analysis & Audit Tools — No Plugin Required (Week 3)
**Goal:** SEO, readability, image, and content analysis using REST API + external APIs
**Version:** 0.6.0

### Tasks
| # | Task | Type | Est. | Priority |
|---|------|------|------|----------|
| 3.1 | wp_analyze_seo tool (meta tags, headings, images, links) | Dev | 3hr | P1 |
| 3.2 | wp_analyze_readability tool (Flesch score, sentence analysis) | Dev | 2hr | P1 |
| 3.3 | wp_analyze_images tool (missing alt text, large images, format) | Dev | 2hr | P1 |
| 3.4 | wp_check_broken_links tool (scan post content for dead links) | Dev | 3hr | P1 |
| 3.5 | wp_analyze_content_quality tool (word count, keyword density, structure) | Dev | 2hr | P2 |
| 3.6 | wp_check_structured_data tool (JSON-LD validation via URL fetch) | Dev | 2hr | P2 |
| 3.7 | wp_get_yoast_analysis tool (deeper Yoast SEO integration) | Dev | 2hr | P1 |
| 3.8 | wp_get_rankmath_analysis tool (RankMath score + fixes) | Dev | 2hr | P1 |
| 3.9 | wp_content_calendar tool (scheduled posts overview) | Dev | 1hr | P2 |
| 3.10 | wp_duplicate_content_check tool (find similar content) | Dev | 2hr | P2 |
| 3.11 | Tests for all analysis tools | QA | 3hr | P1 |
| 3.12 | Update README, CHANGELOG | Docs | 1hr | P1 |

**Total: ~25 hours**
**Deliverable:** v0.6.0 with 10+ analysis and audit tools

---

## Sprint 4: Advanced REST API Tools & Widget Shortcuts (Week 4)
**Goal:** Add widget shortcuts and advanced content tools (no plugin needed)
**Version:** 0.7.0

### Tasks
| # | Task | Type | Est. | Priority |
|---|------|------|------|----------|
| 4.1 | 15 Gutenberg widget shortcuts (wp_add_heading, wp_add_paragraph, wp_add_image, wp_add_button, wp_add_video, wp_add_section, wp_add_divider, wp_add_spacer, wp_add_gallery, wp_add_columns, wp_add_list, wp_add_quote, wp_add_code, wp_add_table, wp_add_embed) | Dev | 4hr | P1 |
| 4.2 | wp_build_page tool (create page from declarative block structure) | Dev | 3hr | P1 |
| 4.3 | wp_convert_html_to_blocks tool (HTML → Gutenberg blocks) | Dev | 4hr | P1 |
| 4.4 | wp_schedule_post tool (schedule content for future publishing) | Dev | 1hr | P2 |
| 4.5 | wp_moderate_comments tool (bulk approve/spam/trash) | Dev | 2hr | P2 |
| 4.6 | wp_get_content_stats tool (word count, media count, link count per post) | Dev | 1hr | P2 |
| 4.7 | wp_find_content tool (search across all content types with regex) | Dev | 2hr | P1 |
| 4.8 | Preview URL generation after edits | Dev | 1hr | P2 |
| 4.9 | Tests for all new tools | QA | 3hr | P1 |
| 4.10 | Update README, CHANGELOG | Docs | 1hr | P1 |

**Total: ~22 hours**
**Deliverable:** v0.7.0 with widget shortcuts, page builder, HTML conversion

---

## Sprint 5: WordPress Plugin — Core Foundation (Week 5-6)
**Goal:** Build the companion WordPress plugin that unlocks page builder support
**Version:** Plugin v1.0.0

### Tasks
| # | Task | Type | Est. | Priority |
|---|------|------|------|----------|
| 5.1 | Plugin boilerplate (activation, deactivation, uninstall hooks) | Dev | 2hr | P1 |
| 5.2 | API key management (generate, revoke, list keys) | Dev | 3hr | P1 |
| 5.3 | Custom REST API namespace /wp-json/cmsmcp/v1/ | Dev | 2hr | P1 |
| 5.4 | API key authentication middleware | Dev | 2hr | P1 |
| 5.5 | Builder auto-detection endpoint (detect Elementor/Divi/Bricks/etc.) | Dev | 3hr | P1 |
| 5.6 | Builder content extraction endpoint (read builder data from postmeta) | Dev | 4hr | P1 |
| 5.7 | Builder content injection endpoint (write builder data to postmeta) | Dev | 4hr | P1 |
| 5.8 | Snapshot storage system (custom table for version snapshots) | Dev | 3hr | P1 |
| 5.9 | Snapshot CRUD endpoints (list, get, diff, restore) | Dev | 3hr | P1 |
| 5.10 | Tool governance admin panel (enable/disable tools from WP dashboard) | Dev | 3hr | P2 |
| 5.11 | Plugin settings page | Dev | 2hr | P2 |
| 5.12 | Security: nonce verification, capability checks | Dev | 2hr | P1 |
| 5.13 | Plugin README and documentation | Docs | 2hr | P1 |

**Total: ~35 hours**
**Deliverable:** WordPress plugin v1.0.0 with builder detection, content extraction/injection, snapshots

---

## Sprint 6: Elementor & Divi Support (Week 7-8)
**Goal:** Full page builder intelligence for the two biggest builders
**Version:** Plugin v1.1.0 + MCP v0.8.0

### Tasks
| # | Task | Type | Est. | Priority |
|---|------|------|------|----------|
| 6.1 | Elementor: Parse _elementor_data JSON structure | Dev | 3hr | P1 |
| 6.2 | Elementor: Element-level find (by ID, type, CSS class, content) | Dev | 3hr | P1 |
| 6.3 | Elementor: Element-level update/move/duplicate/remove | Dev | 4hr | P1 |
| 6.4 | Elementor: Widget registry (dynamic schemas for all widgets) | Dev | 3hr | P1 |
| 6.5 | Elementor: Build page from structure | Dev | 3hr | P1 |
| 6.6 | Divi 5: Parse block comment JSON structure | Dev | 3hr | P1 |
| 6.7 | Divi 5: Module definitions (40+ modules) | Dev | 3hr | P1 |
| 6.8 | Divi 4: Parse shortcode tree | Dev | 2hr | P2 |
| 6.9 | HTML-to-Elementor conversion with fidelity scoring | Dev | 4hr | P1 |
| 6.10 | HTML-to-Divi conversion | Dev | 3hr | P2 |
| 6.11 | MCP tools: wp_find_element, wp_update_element, wp_move_element, wp_duplicate_element, wp_remove_element, wp_batch_update_elements | Dev | 4hr | P1 |
| 6.12 | MCP tools: wp_get_builder_info, wp_extract_builder_content, wp_inject_builder_content | Dev | 3hr | P1 |
| 6.13 | Tests for builder tools | QA | 4hr | P1 |
| 6.14 | Update README, CHANGELOG | Docs | 1hr | P1 |

**Total: ~43 hours**
**Deliverable:** Full Elementor + Divi intelligence with element-level editing

---

## Sprint 7: Bricks + Other Builders + Analysis Endpoints (Week 9-10)
**Goal:** Complete builder coverage + server-side analysis
**Version:** Plugin v1.2.0 + MCP v0.9.0

### Tasks
| # | Task | Type | Est. | Priority |
|---|------|------|------|----------|
| 7.1 | Bricks: Parse flat element array with parent/children | Dev | 3hr | P1 |
| 7.2 | Bricks: 20 deep intelligence tools (global classes, theme styles, color palette, typography, components, ACSS, query loops, design system) | Dev | 6hr | P1 |
| 7.3 | Beaver Builder: Row/column/module parsing | Dev | 2hr | P2 |
| 7.4 | WPBakery: Shortcode tree parsing | Dev | 2hr | P2 |
| 7.5 | Oxygen: ct_builder_json parsing | Dev | 2hr | P3 |
| 7.6 | Breakdance: Tree-based parsing | Dev | 2hr | P3 |
| 7.7 | Plugin: SEO analysis endpoint (meta, headings, schema, links) | Dev | 3hr | P1 |
| 7.8 | Plugin: Performance analysis endpoint (asset sizes, render blocking) | Dev | 3hr | P2 |
| 7.9 | Plugin: WCAG accessibility scan endpoint | Dev | 3hr | P1 |
| 7.10 | Plugin: Security audit endpoint (file permissions, user enumeration) | Dev | 2hr | P2 |
| 7.11 | MCP tools for all analysis endpoints | Dev | 3hr | P1 |
| 7.12 | MCP tools: wp_scan_accessibility, wp_apply_accessibility_fixes | Dev | 2hr | P1 |
| 7.13 | Tests for all new tools | QA | 4hr | P1 |
| 7.14 | Update README, CHANGELOG | Docs | 1hr | P1 |

**Total: ~38 hours**
**Deliverable:** 6 builders supported + server-side analysis tools

---

## Sprint 8: Widget Shortcuts, Bulk Builder Ops, Optimistic Locking (Week 11)
**Goal:** Builder-aware bulk operations and production safety
**Version:** MCP v1.0.0 (major release!)

### Tasks
| # | Task | Type | Est. | Priority |
|---|------|------|------|----------|
| 8.1 | 27 builder-aware widget shortcuts (wp_add_heading through wp_add_pricing_table) | Dev | 4hr | P1 |
| 8.2 | wp_bulk_builder_operation tool (find/replace across builder content) | Dev | 3hr | P1 |
| 8.3 | Optimistic locking with contentHash | Dev | 2hr | P1 |
| 8.4 | Mandatory snapshots before bulk builder ops | Dev | 1hr | P1 |
| 8.5 | wp_validate_security tool (XSS check before save) | Dev | 2hr | P1 |
| 8.6 | Plugin: Auto-detect and graceful degradation (plugin vs no-plugin) | Dev | 3hr | P1 |
| 8.7 | Core Web Vitals via plugin endpoint | Dev | 2hr | P2 |
| 8.8 | AEO analysis tool (AI search optimization) | Dev | 2hr | P2 |
| 8.9 | Tests for v1.0.0 release | QA | 4hr | P1 |
| 8.10 | Full README rewrite for v1.0.0 | Docs | 3hr | P1 |
| 8.11 | CHANGELOG for v1.0.0 | Docs | 1hr | P1 |

**Total: ~27 hours**
**Deliverable:** v1.0.0 — major release with full parity + advantages over Respira

---

## Sprint 9: Surpass — Unique Features (Week 12-13)
**Goal:** Features Respira doesn't have
**Version:** v1.1.0

### Tasks
| # | Task | Type | Est. | Priority |
|---|------|------|------|----------|
| 9.1 | WordPress Multisite (Network) support | Dev | 4hr | P2 |
| 9.2 | ACF deep integration (field groups, flexible content, repeaters) | Dev | 4hr | P1 |
| 9.3 | Meta Box integration | Dev | 2hr | P2 |
| 9.4 | Theme Customizer read/write | Dev | 3hr | P2 |
| 9.5 | WP-CLI bridge (run WP-CLI commands via MCP) | Dev | 3hr | P2 |
| 9.6 | Content staging workflow (draft → review → approve → publish) | Dev | 3hr | P1 |
| 9.7 | User activity log (who changed what, when) | Dev | 2hr | P2 |
| 9.8 | Backup management integration (UpdraftPlus, BackWPup) | Dev | 2hr | P3 |
| 9.9 | Uptime/health monitoring endpoint | Dev | 1hr | P3 |
| 9.10 | Tests + docs | QA/Docs | 3hr | P1 |

**Total: ~27 hours**
**Deliverable:** v1.1.0 with unique features no competitor has

---

## Sprint 10: Polish, Launch, Marketing (Week 14)
**Goal:** Production-ready release + marketing push
**Version:** v1.2.0 (stable)

### Tasks
| # | Task | Type | Est. | Priority |
|---|------|------|------|----------|
| 10.1 | Full test suite review and gap filling | QA | 4hr | P1 |
| 10.2 | Performance optimization (connection pooling, response caching) | Dev | 3hr | P1 |
| 10.3 | Error messages review (actionable suggestions for all errors) | Dev | 2hr | P1 |
| 10.4 | Plugin: WordPress.org submission | DevOps | 3hr | P1 |
| 10.5 | Plugin listing page (screenshots, description) | Content | 2hr | P1 |
| 10.6 | npm publish all versions | DevOps | 1hr | P1 |
| 10.7 | Launch blog post (Dev.to + Hashnode) | Content | 3hr | P1 |
| 10.8 | LinkedIn announcement | Content | 1hr | P1 |
| 10.9 | Twitter thread | Content | 1hr | P1 |
| 10.10 | Reddit posts (r/wordpress, r/webdev, r/MCP, r/selfhosted) | Content | 2hr | P1 |
| 10.11 | Product Hunt launch prep | Content | 2hr | P2 |
| 10.12 | MCP Registry / Smithery / Glama listings | DevOps | 1hr | P1 |

**Total: ~25 hours**
**Deliverable:** Production-ready v1.2.0 + full marketing launch

---

## Tool Count Projection

| Version | Tools | New Tools Added |
|---------|-------|----------------|
| Current v0.3.2 | 169 | — |
| v0.4.0 (Sprint 1) | 175 | +6 (multi-site, governance) |
| v0.5.0 (Sprint 2) | 188 | +13 (stock images, bulk ops, snapshots) |
| v0.6.0 (Sprint 3) | 200 | +12 (analysis & audit) |
| v0.7.0 (Sprint 4) | 222 | +22 (widget shortcuts, page builder, HTML conversion) |
| v0.8.0 (Sprint 6) | 240 | +18 (Elementor, Divi, element ops) |
| v0.9.0 (Sprint 7) | 268 | +28 (Bricks, other builders, accessibility) |
| v1.0.0 (Sprint 8) | 300+ | +32 (builder widgets, bulk builder, security) |
| v1.1.0 (Sprint 9) | 315+ | +15 (ACF, multisite, staging, WP-CLI) |
| v1.2.0 (Sprint 10) | 320+ | Polish + optimization |

**Final: 320+ tools (vs Respira's 172)**

---

## Comparison After Completion

| Feature | Us (v1.2.0) | Respira (v5.5) |
|---------|-------------|----------------|
| Total tools | 320+ | 172 |
| CMS platforms | 12 | 1 (WordPress only) |
| Plugin required for basics | No | Yes |
| Page builders | 6+ | 11 |
| Element-level editing | Yes | Yes |
| Gutenberg blocks | 169 tools (deepest) | Basic |
| WooCommerce | 95 tools (separate package) | 21 |
| Snapshot/rollback | Yes | Yes |
| Multi-site | Yes | Yes |
| Analysis tools | 12+ | 8 |
| Stock images | Yes | Yes |
| Bulk operations | Yes | Yes |
| REST API Gateway | Yes | No |
| ACF/Meta Box deep integration | Yes | No |
| WP-CLI bridge | Yes | No |
| Content staging workflow | Yes | No |
| WordPress.org plugin listing | Yes | No (custom download) |
| Telemetry/tracking | None | Sentry |
| License | MIT | MIT |

---

## Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| WordPress plugin review delay (wp.org) | Medium | High | Submit early, have manual install option |
| Page builder API changes | Medium | Medium | Version detection, graceful fallback |
| Scope creep on builder support | High | High | Ship Elementor+Divi first, others as P2 |
| Time overrun | High | Medium | Each sprint is independently shippable |
| Test coverage gaps | Medium | Medium | Tests are part of every sprint |

---

## Success Metrics

| Metric | Current | Sprint 4 Target | v1.0.0 Target |
|--------|---------|-----------------|---------------|
| WordPress tools | 169 | 222 | 300+ |
| npm weekly downloads | — | 100+ | 500+ |
| GitHub stars | 0 | 25+ | 100+ |
| Test count | 462 (all packages) | 550+ | 700+ |
| WordPress plugin installs | — | — | 100+ |
