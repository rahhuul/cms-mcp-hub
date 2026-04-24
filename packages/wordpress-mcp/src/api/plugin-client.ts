/**
 * REST API client for the CMS MCP Hub WordPress plugin.
 * Targets /wp-json/cmsmcp/v1/ endpoints.
 *
 * Auth: either the same Basic Auth as WpClient, or a dedicated
 * CMSMCP_API_KEY sent via X-CmsMcp-API-Key header.
 */

import { ApiClient, createLogger, type Logger } from "@cmsmcp/shared";

/* ------------------------------------------------------------------ */
/*  Type definitions for plugin responses                              */
/* ------------------------------------------------------------------ */

export interface PluginStatus {
  plugin_version: string;
  wp_version: string;
  php_version: string;
  active_builders: string[];
  snapshot_count: number;
  site_url: string;
  rest_namespace: string;
}

export interface BuilderInfo {
  slug: string;
  name: string;
  version: string;
  support_level: "full" | "partial" | "read-only" | "none";
  active: boolean;
}

export interface BuilderContent {
  post_id: number;
  builder: string;
  content: unknown;
  meta: Record<string, unknown>;
}

export interface ElementCriteria {
  type?: string;
  class?: string;
  content?: string;
  id?: string;
}

export interface BuilderElement {
  id: string;
  type: string;
  tag?: string;
  classes?: string[];
  content?: string;
  settings: Record<string, unknown>;
  children?: BuilderElement[];
}

export interface Snapshot {
  id: number;
  post_id: number;
  reason: string;
  created_at: string;
  builder: string;
  size_bytes: number;
}

export interface SnapshotDiff {
  snapshot_a: number;
  snapshot_b: number;
  changes: unknown[];
  summary: string;
}

export interface SeoReport {
  post_id: number;
  score: number;
  issues: unknown[];
  suggestions: unknown[];
}

export interface AccessibilityReport {
  post_id: number;
  score: number;
  violations: unknown[];
  warnings: unknown[];
}

export interface PerformanceReport {
  post_id: number;
  metrics: Record<string, unknown>;
  suggestions: unknown[];
}

/* ------------------------------------------------------------------ */
/*  Plugin client                                                      */
/* ------------------------------------------------------------------ */

export class PluginClient {
  private readonly api: ApiClient;
  private readonly logger: Logger;
  private availableCache: boolean | null = null;

  constructor(config: { baseUrl: string; authHeader: string; apiKey?: string }) {
    this.logger = createLogger("wordpress:plugin");

    const pluginBaseUrl = `${config.baseUrl.replace(/\/+$/, "")}/wp-json/cmsmcp/v1`;

    // If apiKey is provided, use X-CmsMcp-API-Key header; otherwise fall back to Basic Auth
    const headers: Record<string, string> = config.apiKey
      ? { "X-CmsMcp-API-Key": config.apiKey }
      : { Authorization: config.authHeader };

    this.api = new ApiClient(
      {
        baseUrl: pluginBaseUrl,
        headers,
        maxRetries: 2,
        rateLimitPerSecond: 25,
        timeoutMs: 30_000,
      },
      this.logger,
    );
  }

  /* ── Availability ─────────────────────────────────────────────── */

  /**
   * Check if the companion plugin is installed and responsive.
   * Result is cached after the first successful/failed probe.
   */
  async isAvailable(): Promise<boolean> {
    if (this.availableCache !== null) return this.availableCache;

    try {
      await this.api.get<PluginStatus>("status");
      this.availableCache = true;
    } catch {
      this.availableCache = false;
      this.logger.debug("CMS MCP Hub plugin not available — plugin-dependent tools will be disabled");
    }

    return this.availableCache;
  }

  /** Reset the cached availability flag (useful after plugin install). */
  resetAvailability(): void {
    this.availableCache = null;
  }

  /* ── Status ───────────────────────────────────────────────────── */

  async getStatus(): Promise<PluginStatus> {
    return this.api.get<PluginStatus>("status");
  }

  /* ── Builder detection ────────────────────────────────────────── */

  async detectBuilders(): Promise<BuilderInfo[]> {
    return this.api.get<BuilderInfo[]>("builder/detect");
  }

  /* ── Builder content ──────────────────────────────────────────── */

