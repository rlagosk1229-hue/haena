"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagInput } from "./tag-input";
import { ImageUpload } from "./image-upload";
import { createPost, updatePost } from "@/lib/posts";
import type { Post, PostType } from "@/types/database";
import { toast } from "sonner";
import { Save, Eye, EyeOff } from "lucide-react";

interface PostEditorProps {
  post?: Post;
}

export function PostEditor({ post }: PostEditorProps) {
  const [title, setTitle] = useState(post?.title || "");
  const [content, setContent] = useState(post?.content || "");
  const [type, setType] = useState<PostType>(post?.type || "diary");
  const [tags, setTags] = useState<string[]>(post?.tags || []);
  const [isPublic, setIsPublic] = useState(post?.is_public ?? true);
  const [coverImage, setCoverImage] = useState<string | null>(
    post?.cover_image || null
  );
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("제목을 입력해주세요");
      return;
    }
    if (!content.trim()) {
      toast.error("내용을 입력해주세요");
      return;
    }

    setSaving(true);
    try {
      if (post) {
        await updatePost(post.id, {
          title,
          content,
          type,
          tags,
          is_public: isPublic,
          cover_image: coverImage,
        });
        toast.success("수정 완료!");
        router.push(`/posts/${post.slug}`);
      } else {
        const newPost = await createPost({
          title,
          content,
          type,
          tags,
          is_public: isPublic,
          cover_image: coverImage,
        });
        toast.success("발행 완료!");
        router.push(`/posts/${newPost.slug}`);
      }
      router.refresh();
    } catch {
      toast.error(post ? "수정에 실패했습니다" : "발행에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Type selector + Title */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="space-y-2">
          <Label>유형</Label>
          <div className="flex gap-1.5">
            {(["diary", "note"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  type === t
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "glass hover:bg-secondary"
                }`}
              >
                {t === "diary" ? "일기" : "노트"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <Label htmlFor="title">제목</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            className="text-lg font-serif h-11"
          />
        </div>
      </div>

      {/* Cover Image */}
      {coverImage && (
        <div className="relative rounded-xl overflow-hidden">
          <img
            src={coverImage}
            alt="Cover"
            className="w-full h-48 object-cover"
          />
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={() => setCoverImage(null)}
          >
            제거
          </Button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <ImageUpload
          onUpload={(url) => {
            if (!coverImage) {
              setCoverImage(url);
            } else {
              setContent(
                content + `<p><img src="${url}" alt="image" /></p>`
              );
            }
          }}
        />
      </div>

      {/* Content Editor - Simple textarea with nice styling */}
      <div className="space-y-2">
        <Label>내용</Label>
        <div className="glass rounded-2xl overflow-hidden">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="여기에 글을 작성하세요..."
            className="w-full min-h-[400px] border-0 bg-transparent shadow-none focus:outline-none resize-none p-6 text-base leading-relaxed font-sans"
          />
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>태그</Label>
        <TagInput tags={tags} onChange={setTags} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => setIsPublic(!isPublic)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {isPublic ? <Eye size={16} /> : <EyeOff size={16} />}
          {isPublic ? "공개" : "비공개"}
        </button>
        <Button
          onClick={handleSubmit}
          disabled={saving}
          className="gap-1.5 px-6"
        >
          <Save size={16} />
          {saving ? "저장 중..." : post ? "수정" : "발행"}
        </Button>
      </div>
    </div>
  );
}
