import { describe, it, expect } from "vitest";
import { generateAdminToken } from "../api/auth.js";

describe("generateAdminToken", () => {
  it("generates a valid JWT with three parts", () => {
    // Test key: id is "abc123", secret is a hex string
    const key = "abc123:aabbccddee112233445566778899aabb";
    const token = generateAdminToken(key);

    const parts = token.split(".");
    expect(parts).toHaveLength(3);
  });

  it("includes the key ID in the header", () => {
    const key = "myKeyId:aabbccddee112233445566778899aabb";
    const token = generateAdminToken(key);

    const [headerB64] = token.split(".");
    const header = JSON.parse(Buffer.from(headerB64!, "base64url").toString());
    expect(header.kid).toBe("myKeyId");
    expect(header.alg).toBe("HS256");
    expect(header.typ).toBe("JWT");
  });

  it("includes correct payload claims", () => {
    const key = "id123:aabbccddee112233445566778899aabb";
    const token = generateAdminToken(key);

    const [, payloadB64] = token.split(".");
    const payload = JSON.parse(Buffer.from(payloadB64!, "base64url").toString());
    expect(payload.aud).toBe("/admin/");
    expect(payload.iat).toBeDefined();
    expect(payload.exp).toBeDefined();
    expect(payload.exp - payload.iat).toBe(300); // 5 minutes
  });

  it("generates different tokens for different keys", () => {
    const token1 = generateAdminToken("id1:aabbccddee112233445566778899aabb");
    const token2 = generateAdminToken("id2:11223344556677889900aabbccddeeff");
    expect(token1).not.toBe(token2);
  });

  it("throws on invalid key format", () => {
    expect(() => generateAdminToken("no-colon-here")).toThrow("Invalid GHOST_ADMIN_API_KEY");
    expect(() => generateAdminToken("")).toThrow();
  });
});
