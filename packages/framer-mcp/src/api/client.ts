/**
 * Framer API client with WebSocket connection lifecycle management.
 *
 * Uses the official `framer-api` npm package which communicates via WebSocket.
 * Manages connection state to ensure a single active connection per MCP server instance.
 */

import { connect, type Framer } from "framer-api";
import { createLogger, type Logger, ConfigError } from "@cmsmcp/shared";
import type { FramerConfig } from "../types/index.js";

export class FramerClient {
  private connection: Framer | null = null;
  private connecting: Promise<Framer> | null = null;
  private readonly config: FramerConfig;
  private readonly logger: Logger;

  constructor(config: FramerConfig) {
    if (!config.projectUrl) {
      throw new ConfigError(
        "Missing FRAMER_PROJECT_URL. Set it to your Framer project URL (e.g., https://framer.com/projects/abc123).",
      );
    }
    if (!config.apiKey) {
      throw new ConfigError(
        "Missing FRAMER_API_KEY. Get it from your Framer project's Site Settings → General.",
      );
    }

    this.config = config;
    this.logger = createLogger("framer");
  }

  /**
   * Gets the active Framer connection, creating one if needed.
   * Ensures only one connection attempt happens at a time.
   */
  async getConnection(): Promise<Framer> {
    if (this.connection) {
      return this.connection;
    }

    // Avoid duplicate concurrent connection attempts
    if (this.connecting) {
      return this.connecting;
    }

    this.connecting = this.establishConnection();

    try {
      this.connection = await this.connecting;
      return this.connection;
    } finally {
      this.connecting = null;
    }
  }

  /**
   * Disconnects the active WebSocket connection.
   */
  async disconnect(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.disconnect();
        this.logger.info("Disconnected from Framer project");
      } catch (error) {
        this.logger.warn("Error during disconnect", {
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        this.connection = null;
      }
    }
  }

  private async establishConnection(): Promise<Framer> {
    this.logger.info("Connecting to Framer project", {
      projectUrl: this.config.projectUrl,
    });

    try {
      const framer = await connect(this.config.projectUrl, this.config.apiKey);
      this.logger.info("Connected to Framer project");
      return framer;
    } catch (error) {
      this.logger.error("Failed to connect to Framer", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
