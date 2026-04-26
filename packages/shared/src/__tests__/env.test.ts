import { describe, it, expect, afterEach } from "vitest";
import { requireEnv, optionalEnv, optionalEnvInt } from "../env.js";

describe("requireEnv", () => {
  const KEY = "TEST_REQUIRE_ENV_KEY";

  afterEach(() => {
    delete process.env[KEY];
  });

  it("returns value when set", () => {
    process.env[KEY] = "my-value";
    expect(requireEnv(KEY)).toBe("my-value");
  });

  it("throws ConfigError when missing", () => {
    expect(() => requireEnv(KEY)).toThrow("Missing required environment variable");
  });
});

describe("optionalEnv", () => {
  it("returns env value when set", () => {
    process.env["TEST_OPT"] = "val";
    expect(optionalEnv("TEST_OPT", "default")).toBe("val");
    delete process.env["TEST_OPT"];
  });

  it("returns default when not set", () => {
    expect(optionalEnv("TEST_OPT_MISSING", "fallback")).toBe("fallback");
  });
});

describe("optionalEnvInt", () => {
  afterEach(() => {
    delete process.env["TEST_INT"];
  });

  it("parses integer value", () => {
    process.env["TEST_INT"] = "42";
    expect(optionalEnvInt("TEST_INT", 10)).toBe(42);
  });

  it("returns default when not set", () => {
    expect(optionalEnvInt("TEST_INT", 10)).toBe(10);
  });

  it("throws on non-numeric value", () => {
    process.env["TEST_INT"] = "abc";
    expect(() => optionalEnvInt("TEST_INT", 10)).toThrow("must be a number");
  });
});