  async extractBuilderContent(postId: number): Promise<BuilderContent> {
    return this.api.get<BuilderContent>(`builder/content/${postId}`);
  }

  async injectBuilderContent(postId: number, content: unknown): Promise<void> {
    await this.api.post<void>(`builder/content/${postId}`, { content });
  }

  /* ── Element operations ───────────────────────────────────────── */

  async findElements(postId: number, criteria: ElementCriteria): Promise<BuilderElement[]> {
    const params: Record<string, string | number | boolean | undefined> = {};
    if (criteria.type) params["type"] = criteria.type;
    if (criteria.class) params["class"] = criteria.class;
    if (criteria.content) params["content"] = criteria.content;
    if (criteria.id) params["id"] = criteria.id;
    return this.api.get<BuilderElement[]>(`builder/elements/${postId}`, params);
  }

  async updateElement(postId: number, elementId: string, updates: Record<string, unknown>): Promise<void> {
    await this.api.post<void>(`builder/element/${postId}`, { element_id: elementId, updates });
  }

  async moveElement(
    postId: number,
    elementId: string,
    targetId: string,
    position: "before" | "after" | "inside",
  ): Promise<void> {
    await this.api.post<void>(`builder/element/${postId}/move`, {
      element_id: elementId,
      target_id: targetId,
      position,
    });
  }

  async duplicateElement(postId: number, elementId: string): Promise<BuilderElement> {
    return this.api.post<BuilderElement>(`builder/element/${postId}/duplicate`, {
      element_id: elementId,
    });
  }

  async removeElement(postId: number, elementId: string): Promise<void> {
    await this.api.post<void>(`builder/element/${postId}/remove`, {
      element_id: elementId,
    });
  }

  /* ── Snapshots ────────────────────────────────────────────────── */

  async listSnapshots(postId: number): Promise<Snapshot[]> {
    return this.api.get<Snapshot[]>(`snapshots/${postId}`);
  }

  async getSnapshot(postId: number, snapshotId: number): Promise<Snapshot> {
    return this.api.get<Snapshot>(`snapshots/${postId}/${snapshotId}`);
  }

  async createSnapshot(postId: number, reason?: string): Promise<{ id: number }> {
    return this.api.post<{ id: number }>(`snapshots/${postId}`, { reason });
  }

  async restoreSnapshot(postId: number, snapshotId: number): Promise<void> {
    await this.api.post<void>(`snapshots/${postId}/${snapshotId}/restore`);
  }

  async diffSnapshots(postId: number, a: number, b: number): Promise<SnapshotDiff> {
    return this.api.get<SnapshotDiff>(`snapshots/${postId}/diff`, { a, b });
  }

  /* ── Builder widget shortcuts ──────────────────────────────────── */

  async addBuilderWidget(
    postId: number,
    type: string,
    settings: Record<string, unknown>,
    position?: string,
  ): Promise<unknown> {
    return this.api.post<unknown>(`builder/widget/${postId}`, {
      type,
      settings,
      position: position ?? "bottom",
    });
  }

  /* ── Analysis ─────────────────────────────────────────────────── */

  async analyzeSeo(postId: number): Promise<SeoReport> {
    return this.api.get<SeoReport>(`analysis/seo/${postId}`);
  }

  async scanAccessibility(postId: number): Promise<AccessibilityReport> {
    return this.api.get<AccessibilityReport>(`analysis/accessibility/${postId}`);
  }

  async analyzePerformance(postId: number): Promise<PerformanceReport> {
    return this.api.get<PerformanceReport>(`analysis/performance/${postId}`);
  }

  /* ── Bricks Deep Intelligence ────────────────────────────────────── */

  // Global Classes
  async getBricksGlobalClasses(): Promise<unknown> {
    return this.api.get<unknown>("bricks/global-classes");
  }

  async createBricksGlobalClass(data: Record<string, unknown>): Promise<unknown> {
    return this.api.post<unknown>("bricks/global-classes", data);
  }

  async updateBricksGlobalClass(classId: string, data: Record<string, unknown>): Promise<unknown> {
    return this.api.post<unknown>(`bricks/global-classes/${encodeURIComponent(classId)}`, data);
  }

  async deleteBricksGlobalClass(classId: string): Promise<unknown> {
    return this.api.delete<unknown>(`bricks/global-classes/${encodeURIComponent(classId)}`);
  }

