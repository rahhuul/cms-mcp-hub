/**
 * MCP Prompts — pre-built templates for common WordPress tasks.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerPrompts(server: McpServer): void {

  server.prompt("blog-post-creator", "Guided blog post creation with SEO optimization", () => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `Help me create a new WordPress blog post. Follow these steps:

1. Ask me for the topic/title
2. Generate an engaging post with:
   - An SEO-optimized title
   - A compelling introduction with a hook
   - 3-5 sections with H2/H3 headings
   - A conclusion with a call-to-action
   - HTML formatting suitable for WordPress
3. Suggest 3-5 relevant categories and tags
4. Generate an SEO meta description (under 160 characters)
5. Suggest a focus keyword for Yoast SEO
6. Use wp_create_full_post to create it all at once

Ask me for the topic now.`,
      },
    }],
  }));

  server.prompt("product-creator", "Guided WooCommerce product creation", () => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `Help me create a new WooCommerce product. I'll describe the product and you:

1. Ask for: product name, description, price, category, images
2. Generate a compelling product description with features and benefits
3. Suggest appropriate categories and tags
4. Use woo_create_full_product to create it with all details

What product would you like to create?`,
      },
    }],
  }));

  server.prompt("site-health-report", "Comprehensive WordPress site health report", () => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `Generate a comprehensive WordPress site health report. Use these tools:

1. wp_site_audit — Get overall site status
2. wp_get_settings — Check site configuration
3. wp_list_plugins — Check plugin status (active/inactive, any needing updates)
4. wp_list_themes — Check theme status
5. wp_list_users — Review user accounts
6. wp_list_posts with status="draft" — Check abandoned drafts
7. wp_list_comments with status="hold" — Check moderation queue

Present the results as a structured report with recommendations for each area. Flag any security concerns, performance issues, or content that needs attention.`,
      },
    }],
  }));

  server.prompt("content-calendar", "View and manage your content pipeline", () => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `Show me my WordPress content calendar. Use these tools:

1. wp_list_posts with status="future" — Show scheduled posts with dates
2. wp_list_posts with status="draft" — Show draft posts
3. wp_list_posts with status="pending" — Show posts awaiting review
4. wp_list_posts with status="publish" and recent dates — Show recently published

Present as a timeline view showing:
- What's scheduled and when
- What's in draft (and how old the drafts are)
- What's pending review
- Publishing frequency analysis
- Suggestions for content gaps`,
      },
    }],
  }));

  server.prompt("store-report", "WooCommerce store performance report", () => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `Generate a WooCommerce store performance report. Use these tools:

1. woo_store_dashboard — Get sales summary, pending orders, low stock
2. woo_get_reports_sales with period="month" — Monthly sales data
3. woo_get_reports_top_sellers — Best selling products
4. woo_get_reports_totals for orders, products, customers — Overall counts
5. woo_list_coupons — Active promotions

Present a dashboard-style report with:
- Revenue summary (this month vs context)
- Top 5 products by sales
- Order funnel (pending → processing → completed)
- Low stock alerts
- Active coupon performance
- Actionable recommendations`,
      },
    }],
  }));

  server.prompt("seo-audit", "SEO audit for a WordPress post or page", () => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `I want to do an SEO audit on a post or page. I'll give you the post ID and you:

1. Use wp_get_post to read the content
2. Use wp_get_yoast_seo to check current SEO settings
3. Analyze:
   - Title tag length and keyword usage
   - Meta description quality
   - Heading structure (H1, H2, H3)
   - Content length
   - Keyword density
   - Internal/external links
   - Image alt tags
   - URL slug optimization
4. Score each area and provide specific improvement suggestions
5. Offer to fix issues using wp_update_post and wp_update_yoast_seo

Which post ID should I audit?`,
      },
    }],
  }));
}
