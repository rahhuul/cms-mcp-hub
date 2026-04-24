/**
 * SEO analysis tools — content-level SEO auditing without external dependencies.
 * Pure regex-based HTML analysis for headings, images, links, and content quality.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WpClient } from "../api/client.js";
import { AnalyzeSeoSchema, GetRankMathScoreSchema, GetSeoOverviewSchema } from "../schemas/index.js";

// ─── Types ───────────────────────────────────────────────────────────

interface SeoIssue {
  severity: "error" | "warning" | "info";
  category: string;
  message: string;
  recommendation: string;
}

interface SeoStats {
  word_count: number;
  heading_count: number;
  image_count: number;
  link_count: number;
  internal_link_count: number;
  external_link_count: number;
}

// ─── HTML helpers ────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&#\d+;/g, " ").replace(/&\w+;/g, " ").replace(/\s+/g, " ").trim();
}

function countWords(text: string): number {
  const cleaned = stripHtml(text);
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter((w) => w.length > 0).length;
}

// ─── Stop words for slug analysis ────────────────────────────────────

const STOP_WORDS = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with",
  "by","from","as","is","was","are","were","been","be","have","has","had",
  "do","does","did","will","would","shall","should","may","might","can",
  "could","this","that","these","those","it","its","not","no","nor",
]);

// ─── Analysis functions ──────────────────────────────────────────────

function analyzeTitle(title: string): SeoIssue[] {
  const issues: SeoIssue[] = [];
  const clean = stripHtml(title);
  const len = clean.length;

  if (len === 0) {
    issues.push({ severity: "error", category: "title", message: "Title is empty.", recommendation: "Add a descriptive title between 30-60 characters." });
  } else if (len < 30) {
    issues.push({ severity: "warning", category: "title", message: `Title is too short (${len} chars). Ideal: 30-60 characters.`, recommendation: "Expand the title with relevant keywords to improve click-through rate." });
  } else if (len > 60) {
    issues.push({ severity: "warning", category: "title", message: `Title is too long (${len} chars). Ideal: 30-60 characters.`, recommendation: "Shorten the title — search engines may truncate it in results." });
  } else {
    issues.push({ severity: "info", category: "title", message: `Title length is good (${len} chars).`, recommendation: "No action needed." });
  }

  return issues;
}

function analyzeExcerpt(excerpt: string | undefined): SeoIssue[] {
  const issues: SeoIssue[] = [];
  const clean = excerpt ? stripHtml(excerpt) : "";
  const len = clean.length;

  if (len === 0) {
    issues.push({ severity: "warning", category: "meta_description", message: "No excerpt/meta description set.", recommendation: "Add an excerpt (120-160 chars) that summarizes the content with target keywords." });
  } else if (len < 120) {
    issues.push({ severity: "warning", category: "meta_description", message: `Excerpt is short (${len} chars). Ideal: 120-160 characters.`, recommendation: "Expand the excerpt to give search engines a better description." });
  } else if (len > 160) {
    issues.push({ severity: "warning", category: "meta_description", message: `Excerpt is long (${len} chars). Ideal: 120-160 characters.`, recommendation: "Trim the excerpt — search engines may truncate it in results." });
  } else {
    issues.push({ severity: "info", category: "meta_description", message: `Excerpt length is good (${len} chars).`, recommendation: "No action needed." });
  }

  return issues;
}

function analyzeHeadings(content: string): SeoIssue[] {
  const issues: SeoIssue[] = [];
  const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h\1>/gi;
  const headings: { level: number; text: string }[] = [];
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(content)) !== null) {
    headings.push({ level: parseInt(match[1], 10), text: stripHtml(match[2]) });
  }

  if (headings.length === 0) {
    issues.push({ severity: "warning", category: "headings", message: "No headings found in content.", recommendation: "Add H2/H3 headings to structure your content for readability and SEO." });
    return issues;
  }

  // Check for H1 in content (usually the title handles H1)
  const h1Count = headings.filter((h) => h.level === 1).length;
  if (h1Count > 1) {
    issues.push({ severity: "warning", category: "headings", message: `Multiple H1 tags found (${h1Count}). Only one H1 per page is recommended.`, recommendation: "Use a single H1 for the main title. Use H2-H6 for subheadings." });
  }

  // Check heading hierarchy (no skipping levels, e.g., H2 -> H4)
  let prevLevel = 1; // Assume title is H1
  for (const h of headings) {
    if (h.level === 1) { prevLevel = 1; continue; }
    if (h.level > prevLevel + 1) {
      issues.push({ severity: "warning", category: "headings", message: `Heading hierarchy skip: H${prevLevel} -> H${h.level} ("${h.text.slice(0, 40)}").`, recommendation: `Use H${prevLevel + 1} instead of H${h.level} to maintain proper heading hierarchy.` });
    }
    prevLevel = h.level;
  }

  const h2Count = headings.filter((h) => h.level === 2).length;
  if (h2Count === 0) {
    issues.push({ severity: "warning", category: "headings", message: "No H2 headings found.", recommendation: "Add H2 subheadings to break up content into sections." });
  }

  return issues;
}

function analyzeImages(content: string): SeoIssue[] {
  const issues: SeoIssue[] = [];
  const imgRegex = /<img\s[^>]*>/gi;
  const images: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = imgRegex.exec(content)) !== null) {
    images.push(match[0]);
  }

  if (images.length === 0) {
    issues.push({ severity: "info", category: "images", message: "No images found in content.", recommendation: "Consider adding relevant images to improve engagement and SEO." });
    return issues;
  }

  let missingAlt = 0;
  let emptyAlt = 0;
  for (const img of images) {
    const altMatch = /alt\s*=\s*["']([^"']*)["']/i.exec(img);
    if (!altMatch) {
      missingAlt++;
    } else if (altMatch[1].trim() === "") {
      emptyAlt++;
    }
  }

  if (missingAlt > 0) {
    issues.push({ severity: "error", category: "images", message: `${missingAlt} image(s) missing alt attribute.`, recommendation: "Add descriptive alt text to all images for accessibility and SEO." });
  }
  if (emptyAlt > 0) {
    issues.push({ severity: "warning", category: "images", message: `${emptyAlt} image(s) have empty alt text.`, recommendation: "Add meaningful alt text describing the image content." });
  }

  return issues;
}

function analyzeLinks(content: string, siteUrl?: string): SeoIssue[] {
  const issues: SeoIssue[] = [];
  const linkRegex = /<a\s[^>]*href\s*=\s*["']([^"']*)["'][^>]*>(.*?)<\/a>/gi;
  let internalCount = 0;
  let externalCount = 0;
  let nofollowCount = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(content)) !== null) {
    const href = match[1];
    const tag = match[0];

    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      continue;
    }

    const isExternal = href.startsWith("http") && (!siteUrl || !href.includes(siteUrl.replace(/https?:\/\//, "")));
    if (isExternal) {
      externalCount++;
      if (/rel\s*=\s*["'][^"']*nofollow[^"']*["']/i.test(tag)) {
        nofollowCount++;
      }
    } else {
      internalCount++;
    }
  }

  if (internalCount === 0 && countWords(content) > 300) {
    issues.push({ severity: "warning", category: "links", message: "No internal links found.", recommendation: "Add internal links to related content to improve site navigation and SEO." });
  }

  if (externalCount === 0 && countWords(content) > 500) {
    issues.push({ severity: "info", category: "links", message: "No external links found.", recommendation: "Consider linking to authoritative external sources to build credibility." });
  }

  issues.push({ severity: "info", category: "links", message: `Links: ${internalCount} internal, ${externalCount} external (${nofollowCount} nofollow).`, recommendation: "No action needed." });

  return issues;
}

function analyzeSlug(slug: string): SeoIssue[] {
  const issues: SeoIssue[] = [];

  if (!slug) {
    issues.push({ severity: "warning", category: "url", message: "No slug set.", recommendation: "Set a descriptive URL slug with target keywords." });
    return issues;
  }

  if (slug.length > 75) {
    issues.push({ severity: "warning", category: "url", message: `Slug is long (${slug.length} chars).`, recommendation: "Keep URL slugs under 75 characters for better readability and sharing." });
  }

  const parts = slug.split("-");
  const stopWordsInSlug = parts.filter((w) => STOP_WORDS.has(w));
  if (stopWordsInSlug.length > 2) {
    issues.push({ severity: "info", category: "url", message: `Slug contains stop words: ${stopWordsInSlug.join(", ")}.`, recommendation: "Remove unnecessary stop words from the slug for a cleaner URL." });
  }

  return issues;
}

function analyzeContentLength(content: string): SeoIssue[] {
  const issues: SeoIssue[] = [];
  const words = countWords(content);

  if (words < 100) {
    issues.push({ severity: "error", category: "content", message: `Content is very thin (${words} words).`, recommendation: "Aim for at least 300 words. Thin content is unlikely to rank well." });
  } else if (words < 300) {
    issues.push({ severity: "warning", category: "content", message: `Content is short (${words} words). Recommended: 300+ words.`, recommendation: "Expand the content with more detail, examples, or related information." });
  } else if (words > 2500) {
    issues.push({ severity: "info", category: "content", message: `Long-form content (${words} words). Well-structured long content tends to rank well.`, recommendation: "Ensure content is well-organized with headings and subheadings." });
  } else {
    issues.push({ severity: "info", category: "content", message: `Content length is good (${words} words).`, recommendation: "No action needed." });
  }

  return issues;
}

function calculateScore(issues: SeoIssue[]): number {
  let score = 100;
  for (const issue of issues) {
    if (issue.severity === "error") score -= 15;
    else if (issue.severity === "warning") score -= 7;
    // info issues don't deduct
  }
  return Math.max(0, Math.min(100, score));
}

// ─── Tool registration ───────────────────────────────────────────────

export function registerSeoAnalysisTools(server: McpServer, client: WpClient): void {
  server.tool("wp_analyze_seo", "Comprehensive SEO audit for a WordPress post or page. Checks title length, meta description, heading hierarchy, image alt text, link structure, content length, and URL slug. Returns a scored report with actionable recommendations.", AnalyzeSeoSchema.shape, async (p) => {
    try {
      const { post_id, post_type } = AnalyzeSeoSchema.parse(p);
      const post = await client.get<Record<string, unknown>>(`${post_type}/${post_id}`, { context: "edit" });

      const titleRaw = ((post["title"] as Record<string, unknown>)?.["raw"] as string) ?? "";
      const contentRaw = ((post["content"] as Record<string, unknown>)?.["raw"] as string) ?? "";
      const excerptRaw = ((post["excerpt"] as Record<string, unknown>)?.["raw"] as string) ?? "";
      const slug = (post["slug"] as string) ?? "";

      const issues: SeoIssue[] = [
        ...analyzeTitle(titleRaw),
        ...analyzeExcerpt(excerptRaw),
        ...analyzeHeadings(contentRaw),
        ...analyzeImages(contentRaw),
        ...analyzeLinks(contentRaw),
        ...analyzeSlug(slug),
        ...analyzeContentLength(contentRaw),
      ];

      // Check featured image
      const featuredMedia = post["featured_media"] as number | undefined;
      if (!featuredMedia || featuredMedia === 0) {
        issues.push({ severity: "warning", category: "images", message: "No featured image set.", recommendation: "Set a featured image for social sharing and visual appeal in search results." });
      }

      const wordCount = countWords(contentRaw);
      const headingMatches = contentRaw.match(/<h[1-6][^>]*>/gi);
      const imageMatches = contentRaw.match(/<img\s[^>]*/gi);
      const linkMatches = contentRaw.match(/<a\s[^>]*href/gi);
      const internalLinkMatches = contentRaw.match(/<a\s[^>]*href\s*=\s*["'](?!https?:\/\/|#|mailto:|tel:)[^"']*["']/gi);

      const stats: SeoStats = {
        word_count: wordCount,
        heading_count: headingMatches ? headingMatches.length : 0,
        image_count: imageMatches ? imageMatches.length : 0,
        link_count: linkMatches ? linkMatches.length : 0,
        internal_link_count: internalLinkMatches ? internalLinkMatches.length : 0,
        external_link_count: (linkMatches ? linkMatches.length : 0) - (internalLinkMatches ? internalLinkMatches.length : 0),
      };

      const score = calculateScore(issues);

      return mcpSuccess({
        score,
        post_id,
        post_type,
        title: titleRaw,
        slug,
        issues,
        stats,
        summary: `SEO Score: ${score}/100 — ${issues.filter((i) => i.severity === "error").length} errors, ${issues.filter((i) => i.severity === "warning").length} warnings, ${issues.filter((i) => i.severity === "info").length} info`,
      });
    } catch (e) { return mcpError(e, "wp_analyze_seo"); }
  });

  server.tool("wp_get_rankmath_score", "Get RankMath SEO data for a post/page (requires RankMath plugin). Returns SEO score, focus keyword, and meta fields.", GetRankMathScoreSchema.shape, async (p) => {
    try {
      const { post_id, post_type } = GetRankMathScoreSchema.parse(p);
      const post = await client.get<Record<string, unknown>>(`${post_type}/${post_id}`, { context: "edit" });

      const meta = (post["meta"] as Record<string, unknown>) ?? {};

      // RankMath stores data in post meta with rank_math_ prefix
      const rankMathFields: Record<string, unknown> = {};
      const RANK_MATH_KEYS = [
        "rank_math_seo_score",
        "rank_math_focus_keyword",
        "rank_math_title",
        "rank_math_description",
        "rank_math_canonical_url",
        "rank_math_robots",
        "rank_math_advanced_robots",
        "rank_math_facebook_title",
        "rank_math_facebook_description",
        "rank_math_facebook_image",
        "rank_math_twitter_title",
        "rank_math_twitter_description",
        "rank_math_twitter_image",
        "rank_math_schema_type",
        "rank_math_internal_links_count",
        "rank_math_external_links_count",
      ];

      let found = false;
      for (const key of RANK_MATH_KEYS) {
        if (meta[key] !== undefined && meta[key] !== null && meta[key] !== "") {
          rankMathFields[key] = meta[key];
          found = true;
        }
      }

      if (!found) {
        return mcpSuccess({
          post_id,
          post_type,
          rank_math_active: false,
          message: "No RankMath data found. The RankMath plugin may not be installed or its meta fields are not exposed to the REST API.",
          suggestion: "Ensure RankMath SEO plugin is active and REST API meta fields are enabled.",
        });
      }

      return mcpSuccess({
        post_id,
        post_type,
        rank_math_active: true,
        score: rankMathFields["rank_math_seo_score"] ?? null,
        focus_keyword: rankMathFields["rank_math_focus_keyword"] ?? null,
        fields: rankMathFields,
        message: `RankMath data found for ${post_type.slice(0, -1)} ${post_id}`,
      });
    } catch (e) { return mcpError(e, "wp_get_rankmath_score"); }
  });

  server.tool("wp_get_seo_overview", "Site-wide SEO overview — quick-checks recent posts/pages for missing excerpts, title length issues, and missing featured images. Returns a summary with per-post issue counts.", GetSeoOverviewSchema.shape, async (p) => {
    try {
      const { post_type, limit } = GetSeoOverviewSchema.parse(p);
      const posts = await client.list<Record<string, unknown>>(post_type, { status: "publish", orderby: "date", order: "desc" }, 1, limit);

      let totalIssues = 0;
      const postsWithIssues: Array<{ id: unknown; title: string; issues: string[] }> = [];

      for (const post of posts) {
        const issues: string[] = [];

        // Title length check
        const titleRendered = ((post["title"] as Record<string, unknown>)?.["rendered"] as string) ?? "";
        const titleClean = stripHtml(titleRendered);
        if (titleClean.length < 30) issues.push(`Title too short (${titleClean.length} chars)`);
        if (titleClean.length > 60) issues.push(`Title too long (${titleClean.length} chars)`);

        // Excerpt check
        const excerptRendered = ((post["excerpt"] as Record<string, unknown>)?.["rendered"] as string) ?? "";
        const excerptClean = stripHtml(excerptRendered);
        if (excerptClean.length === 0) issues.push("No excerpt/meta description");

        // Featured image check
        const featuredMedia = post["featured_media"] as number | undefined;
        if (!featuredMedia || featuredMedia === 0) issues.push("No featured image");

        if (issues.length > 0) {
          totalIssues += issues.length;
          postsWithIssues.push({
            id: post["id"],
            title: titleClean,
            issues,
          });
        }
      }

      return mcpSuccess({
        total_checked: posts.length,
        issues_found: totalIssues,
        posts_with_issues: postsWithIssues,
        posts_without_issues: posts.length - postsWithIssues.length,
        message: `Checked ${posts.length} ${post_type}: ${totalIssues} issues across ${postsWithIssues.length} posts`,
      });
    } catch (e) { return mcpError(e, "wp_get_seo_overview"); }
  });
}
