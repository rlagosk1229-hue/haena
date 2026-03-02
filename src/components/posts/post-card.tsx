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
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className={featured ? "md:col-span-2" : ""}
    >
      <Link href={`/posts/${post.slug}`}>
        <article className="glass rounded-2xl p-6 h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group cursor-pointer">
          {post.cover_image && (
            <div className="mb-4 rounded-xl overflow-hidden">
              <img
                src={post.cover_image}
                alt={post.title}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}

          <div className="flex items-center gap-2 mb-3">
            <Badge
              variant="secondary"
              className="text-xs font-medium"
            >
              {post.type === "diary" ? "일기" : "노트"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {format(new Date(post.created_at), "M월 d일, yyyy", {
                locale: ko,
              })}
            </span>
          </div>

          <h2
            className={`font-serif font-bold mb-2 group-hover:text-primary transition-colors ${
              featured ? "text-2xl" : "text-lg"
            }`}
          >
            {post.title}
          </h2>

          <p className="text-muted-foreground text-sm line-clamp-3">
            {plainText.slice(0, featured ? 200 : 120)}
            {plainText.length > (featured ? 200 : 120) ? "..." : ""}
          </p>

          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-muted-foreground/70"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </article>
      </Link>
    </motion.div>
  );
}
