import { describe, it, expect } from "vitest";
import {
  ListPostsSchema, CreatePostSchema, UpdatePostSchema, DeletePostSchema,
  CreatePageSchema,
  UpdateMediaSchema,
  CreateCommentSchema,
  CreateCategorySchema, DeleteCategorySchema,
  CreateTagSchema,
  CreateUserSchema, DeleteUserSchema, CreateAppPasswordSchema,
  ListCustomPostsSchema, CreateCustomPostSchema,
  CreateMenuSchema, CreateMenuItemSchema,
  UpdatePluginSchema,
  SearchSchema,
  GetBlockTypeSchema, RenderBlockSchema,
  CreateWidgetSchema,
  CreateNavigationSchema,
  UpdateSettingsSchema,
  GetGlobalStylesSchema,
} from "../schemas/index.js";

describe("Post schemas", () => {
  it("ListPostsSchema defaults", () => { const r = ListPostsSchema.parse({}); expect(r.page).toBe(1); expect(r.per_page).toBe(25); });
  it("CreatePostSchema defaults to draft", () => { expect(CreatePostSchema.parse({ title: "T" }).status).toBe("draft"); });
  it("CreatePostSchema accepts full post", () => { const r = CreatePostSchema.parse({ title: "T", content: "<p>Hi</p>", status: "publish", categories: [1,2], tags: [3], format: "aside" }); expect(r.categories).toHaveLength(2); });
  it("UpdatePostSchema requires id", () => { expect(UpdatePostSchema.parse({ id: 1, title: "New" }).title).toBe("New"); });
  it("DeletePostSchema defaults force", () => { expect(DeletePostSchema.parse({ id: 1 }).force).toBe(false); });
});

describe("Page schemas", () => {
  it("CreatePageSchema supports parent and template", () => { const r = CreatePageSchema.parse({ title: "About", parent: 5, template: "full-width" }); expect(r.parent).toBe(5); });
});

describe("Media schemas", () => {
  it("UpdateMediaSchema works", () => { expect(UpdateMediaSchema.parse({ id: 1, alt_text: "photo" }).alt_text).toBe("photo"); });
});

describe("Comment schemas", () => {
  it("CreateCommentSchema requires post and content", () => { const r = CreateCommentSchema.parse({ post: 1, content: "Great!" }); expect(r.post).toBe(1); });
});

describe("Taxonomy schemas", () => {
  it("CreateCategorySchema requires name", () => { expect(CreateCategorySchema.parse({ name: "News" }).name).toBe("News"); });
  it("CreateTagSchema requires name", () => { expect(CreateTagSchema.parse({ name: "Hot" }).name).toBe("Hot"); });
  it("DeleteCategorySchema defaults force", () => { expect(DeleteCategorySchema.parse({ id: 1 }).force).toBe(false); });
});

describe("User schemas", () => {
  it("CreateUserSchema requires fields", () => { const r = CreateUserSchema.parse({ username: "john", email: "j@e.com", password: "pass123" }); expect(r.username).toBe("john"); });
  it("DeleteUserSchema requires reassign", () => { expect(DeleteUserSchema.parse({ id: 1, reassign: 2 }).reassign).toBe(2); });
  it("CreateAppPasswordSchema", () => { expect(CreateAppPasswordSchema.parse({ user_id: 1, name: "CLI" }).name).toBe("CLI"); });
});

describe("Custom type schemas", () => {
  it("ListCustomPostsSchema requires post_type", () => { expect(ListCustomPostsSchema.parse({ post_type: "product" }).post_type).toBe("product"); });
  it("CreateCustomPostSchema defaults to draft", () => { expect(CreateCustomPostSchema.parse({ post_type: "event", title: "Launch" }).status).toBe("draft"); });
});

describe("Menu schemas", () => {
  it("CreateMenuSchema requires name", () => { expect(CreateMenuSchema.parse({ name: "Main" }).name).toBe("Main"); });
  it("CreateMenuItemSchema requires title and menus", () => { const r = CreateMenuItemSchema.parse({ title: "Home", menus: 1 }); expect(r.menus).toBe(1); });
});

describe("Admin schemas", () => {
  it("UpdatePluginSchema validates status", () => { expect(UpdatePluginSchema.parse({ plugin: "akismet/akismet", status: "active" }).status).toBe("active"); });
  it("SearchSchema requires search", () => { expect(SearchSchema.parse({ search: "hello" }).search).toBe("hello"); });
  it("UpdateSettingsSchema accepts partial", () => { expect(UpdateSettingsSchema.parse({ title: "My Site" }).title).toBe("My Site"); });
});

describe("Block schemas", () => {
  it("GetBlockTypeSchema works", () => { const r = GetBlockTypeSchema.parse({ namespace: "core", name: "paragraph" }); expect(r.name).toBe("paragraph"); });
  it("RenderBlockSchema works", () => { expect(RenderBlockSchema.parse({ name: "core/latest-posts" }).name).toBe("core/latest-posts"); });
});

describe("Widget schemas", () => {
  it("CreateWidgetSchema works", () => { const r = CreateWidgetSchema.parse({ id_base: "text", sidebar: "sidebar-1" }); expect(r.sidebar).toBe("sidebar-1"); });
});

describe("Navigation schemas", () => {
  it("CreateNavigationSchema defaults to publish", () => { expect(CreateNavigationSchema.parse({ title: "Nav" }).status).toBe("publish"); });
});

describe("Global styles schema", () => {
  it("GetGlobalStylesSchema requires id", () => { expect(GetGlobalStylesSchema.parse({ id: 1 }).id).toBe(1); });
});
