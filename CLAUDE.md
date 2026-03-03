# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

개인 저널/다이어리 PWA 애플리케이션. Next.js 16 App Router + Supabase + Tailwind CSS 4.
게시물(일기/노트), 습관 추적, 캘린더 이벤트, 북마크, 웹 푸시 알림 기능.

## Commands

```bash
npm run dev         # 개발 서버 (localhost:3000)
npm run build       # 프로덕션 빌드
npm run lint        # ESLint
npm run test        # Vitest 실행
npm run test:watch  # Vitest 감시 모드
```

단일 테스트 실행: `npx vitest run src/lib/__tests__/파일명.test.ts`

## Architecture

### 라우팅 & 페이지

- **App Router** 기반, `src/app/` 디렉토리
- 공개 라우트: `/` (홈), `/posts/[slug]`, `/login`
- 보호 라우트 (미인증 시 `/login` 리다이렉트): `/write`, `/edit/[id]`, `/habits`, `/calendar`, `/bookmarks`
- 보호 라우트 로직: `src/middleware.ts` → `src/lib/supabase/middleware.ts`

### Supabase 클라이언트 패턴

**브라우저(CSR)와 서버(SSR)에서 다른 클라이언트를 사용:**
- `src/lib/supabase/client.ts` — 클라이언트 컴포넌트용 (`createBrowserClient`)
- `src/lib/supabase/server.ts` — 서버 컴포넌트/API용 (`createServerClient`, 쿠키 기반)

### 데이터 계층

- `src/lib/posts.ts` — 클라이언트 사이드 CRUD (createPost, updatePost, deletePost, getPosts)
- `src/lib/posts-server.ts` — 서버 사이드 조회 (getPostBySlug 등)
- `src/lib/push.ts` — Web Push 구독/해제
- `src/lib/storage.ts` — Supabase Storage 이미지 업로드 (`post-images` 버킷)
- `src/lib/slug.ts` — 한국어 지원 URL 슬러그 생성 (slugify + timestamp)

### DB 테이블 (Supabase PostgreSQL, RLS 적용)

`posts`, `habits`, `habit_logs`, `events`, `bookmarks`, `push_subscriptions`
타입 정의: `src/types/database.ts`

### 컴포넌트 구조

- `src/components/ui/` — shadcn/ui 프리미티브 (직접 수정 지양)
- `src/components/layout/` — Header, BottomTabBar, ThemeToggle, PushToggle
- `src/components/posts/` — PostCard, PostGrid, TypeFilter
- `src/components/editor/` — PostEditor (Novel/TipTap 기반 리치 에디터)
- `src/components/providers.tsx` — ThemeProvider + PWA 서비스워커 등록

### 핵심 패턴

- **서버 vs 클라이언트 컴포넌트**: 페이지는 기본 서버 컴포넌트, 인터랙티브 UI는 `"use client"`
- **인증 확인**: `supabase.auth.getUser()`로 소유권 검증 (user_id 비교)
- **HTML sanitize**: DOMPurify로 에디터 콘텐츠 정화 후 렌더링 (`SafeHtml` 컴포넌트)
- **경로 별칭**: `@/*` → `./src/*` (tsconfig paths)
- **테마**: next-themes 기반 라이트/다크 모드, CSS 변수(oklch)로 색상 관리

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL                       # Supabase 프로젝트 URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY   # Supabase anon 키
NEXT_PUBLIC_VAPID_PUBLIC_KEY                   # Web Push 공개키
VAPID_PRIVATE_KEY                              # Web Push 비밀키 (서버 전용)
CRON_SECRET                                    # Vercel cron 인증 (선택)
```

## Deployment

Vercel 배포. `vercel.json`에 매일 11:00 UTC 크론 설정 (`/api/push` — 습관/일정 푸시 알림).
PWA: `public/sw.js` (캐싱 + 푸시), `public/manifest.json`.

## Key Dependencies

- **에디터**: novel (TipTap 래퍼) + @tiptap/html
- **UI**: shadcn/ui (radix-ui), lucide-react 아이콘, sonner 토스트
- **애니메이션**: motion (v12)
- **날짜**: date-fns (한국어 로케일)
- **npm 설치 시**: `legacy-peer-deps=true` (.npmrc)
