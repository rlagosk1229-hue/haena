export type PostType = "diary" | "note";

export interface Post {
  id: string;
  title: string;
  content: string;
  type: PostType;
  tags: string[];
  is_public: boolean;
  slug: string;
  cover_image: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface PostInsert {
  title: string;
  content: string;
  type: PostType;
  tags?: string[];
  is_public?: boolean;
  slug: string;
  cover_image?: string | null;
}

export interface PostUpdate {
  title?: string;
  content?: string;
  type?: PostType;
  tags?: string[];
  is_public?: boolean;
  slug?: string;
  cover_image?: string | null;
}
