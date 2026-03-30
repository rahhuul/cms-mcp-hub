import { describe, it, expect } from "vitest";
import { FramerClient } from "../api/client.js";

describe("FramerClient", () => {
  it("throws ConfigError when projectUrl is missing", () => {
    expect(() => new FramerClient({ projectUrl: "", apiKey: "test-key" })).toThrow(
      "Missing FRAMER_PROJECT_URL",
    );
  });

  it("throws ConfigError when apiKey is missing", () => {
    expect(() => new FramerClient({ projectUrl: "https://framer.com/projects/abc", apiKey: "" })).toThrow(
      "Missing FRAMER_API_KEY",
    );
  });

  it("creates client with valid config", () => {
    const client = new FramerClient({
      projectUrl: "https://framer.com/projects/abc123",
      apiKey: "test-api-key",
    });
    expect(client).toBeDefined();
  });
});
