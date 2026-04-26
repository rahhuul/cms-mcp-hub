/**
 * Block Component Library — pre-built page sections as Gutenberg blocks.
 * Hero, Features, Pricing, Team, FAQ, CTA, Testimonials, Stats, Contact.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WpClient } from "../api/client.js";
import {
  CreateHeroSectionSchema, CreateFeatureGridSchema, CreatePricingTableSchema,
  CreateTeamSectionSchema, CreateFaqSectionSchema, CreateCtaBannerSchema,
  CreateTestimonialsSectionSchema, CreateStatsSectionSchema, CreateContactSectionSchema,
  CreateFullPageSchema, SaveComponentAsPatternSchema,
} from "../schemas/index.js";

// ─── Block generators for each component ────────────────────────────

function heroBlock(d: { heading: string; subheading?: string; image_url?: string; cta_text?: string; cta_url?: string; alignment?: string }): string {
  const align = d.alignment || "center";
  let out = "";

  if (d.image_url) {
    out += `<!-- wp:cover {"url":"${d.image_url}","dimRatio":60,"align":"full"} -->\n<div class="wp-block-cover alignfull"><span class="wp-block-cover__background has-background-dim-60 has-background-dim"></span><img class="wp-block-cover__image-background" src="${d.image_url}" alt=""/><div class="wp-block-cover__inner-container">\n`;
    out += `<!-- wp:heading {"textAlign":"${align}","level":1} -->\n<h1 class="wp-block-heading has-text-align-${align}">${d.heading}</h1>\n<!-- /wp:heading -->\n`;
    if (d.subheading) out += `<!-- wp:paragraph {"align":"${align}"} -->\n<p class="has-text-align-${align}">${d.subheading}</p>\n<!-- /wp:paragraph -->\n`;
    if (d.cta_text) out += `<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"${align}"}} -->\n<div class="wp-block-buttons"><!-- wp:button -->\n<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="${d.cta_url || "#"}">${d.cta_text}</a></div>\n<!-- /wp:button --></div>\n<!-- /wp:buttons -->\n`;
    out += `</div></div>\n<!-- /wp:cover -->`;
  } else {
    out += `<!-- wp:group {"align":"full","layout":{"type":"constrained"}} -->\n<div class="wp-block-group alignfull">\n`;
    out += `<!-- wp:spacer {"height":"60px"} -->\n<div style="height:60px" aria-hidden="true" class="wp-block-spacer"></div>\n<!-- /wp:spacer -->\n`;
    out += `<!-- wp:heading {"textAlign":"${align}","level":1} -->\n<h1 class="wp-block-heading has-text-align-${align}">${d.heading}</h1>\n<!-- /wp:heading -->\n`;
    if (d.subheading) out += `<!-- wp:paragraph {"align":"${align}","fontSize":"large"} -->\n<p class="has-text-align-${align} has-large-font-size">${d.subheading}</p>\n<!-- /wp:paragraph -->\n`;
    if (d.cta_text) out += `<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"${align}"}} -->\n<div class="wp-block-buttons"><!-- wp:button -->\n<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="${d.cta_url || "#"}">${d.cta_text}</a></div>\n<!-- /wp:button --></div>\n<!-- /wp:buttons -->\n`;
    out += `<!-- wp:spacer {"height":"60px"} -->\n<div style="height:60px" aria-hidden="true" class="wp-block-spacer"></div>\n<!-- /wp:spacer -->\n`;
    out += `</div>\n<!-- /wp:group -->`;
  }
  return out;
}

function featuresBlock(d: { heading?: string; columns?: number; features: Array<{ icon?: string; title: string; description: string }> }): string {
  let out = "";
  if (d.heading) out += `<!-- wp:heading {"textAlign":"center","level":2} -->\n<h2 class="wp-block-heading has-text-align-center">${d.heading}</h2>\n<!-- /wp:heading -->\n\n<!-- wp:spacer {"height":"30px"} -->\n<div style="height:30px" aria-hidden="true" class="wp-block-spacer"></div>\n<!-- /wp:spacer -->\n\n`;

  out += `<!-- wp:columns {"align":"wide"} -->\n<div class="wp-block-columns alignwide">\n`;
  for (const f of d.features) {
    out += `<!-- wp:column -->\n<div class="wp-block-column">\n`;
    if (f.icon) out += `<!-- wp:paragraph {"align":"center","fontSize":"x-large"} -->\n<p class="has-text-align-center has-x-large-font-size">${f.icon}</p>\n<!-- /wp:paragraph -->\n`;
    out += `<!-- wp:heading {"textAlign":"center","level":3} -->\n<h3 class="wp-block-heading has-text-align-center">${f.title}</h3>\n<!-- /wp:heading -->\n`;
    out += `<!-- wp:paragraph {"align":"center"} -->\n<p class="has-text-align-center">${f.description}</p>\n<!-- /wp:paragraph -->\n`;
    out += `</div>\n<!-- /wp:column -->\n`;
  }
  out += `</div>\n<!-- /wp:columns -->`;
  return out;
}

function pricingBlock(d: { heading?: string; tiers: Array<{ name: string; price: string; description?: string; features: string[]; cta_text?: string; cta_url?: string; highlighted?: boolean }> }): string {
  let out = "";
  if (d.heading) out += `<!-- wp:heading {"textAlign":"center","level":2} -->\n<h2 class="wp-block-heading has-text-align-center">${d.heading}</h2>\n<!-- /wp:heading -->\n\n<!-- wp:spacer {"height":"30px"} -->\n<div style="height:30px" aria-hidden="true" class="wp-block-spacer"></div>\n<!-- /wp:spacer -->\n\n`;

  out += `<!-- wp:columns {"align":"wide"} -->\n<div class="wp-block-columns alignwide">\n`;
  for (const t of d.tiers) {
    const border = t.highlighted ? ' style="border:2px solid #2563eb;border-radius:8px;padding:24px"' : ' style="border:1px solid #e5e7eb;border-radius:8px;padding:24px"';
    out += `<!-- wp:column -->\n<div class="wp-block-column">\n`;
    out += `<!-- wp:group -->\n<div class="wp-block-group"${border}>\n`;
    out += `<!-- wp:heading {"textAlign":"center","level":3} -->\n<h3 class="wp-block-heading has-text-align-center">${t.name}</h3>\n<!-- /wp:heading -->\n`;
    out += `<!-- wp:paragraph {"align":"center","fontSize":"x-large"} -->\n<p class="has-text-align-center has-x-large-font-size"><strong>${t.price}</strong></p>\n<!-- /wp:paragraph -->\n`;
    if (t.description) out += `<!-- wp:paragraph {"align":"center"} -->\n<p class="has-text-align-center">${t.description}</p>\n<!-- /wp:paragraph -->\n`;
    out += `<!-- wp:list -->\n<ul>${t.features.map((f) => `<!-- wp:list-item -->\n<li>${f}</li>\n<!-- /wp:list-item -->`).join("\n")}</ul>\n<!-- /wp:list -->\n`;
    if (t.cta_text) out += `<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->\n<div class="wp-block-buttons"><!-- wp:button${t.highlighted ? ' {"backgroundColor":"vivid-cyan-blue"}' : ""} -->\n<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="${t.cta_url || "#"}">${t.cta_text}</a></div>\n<!-- /wp:button --></div>\n<!-- /wp:buttons -->\n`;
    out += `</div>\n<!-- /wp:group -->\n`;
    out += `</div>\n<!-- /wp:column -->\n`;
  }
  out += `</div>\n<!-- /wp:columns -->`;
  return out;
}

function teamBlock(d: { heading?: string; members: Array<{ name: string; role: string; bio?: string; image_url?: string }> }): string {
  let out = "";
  if (d.heading) out += `<!-- wp:heading {"textAlign":"center","level":2} -->\n<h2 class="wp-block-heading has-text-align-center">${d.heading}</h2>\n<!-- /wp:heading -->\n\n`;

  out += `<!-- wp:columns {"align":"wide"} -->\n<div class="wp-block-columns alignwide">\n`;
  for (const m of d.members) {
    out += `<!-- wp:column -->\n<div class="wp-block-column">\n`;
    if (m.image_url) out += `<!-- wp:image {"align":"center","width":"150px","height":"150px","sizeSlug":"thumbnail","className":"is-style-rounded"} -->\n<figure class="wp-block-image aligncenter size-thumbnail is-style-rounded"><img src="${m.image_url}" alt="${m.name}" style="width:150px;height:150px;object-fit:cover;border-radius:50%"/></figure>\n<!-- /wp:image -->\n`;
    out += `<!-- wp:heading {"textAlign":"center","level":3} -->\n<h3 class="wp-block-heading has-text-align-center">${m.name}</h3>\n<!-- /wp:heading -->\n`;
    out += `<!-- wp:paragraph {"align":"center"} -->\n<p class="has-text-align-center"><em>${m.role}</em></p>\n<!-- /wp:paragraph -->\n`;
    if (m.bio) out += `<!-- wp:paragraph {"align":"center"} -->\n<p class="has-text-align-center">${m.bio}</p>\n<!-- /wp:paragraph -->\n`;
    out += `</div>\n<!-- /wp:column -->\n`;
  }
  out += `</div>\n<!-- /wp:columns -->`;
  return out;
}

function faqBlock(d: { heading?: string; items: Array<{ question: string; answer: string }> }): string {
  let out = "";
  if (d.heading) out += `<!-- wp:heading {"textAlign":"center","level":2} -->\n<h2 class="wp-block-heading has-text-align-center">${d.heading}</h2>\n<!-- /wp:heading -->\n\n`;

  for (const item of d.items) {
    out += `<!-- wp:details -->\n<details class="wp-block-details"><summary>${item.question}</summary><!-- wp:paragraph -->\n<p>${item.answer}</p>\n<!-- /wp:paragraph --></details>\n<!-- /wp:details -->\n\n`;
  }
  return out;
}

function ctaBlock(d: { heading: string; text?: string; button_text: string; button_url: string; background_color?: string }): string {
  const bg = d.background_color || "#1e40af";
  let out = `<!-- wp:group {"align":"full","style":{"color":{"background":"${bg}"},"spacing":{"padding":{"top":"60px","bottom":"60px"}}},"layout":{"type":"constrained"}} -->\n<div class="wp-block-group alignfull has-background" style="background-color:${bg};padding-top:60px;padding-bottom:60px">\n`;
  out += `<!-- wp:heading {"textAlign":"center","level":2,"style":{"color":{"text":"#ffffff"}}} -->\n<h2 class="wp-block-heading has-text-align-center" style="color:#ffffff">${d.heading}</h2>\n<!-- /wp:heading -->\n`;
  if (d.text) out += `<!-- wp:paragraph {"align":"center","style":{"color":{"text":"#e2e8f0"}}} -->\n<p class="has-text-align-center" style="color:#e2e8f0">${d.text}</p>\n<!-- /wp:paragraph -->\n`;
  out += `<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->\n<div class="wp-block-buttons"><!-- wp:button {"backgroundColor":"white","textColor":"black"} -->\n<div class="wp-block-button"><a class="wp-block-button__link has-black-color has-white-background-color wp-element-button" href="${d.button_url}">${d.button_text}</a></div>\n<!-- /wp:button --></div>\n<!-- /wp:buttons -->\n`;
  out += `</div>\n<!-- /wp:group -->`;
  return out;
}

function testimonialsBlock(d: { heading?: string; testimonials: Array<{ quote: string; author: string; role?: string; image_url?: string }> }): string {
  let out = "";
  if (d.heading) out += `<!-- wp:heading {"textAlign":"center","level":2} -->\n<h2 class="wp-block-heading has-text-align-center">${d.heading}</h2>\n<!-- /wp:heading -->\n\n`;

  out += `<!-- wp:columns {"align":"wide"} -->\n<div class="wp-block-columns alignwide">\n`;
  for (const t of d.testimonials) {
    out += `<!-- wp:column -->\n<div class="wp-block-column">\n`;
    out += `<!-- wp:quote -->\n<blockquote class="wp-block-quote"><p>${t.quote}</p><cite>${t.author}${t.role ? `, ${t.role}` : ""}</cite></blockquote>\n<!-- /wp:quote -->\n`;
    out += `</div>\n<!-- /wp:column -->\n`;
  }
  out += `</div>\n<!-- /wp:columns -->`;
  return out;
}

function statsBlock(d: { heading?: string; stats: Array<{ value: string; label: string }> }): string {
  let out = "";
  if (d.heading) out += `<!-- wp:heading {"textAlign":"center","level":2} -->\n<h2 class="wp-block-heading has-text-align-center">${d.heading}</h2>\n<!-- /wp:heading -->\n\n`;

  out += `<!-- wp:columns {"align":"wide"} -->\n<div class="wp-block-columns alignwide">\n`;
  for (const s of d.stats) {
    out += `<!-- wp:column -->\n<div class="wp-block-column">\n`;
    out += `<!-- wp:paragraph {"align":"center","fontSize":"x-large"} -->\n<p class="has-text-align-center has-x-large-font-size"><strong>${s.value}</strong></p>\n<!-- /wp:paragraph -->\n`;
    out += `<!-- wp:paragraph {"align":"center"} -->\n<p class="has-text-align-center">${s.label}</p>\n<!-- /wp:paragraph -->\n`;
    out += `</div>\n<!-- /wp:column -->\n`;
  }
  out += `</div>\n<!-- /wp:columns -->`;
  return out;
}

function contactBlock(d: { heading?: string; text?: string; email?: string; phone?: string; address?: string; map_embed_url?: string }): string {
  let out = "";
  if (d.heading) out += `<!-- wp:heading {"textAlign":"center","level":2} -->\n<h2 class="wp-block-heading has-text-align-center">${d.heading}</h2>\n<!-- /wp:heading -->\n\n`;

  out += `<!-- wp:columns {"align":"wide"} -->\n<div class="wp-block-columns alignwide">\n`;
  out += `<!-- wp:column -->\n<div class="wp-block-column">\n`;
  if (d.text) out += `<!-- wp:paragraph -->\n<p>${d.text}</p>\n<!-- /wp:paragraph -->\n`;
  if (d.email) out += `<!-- wp:paragraph -->\n<p><strong>Email:</strong> <a href="mailto:${d.email}">${d.email}</a></p>\n<!-- /wp:paragraph -->\n`;
  if (d.phone) out += `<!-- wp:paragraph -->\n<p><strong>Phone:</strong> ${d.phone}</p>\n<!-- /wp:paragraph -->\n`;
  if (d.address) out += `<!-- wp:paragraph -->\n<p><strong>Address:</strong> ${d.address}</p>\n<!-- /wp:paragraph -->\n`;
  out += `</div>\n<!-- /wp:column -->\n`;
  if (d.map_embed_url) {
    out += `<!-- wp:column -->\n<div class="wp-block-column">\n<!-- wp:html -->\n<iframe src="${d.map_embed_url}" width="100%" height="300" style="border:0" allowfullscreen="" loading="lazy"></iframe>\n<!-- /wp:html -->\n</div>\n<!-- /wp:column -->\n`;
  }
  out += `</div>\n<!-- /wp:columns -->`;
  return out;
}

// Component name → generator mapping
const GENERATORS: Record<string, (data: Record<string, unknown>) => string> = {
  hero: (d) => heroBlock(d as Parameters<typeof heroBlock>[0]),
  features: (d) => featuresBlock(d as Parameters<typeof featuresBlock>[0]),
  pricing: (d) => pricingBlock(d as Parameters<typeof pricingBlock>[0]),
  team: (d) => teamBlock(d as Parameters<typeof teamBlock>[0]),
  faq: (d) => faqBlock(d as Parameters<typeof faqBlock>[0]),
  cta: (d) => ctaBlock(d as Parameters<typeof ctaBlock>[0]),
  testimonials: (d) => testimonialsBlock(d as Parameters<typeof testimonialsBlock>[0]),
  stats: (d) => statsBlock(d as Parameters<typeof statsBlock>[0]),
  contact: (d) => contactBlock(d as Parameters<typeof contactBlock>[0]),
};

const SEP = `\n\n<!-- wp:separator {"align":"wide"} -->\n<hr class="wp-block-separator alignwide has-alpha-channel-opacity"/>\n<!-- /wp:separator -->\n\n`;

export function registerComponentTools(server: McpServer, client: WpClient): void {

  // ─── Individual Components ───────────────────────────────────────

  server.tool("wp_component_hero", "Generate a hero section with heading, subheading, optional background image, and CTA button. Returns Gutenberg block markup.", CreateHeroSectionSchema.shape, async (p) => {
    try { const v = CreateHeroSectionSchema.parse(p); return mcpSuccess({ content: heroBlock(v), message: "Hero section generated" }); }
    catch (e) { return mcpError(e, "wp_component_hero"); }
  });

  server.tool("wp_component_features", "Generate a feature grid with columns. Each feature has optional icon, title, and description.", CreateFeatureGridSchema.shape, async (p) => {
    try { const v = CreateFeatureGridSchema.parse(p); return mcpSuccess({ content: featuresBlock(v), message: `Feature grid with ${v.features.length} items` }); }
    catch (e) { return mcpError(e, "wp_component_features"); }
  });

  server.tool("wp_component_pricing", "Generate a pricing table with multiple tiers. Each tier has name, price, feature list, and CTA button.", CreatePricingTableSchema.shape, async (p) => {
    try { const v = CreatePricingTableSchema.parse(p); return mcpSuccess({ content: pricingBlock(v), message: `Pricing table with ${v.tiers.length} tiers` }); }
    catch (e) { return mcpError(e, "wp_component_pricing"); }
  });

  server.tool("wp_component_team", "Generate a team section with member cards (photo, name, role, bio).", CreateTeamSectionSchema.shape, async (p) => {
    try { const v = CreateTeamSectionSchema.parse(p); return mcpSuccess({ content: teamBlock(v), message: `Team section with ${v.members.length} members` }); }
    catch (e) { return mcpError(e, "wp_component_team"); }
  });

  server.tool("wp_component_faq", "Generate an FAQ section with expandable question/answer items (uses details block).", CreateFaqSectionSchema.shape, async (p) => {
    try { const v = CreateFaqSectionSchema.parse(p); return mcpSuccess({ content: faqBlock(v), message: `FAQ with ${v.items.length} items` }); }
    catch (e) { return mcpError(e, "wp_component_faq"); }
  });

  server.tool("wp_component_cta", "Generate a CTA (call-to-action) banner with colored background, heading, text, and button.", CreateCtaBannerSchema.shape, async (p) => {
    try { const v = CreateCtaBannerSchema.parse(p); return mcpSuccess({ content: ctaBlock(v), message: "CTA banner generated" }); }
    catch (e) { return mcpError(e, "wp_component_cta"); }
  });

  server.tool("wp_component_testimonials", "Generate a testimonials section with quote, author name, and role.", CreateTestimonialsSectionSchema.shape, async (p) => {
    try { const v = CreateTestimonialsSectionSchema.parse(p); return mcpSuccess({ content: testimonialsBlock(v), message: `Testimonials with ${v.testimonials.length} quotes` }); }
    catch (e) { return mcpError(e, "wp_component_testimonials"); }
  });

  server.tool("wp_component_stats", "Generate a stats/numbers section with large values and labels.", CreateStatsSectionSchema.shape, async (p) => {
    try { const v = CreateStatsSectionSchema.parse(p); return mcpSuccess({ content: statsBlock(v), message: `Stats section with ${v.stats.length} metrics` }); }
    catch (e) { return mcpError(e, "wp_component_stats"); }
  });

  server.tool("wp_component_contact", "Generate a contact section with email, phone, address, and optional Google Maps embed.", CreateContactSectionSchema.shape, async (p) => {
    try { const v = CreateContactSectionSchema.parse(p); return mcpSuccess({ content: contactBlock(v), message: "Contact section generated" }); }
    catch (e) { return mcpError(e, "wp_component_contact"); }
  });

  // ─── Full Page Builder ───────────────────────────────────────────

  server.tool("wp_create_full_page",
    "Build a complete page from pre-built components. Pick sections in order: hero, features, pricing, team, faq, cta, testimonials, stats, contact. Creates the page with all sections as proper Gutenberg blocks.",
    CreateFullPageSchema.shape, async (p) => {
    try {
      const v = CreateFullPageSchema.parse(p);
      const parts: string[] = [];

      for (const section of v.sections) {
        const data = v[section as keyof typeof v] as Record<string, unknown> | undefined;
        if (!data) continue;
        const gen = GENERATORS[section];
        if (gen) parts.push(gen(data));
      }

      const content = parts.join(SEP);
      const page = await client.post<Record<string, unknown>>("pages", {
        title: v.title, content, status: v.status,
      });

      return mcpSuccess({
        id: page["id"], slug: page["slug"], status: page["status"], link: page["link"],
        sections: v.sections.length,
        message: `Page '${v.title}' created with ${v.sections.length} sections (ID: ${page["id"]})`,
      });
    } catch (e) { return mcpError(e, "wp_create_full_page"); }
  });

  // ─── Save Component as Reusable Block ────────────────────────────

  server.tool("wp_save_component_as_pattern",
    "Save any component (hero, features, pricing, etc.) as a reusable block / synced pattern that can be inserted into any page.",
    SaveComponentAsPatternSchema.shape, async (p) => {
    try {
      const { title, component, data } = SaveComponentAsPatternSchema.parse(p);
      const gen = GENERATORS[component];
      if (!gen) return mcpError(new Error(`Unknown component: ${component}`), "wp_save_component_as_pattern");

      const content = gen(data);
      const block = await client.post<Record<string, unknown>>("blocks", {
        title, content, status: "publish",
      });

      return mcpSuccess({
        id: block["id"], title,
        message: `Component '${title}' saved as reusable block (ID: ${block["id"]}). Insert it into any post/page.`,
      });
    } catch (e) { return mcpError(e, "wp_save_component_as_pattern"); }
  });
}
