import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WpClient } from "../api/client.js";
import { ListSidebarsSchema, GetSidebarSchema, UpdateSidebarSchema, ListWidgetTypesSchema, GetWidgetTypeSchema, ListWidgetsSchema, GetWidgetSchema, CreateWidgetSchema, UpdateWidgetSchema, DeleteWidgetSchema } from "../schemas/index.js";

export function registerWidgetTools(server: McpServer, client: WpClient): void {
  server.tool("wp_list_sidebars", "List registered widget areas/sidebars.", ListSidebarsSchema.shape, async () => { try { return mcpSuccess(await client.get("sidebars")); } catch(e) { return mcpError(e, "wp_list_sidebars"); } });
  server.tool("wp_get_sidebar", "Get a sidebar's widgets and config.", GetSidebarSchema.shape, async (p) => { try { return mcpSuccess(await client.get(`sidebars/${GetSidebarSchema.parse(p).id}`)); } catch(e) { return mcpError(e, "wp_get_sidebar"); } });
  server.tool("wp_list_widgets", "List widgets, optionally filtered by sidebar.", ListWidgetsSchema.shape, async (p) => { try { const f = ListWidgetsSchema.parse(p); return mcpSuccess(await client.get("widgets", f as Record<string, string | number | boolean | undefined>)); } catch(e) { return mcpError(e, "wp_list_widgets"); } });
  server.tool("wp_get_widget", "Get a single widget by ID.", GetWidgetSchema.shape, async (p) => { try { return mcpSuccess(await client.get(`widgets/${GetWidgetSchema.parse(p).id}`)); } catch(e) { return mcpError(e, "wp_get_widget"); } });
  server.tool("wp_create_widget", "Add a widget to a sidebar.", CreateWidgetSchema.shape, async (p) => { try { const v = CreateWidgetSchema.parse(p); const w = await client.post<Record<string, unknown>>("widgets", v); return mcpSuccess({ id: w["id"], sidebar: w["sidebar"], message: "Widget created" }); } catch(e) { return mcpError(e, "wp_create_widget"); } });
  server.tool("wp_update_widget", "Update a widget's settings or move it to another sidebar.", UpdateWidgetSchema.shape, async (p) => { try { const { id, ...d } = UpdateWidgetSchema.parse(p); await client.put(`widgets/${id}`, d); return mcpSuccess({ message: `Widget ${id} updated` }); } catch(e) { return mcpError(e, "wp_update_widget"); } });
  server.tool("wp_delete_widget", "Remove a widget.", DeleteWidgetSchema.shape, async (p) => { try { await client.del(`widgets/${DeleteWidgetSchema.parse(p).id}`, { force: true }); return mcpSuccess({ message: "Widget deleted" }); } catch(e) { return mcpError(e, "wp_delete_widget"); } });
  // Sidebar update
  server.tool("wp_update_sidebar", "Update a sidebar's widget order.", UpdateSidebarSchema.shape, async (p) => { try { const { id, ...d } = UpdateSidebarSchema.parse(p); await client.put(`sidebars/${id}`, d); return mcpSuccess({ message: `Sidebar ${id} updated` }); } catch(e) { return mcpError(e, "wp_update_sidebar"); } });
  // Widget Types
  server.tool("wp_list_widget_types", "List available widget types (text, search, custom_html, etc.).", ListWidgetTypesSchema.shape, async () => { try { return mcpSuccess(await client.get("widget-types")); } catch(e) { return mcpError(e, "wp_list_widget_types"); } });
  server.tool("wp_get_widget_type", "Get details about a widget type.", GetWidgetTypeSchema.shape, async (p) => { try { return mcpSuccess(await client.get(`widget-types/${GetWidgetTypeSchema.parse(p).id}`)); } catch(e) { return mcpError(e, "wp_get_widget_type"); } });
}
