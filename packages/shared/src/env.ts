/**
 * Environment variable helpers with validation.
 */

import { ConfigError } from "./errors.js";

/**
 * Gets a required environment variable or throws a ConfigError.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new ConfigError(
      `Missing required environment variable: ${name}. ` +
      `Set it before starting the MCP server.`,
    );
  }
  return value;
}

/**
 * Gets an optional environment variable with a default value.
 */
export function optionalEnv(name: string, defaultValue: string): string {
  return process.env[name] ?? defaultValue;
}

/**
 * Gets an optional numeric environment variable with a default value.
 */
export function optionalEnvInt(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new ConfigError(`Environment variable ${name} must be a number, got: "${value}"`);
  }
  return parsed;
}
