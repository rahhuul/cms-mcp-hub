import { describe, it, expect } from "vitest";
import { generateOpenApiSpec } from "../openapi.js";

describe("generateOpenApiSpec", () => {
  const baseTool = {
    name: "wp_list_posts",
    description: "List all WordPress posts with pagination support",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Number of items per page" },
        offset: { type: "number", description: "Pagination offset" },
      },
      required: ["limit"],
    },
  };

  const baseUrl = "http://localhost:4777";

  it("generates valid OpenAPI 3.0.0 structure", () => {
    const spec = generateOpenApiSpec(
      [{ serverName: "wordpress", tool: baseTool }],
      baseUrl,
    );

    expect(spec["openapi"]).toBe("3.0.0");
    expect(spec["info"]).toBeDefined();
    expect((spec["info"] as Record<string, unknown>)["title"]).toBe("CMS MCP Hub API");
    expect((spec["info"] as Record<string, unknown>)["version"]).toBe("0.1.0");
    expect(spec["paths"]).toBeDefined();
    expect(spec["components"]).toBeDefined();
    expect(spec["security"]).toBeDefined();
  });

  it("creates correct paths for tools (POST /api/{server}/{tool})", () => {
    const tools = [
      { serverName: "wordpress", tool: baseTool },
      {
        serverName: "woocommerce",
        tool: { name: "woo_list_products", description: "List products", inputSchema: { type: "object", properties: {} } },
      },
    ];

    const spec = generateOpenApiSpec(tools, baseUrl);
    const paths = spec["paths"] as Record<string, unknown>;

    expect(paths["/api/wordpress/wp_list_posts"]).toBeDefined();
    expect(paths["/api/woocommerce/woo_list_products"]).toBeDefined();

    const wpPath = paths["/api/wordpress/wp_list_posts"] as Record<string, unknown>;
    const post = wpPath["post"] as Record<string, unknown>;
    expect(post["operationId"]).toBe("wp_list_posts");
    expect(post["tags"]).toEqual(["wordpress"]);
  });

  it("includes security scheme (apiKey)", () => {
    const spec = generateOpenApiSpec(
      [{ serverName: "wordpress", tool: baseTool }],
      baseUrl,
    );

    const components = spec["components"] as Record<string, unknown>;
    const securitySchemes = components["securitySchemes"] as Record<string, unknown>;
    const apiKey = securitySchemes["apiKey"] as Record<string, unknown>;

    expect(apiKey["type"]).toBe("apiKey");
    expect(apiKey["in"]).toBe("header");
    expect(apiKey["name"]).toBe("X-API-Key");
  });

  it("includes global security requirement", () => {
    const spec = generateOpenApiSpec(
      [{ serverName: "wordpress", tool: baseTool }],
      baseUrl,
    );

    expect(spec["security"]).toEqual([{ apiKey: [] }]);
  });

  it("includes request body schema from tool inputSchema", () => {
    const spec = generateOpenApiSpec(
      [{ serverName: "wordpress", tool: baseTool }],
      baseUrl,
    );

    const paths = spec["paths"] as Record<string, unknown>;
    const wpPath = paths["/api/wordpress/wp_list_posts"] as Record<string, unknown>;
    const post = wpPath["post"] as Record<string, unknown>;
    const requestBody = post["requestBody"] as Record<string, unknown>;

    expect(requestBody["required"]).toBe(true);

    const content = requestBody["content"] as Record<string, unknown>;
    const jsonContent = content["application/json"] as Record<string, unknown>;
    const schema = jsonContent["schema"] as Record<string, unknown>;

    expect(schema["type"]).toBe("object");
    expect(schema["properties"]).toEqual(baseTool.inputSchema.properties);
    expect(schema["required"]).toEqual(["limit"]);
  });

  it("handles tools with no properties (empty inputSchema)", () => {
    const emptyTool = {
      name: "wp_get_me",
      description: "Get current user info",
      inputSchema: { type: "object", properties: {} },
    };

    const spec = generateOpenApiSpec(
      [{ serverName: "wordpress", tool: emptyTool }],
      baseUrl,
    );

    const paths = spec["paths"] as Record<string, unknown>;
    const wpPath = paths["/api/wordpress/wp_get_me"] as Record<string, unknown>;
    const post = wpPath["post"] as Record<string, unknown>;

    // No requestBody when properties are empty
    expect(post["requestBody"]).toBeUndefined();
  });

  it("handles tools with no properties key at all", () => {
    const noPropsSchema = {
      name: "wp_health",
      description: "Check health",
      inputSchema: {} as Record<string, unknown>,
    };

    const spec = generateOpenApiSpec(
      [{ serverName: "wordpress", tool: noPropsSchema }],
      baseUrl,
    );

    const paths = spec["paths"] as Record<string, unknown>;
    const wpPath = paths["/api/wordpress/wp_health"] as Record<string, unknown>;
    const post = wpPath["post"] as Record<string, unknown>;

    expect(post["requestBody"]).toBeUndefined();
  });

  it("uses overrideServerUrl when provided", () => {
    const overrideUrl = "https://my-gateway.ngrok.io";
    const spec = generateOpenApiSpec(
      [{ serverName: "wordpress", tool: baseTool }],
      baseUrl,
      overrideUrl,
    );

    const servers = spec["servers"] as Array<Record<string, unknown>>;
    expect(servers).toHaveLength(1);
    expect(servers[0]!["url"]).toBe(overrideUrl);
    expect(servers[0]!["description"]).toBe("CMS MCP Gateway");
  });

  it("uses baseUrl when no override", () => {
    const spec = generateOpenApiSpec(
      [{ serverName: "wordpress", tool: baseTool }],
      baseUrl,
    );

    const servers = spec["servers"] as Array<Record<string, unknown>>;
    expect(servers).toHaveLength(1);
    expect(servers[0]!["url"]).toBe(baseUrl);
  });

  it("truncates long descriptions to 300 chars", () => {
    const longDesc = "A".repeat(500);
    const toolWithLongDesc = {
      name: "wp_long",
      description: longDesc,
      inputSchema: { type: "object", properties: {} },
    };

    const spec = generateOpenApiSpec(
      [{ serverName: "wordpress", tool: toolWithLongDesc }],
      baseUrl,
    );

    const paths = spec["paths"] as Record<string, unknown>;
    const wpPath = paths["/api/wordpress/wp_long"] as Record<string, unknown>;
    const post = wpPath["post"] as Record<string, unknown>;

    expect((post["summary"] as string).length).toBe(300);
  });

  it("includes 200 response schema with success, tool, and result fields", () => {
    const spec = generateOpenApiSpec(
      [{ serverName: "wordpress", tool: baseTool }],
      baseUrl,
    );

    const paths = spec["paths"] as Record<string, unknown>;
    const wpPath = paths["/api/wordpress/wp_list_posts"] as Record<string, unknown>;
    const post = wpPath["post"] as Record<string, unknown>;
    const responses = post["responses"] as Record<string, unknown>;
    const ok = responses["200"] as Record<string, unknown>;

    expect(ok["description"]).toBe("Successful response");

    const content = ok["content"] as Record<string, unknown>;
    const jsonContent = content["application/json"] as Record<string, unknown>;
    const schema = jsonContent["schema"] as Record<string, unknown>;
    const properties = schema["properties"] as Record<string, unknown>;

    expect(properties["success"]).toBeDefined();
    expect(properties["tool"]).toBeDefined();
    expect(properties["result"]).toBeDefined();
  });

  it("generates paths for multiple tools across multiple servers", () => {
    const tools = [
      { serverName: "wordpress", tool: { name: "wp_list_posts", description: "List posts", inputSchema: { type: "object", properties: {} } } },
      { serverName: "wordpress", tool: { name: "wp_get_post", description: "Get post", inputSchema: { type: "object", properties: { id: { type: "number" } }, required: ["id"] } } },
      { serverName: "woocommerce", tool: { name: "woo_list_orders", description: "List orders", inputSchema: { type: "object", properties: {} } } },
    ];

    const spec = generateOpenApiSpec(tools, baseUrl);
    const paths = spec["paths"] as Record<string, unknown>;

    expect(Object.keys(paths)).toHaveLength(3);
    expect(paths["/api/wordpress/wp_list_posts"]).toBeDefined();
    expect(paths["/api/wordpress/wp_get_post"]).toBeDefined();
    expect(paths["/api/woocommerce/woo_list_orders"]).toBeDefined();
  });

  it("returns empty paths when no tools provided", () => {
    const spec = generateOpenApiSpec([], baseUrl);
    const paths = spec["paths"] as Record<string, unknown>;

    expect(Object.keys(paths)).toHaveLength(0);
  });
});
