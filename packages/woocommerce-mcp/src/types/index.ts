/**
 * Type definitions for @cmsmcp/woocommerce
 */

export interface WooConfig {
  url: string;
  consumerKey: string;
  consumerSecret: string;
  /** Override rate limit (requests/sec). Defaults to 25. */
  rateLimitPerSecond?: number;
}

export interface WooProduct {
  id: number;
  name: string;
  slug: string;
  type: string;
  status: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  description: string;
  short_description: string;
  categories: Array<{ id: number; name: string; slug: string }>;
  tags: Array<{ id: number; name: string; slug: string }>;
  images: Array<{ id: number; src: string; alt: string }>;
  stock_status: string;
  stock_quantity: number | null;
  manage_stock: boolean;
  [key: string]: unknown;
}

export interface WooOrder {
  id: number;
  status: string;
  currency: string;
  total: string;
  customer_id: number;
  billing: Record<string, unknown>;
  shipping: Record<string, unknown>;
  line_items: Array<Record<string, unknown>>;
  date_created: string;
  [key: string]: unknown;
}

export interface WooCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  billing: Record<string, unknown>;
  shipping: Record<string, unknown>;
  [key: string]: unknown;
}

export interface WooCoupon {
  id: number;
  code: string;
  discount_type: string;
  amount: string;
  usage_count: number;
  [key: string]: unknown;
}

export interface WooCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description: string;
  count: number;
  [key: string]: unknown;
}

export interface WooTag {
  id: number;
  name: string;
  slug: string;
  count: number;
  [key: string]: unknown;
}

export interface WooBatchRequest {
  create?: Record<string, unknown>[];
  update?: Record<string, unknown>[];
  delete?: number[];
}

export interface WooBatchResponse {
  create?: Record<string, unknown>[];
  update?: Record<string, unknown>[];
  delete?: Record<string, unknown>[];
}
