"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deletePost } from "@/lib/posts";
import { toast } from "sonner";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";

interface PostActionsProps {
  postId: string;
  slug: string;
}

export function PostActions({ postId }: PostActionsProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      await deletePost(postId);
      toast.success("글이 삭제되었습니다");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("삭제에 실패했습니다");
    }
  };

  return (
    <div className="flex gap-2 mt-6">
      <Button asChild variant="outline" size="sm" className="gap-1.5">
        <Link href={`/edit/${postId}`}>
          <Pencil size={14} />
          수정
        </Link>
      </Button>
      <Button
        variant="destructive"
        size="sm"
        className="gap-1.5"
        onClick={handleDelete}
      >
        <Trash2 size={14} />
        삭제
      </Button>
    </div>
  );
}
