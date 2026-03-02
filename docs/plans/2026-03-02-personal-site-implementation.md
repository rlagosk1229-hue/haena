# Personal Site Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 일기와 노트를 올릴 수 있는 미니멀하고 예쁜 개인 사이트를 Next.js + Supabase로 구축한다.

**Architecture:** Next.js App Router 프론트엔드에서 Supabase SDK를 직접 호출하여 CRUD를 수행한다. 인증은 Supabase Auth(이메일/비밀번호), DB는 PostgreSQL + RLS, 파일은 Supabase Storage를 사용한다. Vercel에 배포한다.

**Tech Stack:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Supabase, next-themes

---

## Task 1: 프로젝트 스캐폴딩

**Files:**
- Create: `personal-site/` (Next.js 프로젝트 루트)
- Create: `personal-site/.env.local`

**Step 1: Next.js 프로젝트 생성**

```bash
cd "/Users/mrbaeksang/내 드라이브/IdeaProjects/99_unused"
npx create-next-app@latest personal-site --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Expected: `personal-site/` 디렉토리에 Next.js 프로젝트 생성됨

**Step 2: 의존성 설치**

```bash
cd personal-site
npm install @supabase/supabase-js @supabase/ssr next-themes framer-motion react-markdown remark-gfm rehype-highlight rehype-raw slugify date-fns
npm install -D @types/slugify
```

**Step 3: shadcn/ui 초기화 및 기본 컴포넌트 설치**

```bash
npx shadcn@latest init -d
npx shadcn@latest add button input textarea label badge dialog dropdown-menu separator tabs toast sonner
```

**Step 4: .env.local 생성**

`.env.local` 파일 생성 (값은 Supabase 프로젝트 생성 후 입력):
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**Step 5: 개발 서버 동작 확인**

```bash
npm run dev
```

Expected: `http://localhost:3000`에서 Next.js 기본 페이지 표시

**Step 6: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold Next.js project with dependencies"
```

---

## Task 2: Supabase 클라이언트 설정 & 타입 정의

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/middleware.ts`
- Create: `src/types/database.ts`
- Modify: `src/middleware.ts`

**Step 1: Supabase 브라우저 클라이언트 생성**

`src/lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Step 2: Supabase 서버 클라이언트 생성**

`src/lib/supabase/server.ts`:
```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component에서는 무시
          }
        },
      },
    }
  );
}
```

**Step 3: 미들웨어용 Supabase 클라이언트**

`src/lib/supabase/middleware.ts`:
```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 로그인 필요 페이지 보호
  const protectedPaths = ["/write", "/edit"];
  const isProtected = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

**Step 4: Next.js 미들웨어 설정**

`src/middleware.ts`:
```typescript
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

**Step 5: DB 타입 정의**

`src/types/database.ts`:
```typescript
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
  updated_at?: string;
}
```

**Step 6: Commit**

```bash
git add .
git commit -m "feat: add Supabase client setup, middleware, and types"
```

---

## Task 3: 글로벌 레이아웃 & 테마 설정

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Create: `src/components/layout/header.tsx`
- Create: `src/components/layout/theme-toggle.tsx`
- Create: `src/components/providers.tsx`

**Step 1: globals.css - 디자인 토큰 설정**

`src/app/globals.css`를 완전히 교체:
```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: #FAFAF9;
  --color-foreground: #1A1A1A;
  --color-card: rgba(255, 255, 255, 0.7);
  --color-card-foreground: #1A1A1A;
  --color-primary: #6366F1;
  --color-primary-foreground: #FFFFFF;
  --color-secondary: #F4F4F5;
  --color-secondary-foreground: #18181B;
  --color-muted: #F4F4F5;
  --color-muted-foreground: #A1A1AA;
  --color-accent: #F4F4F5;
  --color-accent-foreground: #18181B;
  --color-border: #E4E4E7;
  --color-ring: #6366F1;
  --color-input: #E4E4E7;
  --radius: 0.75rem;

  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-serif: "Playfair Display", ui-serif, Georgia, serif;
}

