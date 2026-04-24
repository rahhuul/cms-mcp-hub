import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WpClient } from "../api/client.js";
import {
  CheckBrokenLinksSchema,
  AnalyzeImagesSchema,
  CheckStructuredDataSchema,
} from "../schemas/index.js";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const SKIP_PROTOCOLS = ["mailto:", "tel:", "javascript:", "#", "data:"];
const MAX_LINKS_PER_POST = 50;
const MAX_LINKS_TOTAL = 200;
const LINK_TIMEOUT_MS = 5_000;
const CONCURRENCY = 5;

interface LinkCheckResult {
  post_id: number;
  post_title: string;
  url: string;
  status_code: number | null;
  error: string | null;
  type: "broken" | "redirect" | "warning";
}

/** Simple concurrency limiter */
async function withConcurrency<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx]);
    }
  });
  await Promise.all(workers);
}

function extractUrls(html: string): string[] {
  const re = /href="([^"]+)"/g;
  const urls: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const url = m[1].trim();
    if (!url || SKIP_PROTOCOLS.some((p) => url.startsWith(p))) continue;
    urls.push(url);
  }
  return [...new Set(urls)];
}

interface ImgTag {
  full: string;
  src: string;
  alt: string | null;
  width: string | null;
  height: string | null;
  loading: string | null;
}

function extractImages(html: string): ImgTag[] {
  const re = /<img\b[^>]*>/gi;
  const imgs: ImgTag[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const tag = m[0];
    const src = tag.match(/src="([^"]+)"/)?.[1] ?? "";
    const alt = tag.match(/alt="([^"]*)"/)?.[1] ?? null;
    const width = tag.match(/width="([^"]+)"/)?.[1] ?? null;
    const height = tag.match(/height="([^"]+)"/)?.[1] ?? null;
    const loading = tag.match(/loading="([^"]+)"/)?.[1] ?? null;
    if (src) imgs.push({ full: tag, src, alt, width, height, loading });
  }
  return imgs;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function getContentText(post: Record<string, unknown>): string {
  const content = post["content"] as Record<string, unknown> | undefined;
  return (content?.["rendered"] as string) ?? "";
}

function getPostTitle(post: Record<string, unknown>): string {
  const title = post["title"] as Record<string, unknown> | undefined;
  return stripHtml((title?.["rendered"] as string) ?? "Untitled");
}

/* ------------------------------------------------------------------ */
/*  Link checker                                                       */
/* ------------------------------------------------------------------ */

async function checkUrl(url: string): Promise<{
  status: number | null;
  error: string | null;
  redirected: boolean;
  finalUrl: string | null;
}> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LINK_TIMEOUT_MS);

  try {
    // Try HEAD first
    let response: Response;
    try {
      response = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal: controller.signal,
        headers: { "User-Agent": USER_AGENT },
      });
    } catch {
      // HEAD may be blocked (405), try GET
      response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { "User-Agent": USER_AGENT },
      });
    }

    clearTimeout(timer);
    return {
      status: response.status,
      error: null,
      redirected: response.redirected,
      finalUrl: response.redirected ? response.url : null,
    };
  } catch (err: unknown) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("abort")) {
      return { status: null, error: "Timeout (5s)", redirected: false, finalUrl: null };
    }
    return { status: null, error: msg, redirected: false, finalUrl: null };
  }
}

/* ------------------------------------------------------------------ */
/*  Image analysis helpers                                             */
/* ------------------------------------------------------------------ */

function analyzeImageTag(img: ImgTag): string[] {
  const problems: string[] = [];

  // Alt text checks
  if (img.alt === null || img.alt === undefined) {
    problems.push("Missing alt attribute (critical for SEO & accessibility)");
  } else if (img.alt === "") {
    problems.push("Empty alt text (should describe image unless decorative)");
  } else {
    if (img.alt.length < 5) problems.push(`Alt text too short (${img.alt.length} chars, min 5)`);
    if (img.alt.length > 125) problems.push(`Alt text too long (${img.alt.length} chars, max 125)`);
    // Check if alt looks like a filename
    if (/^[\w-]+\.(jpg|jpeg|png|gif|webp|svg|avif)$/i.test(img.alt)) {
      problems.push("Alt text appears to be a filename, not descriptive");
    }
  }

  // Dimension attributes
  if (!img.width || !img.height) {
    problems.push("Missing width/height attributes (causes Cumulative Layout Shift)");
  }

  // Lazy loading
  if (img.loading !== "lazy") {
    problems.push('No loading="lazy" attribute (delays page load for below-fold images)');
  }

  // Image format check
  const ext = img.src.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)/i)?.[1]?.toLowerCase();
  if (ext && ["jpg", "jpeg", "png", "gif"].includes(ext)) {
    problems.push(`Using ${ext.toUpperCase()} format — consider WebP/AVIF for better compression`);
  }

  // Large image heuristic (check for dimension patterns in URL like -1920x1080)
  const dimMatch = img.src.match(/-(\d+)x(\d+)\./);
  if (dimMatch) {
    const w = parseInt(dimMatch[1], 10);
    const h = parseInt(dimMatch[2], 10);
    if (w > 2000 || h > 2000) {
      problems.push(`Potentially oversized image (${w}x${h}px) — consider smaller dimensions`);
    }
  }

  return problems;
}

