/**
 * WooCommerce authentication: OAuth 1.0a for HTTP, Basic Auth for HTTPS.
 */

import { createHmac, randomBytes } from "node:crypto";

export interface OAuthParams {
  oauth_consumer_key: string;
  oauth_nonce: string;
  oauth_signature_method: string;
  oauth_timestamp: string;
  oauth_version: string;
  oauth_signature?: string;
}

/**
 * Determines whether to use Basic Auth (HTTPS) or OAuth 1.0a (HTTP).
 */
export function isHttps(url: string): boolean {
  return url.startsWith("https://") || url.startsWith("https%3A");
}

/**
 * Generates a Basic Auth header value from consumer key and secret.
 */
export function basicAuthHeader(consumerKey: string, consumerSecret: string): string {
  const encoded = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  return `Basic ${encoded}`;
}

/**
 * Generates a random nonce for OAuth 1.0a.
 */
function generateNonce(): string {
  return randomBytes(16).toString("hex");
}

/**
 * Percent-encodes a string per RFC 3986.
 */
function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, "%21")
    .replace(/\*/g, "%2A")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29");
}

/**
 * Builds the OAuth 1.0a signature base string.
 */
function buildBaseString(
  method: string,
  baseUrl: string,
  params: Record<string, string>,
): string {
  // Sort parameters alphabetically by key
  const sortedKeys = Object.keys(params).sort();
  const paramString = sortedKeys
    .map((key) => `${percentEncode(key)}=${percentEncode(params[key]!)}`)
    .join("&");

  return `${method.toUpperCase()}&${percentEncode(baseUrl)}&${percentEncode(paramString)}`;
}

/**
 * Signs a request using HMAC-SHA256 (OAuth 1.0a).
 */
function hmacSha256(baseString: string, consumerSecret: string): string {
  // OAuth 1.0a key is "consumerSecret&" (empty token secret)
  const signingKey = `${percentEncode(consumerSecret)}&`;
  return createHmac("sha256", signingKey).update(baseString).digest("base64");
}

/**
 * Generates OAuth 1.0a query parameters for a WooCommerce HTTP request.
 * Returns the full URL with OAuth params appended.
 */
export function signOAuth(
  method: string,
  url: string,
  consumerKey: string,
  consumerSecret: string,
): string {
  const parsed = new URL(url);
  const baseUrl = `${parsed.origin}${parsed.pathname}`;

  // Collect existing query params
  const allParams: Record<string, string> = {};
  parsed.searchParams.forEach((value, key) => {
    allParams[key] = value;
  });

  // Add OAuth params
  const oauthParams: OAuthParams = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: generateNonce(),
    oauth_signature_method: "HMAC-SHA256",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: "1.0",
  };

  for (const [key, value] of Object.entries(oauthParams)) {
    allParams[key] = value;
  }

  // Generate signature
  const baseString = buildBaseString(method, baseUrl, allParams);
  const signature = hmacSha256(baseString, consumerSecret);

  // Add signature to params
  allParams["oauth_signature"] = signature;

  // Build final URL
  const finalUrl = new URL(baseUrl);
  for (const [key, value] of Object.entries(allParams)) {
    finalUrl.searchParams.set(key, value);
  }

  return finalUrl.toString();
}