@layer base {
  .dark {
    --color-background: #0A0A0B;
    --color-foreground: #FAFAFA;
    --color-card: rgba(255, 255, 255, 0.05);
    --color-card-foreground: #FAFAFA;
    --color-primary: #818CF8;
    --color-primary-foreground: #FFFFFF;
    --color-secondary: #27272A;
    --color-secondary-foreground: #FAFAFA;
    --color-muted: #27272A;
    --color-muted-foreground: #A1A1AA;
    --color-accent: #27272A;
    --color-accent-foreground: #FAFAFA;
    --color-border: #27272A;
    --color-ring: #818CF8;
    --color-input: #27272A;
  }
}

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground antialiased;
  }
}

/* Glassmorphism utility */
.glass {
  background: var(--color-card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--color-border);
}

/* Markdown content styling */
.prose-custom h1,
.prose-custom h2,
.prose-custom h3 {
  font-family: var(--font-serif);
  font-weight: 700;
}

.prose-custom pre {
  border-radius: var(--radius);
  overflow-x: auto;
}

.prose-custom img {
  border-radius: var(--radius);
}
```

**Step 2: ThemeProvider & Providers 컴포넌트**

`src/components/providers.tsx`:
```tsx
"use client";

import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}
```

**Step 3: 테마 토글 버튼**

`src/components/layout/theme-toggle.tsx`:
```tsx
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <Button variant="ghost" size="icon" className="w-9 h-9" />;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="w-9 h-9"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
      )}
    </Button>
  );
}
```

**Step 4: 헤더 컴포넌트**

`src/components/layout/header.tsx`:
```tsx
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { HeaderAuth } from "./header-auth";

export async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl font-bold tracking-tight">
          My Journal
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <HeaderAuth user={user} />
        </div>
      </div>
    </header>
  );
}
```

**Step 5: 헤더 인증 버튼 (Client Component)**

`src/components/layout/header-auth.tsx`:
```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function HeaderAuth({ user }: { user: User | null }) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/write">글쓰기</Link>
        </Button>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          로그아웃
        </Button>
      </div>
    );
  }

  return (
    <Button asChild variant="ghost" size="sm">
      <Link href="/login">로그인</Link>
    </Button>
  );
}
```

**Step 6: 루트 레이아웃 수정**

`src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "My Journal",
  description: "생각을 기록하는 공간",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans`}>
        <Providers>
          <Header />
          <main className="max-w-5xl mx-auto px-6 py-8">
            {children}
          </main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
```

**Step 7: 개발 서버에서 레이아웃 확인**

```bash
npm run dev
```

Expected: 헤더에 "My Journal" 로고 + 테마 토글 + 로그인 버튼 표시. 다크/라이트 전환 동작 확인.

**Step 8: Commit**

```bash
git add .
git commit -m "feat: add global layout with header, theme toggle, glassmorphism"
```

---

## Task 4: Supabase DB 스키마 & RLS 설정 (수동)

**Files:**
- Create: `supabase/schema.sql` (참고용)

**Step 1: SQL 스키마 파일 생성 (참고용)**

`supabase/schema.sql`:
```sql
-- Supabase Dashboard > SQL Editor에서 실행

-- posts 테이블
CREATE TABLE posts (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('diary', 'note')),
  tags        TEXT[] DEFAULT '{}',
  is_public   BOOLEAN DEFAULT true,
  slug        TEXT UNIQUE NOT NULL,
  cover_image TEXT,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_posts_type ON posts(type);
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_user_id ON posts(user_id);

-- RLS 활성화
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policy: 공개 글은 누구나 읽기 가능
CREATE POLICY "Public posts are viewable by everyone"
  ON posts FOR SELECT
  USING (is_public = true);

-- Policy: 본인 글은 비공개여도 읽기 가능
CREATE POLICY "Users can view their own posts"
  ON posts FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: 인증된 사용자만 글 작성
CREATE POLICY "Authenticated users can insert posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: 본인 글만 수정
CREATE POLICY "Users can update their own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: 본인 글만 삭제
CREATE POLICY "Users can delete their own posts"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Storage 버킷 (Supabase Dashboard > Storage에서 생성)
-- 이름: post-images
-- Public: true
```