/* ------------------------------------------------------------------ */
/*  Structured data helpers                                            */
/* ------------------------------------------------------------------ */

const ARTICLE_REQUIRED = ["headline", "datePublished", "author"];
const ARTICLE_RECOMMENDED = ["image", "publisher", "dateModified", "description"];

interface SchemaInfo {
  type: string;
  properties: string[];
  issues: string[];
}

function analyzeJsonLd(json: unknown): SchemaInfo {
  const obj = json as Record<string, unknown>;
  const type = (obj["@type"] as string) ?? "Unknown";
  const properties = Object.keys(obj).filter((k) => !k.startsWith("@"));
  const issues: string[] = [];

  if (!obj["@type"]) {
    issues.push("Missing @type property");
  }

  if (!obj["@context"]) {
    issues.push("Missing @context property");
  }

  // Type-specific checks
  if (["Article", "BlogPosting", "NewsArticle", "TechArticle"].includes(type)) {
    for (const prop of ARTICLE_REQUIRED) {
      if (!obj[prop]) issues.push(`Missing required property: ${prop}`);
    }
    for (const prop of ARTICLE_RECOMMENDED) {
      if (!obj[prop]) issues.push(`Missing recommended property: ${prop}`);
    }
  }

  if (["Product"].includes(type)) {
    if (!obj["name"]) issues.push("Missing required property: name");
    if (!obj["offers"]) issues.push("Missing required property: offers");
    if (!obj["image"]) issues.push("Missing recommended property: image");
  }

  if (type === "WebPage") {
    if (!obj["name"] && !obj["headline"]) issues.push("Missing name/headline");
  }

  // Check author structure
  if (obj["author"]) {
    const author = obj["author"] as Record<string, unknown>;
    if (typeof author === "object" && !author["name"]) {
      issues.push("Author object missing name property");
    }
  }

  // Check publisher structure
  if (obj["publisher"]) {
    const publisher = obj["publisher"] as Record<string, unknown>;
    if (typeof publisher === "object" && !publisher["name"]) {
      issues.push("Publisher object missing name property");
    }
    if (typeof publisher === "object" && !publisher["logo"]) {
      issues.push("Publisher object missing logo property");
    }
  }

  return { type, properties, issues };
}

/* ------------------------------------------------------------------ */
/*  Tool registration                                                  */
/* ------------------------------------------------------------------ */

