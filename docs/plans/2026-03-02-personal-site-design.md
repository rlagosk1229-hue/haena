# Personal Site Design Document

**Date:** 2026-03-02
**Project:** 개인 사이트 (일기 + 노트)

## Overview

일기와 노트를 올릴 수 있는 개인 사이트. 미니멀하면서도 현대적이고 예쁜 디자인.

## Tech Stack

- **Frontend:** Next.js 14+ (App Router), React 18, TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Animation:** Framer Motion
- **Backend/DB:** Supabase (PostgreSQL + Auth + Storage)
- **Deploy:** Vercel
- **Theme:** next-themes (다크/라이트 모드)

## Architecture

```
Client (Next.js on Vercel)
    │
    ├── Supabase SDK 직접 호출
    │
    └── Supabase
        ├── Auth (이메일/비밀번호 로그인)
        ├── PostgreSQL (posts 테이블)
        ├── Storage (이미지 업로드)
        └── RLS (Row Level Security)
```

- API Routes 없이 Supabase SDK로 직접 CRUD
- RLS로 DB 레벨 권한 관리

## Database Schema

```sql
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
  user_id     UUID REFERENCES auth.users(id) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
-- 공개 글은 누구나 읽기 가능
-- 작성/수정/삭제는 본인만 가능
```

## Pages

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/` | 홈 - 최신 글 목록 (Bento Grid) | No |
| `/diary` | 일기 목록 | No |
| `/notes` | 노트 목록 | No |
| `/posts/[slug]` | 글 상세 보기 | No |
| `/write` | 글 작성 (마크다운 에디터) | Yes |
| `/edit/[slug]` | 글 수정 | Yes |
| `/login` | 로그인 | No |

## Design Style

### Keywords
- Bento Grid 레이아웃
- Glassmorphism (반투명 유리 효과)
- Micro-interactions (Framer Motion)
- 대담한 타이포그래피 (serif + sans-serif 믹스)
- 다크/라이트 모드

### Color Palette

**Light Mode:**
- Background: #FAFAF9 (warm white)
- Card: rgba(255,255,255,0.7) + backdrop-blur
- Text: #1A1A1A
- Accent: #6366F1 (indigo)
- Sub: #A1A1AA (neutral gray)

**Dark Mode:**
- Background: #0A0A0B
- Card: rgba(255,255,255,0.05) + backdrop-blur
- Text: #FAFAFA
- Accent: #818CF8

### Typography
- Headings: Playfair Display (serif)
- Body: Inter (sans-serif)

### Card Design
- `backdrop-blur-xl` + semi-transparent background
- `rounded-2xl` corners
- Hover: `translate-y` lift + shadow increase

### Responsive
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 2-3 columns (Bento Grid)

### Animations (Framer Motion)
- Page transitions: fade-in
- Card list: stagger effect
- Hover: smooth lift

## Features Summary

1. 글 목록 (Bento Grid, 타입별 필터)
2. 글 상세 보기 (마크다운 렌더링)
3. 글 작성/수정/삭제 (마크다운 에디터 + 실시간 미리보기)
4. 태그 시스템
5. 검색 기능
6. 이미지 업로드 (Supabase Storage)
7. 로그인/로그아웃 (Supabase Auth)
8. 다크/라이트 모드 전환
9. 반응형 디자인
10. 비공개 글 지원
