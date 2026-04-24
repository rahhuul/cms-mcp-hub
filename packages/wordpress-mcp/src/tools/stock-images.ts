import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WpClient } from "../api/client.js";
import { OpenverseClient, buildAttribution } from "../api/openverse.js";
import {
  SearchStockImagesSchema,
  SideloadImageSchema,
  GetStockImageDetailsSchema,
  SearchAndSideloadSchema,
} from "../schemas/index.js";

const openverse = new OpenverseClient();

export function registerStockImageTools(server: McpServer, client: WpClient): void {
  server.tool(
    "wp_search_stock_images",
    "Search Creative Commons licensed images on Openverse. Returns images with license, attribution, and thumbnail URLs. Use wp_sideload_image to download a result into WordPress.",
    SearchStockImagesSchema.shape,
    async (params) => {
      try {
        const v = SearchStockImagesSchema.parse(params);
        const result = await openverse.searchImages({
          query: v.query,
          page: v.page,
          pageSize: v.per_page,
          license: v.license,
          licenseType: v.license_type,
          category: v.category,
          aspectRatio: v.aspect_ratio,
          size: v.size,
        });
        return mcpSuccess({
          result_count: result.result_count,
          page: result.page,
          page_count: result.page_count,
          images: result.results.map((img) => ({
            id: img.id,
            title: img.title,
            url: img.url,
            thumbnail: img.thumbnail,
            width: img.width,
            height: img.height,
            license: img.license,
            license_version: img.license_version,
            license_url: img.license_url,
            creator: img.creator,
            creator_url: img.creator_url,
            source: img.source,
            attribution: buildAttribution(img),
            foreign_landing_url: img.foreign_landing_url,
          })),
        });
      } catch (e) {
        return mcpError(e, "wp_search_stock_images");
      }
    },
  );

  server.tool(
    "wp_sideload_image",
    "Download an image from a URL and upload it to the WordPress Media Library. If openverse_id is provided and no caption is set, auto-generates Creative Commons attribution as the caption. Returns the WordPress media object with ID and URL.",
    SideloadImageSchema.shape,
    async (params) => {
      try {
        const v = SideloadImageSchema.parse(params);

        // Auto-generate attribution caption from Openverse if openverse_id provided
        let autoCaption: string | undefined;
        if (v.openverse_id && !v.caption && !v.attribution) {
          try {
            const details = await openverse.getImageDetails(v.openverse_id);
            autoCaption = buildAttribution(details);
          } catch {
            // Non-fatal — proceed without auto-attribution
          }
        }

        const caption = v.attribution
          ? v.caption
            ? `${v.caption}\n${v.attribution}`
            : v.attribution
          : v.caption || autoCaption;

        const media = await client.uploadMedia(v.image_url, undefined, {
          title: v.title,
          alt_text: v.alt_text,
          caption,
          description: v.description,
        });
        return mcpSuccess({
          id: media["id"],
          title: (media["title"] as Record<string, unknown>)?.["rendered"],
          source_url: media["source_url"],
          media_type: media["media_type"],
          mime_type: media["mime_type"],
          link: media["link"],
          message: `Image sideloaded to WordPress (ID: ${media["id"]}). Use this ID as featured_media in posts/pages.`,
        });
      } catch (e) {
        return mcpError(e, "wp_sideload_image");
      }
    },
  );

  server.tool(
    "wp_get_stock_image_details",
    "Get detailed information about a specific Openverse image by ID, including full license info, creator details, and attribution text.",
    GetStockImageDetailsSchema.shape,
    async (params) => {
      try {
        const v = GetStockImageDetailsSchema.parse(params);
        const image = await openverse.getImageDetails(v.image_id);
        return mcpSuccess({
          id: image.id,
          title: image.title,
          url: image.url,
          thumbnail: image.thumbnail,
          width: image.width,
          height: image.height,
          license: image.license,
          license_version: image.license_version,
          license_url: image.license_url,
          creator: image.creator,
          creator_url: image.creator_url,
          source: image.source,
          attribution: buildAttribution(image),
          detail_url: image.detail_url,
          foreign_landing_url: image.foreign_landing_url,
        });
      } catch (e) {
        return mcpError(e, "wp_get_stock_image_details");
      }
    },
  );

  server.tool(
    "wp_search_and_sideload",
    "Search Openverse for a Creative Commons image, pick the first result, and sideload it into WordPress Media Library. Combines search + download + upload in one step. Returns WordPress media object and original CC license info.",
    SearchAndSideloadSchema.shape,
    async (params) => {
      try {
        const v = SearchAndSideloadSchema.parse(params);
        const result = await openverse.searchImages({ query: v.query, pageSize: 1 });

        if (result.results.length === 0) {
          return mcpSuccess({
            message: `No Creative Commons images found for query "${v.query}". Try different search terms.`,
            found: false,
          });
        }

        const img = result.results[0]!;

        const attribution = v.auto_attribute ? buildAttribution(img) : undefined;
        const caption = attribution || undefined;

        const media = await client.uploadMedia(img.url, undefined, {
          title: v.title || img.title || v.query,
          alt_text: v.alt_text || img.title || v.query,
          caption,
        });

        return mcpSuccess({
          found: true,
          wordpress: {
            id: media["id"],
            title: (media["title"] as Record<string, unknown>)?.["rendered"],
            source_url: media["source_url"],
            media_type: media["media_type"],
            link: media["link"],
          },
          openverse: {
            id: img.id,
            original_url: img.url,
            license: img.license,
            license_version: img.license_version,
            license_url: img.license_url,
            creator: img.creator,
            creator_url: img.creator_url,
            attribution: buildAttribution(img),
            source: img.source,
          },
          message: `Image sideloaded to WordPress (ID: ${media["id"]}). License: ${img.license} ${img.license_version}. Use this ID as featured_media in posts/pages.`,
        });
      } catch (e) {
        return mcpError(e, "wp_search_and_sideload");
      }
    },
  );
}
