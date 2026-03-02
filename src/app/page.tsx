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
      <section className="text-center py-20 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/20 rounded-full blur-[3rem] -z-10 dark:bg-primary/10" />
        <BlurFade delay={0.1}>
          <TextAnimate
            as="h1"
            animation="blurInUp"
            by="word"
            once
            className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight text-foreground"
          >
            해나의 일기장
          </TextAnimate>
        </BlurFade>
        <BlurFade delay={0.3}>
          <p className="text-muted-foreground/80 text-base md:text-lg font-medium tracking-wide">
            나의 생각과 작은 일상들을 조용히 기록하는 공간
          </p>
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