  // Theme Styles
  async getBricksThemeStyles(): Promise<unknown> {
    return this.api.get<unknown>("bricks/theme-styles");
  }

  async updateBricksThemeStyles(data: Record<string, unknown>): Promise<unknown> {
    return this.api.post<unknown>("bricks/theme-styles", data);
  }

  // Color Palette
  async getBricksColorPalette(): Promise<unknown> {
    return this.api.get<unknown>("bricks/color-palette");
  }

  async updateBricksColorPalette(data: Record<string, unknown>): Promise<unknown> {
    return this.api.post<unknown>("bricks/color-palette", data);
  }

  // Typography
  async getBricksTypography(): Promise<unknown> {
    return this.api.get<unknown>("bricks/typography");
  }

  async updateBricksTypography(data: Record<string, unknown>): Promise<unknown> {
    return this.api.post<unknown>("bricks/typography", data);
  }

  // Components
  async listBricksComponents(): Promise<unknown> {
    return this.api.get<unknown>("bricks/components");
  }

  async getBricksComponent(componentId: number): Promise<unknown> {
    return this.api.get<unknown>(`bricks/components/${componentId}`);
  }

  async applyBricksComponent(postId: number, componentId: number, position: string): Promise<unknown> {
    return this.api.post<unknown>(`bricks/components/${componentId}/apply`, {
      post_id: postId,
      position,
    });
  }

  // Analysis
  async searchBricksElements(criteria: Record<string, unknown>): Promise<unknown> {
    return this.api.post<unknown>("bricks/search-elements", criteria);
  }

  async bricksHealthCheck(postId: number): Promise<unknown> {
    return this.api.get<unknown>(`bricks/health-check/${postId}`);
  }

  async bricksStyleProfile(postId: number): Promise<unknown> {
    return this.api.get<unknown>(`bricks/style-profile/${postId}`);
  }

  async bricksDesignSystem(): Promise<unknown> {
    return this.api.get<unknown>("bricks/design-system");
  }

  /* ── WP-CLI Bridge ──────────────────────────────────────────────── */

  async runWpCli(command: string, args?: Record<string, unknown>): Promise<unknown> {
    return this.api.post<unknown>("wpcli/run", { command, args });
  }

  async wpCliExport(options?: Record<string, unknown>): Promise<unknown> {
    return this.api.post<unknown>("wpcli/export", options ?? {});
  }

  async wpCliImport(source: string, options?: Record<string, unknown>): Promise<unknown> {
    return this.api.post<unknown>("wpcli/import", { source, ...options });
  }

  async wpCliSearchReplace(search: string, replace: string, options?: Record<string, unknown>): Promise<unknown> {
    return this.api.post<unknown>("wpcli/search-replace", { search, replace, ...options });
  }

  /* ── Activity Log ────────────────────────────────────────────────── */

  async listActivity(filters?: Record<string, unknown>): Promise<unknown> {
    return this.api.get<unknown>("activity", filters as Record<string, string | number | boolean | undefined>);
  }

  async getActivity(activityId: number): Promise<unknown> {
    return this.api.get<unknown>(`activity/${activityId}`);
  }

  async undoActivity(activityId: number): Promise<unknown> {
    return this.api.post<unknown>(`activity/${activityId}/undo`);
  }

  async getActivityStats(filters?: Record<string, unknown>): Promise<unknown> {
    return this.api.get<unknown>("activity/stats", filters as Record<string, string | number | boolean | undefined>);
  }

  async exportActivity(filters?: Record<string, unknown>): Promise<unknown> {
    return this.api.get<unknown>("activity/export", filters as Record<string, string | number | boolean | undefined>);
  }

  /* ── Theme & Customizer ──────────────────────────────────────────── */

  async getThemeMods(): Promise<unknown> {
    return this.api.get<unknown>("theme/mods");
  }

  async updateThemeMod(name: string, value: unknown): Promise<unknown> {
    return this.api.post<unknown>("theme/mods", { name, value });
  }

  async exportCustomizer(): Promise<unknown> {
    return this.api.get<unknown>("theme/customizer/export");
  }

  async importCustomizer(data: Record<string, unknown>): Promise<unknown> {
    return this.api.post<unknown>("theme/customizer/import", data);
  }

