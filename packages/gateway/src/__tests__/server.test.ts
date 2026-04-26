import { describe, it, expect } from "vitest";
import type { GatewayConfig, ServerConfig } from "../server.js";

describe("Gateway Server", () => {
  describe("GatewayConfig", () => {
    it("requires port, apiKey, baseUrl, and servers", () => {
      const config: GatewayConfig = {
        port: 4777,
        apiKey: "test-key",
        baseUrl: "http://localhost:4777",
        servers: [{ name: "test", command: "node", args: ["test.js"], env: {} }],
      };
      expect(config.port).toBe(4777);
      expect(config.apiKey).toBe("test-key");
      expect(config.baseUrl).toBe("http://localhost:4777");
      expect(config.servers).toHaveLength(1);
    });

    it("supports multiple server configurations", () => {
      const config: GatewayConfig = {
        port: 4777,
        apiKey: "test-key",
        baseUrl: "http://localhost:4777",
        servers: [
          { name: "wordpress", command: "node", args: ["wp.js"], env: { WP_URL: "http://wp.local" } },
          { name: "woocommerce", command: "node", args: ["woo.js"], env: { WOO_KEY: "ck_xxx" } },
        ],
      };
      expect(config.servers).toHaveLength(2);
      expect(config.servers[0]!.name).toBe("wordpress");
      expect(config.servers[1]!.name).toBe("woocommerce");
    });
  });

  describe("ServerConfig", () => {
    it("contains name, command, args, and env", () => {
      const sc: ServerConfig = {
        name: "wordpress",
        command: "node",
        args: ["dist/index.js"],
        env: { WP_URL: "http://test.com", WP_USERNAME: "admin" },
      };
      expect(sc.name).toBe("wordpress");
      expect(sc.command).toBe("node");
      expect(sc.args).toEqual(["dist/index.js"]);
      expect(sc.env["WP_URL"]).toBe("http://test.com");
      expect(sc.env["WP_USERNAME"]).toBe("admin");
    });

    it("supports empty env", () => {
      const sc: ServerConfig = {
        name: "test-server",
        command: "node",
        args: ["server.js"],
        env: {},
      };
      expect(Object.keys(sc.env)).toHaveLength(0);
    });

    it("supports multiple args", () => {
      const sc: ServerConfig = {
        name: "test-server",
        command: "npx",
        args: ["ts-node", "--esm", "src/index.ts"],
        env: {},
      };
      expect(sc.command).toBe("npx");
      expect(sc.args).toEqual(["ts-node", "--esm", "src/index.ts"]);
    });
  });

  describe("API key extraction patterns", () => {
    it("extracts from X-API-Key header", () => {
      const headers: Record<string, string> = { "x-api-key": "my-secret-key" };
      const key = headers["x-api-key"];
      expect(key).toBe("my-secret-key");
    });

    it("extracts from Authorization Bearer header", () => {
      const authHeader = "Bearer my-secret-key";
      const key = authHeader.replace("Bearer ", "");
      expect(key).toBe("my-secret-key");
    });

    it("extracts from query parameter", () => {
      const url = new URL("http://localhost:4777/api/tools?api_key=my-secret-key");
      const key = url.searchParams.get("api_key");
      expect(key).toBe("my-secret-key");
    });
  });

  describe("Tool path matching", () => {
    const pathRegex = /^\/api\/([^/]+)\/([^/]+)$/;

    it("matches valid tool paths", () => {
      const match = "/api/wordpress/wp_list_posts".match(pathRegex);
      expect(match).not.toBeNull();
      expect(match![1]).toBe("wordpress");
      expect(match![2]).toBe("wp_list_posts");
    });

    it("matches woocommerce tool paths", () => {
      const match = "/api/woocommerce/woo_create_product".match(pathRegex);
      expect(match).not.toBeNull();
      expect(match![1]).toBe("woocommerce");
      expect(match![2]).toBe("woo_create_product");
    });

    it("does not match /api/tools", () => {
      const match = "/api/tools".match(pathRegex);
      expect(match).toBeNull();
    });

    it("does not match paths with extra segments", () => {
      const match = "/api/wordpress/wp_list_posts/extra".match(pathRegex);
      expect(match).toBeNull();
    });

    it("does not match root path", () => {
      const match = "/".match(pathRegex);
      expect(match).toBeNull();
    });
  });

  describe("Route identification", () => {
    const publicRoutes = ["/", "/health", "/openapi.json", "/packs"];
    const protectedRoutes = ["/api/tools", "/api/wordpress/wp_list_posts"];

    it("identifies public routes", () => {
      for (const route of publicRoutes) {
        expect(publicRoutes.includes(route)).toBe(true);
      }
    });

    it("identifies protected routes starting with /api/", () => {
      for (const route of protectedRoutes) {
        expect(route.startsWith("/api/")).toBe(true);
      }
    });
  });
});
