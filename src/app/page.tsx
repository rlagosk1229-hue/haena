import { Suspense } from "react";
import { getPostsServer, searchPostsServer } from "@/lib/posts-server";
import { PostGrid } from "@/components/posts/post-grid";
import { TypeFilter } from "@/components/posts/type-filter";
import { SearchBar } from "@/components/posts/search-bar";
import { BlurFade } from "@/components/ui/blur-fade";
import { TextAnimate } from "@/components/ui/text-animate";
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
        <BlurFade delay={0.1}>
          <TextAnimate
            as="h1"
            animation="blurInUp"
            by="word"
            once
            className="font-serif text-5xl md:text-6xl font-bold mb-4 tracking-tight"
          >
            해나의 일기장
          </TextAnimate>
        </BlurFade>
        <BlurFade delay={0.3}>
          <p className="text-muted-foreground text-lg">나의 생각과 일상을 기록하는 공간</p>
        </BlurFade>
      </section>

      {/* Filter + Search */}
      <BlurFade delay={0.4}>
        <Suspense>
          <div className="flex items-center justify-between">
            <TypeFilter />
            <SearchBar />
          </div>
        </Suspense>
      </BlurFade>

      {/* Posts Grid */}
      <BlurFade delay={0.5}>
        <PostGrid posts={posts} />
      </BlurFade>
    </div>
  );
}
