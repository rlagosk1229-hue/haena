import { createClient } from "@/lib/supabase/server";
import type { Post, PostType } from "@/types/database";

export async function getPostsServer(type?: PostType) {
  const supabase = await createClient();
  let query = supabase
    .from("posts")
    .select("*")
    .eq("is_public", true);

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) return [] as Post[];
  return (data ?? []) as Post[];
}

export async function getPostBySlugServer(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) throw error;
  return data as Post;
}

export async function searchPostsServer(query: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("is_public", true)
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Post[];
}
