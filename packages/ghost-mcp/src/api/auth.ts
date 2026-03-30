/**
 * Ghost Admin API JWT authentication.
 *
 * The Admin API key is in the format "id:secret".
 * We sign a JWT with HS256 using the hex-decoded secret.
 */

import { createHmac } from "node:crypto";

interface JwtHeader {
  alg: string;
  typ: string;
  kid: string;
}

interface JwtPayload {
  iat: number;
  exp: number;
  aud: string;
}

function base64UrlEncode(data: string | Buffer): string {
  const buf = typeof data === "string" ? Buffer.from(data) : data;
  return buf.toString("base64url");
}

/**
 * Generates a Ghost Admin API JWT token from the admin key.
 * Token is valid for 5 minutes.
 */
export function generateAdminToken(adminApiKey: string): string {
  const [id, secret] = adminApiKey.split(":");
  if (!id || !secret) {
    throw new Error(
      "Invalid GHOST_ADMIN_API_KEY format. Expected 'id:secret'. " +
      "Get it from Ghost Admin → Settings → Integrations.",
    );
  }

  const secretBytes = Buffer.from(secret, "hex");
  const now = Math.floor(Date.now() / 1000);

  const header: JwtHeader = {
    alg: "HS256",
    typ: "JWT",
    kid: id,
  };

  const payload: JwtPayload = {
    iat: now,
    exp: now + 5 * 60, // 5 minutes
    aud: "/admin/",
  };

  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${headerEncoded}.${payloadEncoded}`;

  const signature = createHmac("sha256", secretBytes)
    .update(signingInput)
    .digest();

  return `${signingInput}.${base64UrlEncode(signature)}`;
}