**Step 2: Supabase 프로젝트 설정 안내**

사용자에게 안내:
1. https://supabase.com 에서 프로젝트 생성
2. SQL Editor에서 위 스키마 실행
3. Storage에서 `post-images` 버킷 생성 (public)
4. Settings > API에서 URL과 anon key를 `.env.local`에 입력
5. Authentication > Providers에서 Email 활성화

**Step 3: Commit**

```bash
git add supabase/
git commit -m "docs: add Supabase schema SQL for reference"
```

---

## Task 5: Supabase CRUD 유틸리티 함수

**Files:**
- Create: `src/lib/posts.ts`
- Create: `src/lib/storage.ts`

**Step 1: Posts CRUD 함수**

`src/lib/posts.ts`:
```typescript
import { createClient } from "@/lib/supabase/client";
import type { Post, PostInsert, PostUpdate, PostType } from "@/types/database";
import slugify from "slugify";

function getClient() {
  return createClient();
}

export async function getPosts(type?: PostType) {
  const supabase = getClient();
  let query = supabase
    .from("posts")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Post[];
}

export async function getPostBySlug(slug: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) throw error;
  return data as Post;
}

export async function createPost(post: PostInsert) {
  const supabase = getClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다");

  const slug = slugify(post.title, { lower: true, strict: true }) +
    "-" + Date.now().toString(36);

  const { data, error } = await supabase
    .from("posts")
    .insert({ ...post, slug, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data as Post;
}

export async function updatePost(id: string, updates: PostUpdate) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("posts")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Post;
}

export async function deletePost(id: string) {
  const supabase = getClient();
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw error;
}

export async function searchPosts(query: string) {
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
```

**Step 2: Storage 유틸리티**

`src/lib/storage.ts`:
```typescript
import { createClient } from "@/lib/supabase/client";

export async function uploadImage(file: File): Promise<string> {
  const supabase = createClient();
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

  const { error } = await supabase.storage
    .from("post-images")
    .upload(fileName, file);

  if (error) throw error;

  const { data } = supabase.storage
    .from("post-images")
    .getPublicUrl(fileName);

  return data.publicUrl;
}
```

**Step 3: 서버 컴포넌트용 Posts 함수**

`src/lib/posts-server.ts`:
```typescript
import { createClient } from "@/lib/supabase/server";
import type { Post, PostType } from "@/types/database";

export async function getPostsServer(type?: PostType) {
  const supabase = await createClient();
  let query = supabase
    .from("posts")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Post[];
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
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add Supabase CRUD utilities and storage helper"
```

---

## Task 6: 로그인 페이지

**Files:**
- Create: `src/app/login/page.tsx`

**Step 1: 로그인 페이지 구현**

`src/app/login/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("로그인 성공!");
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="glass rounded-2xl p-8 w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="font-serif text-2xl font-bold">로그인</h1>
          <p className="text-muted-foreground text-sm mt-1">
            글을 작성하려면 로그인하세요
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hello@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </Button>
        </form>
      </div>
    </div>
  );
}
```

**Step 2: 확인**

```bash
npm run dev
```

Expected: `/login` 페이지에 유리 효과 카드 안에 로그인 폼 표시

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add login page with glassmorphism card"
```

---

## Task 7: 홈 페이지 & 카드 컴포넌트 (Bento Grid)

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/components/posts/post-card.tsx`
- Create: `src/components/posts/post-grid.tsx`
- Create: `src/components/posts/type-filter.tsx`

