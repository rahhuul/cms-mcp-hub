import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WpClient } from "../api/client.js";
import {
  AnalyzeReadabilitySchema,
  AnalyzeContentQualitySchema,
  ContentCalendarSchema,
  FindThinContentSchema,
} from "../schemas/index.js";

/* ------------------------------------------------------------------ */
/*  Text analysis helpers                                              */
/* ------------------------------------------------------------------ */

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  word = word.replace(/^y/, "");
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

function getWords(text: string): string[] {
  return text.split(/\s+/).filter((w) => w.length > 0);
}

function getSentences(text: string): string[] {
  return text.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 0);
}

function getParagraphs(html: string): string[] {
  // Split on paragraph/heading/div/br tags, then filter empty
  return html
    .split(/<\/p>|<\/div>|<br\s*\/?>|<\/h[1-6]>/i)
    .map((p) => stripHtml(p))
    .filter((p) => p.length > 0);
}

function getFleschLabel(score: number): string {
  if (score >= 90) return "Very Easy";
  if (score >= 80) return "Easy";
  if (score >= 70) return "Fairly Easy";
  if (score >= 60) return "Standard";
  if (score >= 50) return "Fairly Difficult";
  if (score >= 30) return "Difficult";
  return "Very Difficult";
}

function detectPassiveVoice(sentences: string[]): number {
  const passivePattern = /\b(was|were|been|being|is|are|am)\s+\w+ed\b/i;
  return sentences.filter((s) => passivePattern.test(s)).length;
}

function extractHeadings(html: string): string[] {
  const matches = html.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi) || [];
  return matches.map((h) => stripHtml(h));
}

function countMedia(html: string): number {
  const images = (html.match(/<img\b/gi) || []).length;
  const videos = (html.match(/<video\b/gi) || []).length;
  const iframes = (html.match(/<iframe\b/gi) || []).length;
  return images + videos + iframes;
}

function countLists(html: string): number {
  return (html.match(/<[ou]l\b/gi) || []).length;
}

function hasCallToAction(html: string): boolean {
  const buttonPattern = /<(button|a)\b[^>]*class="[^"]*(?:cta|btn|button|wp-block-button)[^"]*"[^>]*>/i;
  const linkAtEnd = /<a\b[^>]*>[^<]*<\/a>\s*(<\/p>|<\/div>)?\s*$/i;
  return buttonPattern.test(html) || linkAtEnd.test(html);
}

function getContentField(post: Record<string, unknown>): string {
  const content = post["content"] as Record<string, unknown> | undefined;
  return (content?.["rendered"] as string) || "";
}

function getTitleField(post: Record<string, unknown>): string {
  const title = post["title"] as Record<string, unknown> | undefined;
  return (title?.["rendered"] as string) || "";
}

function getExcerptField(post: Record<string, unknown>): string {
  const excerpt = post["excerpt"] as Record<string, unknown> | undefined;
  return (excerpt?.["rendered"] as string) || "";
}

/* ------------------------------------------------------------------ */
/*  Tool registration                                                  */
/* ------------------------------------------------------------------ */

