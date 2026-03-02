import { Suspense } from "react";
import { getPostsServer, searchPostsServer } from "@/lib/posts-server";
import { PostGrid } from "@/components/posts/post-grid";
import { TypeFilter } from "@/components/posts/type-filter";
import { SearchBar } from "@/components/posts/search-bar";
import type { PostType } from "@/types/database";

interface HomeProps {
  searchParams: Promise<{ type?: string; q?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const type = params.type as PostType | undefined;

  let posts;
  if (params.q) {
    posts = await searchPostsServer(params.q);
  } else {
    posts = await getPostsServer(type);
  }

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="text-center py-16">
        <h1 className="font-serif text-5xl md:text-6xl font-bold mb-4 tracking-tight">
          My Journal
        </h1>
        <p className="text-muted-foreground text-lg">생각을 기록하는 공간</p>
      </section>

      {/* Filter + Search */}
      <Suspense>
        <div className="flex items-center justify-between">
          <TypeFilter />
          <SearchBar />
        </div>
      </Suspense>

      {/* Posts Grid */}
      <PostGrid posts={posts} />
    </div>
  );
}
