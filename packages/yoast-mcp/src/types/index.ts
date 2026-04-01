export interface YoastConfig {
  url: string;
  username: string;
  applicationPassword: string;
}

/** WordPress post types supported for SEO operations */
export type WpPostType = "post" | "page" | "product" | "attachment";

/** Yoast SEO meta fields stored in WordPress post meta */
export interface YoastSeoMeta {
  _yoast_wpseo_title?: string;
  _yoast_wpseo_metadesc?: string;
  _yoast_wpseo_focuskw?: string;
  _yoast_wpseo_canonical?: string;
  "_yoast_wpseo_meta-robots-noindex"?: string;
  "_yoast_wpseo_opengraph-title"?: string;
  "_yoast_wpseo_opengraph-description"?: string;
  "_yoast_wpseo_opengraph-image"?: string;
  "_yoast_wpseo_twitter-title"?: string;
  "_yoast_wpseo_twitter-description"?: string;
  "_yoast_wpseo_twitter-image"?: string;
}

/** Shape of WordPress post response with Yoast fields */
export interface WpPostWithSeo {
  id: number;
  title: { rendered: string };
  slug: string;
  link: string;
  status: string;
  type: string;
  meta: Record<string, unknown>;
  yoast_head_json?: Record<string, unknown>;
}

/** Yoast head response from /yoast/v1/get_head */
export interface YoastHeadResponse {
  html: string;
  json: Record<string, unknown>;
  status: number;
}

/** Yoast redirect entry */
export interface YoastRedirect {
  origin: string;
  url: string;
  type: number;
  format: string;
}