export function registerContentAnalysisTools(server: McpServer, client: WpClient): void {

  /* ── wp_analyze_readability ──────────────────────────────────────── */

  server.tool(
    "wp_analyze_readability",
    "Analyze readability of a post/page. Returns Flesch Reading Ease, grade level, sentence stats, passive voice count, and recommendations.",
    AnalyzeReadabilitySchema.shape,
    async (params) => {
      try {
        const { post_id, post_type } = AnalyzeReadabilitySchema.parse(params);
        const post = await client.get<Record<string, unknown>>(`${post_type}/${post_id}`);
        const html = getContentField(post);
        const plainText = stripHtml(html);

        if (!plainText || plainText.length < 10) {
          return mcpSuccess({ post_id, error: "Post has no meaningful content to analyze" });
        }

        const words = getWords(plainText);
        const sentences = getSentences(plainText);
        const paragraphs = getParagraphs(html);
        const wordCount = words.length;
        const sentenceCount = Math.max(sentences.length, 1);
        const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);

        const avgSentenceLength = wordCount / sentenceCount;
        const avgSyllablesPerWord = totalSyllables / Math.max(wordCount, 1);

        const fleschScore = Math.round(
          (206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord) * 10
        ) / 10;
        const gradeLevel = Math.round(
          (0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59) * 10
        ) / 10;

        const longSentences = sentences.filter((s) => getWords(s).length > 25).length;
        const passiveCount = detectPassiveVoice(sentences);
        const avgWordLength = Math.round(
          (words.reduce((sum, w) => sum + w.length, 0) / Math.max(wordCount, 1)) * 10
        ) / 10;
        const sentencesPerParagraph = Math.round(
          (sentenceCount / Math.max(paragraphs.length, 1)) * 10
        ) / 10;

        const recommendations: string[] = [];
        if (fleschScore < 50) recommendations.push("Content is difficult to read. Use shorter sentences and simpler words.");
        if (avgSentenceLength > 20) recommendations.push(`Average sentence length is ${Math.round(avgSentenceLength)} words. Aim for 15-20 words per sentence.`);
        if (longSentences > 0) recommendations.push(`${longSentences} sentence(s) exceed 25 words. Break them into shorter sentences.`);
        if (passiveCount > sentenceCount * 0.15) recommendations.push(`${passiveCount} sentence(s) use passive voice. Prefer active voice for clarity.`);
        if (sentencesPerParagraph > 6) recommendations.push("Paragraphs are long. Aim for 3-5 sentences per paragraph for better readability.");
        if (avgSyllablesPerWord > 1.7) recommendations.push("Many complex words detected. Consider using simpler alternatives where possible.");
        if (recommendations.length === 0) recommendations.push("Content readability is good. No major issues detected.");

        return mcpSuccess({
          post_id,
          title: stripHtml(getTitleField(post)),
          flesch_score: fleschScore,
          grade_level: gradeLevel,
          grade_label: getFleschLabel(fleschScore),
          stats: {
            word_count: wordCount,
            sentence_count: sentenceCount,
            paragraph_count: paragraphs.length,
            avg_sentence_length: Math.round(avgSentenceLength * 10) / 10,
            avg_word_length: avgWordLength,
            sentences_per_paragraph: sentencesPerParagraph,
            long_sentence_count: longSentences,
            passive_voice_count: passiveCount,
            syllable_count: totalSyllables,
          },
          recommendations,
        });
      } catch (e) {
        return mcpError(e, "wp_analyze_readability");
      }
    },
  );

  /* ── wp_analyze_content_quality ──────────────────────────────────── */

  server.tool(
    "wp_analyze_content_quality",
    "Analyze content quality of a post/page. Returns quality score (0-100), ratings for length, structure, media, freshness, and recommendations.",
    AnalyzeContentQualitySchema.shape,
    async (params) => {
      try {
        const { post_id, post_type } = AnalyzeContentQualitySchema.parse(params);
        const post = await client.get<Record<string, unknown>>(`${post_type}/${post_id}`);
        const html = getContentField(post);
        const plainText = stripHtml(html);
        const words = getWords(plainText);
        const wordCount = words.length;

        const recommendations: string[] = [];
        let totalScore = 0;

        // --- Length rating (0-25) ---
        let lengthRating: string;
        let lengthScore: number;
        if (wordCount < 300) { lengthRating = "thin"; lengthScore = 5; recommendations.push(`Content is thin (${wordCount} words). Aim for at least 300 words.`); }
        else if (wordCount < 1000) { lengthRating = "short"; lengthScore = 15; recommendations.push("Content is short. Consider expanding to 1000+ words for better engagement."); }
        else if (wordCount <= 2000) { lengthRating = "good"; lengthScore = 25; }
        else { lengthRating = "long-form"; lengthScore = 22; recommendations.push("Long-form content. Ensure it stays focused and well-structured."); }
        totalScore += lengthScore;

        // --- Structure rating (0-25) ---
        const headings = extractHeadings(html);
        const paragraphs = getParagraphs(html);
        const lists = countLists(html);
        const longParagraphs = paragraphs.filter((p) => getWords(p).length > 150).length;
        let structureScore = 0;

        // Heading distribution: ~1 heading per 300 words
        const expectedHeadings = Math.max(1, Math.floor(wordCount / 300));
        const headingRatio = Math.min(headings.length / expectedHeadings, 1);
        structureScore += Math.round(headingRatio * 10);

        if (headings.length === 0 && wordCount > 300) {
          recommendations.push("No headings found. Add headings (H2, H3) every 200-300 words to improve scanability.");
        }

        // Paragraph structure
        if (longParagraphs > 0) {
          recommendations.push(`${longParagraphs} paragraph(s) exceed 150 words. Break them up for readability.`);
        } else if (paragraphs.length > 1) {
          structureScore += 8;
        }

        // List usage
        if (lists > 0) { structureScore += 7; }
        else if (wordCount > 500) { recommendations.push("Consider using bullet/numbered lists for key points to improve scanability."); }

        totalScore += Math.min(structureScore, 25);

        // --- Media rating (0-25) ---
        const mediaCount = countMedia(html);
        const expectedMedia = Math.max(1, Math.floor(wordCount / 500));
        const mediaRatio = Math.min(mediaCount / expectedMedia, 1);
        const mediaScore = Math.round(mediaRatio * 20);

        const featuredMedia = post["featured_media"] as number | undefined;
        const hasFeaturedImage = !!featuredMedia && featuredMedia > 0;
        const featuredScore = hasFeaturedImage ? 5 : 0;
        if (!hasFeaturedImage) recommendations.push("No featured image set. Add one for better social sharing and visual appeal.");
        if (mediaCount === 0 && wordCount > 300) recommendations.push("No images or videos in content. Add media to break up text and increase engagement.");

        totalScore += Math.min(mediaScore + featuredScore, 25);

        // --- Freshness rating (0-15) ---
        const modified = post["modified"] as string | undefined;
        const created = post["date"] as string | undefined;
        let freshnessScore = 15;
        let freshnessRating = "fresh";

        if (modified) {
          const modDate = new Date(modified);
          const now = new Date();
          const daysSinceModified = Math.floor((now.getTime() - modDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysSinceModified > 365) { freshnessScore = 3; freshnessRating = "stale"; recommendations.push(`Content last updated ${daysSinceModified} days ago. Consider refreshing it.`); }
          else if (daysSinceModified > 180) { freshnessScore = 8; freshnessRating = "aging"; recommendations.push("Content is over 6 months old. Review for accuracy and relevance."); }
          else if (daysSinceModified > 90) { freshnessScore = 12; freshnessRating = "moderate"; }
        }
        totalScore += freshnessScore;

        // --- CTA / engagement (0-10) ---
        const hasCta = hasCallToAction(html);
        const ctaScore = hasCta ? 10 : 0;
        if (!hasCta && wordCount > 300) recommendations.push("No call-to-action detected. Add a CTA to guide readers to the next step.");
        totalScore += ctaScore;

        // --- Excerpt check ---
        const excerpt = stripHtml(getExcerptField(post));
        if (!excerpt || excerpt.length < 10) recommendations.push("No custom excerpt set. Add one for better search results and social previews.");

        // --- Categories check ---
        const categories = post["categories"] as number[] | undefined;
        if (!categories || categories.length === 0 || (categories.length === 1 && categories[0] === 1)) {
          recommendations.push("Post is only in the default 'Uncategorized' category. Assign a relevant category.");
        }

        if (recommendations.length === 0) recommendations.push("Content quality is excellent. No issues detected.");

        return mcpSuccess({
          post_id,
          title: stripHtml(getTitleField(post)),
          quality_score: Math.min(totalScore, 100),
          ratings: {
            length: { rating: lengthRating, score: lengthScore, max: 25, word_count: wordCount },
            structure: { score: Math.min(structureScore, 25), max: 25, headings: headings.length, paragraphs: paragraphs.length, lists, long_paragraphs: longParagraphs },
            media: { score: Math.min(mediaScore + featuredScore, 25), max: 25, inline_media: mediaCount, has_featured_image: hasFeaturedImage },
            freshness: { rating: freshnessRating, score: freshnessScore, max: 15, last_modified: modified || created || "unknown" },
            engagement: { score: ctaScore, max: 10, has_cta: hasCta },
          },
          recommendations,
        });
      } catch (e) {
        return mcpError(e, "wp_analyze_content_quality");
      }
    },
  );

  /* ── wp_content_calendar ─────────────────────────────────────────── */

  server.tool(
    "wp_content_calendar",
    "View scheduled, recent, and draft content as a calendar overview. Groups posts by status and week for editorial planning.",
    ContentCalendarSchema.shape,
    async (params) => {
      try {
        const { status, days, post_type } = ContentCalendarSchema.parse(params);
        const now = new Date();
        const pastDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

        const queryParams: Record<string, string | number | boolean | undefined> = {
          after: pastDate.toISOString(),
          before: futureDate.toISOString(),
          orderby: "date",
          order: "asc",
        };
        if (status !== "any") queryParams["status"] = status;
        else queryParams["status"] = "publish,future,draft,pending,private";

        const posts = await client.list<Record<string, unknown>>(post_type, queryParams, 1, 100);

        // Group by week and status
        const summary = { total: posts.length, published: 0, scheduled: 0, drafts: 0, pending: 0, private: 0 };
        const weeklyGroups: Record<string, Array<{ id: unknown; title: string; status: unknown; date: unknown; modified: unknown }>> = {};

        for (const post of posts) {
          const postStatus = post["status"] as string;
          if (postStatus === "publish") summary.published++;
          else if (postStatus === "future") summary.scheduled++;
          else if (postStatus === "draft") summary.drafts++;
          else if (postStatus === "pending") summary.pending++;
          else if (postStatus === "private") summary.private++;

          const postDate = new Date(post["date"] as string);
          const weekStart = new Date(postDate);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          const weekKey = weekStart.toISOString().split("T")[0]!;

          if (!weeklyGroups[weekKey]) weeklyGroups[weekKey] = [];
          weeklyGroups[weekKey]!.push({
            id: post["id"],
            title: stripHtml(getTitleField(post)),
            status: postStatus,
            date: post["date"],
            modified: post["modified"],
          });
        }

        return mcpSuccess({
          summary,
          date_range: { from: pastDate.toISOString().split("T")[0], to: futureDate.toISOString().split("T")[0] },
          weeks: weeklyGroups,
          posts: posts.map((p) => ({
            id: p["id"],
            title: stripHtml(getTitleField(p)),
            status: p["status"],
            date: p["date"],
            modified: p["modified"],
          })),
        });
      } catch (e) {
        return mcpError(e, "wp_content_calendar");
      }
    },
  );

  /* ── wp_find_thin_content ────────────────────────────────────────── */

  server.tool(
    "wp_find_thin_content",
    "Find posts/pages with thin or low-quality content. Flags posts below a word-count threshold and those missing featured images, excerpts, or categories.",
    FindThinContentSchema.shape,
    async (params) => {
      try {
        const { post_type, min_words, limit } = FindThinContentSchema.parse(params);
        const posts = await client.list<Record<string, unknown>>(post_type, { status: "publish" }, 1, limit);

        const thinPosts: Array<{ id: unknown; title: string; word_count: number; issues: string[] }> = [];

        for (const post of posts) {
          const html = getContentField(post);
          const plainText = stripHtml(html);
          const wordCount = getWords(plainText).length;
          const issues: string[] = [];

          if (wordCount < min_words) issues.push(`Only ${wordCount} words (minimum: ${min_words})`);

          const featuredMedia = post["featured_media"] as number | undefined;
          if (!featuredMedia || featuredMedia === 0) issues.push("Missing featured image");

          const excerpt = stripHtml(getExcerptField(post));
          if (!excerpt || excerpt.length < 10) issues.push("Missing custom excerpt");

          const categories = post["categories"] as number[] | undefined;
          if (!categories || categories.length === 0 || (categories.length === 1 && categories[0] === 1)) {
            issues.push("Only in default/uncategorized category");
          }

          if (issues.length > 0) {
            thinPosts.push({
              id: post["id"],
              title: stripHtml(getTitleField(post)),
              word_count: wordCount,
              issues,
            });
          }
        }

        // Sort: fewest words first
        thinPosts.sort((a, b) => a.word_count - b.word_count);

        return mcpSuccess({
          total_checked: posts.length,
          thin_count: thinPosts.length,
          min_words_threshold: min_words,
          thin_posts: thinPosts,
        });
      } catch (e) {
        return mcpError(e, "wp_find_thin_content");
      }
    },
  );
}
