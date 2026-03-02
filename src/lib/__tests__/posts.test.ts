import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Post } from "@/types/database";

// Mock Supabase client
const mockFrom = vi.fn();
const mockAuth = {
  getUser: vi.fn(),
};
const mockStorage = {
  from: vi.fn(),
};

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: mockFrom,
    auth: mockAuth,
    storage: mockStorage,
  }),
}));

// Import after mock
import {
  getPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  searchPosts,
} from "../posts";

const samplePost: Post = {
  id: "uuid-1",
  title: "테스트 글",
  content: "<p>본문입니다</p>",
  type: "diary",
  tags: ["일상"],
  is_public: true,
  slug: "test-post-abc123",
  cover_image: null,
  user_id: "user-1",
  created_at: "2026-03-01T00:00:00Z",
  updated_at: "2026-03-01T00:00:00Z",
};

function mockQuery(data: unknown, error: unknown = null) {
  // Every method returns chain AND chain is thenable (await resolves to {data, error})
  const result = { data, error };
  const chain: Record<string, unknown> = {};
  const returnChain = vi.fn().mockReturnValue(chain);

  chain.select = returnChain;
  chain.insert = returnChain;
  chain.update = returnChain;
  chain.delete = returnChain;
  chain.eq = returnChain;
  chain.or = returnChain;
  chain.order = returnChain;
  chain.single = vi.fn().mockResolvedValue(result);
  // Make chain thenable so `await query.order(...)` resolves
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve);

  mockFrom.mockReturnValue(chain);
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getPosts", () => {
  it("fetches all public posts ordered by date", async () => {
    const chain = mockQuery([samplePost]);
    const returnChain = chain.select as ReturnType<typeof vi.fn>;

    const posts = await getPosts();

    expect(mockFrom).toHaveBeenCalledWith("posts");
    expect(returnChain).toHaveBeenCalledWith("*");
    expect(returnChain).toHaveBeenCalledWith("is_public", true);
    expect(returnChain).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(posts).toEqual([samplePost]);
  });

  it("filters by type when provided", async () => {
    const chain = mockQuery([samplePost]);
    const returnChain = chain.select as ReturnType<typeof vi.fn>;

    await getPosts("diary");

    expect(returnChain).toHaveBeenCalledWith("type", "diary");
  });
});

describe("getPostBySlug", () => {
  it("fetches single post by slug", async () => {
    const chain = mockQuery(samplePost);
    const returnChain = chain.select as ReturnType<typeof vi.fn>;

    const post = await getPostBySlug("test-post-abc123");

    expect(mockFrom).toHaveBeenCalledWith("posts");
    expect(returnChain).toHaveBeenCalledWith("slug", "test-post-abc123");
    expect(chain.single).toHaveBeenCalled();
    expect(post).toEqual(samplePost);
  });

  it("throws on not found", async () => {
    mockQuery(null, { message: "Not found" });

    await expect(getPostBySlug("nonexistent")).rejects.toThrow();
  });
});

describe("createPost", () => {
  it("creates post with authenticated user", async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    const chain = mockQuery(samplePost);
    const returnChain = chain.select as ReturnType<typeof vi.fn>;

    const result = await createPost({
      title: "테스트 글",
      content: "<p>본문입니다</p>",
      type: "diary",
      tags: ["일상"],
    });

    expect(returnChain).toHaveBeenCalled();
    expect(result).toEqual(samplePost);
  });

  it("throws when not authenticated", async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: null },
    });

    await expect(
      createPost({
        title: "테스트",
        content: "내용",
        type: "note",
      })
    ).rejects.toThrow("로그인이 필요합니다");
  });
});

describe("updatePost", () => {
  it("updates post fields", async () => {
    const updated = { ...samplePost, title: "수정된 제목" };
    const chain = mockQuery(updated);
    const returnChain = chain.select as ReturnType<typeof vi.fn>;

    const result = await updatePost("uuid-1", { title: "수정된 제목" });

    expect(returnChain).toHaveBeenCalledWith({ title: "수정된 제목" });
    expect(returnChain).toHaveBeenCalledWith("id", "uuid-1");
    expect(result).toEqual(updated);
  });
});

describe("deletePost", () => {
  it("deletes post by id", async () => {
    const chain = mockQuery(null);
    const returnChain = chain.select as ReturnType<typeof vi.fn>;

    await deletePost("uuid-1");

    expect(mockFrom).toHaveBeenCalledWith("posts");
    expect(returnChain).toHaveBeenCalledWith("id", "uuid-1");
  });
});

describe("searchPosts", () => {
  it("searches by title and content", async () => {
    const chain = mockQuery([samplePost]);
    const returnChain = chain.select as ReturnType<typeof vi.fn>;

    const results = await searchPosts("테스트");

    expect(returnChain).toHaveBeenCalledWith(
      "title.ilike.%테스트%,content.ilike.%테스트%"
    );
    expect(results).toEqual([samplePost]);
  });
});