  /* ── Multisite ─────────────────────────────────────────────────────── */

  async listNetworkSites(params?: Record<string, unknown>): Promise<unknown> {
    return this.api.get<unknown>("multisite/sites", params as Record<string, string | number | boolean | undefined>);
  }

  async getNetworkSite(blogId: number): Promise<unknown> {
    return this.api.get<unknown>(`multisite/sites/${blogId}`);
  }

  async createNetworkSite(data: Record<string, unknown>): Promise<unknown> {
    return this.api.post<unknown>("multisite/sites", data);
  }

  async updateNetworkSite(blogId: number, data: Record<string, unknown>): Promise<unknown> {
    return this.api.post<unknown>(`multisite/sites/${blogId}`, data);
  }

  async deleteNetworkSite(blogId: number): Promise<unknown> {
    return this.api.delete<unknown>(`multisite/sites/${blogId}`);
  }

  async getNetworkSettings(): Promise<unknown> {
    return this.api.get<unknown>("multisite/settings");
  }

  /* ── Settings & Options ──────────────────────────────────────────── */

  async getOption(name: string): Promise<unknown> {
    return this.api.get<unknown>(`options/${encodeURIComponent(name)}`);
  }

  async updateOption(name: string, value: unknown): Promise<unknown> {
    return this.api.post<unknown>(`options/${encodeURIComponent(name)}`, { value });
  }

  async listTransients(filters?: Record<string, unknown>): Promise<unknown> {
    return this.api.get<unknown>("transients", filters as Record<string, string | number | boolean | undefined>);
  }

  async deleteTransient(name: string): Promise<unknown> {
    return this.api.delete<unknown>(`transients/${encodeURIComponent(name)}`);
  }

  /* ── Database Management ────────────────────────────────────────────── */

  async getDbSizes(): Promise<unknown> {
    return this.api.get<unknown>("database/sizes");
  }

  async optimizeDbTables(tables?: string[]): Promise<unknown> {
    return this.api.post<unknown>("database/optimize", { tables });
  }

  async cleanupRevisions(keepCount?: number): Promise<unknown> {
    return this.api.post<unknown>("database/cleanup-revisions", { keep: keepCount ?? 5 });
  }

  async cleanupExpiredTransients(): Promise<unknown> {
    return this.api.post<unknown>("database/cleanup-transients");
  }

  async getDbInfo(): Promise<unknown> {
    return this.api.get<unknown>("database/info");
  }

  /* ── Email ──────────────────────────────────────────────────────────── */

  async sendTestEmail(to: string, subject?: string, body?: string): Promise<unknown> {
    return this.api.post<unknown>("email/test", { to, subject, body });
  }

  async getEmailLog(filters?: Record<string, unknown>): Promise<unknown> {
    return this.api.get<unknown>("email/log", filters as Record<string, string | number | boolean | undefined>);
  }

  async getEmailConfig(): Promise<unknown> {
    return this.api.get<unknown>("email/config");
  }

  /* ── Media Advanced ────────────────────────────────────────────────── */

  async regenerateThumbnails(attachmentId: number): Promise<unknown> {
    return this.api.post<unknown>(`media/${attachmentId}/regenerate`);
  }

  async getImageSizes(): Promise<unknown> {
    return this.api.get<unknown>("media/sizes");
  }

  async replaceMedia(attachmentId: number, data: Record<string, unknown>): Promise<unknown> {
    return this.api.post<unknown>(`media/${attachmentId}/replace`, data);
  }

  /* ── WP-Cron Management ────────────────────────────────────────────── */

  async listCronEvents(): Promise<unknown> {
    return this.api.get<unknown>("cron/events");
  }

  async getCronSchedules(): Promise<unknown> {
    return this.api.get<unknown>("cron/schedules");
  }

  async runCronEvent(hook: string, timestamp?: number): Promise<unknown> {
    return this.api.post<unknown>("cron/run", { hook, timestamp });
  }

  async deleteCronEvent(hook: string, timestamp: number): Promise<unknown> {
    return this.api.post<unknown>("cron/delete", { hook, timestamp });
  }

  async getCronStatus(): Promise<unknown> {
    return this.api.get<unknown>("cron/status");
  }
}
