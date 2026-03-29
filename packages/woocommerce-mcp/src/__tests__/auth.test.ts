import { describe, it, expect } from "vitest";
import { isHttps, basicAuthHeader, signOAuth } from "../api/auth.js";

describe("isHttps", () => {
  it("returns true for HTTPS URLs", () => {
    expect(isHttps("https://mystore.com")).toBe(true);
    expect(isHttps("https://localhost:8443")).toBe(true);
  });

  it("returns false for HTTP URLs", () => {
    expect(isHttps("http://mystore.com")).toBe(false);
    expect(isHttps("http://localhost:8080")).toBe(false);
  });
});

describe("basicAuthHeader", () => {
  it("generates correct Basic Auth header", () => {
    const header = basicAuthHeader("ck_test", "cs_test");
    expect(header).toBe(`Basic ${Buffer.from("ck_test:cs_test").toString("base64")}`);
  });

  it("starts with 'Basic '", () => {
    const header = basicAuthHeader("key", "secret");
    expect(header.startsWith("Basic ")).toBe(true);
  });
});

describe("signOAuth", () => {
  it("returns a URL with OAuth parameters", () => {
    const signed = signOAuth(
      "GET",
      "http://mystore.com/wp-json/wc/v3/products",
      "ck_consumer_key",
      "cs_consumer_secret",
    );

    const url = new URL(signed);
    expect(url.searchParams.has("oauth_consumer_key")).toBe(true);
    expect(url.searchParams.get("oauth_consumer_key")).toBe("ck_consumer_key");
    expect(url.searchParams.has("oauth_signature")).toBe(true);
    expect(url.searchParams.has("oauth_nonce")).toBe(true);
    expect(url.searchParams.has("oauth_timestamp")).toBe(true);
    expect(url.searchParams.get("oauth_signature_method")).toBe("HMAC-SHA256");
    expect(url.searchParams.get("oauth_version")).toBe("1.0");
  });

  it("preserves existing query parameters", () => {
    const signed = signOAuth(
      "GET",
      "http://mystore.com/wp-json/wc/v3/products?per_page=10&page=2",
      "ck_key",
      "cs_secret",
    );

    const url = new URL(signed);
    expect(url.searchParams.get("per_page")).toBe("10");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.has("oauth_signature")).toBe(true);
  });

  it("generates different nonces for each call", () => {
    const signed1 = signOAuth("GET", "http://store.com/api", "key", "secret");
    const signed2 = signOAuth("GET", "http://store.com/api", "key", "secret");

    const nonce1 = new URL(signed1).searchParams.get("oauth_nonce");
    const nonce2 = new URL(signed2).searchParams.get("oauth_nonce");
    expect(nonce1).not.toBe(nonce2);
  });

  it("uses the correct HTTP method in signature", () => {
    const signedGet = signOAuth("GET", "http://store.com/api", "key", "secret");
    const signedPost = signOAuth("POST", "http://store.com/api", "key", "secret");

    // Different methods should produce different signatures
    const sig1 = new URL(signedGet).searchParams.get("oauth_signature");
    const sig2 = new URL(signedPost).searchParams.get("oauth_signature");
    expect(sig1).not.toBe(sig2);
  });
});
