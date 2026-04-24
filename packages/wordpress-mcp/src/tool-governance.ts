/**
 * Tool governance — filters which tools are exposed to MCP clients.
 *
 * When enabledTools is configured, only those tools (plus always-included
 * site management tools) are registered. This is critical for MCP clients
 * with hard tool limits (e.g., ~100 tools).
 */

/** Tools that are always included regardless of enabledTools config. */
const ALWAYS_INCLUDED_TOOLS: ReadonlySet<string> = new Set([
  "wp_list_sites",
  "wp_switch_site",
  "wp_get_active_site",
]);

export interface ToolGovernance {
  /** Check if a specific tool should be registered. */
  isToolEnabled(toolName: string): boolean;
  /** The set of enabled tool names, or null if all tools are enabled. */
  enabledSet: ReadonlySet<string> | null;
}

/**
 * Create a ToolGovernance instance.
 *
 * @param enabledTools - Array of tool names to enable, or null/undefined for all tools.
 * @returns ToolGovernance instance with filtering methods.
 */
export function createToolGovernance(enabledTools?: string[] | null): ToolGovernance {
  if (!enabledTools || enabledTools.length === 0) {
    return {
      enabledSet: null,
      isToolEnabled: () => true,
    };
  }

  const enabledSet = new Set<string>([
    ...enabledTools,
    ...ALWAYS_INCLUDED_TOOLS,
  ]);

  return {
    enabledSet,
    isToolEnabled(toolName: string): boolean {
      return enabledSet.has(toolName);
    },
  };
}
