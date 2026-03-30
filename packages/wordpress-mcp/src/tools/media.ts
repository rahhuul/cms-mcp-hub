import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WpClient } from "../api/client.js";
import { ListMediaSchema, GetMediaSchema, UpdateMediaSchema, DeleteMediaSchema, UploadMediaSchema } from "../schemas/index.js";

export function registerMediaTools(server: McpServer, client: WpClient): void {
  server.tool("wp_list_media", "List media library items (images, videos, documents) with type and search filters.", ListMediaSchema.shape, async (params) => {
    try { const { page, per_page, ...f } = ListMediaSchema.parse(params); return mcpSuccess(await client.list("media", f as Record<string, string | number | boolean | undefined>, page, per_page)); }
    catch (e) { return mcpError(e, "wp_list_media"); }
  });
  server.tool("wp_get_media", "Get a single media item by ID.", GetMediaSchema.shape, async (params) => {
    try { return mcpSuccess(await client.get(`media/${GetMediaSchema.parse(params).id}`)); }
    catch (e) { return mcpError(e, "wp_get_media"); }
  });
  server.tool("wp_update_media", "Update media item metadata (title, caption, alt text, description).", UpdateMediaSchema.shape, async (params) => {
    try { const { id, ...d } = UpdateMediaSchema.parse(params); await client.put(`media/${id}`, d); return mcpSuccess({ message: `Media ${id} updated` }); }
    catch (e) { return mcpError(e, "wp_update_media"); }
  });
  server.tool("wp_delete_media", "Permanently delete a media item (force=true required).", DeleteMediaSchema.shape, async (params) => {
    try { const { id, force } = DeleteMediaSchema.parse(params); await client.del(`media/${id}`, { force }); return mcpSuccess({ message: `Media ${id} deleted` }); }
    catch (e) { return mcpError(e, "wp_delete_media"); }
  });
  server.tool(
    "wp_upload_media",
    "Upload a file to the WordPress media library. Provide a local file path (e.g., 'C:/Users/Admin/Pictures/photo.jpg') or a URL (e.g., 'https://example.com/image.png'). Returns the media ID which can be used as featured_media in posts/pages.",
    UploadMediaSchema.shape,
    async (params) => {
      try {
        const { source, filename, title, caption, alt_text, description } = UploadMediaSchema.parse(params);
        const media = await client.uploadMedia(source, filename, { title, caption, alt_text, description });
        return mcpSuccess({
          id: media["id"],
          title: (media["title"] as Record<string, unknown>)?.["rendered"],
          source_url: media["source_url"],
          media_type: media["media_type"],
          mime_type: media["mime_type"],
          link: media["link"],
          message: `Media uploaded (ID: ${media["id"]}). Use this ID as featured_media when creating/updating posts.`,
        });
      } catch (e) {
        return mcpError(e, "wp_upload_media");
      }
    },
  );
}