export function registerLinkAnalysisTools(server: McpServer, client: WpClient): void {
  /* ── wp_check_broken_links ────────────────────────────────────────── */
  server.tool(
    "wp_check_broken_links",
    "Scan WordPress posts/pages for broken links, redirects, and problematic URLs. Checks each link with a HEAD request and reports dead links, redirect chains, localhost links, and empty hrefs.",
    CheckBrokenLinksSchema.shape,
    async (params) => {
      try {
        const { post_id, post_type, limit } = CheckBrokenLinksSchema.parse(params);

        // Fetch posts to scan
        let posts: Record<string, unknown>[];
        if (post_id !== undefined) {
          const post = await client.get<Record<string, unknown>>(`${post_type}/${post_id}`);
          posts = [post];
        } else {
          posts = await client.list<Record<string, unknown>>(post_type, { status: "publish" }, 1, limit);
        }

        const broken: LinkCheckResult[] = [];
        const redirects: LinkCheckResult[] = [];
        const warnings: LinkCheckResult[] = [];
        let totalLinks = 0;
        let linksChecked = 0;

        for (const post of posts) {
          const html = getContentText(post);
          const title = getPostTitle(post);
          const pid = post["id"] as number;
          let urls = extractUrls(html);

          // Cap per post
          if (urls.length > MAX_LINKS_PER_POST) {
            urls = urls.slice(0, MAX_LINKS_PER_POST);
          }

          // Cap total
          if (totalLinks + urls.length > MAX_LINKS_TOTAL) {
            urls = urls.slice(0, MAX_LINKS_TOTAL - totalLinks);
          }

          totalLinks += urls.length;

          // Check for empty hrefs or anchors-only already filtered
          // Check for localhost links
          const localhostUrls = urls.filter(
            (u) => u.includes("localhost") || u.includes("127.0.0.1"),
          );
          for (const u of localhostUrls) {
            warnings.push({
              post_id: pid,
              post_title: title,
              url: u,
              status_code: null,
              error: "Links to localhost — likely a development artifact",
              type: "warning",
            });
          }

          // Filter out localhost for actual checking
          const checkable = urls.filter(
            (u) => !u.includes("localhost") && !u.includes("127.0.0.1"),
          );

          await withConcurrency(checkable, CONCURRENCY, async (url) => {
            linksChecked++;
            const result = await checkUrl(url);

            if (result.error) {
              broken.push({
                post_id: pid,
                post_title: title,
                url,
                status_code: null,
                error: result.error,
                type: "broken",
              });
            } else if (result.status && result.status >= 400) {
              broken.push({
                post_id: pid,
                post_title: title,
                url,
                status_code: result.status,
                error: `HTTP ${result.status}`,
                type: "broken",
              });
            } else if (result.redirected) {
              redirects.push({
                post_id: pid,
                post_title: title,
                url,
                status_code: result.status,
                error: `Redirects to: ${result.finalUrl}`,
                type: "redirect",
              });
            }
          });

          if (totalLinks >= MAX_LINKS_TOTAL) break;
        }

        return mcpSuccess({
          posts_scanned: posts.length,
          total_links: totalLinks,
          links_checked: linksChecked,
          broken_count: broken.length,
          redirect_count: redirects.length,
          warning_count: warnings.length,
          broken,
          redirects,
          warnings,
        });
      } catch (e) {
        return mcpError(e, "wp_check_broken_links");
      }
    },
  );

  /* ── wp_analyze_images ────────────────────────────────────────────── */
  server.tool(
    "wp_analyze_images",
    "Audit images in a WordPress post/page for SEO and performance issues. Checks alt text quality, missing dimensions, lazy loading, image format, and featured image. Returns a 0-100 score with specific recommendations.",
    AnalyzeImagesSchema.shape,
    async (params) => {
      try {
        const { post_id, post_type } = AnalyzeImagesSchema.parse(params);
        const post = await client.get<Record<string, unknown>>(`${post_type}/${post_id}`);

        const html = getContentText(post);
        const images = extractImages(html);
        const featuredMedia = post["featured_media"] as number | undefined;
        const wordCount = stripHtml(html).split(/\s+/).filter(Boolean).length;

        const issues: Array<{ image_src: string; problems: string[] }> = [];
        let totalProblems = 0;

        for (const img of images) {
          const problems = analyzeImageTag(img);
          if (problems.length > 0) {
            issues.push({ image_src: img.src, problems });
            totalProblems += problems.length;
          }
        }

        const recommendations: string[] = [];

        // Featured image check
        if (!featuredMedia || featuredMedia === 0) {
          recommendations.push(
            "Set a featured image — critical for social sharing and SEO",
          );
        }

        // Image count vs content length
        if (images.length === 0 && wordCount > 300) {
          recommendations.push(
            "No images found in content — add relevant images to improve engagement",
          );
        } else if (wordCount > 1000 && images.length < 2) {
          recommendations.push(
            "Long content with few images — consider adding more visual content (1 image per 300-500 words)",
          );
        }

        // Check for any missing alt text overall
        const missingAlt = images.filter((img) => img.alt === null || img.alt === "");
        if (missingAlt.length > 0) {
          recommendations.push(
            `${missingAlt.length} image(s) missing alt text — add descriptive alt text for accessibility and SEO`,
          );
        }

        // Check for legacy formats
        const legacyFormats = images.filter((img) => {
          const ext = img.src.match(/\.(jpg|jpeg|png|gif)/i)?.[1];
          return !!ext;
        });
        if (legacyFormats.length > 0) {
          recommendations.push(
            `${legacyFormats.length} image(s) using legacy formats — convert to WebP for 25-50% smaller file sizes`,
          );
        }

        // Score calculation (0-100)
        let score = 100;
        const maxDeductions = images.length > 0 ? images.length * 5 : 5; // normalize
        if (!featuredMedia || featuredMedia === 0) score -= 15;
        if (images.length === 0 && wordCount > 300) score -= 10;
        // Deduct for individual issues
        score -= Math.min(totalProblems * 5, 60);
        score = Math.max(0, Math.min(100, score));

        return mcpSuccess({
          post_id,
          post_title: getPostTitle(post),
          total_images: images.length,
          featured_image: !!featuredMedia && featuredMedia > 0,
          word_count: wordCount,
          issues,
          score,
          recommendations,
        });
      } catch (e) {
        return mcpError(e, "wp_analyze_images");
      }
    },
  );

  /* ── wp_check_structured_data ─────────────────────────────────────── */
  server.tool(
    "wp_check_structured_data",
    "Check a WordPress post/page for Schema.org structured data (JSON-LD). Detects JSON-LD blocks in content and Yoast/RankMath head output, validates required properties per schema type, and provides recommendations.",
    CheckStructuredDataSchema.shape,
    async (params) => {
      try {
        const { post_id, post_type } = CheckStructuredDataSchema.parse(params);
        const post = await client.get<Record<string, unknown>>(`${post_type}/${post_id}`);

        const html = getContentText(post);
        const title = getPostTitle(post);

        // Gather all text to search for JSON-LD
        // Check yoast_head (Yoast SEO injects structured data here)
        const yoastHead = (post["yoast_head"] as string) ?? "";
        // Some themes/plugins put it in head_tags
        const headTags = (post["head_tags"] as string) ?? "";
        const searchText = `${html}\n${yoastHead}\n${headTags}`;

        // Extract JSON-LD blocks
        const jsonLdRegex = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
        const schemas: SchemaInfo[] = [];
        const rawBlocks: unknown[] = [];
        let m: RegExpExecArray | null;

        while ((m = jsonLdRegex.exec(searchText)) !== null) {
          try {
            const parsed = JSON.parse(m[1].trim());
            rawBlocks.push(parsed);

            // Handle @graph arrays (Yoast style)
            if (parsed["@graph"] && Array.isArray(parsed["@graph"])) {
              for (const item of parsed["@graph"]) {
                schemas.push(analyzeJsonLd(item));
              }
            } else {
              schemas.push(analyzeJsonLd(parsed));
            }
          } catch {
            schemas.push({
              type: "Invalid",
              properties: [],
              issues: ["JSON-LD block contains invalid JSON"],
            });
          }
        }

        const hasStructuredData = schemas.length > 0;
        const recommendations: string[] = [];

        if (!hasStructuredData) {
          recommendations.push(
            "No structured data found — install Yoast SEO or RankMath to auto-generate Schema.org markup",
          );
          recommendations.push(
            "Structured data helps search engines display rich snippets (ratings, breadcrumbs, FAQs)",
          );

          // Check if Yoast/RankMath might be active but not generating data
          const yoastMeta = post["yoast_head_json"] as Record<string, unknown> | undefined;
          if (yoastMeta) {
            recommendations.push(
              "Yoast SEO appears active (yoast_head_json found) but no JSON-LD detected in output — check Yoast schema settings",
            );
          }
        } else {
          // Check for common missing types
          const types = schemas.map((s) => s.type);
          if (
            !types.some((t) =>
              ["Article", "BlogPosting", "NewsArticle", "TechArticle", "WebPage"].includes(t),
            )
          ) {
            recommendations.push(
              "No Article/BlogPosting schema detected — important for blog content in search results",
            );
          }

          if (!types.includes("BreadcrumbList")) {
            recommendations.push(
              "No BreadcrumbList schema — helps search engines understand site structure",
            );
          }

          // Aggregate issues
          const allIssues = schemas.flatMap((s) => s.issues);
          if (allIssues.length > 0) {
            recommendations.push(
              `${allIssues.length} issue(s) found across ${schemas.length} schema(s) — see details below`,
            );
          }
        }

        return mcpSuccess({
          post_id,
          post_title: title,
          has_structured_data: hasStructuredData,
          schemas_found: schemas,
          total_schemas: schemas.length,
          recommendations,
        });
      } catch (e) {
        return mcpError(e, "wp_check_structured_data");
      }
    },
  );
}
