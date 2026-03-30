/**
 * Structured logger for CMS MCP Hub servers.
 * Outputs JSON lines to stderr (stdout is reserved for MCP stdio transport).
 */

import type { LogLevel, LogEntry } from "./types/index.js";

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class Logger {
  private readonly minLevel: number;
  private readonly prefix: string;

  constructor(options: { level?: LogLevel; prefix?: string } = {}) {
    this.minLevel = LOG_LEVEL_PRIORITY[options.level ?? "info"];
    this.prefix = options.prefix ?? "cmsmcp";
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (LOG_LEVEL_PRIORITY[level] < this.minLevel) return;

    const entry: LogEntry = {
      level,
      message: `[${this.prefix}] ${message}`,
      timestamp: new Date().toISOString(),
      ...(context ? { context } : {}),
    };

    process.stderr.write(JSON.stringify(entry) + "\n");
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log("debug", message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log("warn", message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log("error", message, context);
  }
}

/**
 * Creates a logger instance for a specific CMS package.
 */
export function createLogger(cmsName: string, level?: LogLevel): Logger {
  return new Logger({
    prefix: `cmsmcp:${cmsName}`,
    level: level ?? ((process.env["LOG_LEVEL"] as LogLevel | undefined) ?? "info"),
  });
}
