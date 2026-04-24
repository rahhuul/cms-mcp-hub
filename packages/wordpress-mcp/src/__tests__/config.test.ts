import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { normalizeUrl } from "../config.js";
import { createToolGovernance } from "../tool-governance.js";
import { SiteManager } from "../site-manager.js";
import { getServerInstructions } from "../instructions.js";
import type { CmsmcpConfig } from "../types/config.js";

/* ------------------------------------------------------------------ */
/*  normalizeUrl                                                       */
/* ------------------------------------------------------------------ */

describe("normalizeUrl", () => {
  it("adds https:// when no protocol", () => {
    expect(normalizeUrl("mysite.com")).toBe("https://mysite.com");
  });

  it("preserves http:// when specified", () => {
    expect(normalizeUrl("http://localhost")).toBe("http://localhost");
  });

  it("removes trailing slashes", () => {
    expect(normalizeUrl("https://mysite.com/")).toBe("https://mysite.com");
    expect(normalizeUrl("https://mysite.com///")).toBe("https://mysite.com");
  });

  it("fixes double protocols", () => {
    expect(normalizeUrl("https://https://mysite.com")).toBe("https://mysite.com");
  });

  it("throws on empty/invalid URL", () => {
    expect(() => normalizeUrl("")).toThrow();
  });

  it("handles URLs with paths", () => {
    expect(normalizeUrl("https://mysite.com/wp")).toBe("https://mysite.com/wp");
  });
});

/* ------------------------------------------------------------------ */
/*  ToolGovernance                                                     */
/* ------------------------------------------------------------------ */

describe("createToolGovernance", () => {
  it("enables all tools when no filter is set", () => {
    const gov = createToolGovernance(null);
    expect(gov.enabledSet).toBeNull();
    expect(gov.isToolEnabled("wp_list_posts")).toBe(true);
    expect(gov.isToolEnabled("any_random_tool")).toBe(true);
  });

  it("enables all tools when empty array", () => {
    const gov = createToolGovernance([]);
    expect(gov.enabledSet).toBeNull();
    expect(gov.isToolEnabled("wp_list_posts")).toBe(true);
  });

  it("filters to only specified tools", () => {
    const gov = createToolGovernance(["wp_list_posts", "wp_get_post"]);
    expect(gov.isToolEnabled("wp_list_posts")).toBe(true);
    expect(gov.isToolEnabled("wp_get_post")).toBe(true);
    expect(gov.isToolEnabled("wp_create_post")).toBe(false);
  });

  it("always includes site management tools", () => {
    const gov = createToolGovernance(["wp_list_posts"]);
    expect(gov.isToolEnabled("wp_list_sites")).toBe(true);
    expect(gov.isToolEnabled("wp_switch_site")).toBe(true);
    expect(gov.isToolEnabled("wp_get_active_site")).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  SiteManager                                                        */
/* ------------------------------------------------------------------ */

describe("SiteManager", () => {
  const twoSiteConfig: CmsmcpConfig = {
    sites: [
      { id: "prod", name: "Production", url: "https://prod.com", username: "admin", appPassword: "pass1", default: true },
      { id: "staging", name: "Staging", url: "https://staging.com", username: "admin", appPassword: "pass2" },
    ],
  };

  it("initializes with correct site count", () => {
    const mgr = new SiteManager(twoSiteConfig);
    expect(mgr.siteCount).toBe(2);
  });

  it("sets default site as active", () => {
    const mgr = new SiteManager(twoSiteConfig);
    const active = mgr.getActiveSite();
    expect(active.config.id).toBe("prod");
  });

  it("switches site", () => {
    const mgr = new SiteManager(twoSiteConfig);
    mgr.switchSite("staging");
    expect(mgr.getActiveSite().config.id).toBe("staging");
  });

  it("throws on switching to unknown site", () => {
    const mgr = new SiteManager(twoSiteConfig);
    expect(() => mgr.switchSite("nonexistent")).toThrow(/not found/);
  });

  it("lists all sites with active marker", () => {
    const mgr = new SiteManager(twoSiteConfig);
    const sites = mgr.listSites();
    expect(sites).toHaveLength(2);
    expect(sites[0].active).toBe(true);
    expect(sites[1].active).toBe(false);
  });

  it("throws on empty sites array", () => {
    expect(() => new SiteManager({ sites: [] })).toThrow(/No sites configured/);
  });

  it("uses first site as default when none marked", () => {
    const config: CmsmcpConfig = {
      sites: [
        { id: "a", name: "A", url: "https://a.com", username: "u", appPassword: "p" },
        { id: "b", name: "B", url: "https://b.com", username: "u", appPassword: "p" },
      ],
    };
    const mgr = new SiteManager(config);
    expect(mgr.getActiveSite().config.id).toBe("a");
  });

  it("getSiteClient returns client for specific site", () => {
    const mgr = new SiteManager(twoSiteConfig);
    const client = mgr.getSiteClient("staging");
    expect(client).toBeDefined();
  });

  it("getSiteClient throws for unknown site", () => {
    const mgr = new SiteManager(twoSiteConfig);
    expect(() => mgr.getSiteClient("unknown")).toThrow(/not found/);
  });
});

/* ------------------------------------------------------------------ */
/*  Server Instructions                                                */
/* ------------------------------------------------------------------ */

describe("getServerInstructions", () => {
  it("returns a non-empty string", () => {
    const instructions = getServerInstructions();
    expect(typeof instructions).toBe("string");
    expect(instructions.length).toBeGreaterThan(100);
  });

  it("mentions key tool categories", () => {
    const instructions = getServerInstructions();
    expect(instructions).toContain("Posts");
    expect(instructions).toContain("Pages");
    expect(instructions).toContain("Media");
    expect(instructions).toContain("Block Editor");
    expect(instructions).toContain("Workflows");
  });

  it("includes common task patterns", () => {
    const instructions = getServerInstructions();
    expect(instructions).toContain("wp_create_full_post");
    expect(instructions).toContain("wp_site_audit");
  });
});
