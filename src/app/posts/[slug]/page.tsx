import { getPostBySlugServer } from "@/lib/posts-server";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { BlurFade } from "@/components/ui/blur-fade";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { notFound } from "next/navigation";
import { PostActions } from "@/components/posts/post-actions";
import { SafeHtml } from "@/components/posts/safe-html";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  let post;

  try {
    post = await getPostBySlugServer(slug);
  } catch {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === post.user_id;

  return (
    <>
      <ScrollProgress />
      <article className="max-w-3xl mx-auto">
        <BlurFade delay={0.1}>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            돌아가기
          </Link>
        </BlurFade>

        <BlurFade delay={0.2}>
          <header className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary">
                {post.type === "diary" ? "일기" : "노트"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {format(new Date(post.created_at), "yyyy년 M월 d일", { locale: ko })}
              </span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold mb-4 leading-tight">
              {post.title}
            </h1>
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="text-sm text-muted-foreground">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            {isOwner && <PostActions postId={post.id} slug={post.slug} />}
          </header>
        </BlurFade>

        {post.cover_image && (
          <BlurFade delay={0.3}>
            <div className="mb-10 rounded-2xl overflow-hidden">
              <img
                src={post.cover_image}
                alt={post.title}
                className="w-full object-cover"
              />
            </div>
          </BlurFade>
        )}

        <BlurFade delay={0.4}>
          <SafeHtml html={post.content} className="prose-custom" />
        </BlurFade>
      </article>
    </>
  );
}
