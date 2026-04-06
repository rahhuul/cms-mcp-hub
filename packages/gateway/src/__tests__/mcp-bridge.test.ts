import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock child_process
vi.mock("node:child_process", () => ({
  spawn: vi.fn(),
}));

// Mock crypto
vi.mock("node:crypto", () => ({
  randomUUID: vi.fn(() => "test-uuid-1234"),
}));

// Mock @cmsmcp/shared logger
vi.mock("@cmsmcp/shared", () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { McpBridge } from "../mcp-bridge.js";
import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";
import { Readable, Writable } from "node:stream";

/**
 * Creates a mock child process. The `onStdinWrite` callback fires whenever
 * the bridge writes to stdin (i.e. sends a JSON-RPC request), allowing
 * us to immediately push a response to stdout and avoid timeouts.
 */
function createMockProcess(onStdinWrite?: (data: string) => void) {
  const proc = new EventEmitter() as EventEmitter & {
    stdin: Writable;
    stdout: Readable;
    stderr: Readable;
    kill: ReturnType<typeof vi.fn>;
  };
  proc.stdin = new Writable({
    write(chunk: Buffer | string, _enc: unknown, cb: () => void) {
      const str = typeof chunk === "string" ? chunk : chunk.toString();
      if (onStdinWrite) onStdinWrite(str);
      cb();
    },
  });
  proc.stdout = new Readable({ read() {} });
  proc.stderr = new Readable({ read() {} });
  proc.kill = vi.fn();
  return proc;
}

describe("McpBridge", () => {
  let bridge: McpBridge;
  let mockProcess: ReturnType<typeof createMockProcess>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcess = createMockProcess();
    (spawn as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockProcess);
    bridge = new McpBridge("test-server", "node", ["test.js"], { API_KEY: "xxx" });
  });

  it("initializes with ready=false", () => {
    expect(bridge.isReady()).toBe(false);
  });

  it("returns empty tools before start", () => {
    expect(bridge.getTools()).toEqual([]);
  });

  it("returns correct name", () => {
    expect(bridge.getName()).toBe("test-server");
  });

  it("spawns process with correct command and env on start", () => {
    // Start but don't await (it will hang waiting for MCP handshake)
    bridge.start().catch(() => {
      /* expected — no response from mock */
    });

    expect(spawn).toHaveBeenCalledWith(
      "node",
      ["test.js"],
      expect.objectContaining({
        stdio: ["pipe", "pipe", "pipe"],
      }),
    );

    // Verify env includes the custom env vars
    const callArgs = (spawn as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    const options = callArgs[2] as { env: Record<string, string> };
    expect(options.env["API_KEY"]).toBe("xxx");
  });

  it("kills process on stop", async () => {
    (bridge as unknown as { process: unknown }).process = mockProcess;
    await bridge.stop();
    expect(mockProcess.kill).toHaveBeenCalledWith("SIGTERM");
    expect(bridge.isReady()).toBe(false);
  });

  it("handles stop when no process exists", async () => {
    await bridge.stop();
    expect(bridge.isReady()).toBe(false);
  });

  it("clears process reference after stop", async () => {
    (bridge as unknown as { process: unknown }).process = mockProcess;
    await bridge.stop();
    expect((bridge as unknown as { process: unknown }).process).toBeNull();
  });

  it("throws on callTool when not ready", async () => {
    await expect(bridge.callTool("test_tool", {})).rejects.toThrow("not ready");
  });

  it("throws on callTool with descriptive error including server name", async () => {
    await expect(bridge.callTool("test_tool", {})).rejects.toThrow("test-server");
  });

  it("completes MCP handshake and discovers tools", async () => {
    const { randomUUID } = await import("node:crypto");
    let callCount = 0;
    (randomUUID as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      return `test-uuid-${callCount}`;
    });

    // Create a process that auto-responds to JSON-RPC requests
    const autoProcess = createMockProcess((data: string) => {
      try {
        const msg = JSON.parse(data.trim());
        if (msg.method === "initialize") {
          // Respond to initialize
          setImmediate(() => {
            autoProcess.stdout.push(
              JSON.stringify({
                jsonrpc: "2.0",
                id: msg.id,
                result: { protocolVersion: "2024-11-05", capabilities: {} },
              }) + "\n",
            );
          });
        } else if (msg.method === "tools/list") {
          // Respond to tools/list
          setImmediate(() => {
            autoProcess.stdout.push(
              JSON.stringify({
                jsonrpc: "2.0",
                id: msg.id,
                result: {
                  tools: [
                    { name: "test_tool", description: "A test tool", inputSchema: { type: "object", properties: {} } },
                    { name: "test_tool_2", description: "Another test tool", inputSchema: { type: "object", properties: { id: { type: "number" } } } },
                  ],
                },
              }) + "\n",
            );
          });
        }
        // notifications (like notifications/initialized) have no id — ignore
      } catch {
        // Not valid JSON — ignore
      }
    });

    (spawn as unknown as ReturnType<typeof vi.fn>).mockReturnValue(autoProcess);
    const autoBridge = new McpBridge("test-server", "node", ["test.js"], { API_KEY: "xxx" });

    await autoBridge.start();

    expect(autoBridge.isReady()).toBe(true);
    expect(autoBridge.getTools()).toHaveLength(2);
    expect(autoBridge.getTools()[0].name).toBe("test_tool");
    expect(autoBridge.getTools()[1].name).toBe("test_tool_2");
  });

  it("calls a tool and returns parsed JSON result", async () => {
    const { randomUUID } = await import("node:crypto");
    let callCount = 0;
    (randomUUID as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      return `uuid-call-${callCount}`;
    });

    // Create auto-responding process for callTool
    const autoProcess = createMockProcess((data: string) => {
      try {
        const msg = JSON.parse(data.trim());
        if (msg.method === "tools/call") {
          setImmediate(() => {
            autoProcess.stdout.push(
              JSON.stringify({
                jsonrpc: "2.0",
                id: msg.id,
                result: {
                  content: [{ type: "text", text: JSON.stringify({ items: [1, 2, 3] }) }],
                  isError: false,
                },
              }) + "\n",
            );
          });
        }
      } catch {
        // ignore
      }
    });

    // Set bridge to ready state with auto-responding process
    (bridge as unknown as { ready: boolean }).ready = true;
    (bridge as unknown as { process: unknown }).process = autoProcess;

    // Attach data listener (normally done in start())
    autoProcess.stdout.on("data", (data: Buffer) => {
      const bridgePrivate = bridge as unknown as { buffer: string; processBuffer: () => void };
      bridgePrivate.buffer += data.toString();
      bridgePrivate.processBuffer();
    });

    const result = await bridge.callTool("test_tool", { limit: 10 });
    expect(result).toEqual({ items: [1, 2, 3] });
  });

  it("throws when tool returns isError", async () => {
    const { randomUUID } = await import("node:crypto");
    let callCount = 0;
    (randomUUID as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      return `uuid-err-${callCount}`;
    });

    const autoProcess = createMockProcess((data: string) => {
      try {
        const msg = JSON.parse(data.trim());
        if (msg.method === "tools/call") {
          setImmediate(() => {
            autoProcess.stdout.push(
              JSON.stringify({
                jsonrpc: "2.0",
                id: msg.id,
                result: {
                  content: [{ type: "text", text: "Something went wrong" }],
                  isError: true,
                },
              }) + "\n",
            );
          });
        }
      } catch {
        // ignore
      }
    });

    (bridge as unknown as { ready: boolean }).ready = true;
    (bridge as unknown as { process: unknown }).process = autoProcess;

    autoProcess.stdout.on("data", (data: Buffer) => {
      const bridgePrivate = bridge as unknown as { buffer: string; processBuffer: () => void };
      bridgePrivate.buffer += data.toString();
      bridgePrivate.processBuffer();
    });

    await expect(bridge.callTool("bad_tool", {})).rejects.toThrow("Something went wrong");
  });

  it("handles JSON-RPC error responses", async () => {
    const { randomUUID } = await import("node:crypto");
    let callCount = 0;
    (randomUUID as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      return `uuid-rpc-${callCount}`;
    });

    const autoProcess = createMockProcess((data: string) => {
      try {
        const msg = JSON.parse(data.trim());
        if (msg.method === "tools/call") {
          setImmediate(() => {
            autoProcess.stdout.push(
              JSON.stringify({
                jsonrpc: "2.0",
                id: msg.id,
                error: { code: -32601, message: "Method not found" },
              }) + "\n",
            );
          });
        }
      } catch {
        // ignore
      }
    });

    (bridge as unknown as { ready: boolean }).ready = true;
    (bridge as unknown as { process: unknown }).process = autoProcess;

    autoProcess.stdout.on("data", (data: Buffer) => {
      const bridgePrivate = bridge as unknown as { buffer: string; processBuffer: () => void };
      bridgePrivate.buffer += data.toString();
      bridgePrivate.processBuffer();
    });

    await expect(bridge.callTool("missing_tool", {})).rejects.toThrow("Method not found");
  });

  it("returns raw text when tool response is not valid JSON", async () => {
    const { randomUUID } = await import("node:crypto");
    let callCount = 0;
    (randomUUID as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      return `uuid-text-${callCount}`;
    });

    const autoProcess = createMockProcess((data: string) => {
      try {
        const msg = JSON.parse(data.trim());
        if (msg.method === "tools/call") {
          setImmediate(() => {
            autoProcess.stdout.push(
              JSON.stringify({
                jsonrpc: "2.0",
                id: msg.id,
                result: {
                  content: [{ type: "text", text: "plain text response" }],
                },
              }) + "\n",
            );
          });
        }
      } catch {
        // ignore
      }
    });

    (bridge as unknown as { ready: boolean }).ready = true;
    (bridge as unknown as { process: unknown }).process = autoProcess;

    autoProcess.stdout.on("data", (data: Buffer) => {
      const bridgePrivate = bridge as unknown as { buffer: string; processBuffer: () => void };
      bridgePrivate.buffer += data.toString();
      bridgePrivate.processBuffer();
    });

    const result = await bridge.callTool("text_tool", {});
    expect(result).toEqual({ text: "plain text response" });
  });

  it("handles stderr output without crashing", () => {
    bridge.start().catch(() => {});

    // Simulate stderr output — should not throw
    expect(() => {
      mockProcess.stderr.push("Warning: some debug info\n");
    }).not.toThrow();
  });

  it("sets ready to false when process exits", () => {
    bridge.start().catch(() => {});

    // Simulate process exit
    mockProcess.emit("exit", 1);
    expect(bridge.isReady()).toBe(false);
  });
});
