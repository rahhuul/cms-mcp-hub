import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WpClient } from "../api/client.js";
import { ListFontFamiliesSchema, GetFontFamilySchema, CreateFontFamilySchema, DeleteFontFamilySchema, ListFontFacesSchema, GetFontFaceSchema, CreateFontFaceSchema, DeleteFontFaceSchema } from "../schemas/index.js";

export function registerFontTools(server: McpServer, client: WpClient): void {
  // Font Families
  server.tool("wp_list_font_families", "List installed font families.", ListFontFamiliesSchema.shape, async (p) => {
    try { const { page, per_page } = ListFontFamiliesSchema.parse(p); return mcpSuccess(await client.list("font-families", {}, page, per_page)); }
    catch (e) { return mcpError(e, "wp_list_font_families"); }
  });
  server.tool("wp_get_font_family", "Get a font family by ID.", GetFontFamilySchema.shape, async (p) => {
    try { return mcpSuccess(await client.get(`font-families/${GetFontFamilySchema.parse(p).id}`)); }
    catch (e) { return mcpError(e, "wp_get_font_family"); }
  });
  server.tool("wp_create_font_family", "Install a new font family. Provide settings as JSON string with name, slug, fontFamily.", CreateFontFamilySchema.shape, async (p) => {
    try { const v = CreateFontFamilySchema.parse(p); const f = await client.post<Record<string, unknown>>("font-families", v); return mcpSuccess({ id: f["id"], message: "Font family created" }); }
    catch (e) { return mcpError(e, "wp_create_font_family"); }
  });
  server.tool("wp_delete_font_family", "Delete a font family and all its faces.", DeleteFontFamilySchema.shape, async (p) => {
    try { const { id, force } = DeleteFontFamilySchema.parse(p); await client.del(`font-families/${id}`, { force }); return mcpSuccess({ message: `Font family ${id} deleted` }); }
    catch (e) { return mcpError(e, "wp_delete_font_family"); }
  });
  // Font Faces
  server.tool("wp_list_font_faces", "List font faces (weights/styles) for a font family.", ListFontFacesSchema.shape, async (p) => {
    try { const { font_family_id, page, per_page } = ListFontFacesSchema.parse(p); return mcpSuccess(await client.list(`font-families/${font_family_id}/font-faces`, {}, page, per_page)); }
    catch (e) { return mcpError(e, "wp_list_font_faces"); }
  });
  server.tool("wp_get_font_face", "Get a specific font face.", GetFontFaceSchema.shape, async (p) => {
    try { const { font_family_id, id } = GetFontFaceSchema.parse(p); return mcpSuccess(await client.get(`font-families/${font_family_id}/font-faces/${id}`)); }
    catch (e) { return mcpError(e, "wp_get_font_face"); }
  });
  server.tool("wp_create_font_face", "Add a font face (weight/style variant) to a font family.", CreateFontFaceSchema.shape, async (p) => {
    try { const { font_family_id, ...d } = CreateFontFaceSchema.parse(p); const f = await client.post<Record<string, unknown>>(`font-families/${font_family_id}/font-faces`, d); return mcpSuccess({ id: f["id"], message: "Font face created" }); }
    catch (e) { return mcpError(e, "wp_create_font_face"); }
  });
  server.tool("wp_delete_font_face", "Delete a font face.", DeleteFontFaceSchema.shape, async (p) => {
    try { const { font_family_id, id, force } = DeleteFontFaceSchema.parse(p); await client.del(`font-families/${font_family_id}/font-faces/${id}`, { force }); return mcpSuccess({ message: "Font face deleted" }); }
    catch (e) { return mcpError(e, "wp_delete_font_face"); }
  });
}
