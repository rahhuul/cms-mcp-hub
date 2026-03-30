/**
 * MCP Bridge — spawns an MCP server as a child process and communicates via stdio JSON-RPC.
 * This bridges MCP tools into the HTTP world.
 */

import { spawn, type ChildProcess } from "node:child_process";
import { createLogger } from "@cmsmcp/shared";
import { randomUUID } from "node:crypto";

const logger = createLogger("gateway:bridge");

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: string;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

export class McpBridge {
  private process: ChildProcess | null = null;
  private pendingRequests = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
  private buffer = "";
  private tools: McpTool[] = [];
  private ready = false;

  constructor(
    private readonly name: string,
    private readonly command: string,
    private readonly args: string[],
    private readonly env: Record<string, string>,
  ) {}

  async start(): Promise<void> {
    this.process = spawn(this.command, this.args, {
      env: { ...process.env, ...this.env },
      stdio: ["pipe", "pipe", "pipe"],
    });

    this.process.stdout!.on("data", (data: Buffer) => {
      this.buffer += data.toString();
      this.processBuffer();
    });

    this.process.stderr!.on("data", (data: Buffer) => {
      // MCP servers log to stderr — pass through
      const lines = data.toString().trim().split("\n");
      for (const line of lines) {
        if (line.trim()) logger.debug(`[${this.name}] ${line}`);
      }
    });

    this.process.on("exit", (code) => {
      logger.warn(`MCP server '${this.name}' exited with code ${code}`);
      this.ready = false;
    });

    // Initialize the MCP connection
    await this.sendRequest("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "cmsmcp-gateway", version: "0.1.0" },
    });

    // Send initialized notification
    this.sendNotification("notifications/initialized", {});

    // List tools
    const toolsResult = await this.sendRequest("tools/list", {}) as { tools: McpTool[] };
    this.tools = toolsResult.tools;
    this.ready = true;

    logger.info(`MCP server '${this.name}' started with ${this.tools.length} tools`);
  }

  async callTool(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    if (!this.ready) throw new Error(`MCP server '${this.name}' not ready`);

    const result = await this.sendRequest("tools/call", {
      name: toolName,
      arguments: args,
    }) as { content: Array<{ type: string; text: string }>; isError?: boolean };

    if (result.isError) {
      const errorText = result.content[0]?.text || "Unknown error";
      throw new Error(errorText);
    }

    // Parse the text content as JSON if possible
    const text = result.content[0]?.text || "{}";
    try { return JSON.parse(text); }
    catch { return { text }; }
  }

  getTools(): McpTool[] {
    return this.tools;
  }

  getName(): string {
    return this.name;
  }

  isReady(): boolean {
    return this.ready;
  }

  async stop(): Promise<void> {
    if (this.process) {
      this.process.kill("SIGTERM");
      this.process = null;
      this.ready = false;
    }
  }

  private async sendRequest(method: string, params: Record<string, unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const id = randomUUID();
      const request: JsonRpcRequest = { jsonrpc: "2.0", id, method, params };

      this.pendingRequests.set(id, { resolve, reject });

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request ${method} timed out after 30s`));
      }, 30000);

      this.pendingRequests.set(id, {
        resolve: (v) => { clearTimeout(timeout); resolve(v); },
        reject: (e) => { clearTimeout(timeout); reject(e); },
      });

      this.process!.stdin!.write(JSON.stringify(request) + "\n");
    });
  }

  private sendNotification(method: string, params: Record<string, unknown>): void {
    const notification = { jsonrpc: "2.0", method, params };
    this.process!.stdin!.write(JSON.stringify(notification) + "\n");
  }

  private processBuffer(): void {
    const lines = this.buffer.split("\n");
    this.buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line) as JsonRpcResponse;
        if (msg.id && this.pendingRequests.has(msg.id)) {
          const handler = this.pendingRequests.get(msg.id)!;
          this.pendingRequests.delete(msg.id);
          if (msg.error) {
            handler.reject(new Error(msg.error.message));
          } else {
            handler.resolve(msg.result);
          }
        }
      } catch {
        // Not JSON — ignore (could be logging)
      }
    }
  }
}