**Step 1: PostCard 컴포넌트**

`src/components/posts/post-card.tsx`:
```tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className={featured ? "md:col-span-2 md:row-span-2" : ""}
    >
      <Link href={`/posts/${post.slug}`}>
        <article className="glass rounded-2xl p-6 h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group">
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
            <Badge variant="secondary" className="text-xs">
              {post.type === "diary" ? "일기" : "노트"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {format(new Date(post.created_at), "M월 d일, yyyy", { locale: ko })}
            </span>
          </div>
          <h2 className={`font-serif font-bold mb-2 group-hover:text-primary transition-colors ${
            featured ? "text-2xl" : "text-lg"
          }`}>
            {post.title}
          </h2>
          <p className="text-muted-foreground text-sm line-clamp-3">
            {post.content.replace(/[#*`>\-\[\]()!]/g, "").slice(0, 150)}...
          </p>
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {post.tags.map((tag) => (
                <span key={tag} className="text-xs text-muted-foreground">
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
```

**Step 2: PostGrid 컴포넌트 (Bento Grid)**

`src/components/posts/post-grid.tsx`:
```tsx
import type { Post } from "@/types/database";
import { PostCard } from "./post-card";

interface PostGridProps {
  posts: Post[];
}

export function PostGrid({ posts }: PostGridProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-lg">아직 글이 없습니다</p>
        <p className="text-muted-foreground text-sm mt-1">첫 번째 글을 작성해보세요!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {posts.map((post, index) => (
        <PostCard
          key={post.id}
          post={post}
          index={index}
          featured={index === 0}
        />
      ))}
    </div>
  );
}
```

**Step 3: TypeFilter 컴포넌트**

`src/components/posts/type-filter.tsx`:
```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";

const filters = [
  { label: "전체", value: "" },
  { label: "일기", value: "diary" },
  { label: "노트", value: "note" },
] as const;

export function TypeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentType = searchParams.get("type") || "";

  const handleFilter = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("type", value);
    } else {
      params.delete("type");
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="flex gap-2">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => handleFilter(filter.value)}
          className={`px-4 py-1.5 rounded-full text-sm transition-all ${
            currentType === filter.value
              ? "bg-primary text-primary-foreground"
              : "glass hover:bg-secondary"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
```

**Step 4: 홈 페이지**

`src/app/page.tsx`:
```tsx
import { getPostsServer } from "@/lib/posts-server";
import { PostGrid } from "@/components/posts/post-grid";
import { TypeFilter } from "@/components/posts/type-filter";
import type { PostType } from "@/types/database";

interface HomeProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const type = params.type as PostType | undefined;
  const posts = await getPostsServer(type);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="text-center py-12">
        <h1 className="font-serif text-4xl md:text-5xl font-bold mb-3">
          My Journal
        </h1>
        <p className="text-muted-foreground text-lg">
          생각을 기록하는 공간
        </p>
      </section>

      {/* Filter */}
      <div className="flex items-center justify-between">
        <TypeFilter />
      </div>

      {/* Posts Grid */}
      <PostGrid posts={posts} />
    </div>
  );
}
```

**Step 5: 확인**

```bash
npm run dev
```

Expected: 홈에서 Hero 섹션 + 필터 탭 + Bento Grid 카드 목록 표시 (글이 없으면 빈 상태 메시지)

**Step 6: Commit**

```bash
git add .
git commit -m "feat: add home page with Bento Grid and type filter"
```

---

## Task 8: 글 상세 페이지

**Files:**
- Create: `src/app/posts/[slug]/page.tsx`
- Create: `src/components/posts/post-actions.tsx`

**Step 1: 글 상세 페이지**

`src/app/posts/[slug]/page.tsx`:
```tsx
import { getPostBySlugServer } from "@/lib/posts-server";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { PostActions } from "@/components/posts/post-actions";

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
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user?.id === post.user_id;

  return (
    <article className="max-w-3xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="secondary">
            {post.type === "diary" ? "일기" : "노트"}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {format(new Date(post.created_at), "yyyy년 M월 d일", { locale: ko })}
          </span>
        </div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-4">
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

      {/* Cover Image */}
      {post.cover_image && (
        <div className="mb-8 rounded-2xl overflow-hidden">
          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="prose-custom prose prose-neutral dark:prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
        >
          {post.content}
        </ReactMarkdown>
      </div>
    </article>
  );
}
```

**Step 2: PostActions 컴포넌트 (수정/삭제 버튼)**

`src/components/posts/post-actions.tsx`:
```tsx
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deletePost } from "@/lib/posts";
import { toast } from "sonner";
import Link from "next/link";

interface PostActionsProps {
  postId: string;
  slug: string;
}

export function PostActions({ postId, slug }: PostActionsProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      await deletePost(postId);
      toast.success("글이 삭제되었습니다");
      router.push("/");
      router.refresh();
    } catch (error) {
      toast.error("삭제에 실패했습니다");
    }
  };

  return (
    <div className="flex gap-2 mt-4">
      <Button asChild variant="outline" size="sm">
        <Link href={`/edit/${slug}`}>수정</Link>
      </Button>
      <Button variant="destructive" size="sm" onClick={handleDelete}>
        삭제
      </Button>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add post detail page with markdown rendering and actions"
```

---

## Task 9: 글 작성 페이지 (마크다운 에디터)

**Files:**
- Create: `src/app/write/page.tsx`
- Create: `src/components/editor/post-editor.tsx`
- Create: `src/components/editor/markdown-preview.tsx`
- Create: `src/components/editor/tag-input.tsx`
- Create: `src/components/editor/image-upload.tsx`

**Step 1: TagInput 컴포넌트**

`src/components/editor/tag-input.tsx`:
```tsx
"use client";

import { useState, KeyboardEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export function TagInput({ tags, onChange }: TagInputProps) {
  const [input, setInput] = useState("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = input.trim();
      if (tag && !tags.includes(tag)) {
        onChange([...tags, tag]);
      }
      setInput("");
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((t) => t !== tagToRemove));
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 glass rounded-xl min-h-[42px]">
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
          onClick={() => removeTag(tag)}
        >
          #{tag} &times;
        </Badge>
      ))}
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="태그 입력 후 Enter"
        className="border-0 bg-transparent shadow-none focus-visible:ring-0 flex-1 min-w-[120px] h-auto p-0"
      />
    </div>
  );
}
```

**Step 2: ImageUpload 컴포넌트**

`src/components/editor/image-upload.tsx`:
```tsx
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { uploadImage } from "@/lib/storage";
import { toast } from "sonner";

interface ImageUploadProps {
  onUpload: (url: string) => void;
}

export function ImageUpload({ onUpload }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImage(file);
      onUpload(url);
      toast.success("이미지 업로드 완료");
    } catch {
      toast.error("이미지 업로드 실패");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? "업로드 중..." : "이미지 삽입"}
      </Button>
    </div>
  );
}
```

**Step 3: MarkdownPreview 컴포넌트**

`src/components/editor/markdown-preview.tsx`:
```tsx
"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

interface MarkdownPreviewProps {
  content: string;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  if (!content) {
    return (
      <p className="text-muted-foreground text-sm">미리보기가 여기에 표시됩니다...</p>
    );
  }

  return (
    <div className="prose-custom prose prose-neutral dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
```

**Step 4: PostEditor 컴포넌트**

`src/components/editor/post-editor.tsx`:
```tsx
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "./tag-input";
import { ImageUpload } from "./image-upload";
import { MarkdownPreview } from "./markdown-preview";
import { createPost, updatePost } from "@/lib/posts";
import type { Post, PostType } from "@/types/database";
import { toast } from "sonner";

interface PostEditorProps {
  post?: Post;
}

export function PostEditor({ post }: PostEditorProps) {
  const [title, setTitle] = useState(post?.title || "");
  const [content, setContent] = useState(post?.content || "");
  const [type, setType] = useState<PostType>(post?.type || "diary");
  const [tags, setTags] = useState<string[]>(post?.tags || []);
  const [isPublic, setIsPublic] = useState(post?.is_public ?? true);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  const handleImageUpload = (url: string) => {
    const markdown = `![image](${url})\n`;
    const textarea = textareaRef.current;
    if (textarea) {
      const pos = textarea.selectionStart;
      const newContent = content.slice(0, pos) + markdown + content.slice(pos);
      setContent(newContent);
    } else {
      setContent(content + "\n" + markdown);
    }
  };

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
        await updatePost(post.id, { title, content, type, tags, is_public: isPublic });
        toast.success("수정 완료!");
        router.push(`/posts/${post.slug}`);
      } else {
        const newPost = await createPost({ title, content, type, tags, is_public: isPublic, slug: "" });
        toast.success("발행 완료!");
        router.push(`/posts/${newPost.slug}`);
      }
      router.refresh();
    } catch (error) {
      toast.error(post ? "수정에 실패했습니다" : "발행에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Type selector + Title */}
      <div className="flex gap-3 items-end">
        <div className="space-y-2">
          <Label>유형</Label>
          <div className="flex gap-1">
            {(["diary", "note"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  type === t
                    ? "bg-primary text-primary-foreground"
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
            className="text-lg font-serif"
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <ImageUpload onUpload={handleImageUpload} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? "편집" : "미리보기"}
          </Button>
        </div>
      </div>

      {/* Editor / Preview */}
      <div className="glass rounded-2xl overflow-hidden min-h-[400px]">
        {showPreview ? (
          <div className="p-6">
            <MarkdownPreview content={content} />
          </div>
        ) : (
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="마크다운으로 작성하세요..."
            className="min-h-[400px] border-0 bg-transparent shadow-none focus-visible:ring-0 resize-none p-6 text-base leading-relaxed"
          />
        )}
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>태그</Label>
        <TagInput tags={tags} onChange={setTags} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={!isPublic}
            onChange={(e) => setIsPublic(!e.target.checked)}
            className="rounded"
          />
          비공개
        </label>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? "저장 중..." : post ? "수정" : "발행"}
        </Button>
      </div>
    </div>
  );
}
```

**Step 5: 글 작성 페이지**

`src/app/write/page.tsx`:
```tsx
import { PostEditor } from "@/components/editor/post-editor";

export default function WritePage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-serif text-3xl font-bold mb-8">새 글 작성</h1>
      <PostEditor />
    </div>
  );
}
```

**Step 6: Commit**

```bash
git add .
git commit -m "feat: add post editor with markdown preview, tags, image upload"
```

---

## Task 10: 글 수정 페이지

**Files:**
- Create: `src/app/edit/[slug]/page.tsx`

**Step 1: 수정 페이지**

`src/app/edit/[slug]/page.tsx`:
```tsx
import { getPostBySlugServer } from "@/lib/posts-server";
import { createClient } from "@/lib/supabase/server";
import { PostEditor } from "@/components/editor/post-editor";
import { notFound, redirect } from "next/navigation";

interface EditPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditPage({ params }: EditPageProps) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let post;
  try {
    post = await getPostBySlugServer(slug);
  } catch {
    notFound();
  }

  if (post.user_id !== user.id) redirect("/");

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-serif text-3xl font-bold mb-8">글 수정</h1>
      <PostEditor post={post} />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add post edit page"
```

---

## Task 11: 검색 기능

**Files:**
- Create: `src/components/posts/search-bar.tsx`
- Modify: `src/app/page.tsx` (검색바 추가)

**Step 1: SearchBar 컴포넌트**

`src/components/posts/search-bar.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";

export function SearchBar() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (query.trim()) {
      params.set("q", query.trim());
    } else {
      params.delete("q");
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="relative">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="검색..."
        className="glass pl-9 rounded-full h-9 w-48 focus:w-64 transition-all"
      />
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    </form>
  );
}
```

**Step 2: 홈 페이지에 검색 기능 추가**

`src/app/page.tsx` 수정 — searchParams에 `q` 추가, 검색 시 필터링:
```tsx
import { getPostsServer } from "@/lib/posts-server";
import { PostGrid } from "@/components/posts/post-grid";
import { TypeFilter } from "@/components/posts/type-filter";
import { SearchBar } from "@/components/posts/search-bar";
import type { PostType } from "@/types/database";
import { createClient } from "@/lib/supabase/server";

interface HomeProps {
  searchParams: Promise<{ type?: string; q?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const type = params.type as PostType | undefined;

  let posts;
  if (params.q) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("is_public", true)
      .or(`title.ilike.%${params.q}%,content.ilike.%${params.q}%`)
      .order("created_at", { ascending: false });
    posts = data || [];
  } else {
    posts = await getPostsServer(type);
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="text-center py-12">
        <h1 className="font-serif text-4xl md:text-5xl font-bold mb-3">
          My Journal
        </h1>
        <p className="text-muted-foreground text-lg">
          생각을 기록하는 공간
        </p>
      </section>

      {/* Filter + Search */}
      <div className="flex items-center justify-between">
        <TypeFilter />
        <SearchBar />
      </div>

      {/* Posts Grid */}
      <PostGrid posts={posts} />
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add search functionality"
```

---

## Task 12: 코드 하이라이팅 & 마크다운 스타일 보강

**Files:**
- Modify: `src/app/globals.css` (highlight.js 테마 임포트 추가)

**Step 1: highlight.js CSS 추가**

`src/app/layout.tsx`에 highlight.js 테마 CSS 링크 추가하거나,
`src/app/globals.css` 맨 위에 추가:

```css
@import "highlight.js/styles/github.css";
```

다크 모드 대응은 `globals.css`에 추가:
```css
.dark .hljs {
  background: #1e1e2e;
  color: #cdd6f4;
}
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add code syntax highlighting styles"
```

---

## Task 13: 최종 빌드 확인 & 배포 준비

**Step 1: 빌드 테스트**

```bash
npm run build
```

Expected: 빌드 성공. 에러 없음.

**Step 2: 에러 수정 (필요시)**

빌드 에러가 있으면 수정 후 다시 빌드.

**Step 3: Vercel 배포 안내**

사용자에게 안내:
1. GitHub에 push
2. Vercel에서 Import
3. Environment Variables에 `.env.local` 값 입력
4. Deploy

**Step 4: Final Commit**

```bash
git add .
git commit -m "chore: prepare for production deployment"
```

---

## Summary

| Task | Description | Estimated |
|------|-------------|-----------|
| 1 | 프로젝트 스캐폴딩 | 5분 |
| 2 | Supabase 클라이언트 & 타입 | 5분 |
| 3 | 글로벌 레이아웃 & 테마 | 10분 |
| 4 | Supabase DB 스키마 (수동) | 5분 |
| 5 | CRUD 유틸리티 함수 | 5분 |
| 6 | 로그인 페이지 | 5분 |
| 7 | 홈 페이지 & Bento Grid | 10분 |
| 8 | 글 상세 페이지 | 5분 |
| 9 | 글 작성 (마크다운 에디터) | 10분 |
| 10 | 글 수정 페이지 | 3분 |
| 11 | 검색 기능 | 5분 |
| 12 | 코드 하이라이팅 | 3분 |
| 13 | 빌드 확인 & 배포 | 5분 |
