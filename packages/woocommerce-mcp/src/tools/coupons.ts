/**
 * Coupon tools (5): list, get, create, update, delete
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WooClient } from "../api/client.js";
import type { WooCoupon } from "../types/index.js";
import { ListCouponsSchema, GetCouponSchema, CreateCouponSchema, UpdateCouponSchema, DeleteCouponSchema } from "../schemas/index.js";

export function registerCouponTools(server: McpServer, client: WooClient): void {
  server.tool("woo_list_coupons", "List WooCommerce discount coupons with optional search.", ListCouponsSchema.shape, async (params) => {
    try {
      const { page, per_page, ...filters } = ListCouponsSchema.parse(params);
      const coupons = await client.list<WooCoupon>("coupons", filters as Record<string, string | number | boolean | undefined>, page, per_page);
      return mcpSuccess({ coupons: coupons.map((c) => ({ id: c.id, code: c.code, discount_type: c.discount_type, amount: c.amount, usage_count: c.usage_count })), page, per_page });
    } catch (error) { return mcpError(error, "woo_list_coupons"); }
  });

  server.tool("woo_get_coupon", "Get detailed coupon information by ID.", GetCouponSchema.shape, async (params) => {
    try { return mcpSuccess(await client.get<WooCoupon>(`coupons/${GetCouponSchema.parse(params).coupon_id}`)); }
    catch (error) { return mcpError(error, "woo_get_coupon"); }
  });

  server.tool("woo_create_coupon", "Create a WooCommerce discount coupon. Supports percent, fixed_cart, and fixed_product types.", CreateCouponSchema.shape, async (params) => {
    try {
      const validated = CreateCouponSchema.parse(params);
      const c = await client.post<WooCoupon>("coupons", validated);
      return mcpSuccess({ id: c.id, code: c.code, discount_type: c.discount_type, amount: c.amount, message: `Coupon '${c.code}' created` });
    } catch (error) { return mcpError(error, "woo_create_coupon"); }
  });

  server.tool("woo_update_coupon", "Update a coupon's discount, limits, or restrictions.", UpdateCouponSchema.shape, async (params) => {
    try {
      const { coupon_id, ...data } = UpdateCouponSchema.parse(params);
      const c = await client.put<WooCoupon>(`coupons/${coupon_id}`, data);
      return mcpSuccess({ id: c.id, code: c.code, message: `Coupon ${coupon_id} updated` });
    } catch (error) { return mcpError(error, "woo_update_coupon"); }
  });

  server.tool("woo_delete_coupon", "Delete a coupon.", DeleteCouponSchema.shape, async (params) => {
    try {
      const { coupon_id, force } = DeleteCouponSchema.parse(params);
      await client.delete(`coupons/${coupon_id}`, { force });
      return mcpSuccess({ message: `Coupon ${coupon_id} deleted` });
    } catch (error) { return mcpError(error, "woo_delete_coupon"); }
  });
}
