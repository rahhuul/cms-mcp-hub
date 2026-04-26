/**
 * Code file tools: list_code_files, get_code_file, create_code_file, update_code_file
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { FramerClient } from "../api/client.js";
import {
  ListCodeFilesSchema,
  GetCodeFileSchema,
  CreateCodeFileSchema,
  UpdateCodeFileSchema,
} from "../schemas/index.js";

export function registerCodeTools(server: McpServer, client: FramerClient): void {
  // ─── 12. framer_list_code_files ──────────────────────────────────
  server.tool(
    "framer_list_code_files",
    "List all code components and overrides in the Framer project. Returns file IDs, names, and export info.",
    ListCodeFilesSchema.shape,
    async () => {
      try {
        const framer = await client.getConnection();
        const files = await framer.getCodeFiles();

        const result = files.map((f) => ({
          id: f.id,
          name: f.name,
          exports: f.exports.map((e) => ({
            name: e.name,
            type: e.type,
          })),
        }));

        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "framer_list_code_files");
      }
    },
  );

  // ─── 13. framer_get_code_file ────────────────────────────────────
  server.tool(
    "framer_get_code_file",
    "Read the content of a specific code file (React component or override). Returns the file's name, content, exports, and version history.",
    GetCodeFileSchema.shape,
    async (params) => {
      try {
        const { codeFileId } = GetCodeFileSchema.parse(params);
        const framer = await client.getConnection();
        const file = await framer.getCodeFile(codeFileId);

        if (!file) {
          return mcpError(
            new Error(`Code file '${codeFileId}' not found`),
            "framer_get_code_file",
          );
        }

        const versions = await file.getVersions();
        let content: string | null = null;
        if (versions.length > 0) {
          content = await versions[versions.length - 1]!.getContent();
        }

        return mcpSuccess({
          id: file.id,
          name: file.name,
          content,
          exports: file.exports.map((e) => ({
            name: e.name,
            type: e.type,
          })),
          versionCount: versions.length,
        });
      } catch (error) {
        return mcpError(error, "framer_get_code_file");
      }
    },
  );

  // ─── 14. framer_create_code_file ─────────────────────────────────
  server.tool(
    "framer_create_code_file",
    "Create a new code file (React component or override) in the Framer project. Provide the file name and TypeScript/React code content.",
    CreateCodeFileSchema.shape,
    async (params) => {
      try {
        const validated = CreateCodeFileSchema.parse(params);
        const framer = await client.getConnection();
        const file = await framer.createCodeFile(validated.name, validated.code);

        return mcpSuccess({
          id: file.id,
          name: file.name,
          message: `Code file '${validated.name}' created successfully`,
        });
      } catch (error) {
        return mcpError(error, "framer_create_code_file");
      }
    },
  );

  // ─── 15. framer_update_code_file ─────────────────────────────────
  server.tool(
    "framer_update_code_file",
    "Update the content of an existing code file. Replaces the file's entire content with the new code.",
    UpdateCodeFileSchema.shape,
    async (params) => {
      try {
        const validated = UpdateCodeFileSchema.parse(params);
        const framer = await client.getConnection();
        const codeFile = await framer.getCodeFile(validated.codeFileId);
        if (!codeFile) {
          return mcpError(new Error(`Code file '${validated.codeFileId}' not found`), "framer_update_code_file");
        }
        const file = await codeFile.setFileContent(validated.code);

        return mcpSuccess({
          id: file.id,
          name: file.name,
          message: "Code file updated successfully",
        });
      } catch (error) {
        return mcpError(error, "framer_update_code_file");
      }
    },
  );
}
