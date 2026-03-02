import { createClient } from "@/lib/supabase/server";
import { PostEditor } from "@/components/editor/post-editor";
import { notFound, redirect } from "next/navigation";
import type { Post } from "@/types/database";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPage({ params }: EditPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: post, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !post) notFound();
  if ((post as Post).user_id !== user.id) redirect("/");

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-serif text-3xl font-bold mb-8">글 수정</h1>
      <PostEditor post={post as Post} />
    </div>
  );
}
