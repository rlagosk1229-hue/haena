"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { Post } from "@/types/database";

interface PostCardProps {
  post: Post;
  index: number;
  featured?: boolean;
}

export function PostCard({ post, index, featured = false }: PostCardProps) {
  const plainText = post.content
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
      className={featured ? "md:col-span-2" : ""}
    >
      <Link href={`/posts/${post.slug}`} className="block h-full group">
        <article className="glass rounded-2xl sm:rounded-[2rem] p-3 sm:p-5 md:p-7 h-full flex flex-col transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.02)] cursor-pointer bg-white/40 dark:bg-black/10">
          {post.cover_image && (
            <div className="mb-3 sm:mb-6 rounded-xl sm:rounded-[1.5rem] overflow-hidden bg-muted/30">
              <img
                src={post.cover_image}
                alt={post.title}
                className="w-full h-28 sm:h-56 md:h-64 object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          )}

          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-4">
              <Badge
                variant="secondary"
                className="rounded-full px-2 sm:px-3 py-0.5 text-[10px] sm:text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 transition-colors"
              >
                {post.type === "diary" ? "일기" : "노트"}
              </Badge>
              <span className="text-[10px] sm:text-xs text-muted-foreground/70 font-medium">
                {format(new Date(post.created_at), "M월 d일", {
                  locale: ko,
                })}
              </span>
            </div>

            <h2
              className={`font-serif font-bold mb-1.5 sm:mb-3 text-foreground group-hover:text-primary transition-colors duration-300 leading-snug ${featured ? "text-lg sm:text-3xl md:text-4xl" : "text-sm sm:text-xl md:text-2xl"
                }`}
            >
              {post.title}
            </h2>

            <p className="text-muted-foreground/80 text-xs sm:text-sm md:text-base leading-relaxed line-clamp-2 sm:line-clamp-3 mb-3 sm:mb-6 flex-1">
              {plainText.slice(0, featured ? 250 : 120)}
              {plainText.length > (featured ? 250 : 120) ? "..." : ""}
            </p>

            {post.tags.length > 0 && (
              <div className="hidden sm:flex flex-wrap gap-2 mt-auto">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-secondary/50 text-secondary-foreground/70 border border-border/50"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </article>
      </Link>
    </motion.div>
  );
}
