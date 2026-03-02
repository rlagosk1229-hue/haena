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

// 습관 트래커
export interface Habit {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  date: string;
  completed: boolean;
  created_at: string;
}

// 달력/일정
export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  memo: string;
  color: string;
  created_at: string;
}

// 북마크
export interface Bookmark {
  id: string;
  user_id: string;
  url: string;
  title: string;
  description: string;
  category: string;
  favicon_url: string | null;
  created_at: string;
}
