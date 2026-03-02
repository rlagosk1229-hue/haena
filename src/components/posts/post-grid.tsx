import type { Post } from "@/types/database";
import { PostCard } from "./post-card";

interface PostGridProps {
  posts: Post[];
}

export function PostGrid({ posts }: PostGridProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="text-muted-foreground text-lg font-serif">
          아직 글이 없습니다
        </p>
        <p className="text-muted-foreground/60 text-sm mt-2">
          첫 번째 글을 작성해보세요
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
      {posts.map((post, index) => (
        <PostCard
          key={post.id}
          post={post}
          index={index}
          featured={index === 0}
        />
      ))}
    </div>
  );
}
