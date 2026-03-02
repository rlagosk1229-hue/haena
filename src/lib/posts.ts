import { createClient } from "@/lib/supabase/client";
import { generateSlug } from "@/lib/slug";
import type { Post, PostType, PostUpdate } from "@/types/database";

function getClient() {
  return createClient();
}

export async function getPosts(type?: PostType): Promise<Post[]> {
  const supabase = getClient();
  let query = supabase
    .from("posts")
    .select("*")
    .eq("is_public", true);

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data as Post[];
}

export async function getPostBySlug(slug: string): Promise<Post> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) throw error;
  return data as Post;
}

export async function createPost(input: {
  title: string;
  content: string;
  type: PostType;
  tags?: string[];
  is_public?: boolean;
  cover_image?: string | null;
}): Promise<Post> {
  const supabase = getClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다");

  const slug = generateSlug(input.title);

  const { data, error } = await supabase
    .from("posts")
    .insert({
      ...input,
      slug,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Post;
}

export async function updatePost(id: string, updates: PostUpdate): Promise<Post> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("posts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Post;
}

export async function deletePost(id: string): Promise<void> {
  const supabase = getClient();
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw error;
}

export async function searchPosts(query: string): Promise<Post[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("is_public", true)
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Post[];
}
