import { describe, it, expect } from "vitest";
import {
  ListPostsSchema,
  GetPostSchema,
  CreatePostSchema,
  UpdatePostSchema,
  DeletePostSchema,
  ListPagesSchema,
  CreatePageSchema,
  UpdatePageSchema,
  ListTagsSchema,
  CreateTagSchema,
  ListMembersSchema,
  CreateMemberSchema,
  UploadImageSchema,
} from "../schemas/index.js";

describe("Post schemas", () => {
  it("ListPostsSchema applies defaults", () => {
    const result = ListPostsSchema.parse({});
    expect(result.limit).toBe(15);
    expect(result.page).toBe(1);
  });

  it("ListPostsSchema accepts all filters", () => {
    const result = ListPostsSchema.parse({
      filter: "tag:news+featured:true",
      include: "tags,authors",
      fields: "title,slug",
      order: "published_at desc",
      limit: 50,
      page: 2,
    });
    expect(result.filter).toBe("tag:news+featured:true");
  });

  it("GetPostSchema requires id or slug", () => {
    const byId = GetPostSchema.parse({ id: "abc123" });
    expect(byId.id).toBe("abc123");

    const bySlug = GetPostSchema.parse({ slug: "my-post" });
    expect(bySlug.slug).toBe("my-post");
  });

  it("CreatePostSchema applies defaults", () => {
    const result = CreatePostSchema.parse({ title: "Test Post" });
    expect(result.status).toBe("draft");
  });

  it("CreatePostSchema accepts full post", () => {
    const result = CreatePostSchema.parse({
      title: "Full Post",
      html: "<p>Hello</p>",
      status: "published",
      tags: [{ name: "News" }],
      featured: true,
      excerpt: "A test post",
      meta_title: "SEO Title",
    });
    expect(result.tags).toHaveLength(1);
    expect(result.featured).toBe(true);
  });

  it("UpdatePostSchema requires id and updated_at", () => {
    expect(() => UpdatePostSchema.parse({ id: "abc" })).toThrow();
    const result = UpdatePostSchema.parse({
      id: "abc123",
      updated_at: "2024-01-01T00:00:00.000Z",
      title: "Updated Title",
    });
    expect(result.title).toBe("Updated Title");
  });

  it("DeletePostSchema requires id", () => {
    const result = DeletePostSchema.parse({ id: "abc123" });
    expect(result.id).toBe("abc123");
  });
});

describe("Page schemas", () => {
  it("CreatePageSchema applies defaults", () => {
    const result = CreatePageSchema.parse({ title: "About Us" });
    expect(result.status).toBe("draft");
  });

  it("UpdatePageSchema requires updated_at", () => {
    const result = UpdatePageSchema.parse({
      id: "page1",
      updated_at: "2024-01-01T00:00:00.000Z",
      title: "New Title",
    });
    expect(result.id).toBe("page1");
  });
});

describe("Tag schemas", () => {
  it("ListTagsSchema applies defaults", () => {
    const result = ListTagsSchema.parse({});
    expect(result.limit).toBe(15);
  });

  it("CreateTagSchema requires name", () => {
    const result = CreateTagSchema.parse({ name: "Technology" });
    expect(result.name).toBe("Technology");
  });
});

describe("Member schemas", () => {
  it("ListMembersSchema accepts filters", () => {
    const result = ListMembersSchema.parse({
      filter: "status:paid",
      search: "john",
    });
    expect(result.filter).toBe("status:paid");
  });

  it("CreateMemberSchema requires email", () => {
    expect(() => CreateMemberSchema.parse({})).toThrow();
    const result = CreateMemberSchema.parse({
      email: "test@example.com",
      name: "John Doe",
      labels: [{ name: "VIP" }],
    });
    expect(result.email).toBe("test@example.com");
    expect(result.labels).toHaveLength(1);
  });

  it("CreateMemberSchema validates email", () => {
    expect(() => CreateMemberSchema.parse({ email: "bad" })).toThrow();
  });
});

describe("Image schema", () => {
  it("UploadImageSchema validates URL", () => {
    expect(() => UploadImageSchema.parse({ url: "not-url" })).toThrow();
    const result = UploadImageSchema.parse({ url: "https://example.com/img.jpg", ref: "hero" });
    expect(result.ref).toBe("hero");
  });
});
