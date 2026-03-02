# 해나의 일기장 기능 확장 설계

## 목표
개인 일기장을 만능 블로그/앱으로 확장. 모바일 퍼스트.

## 추가 기능

### 1. 습관 트래커
- `habits` 테이블: id, user_id, name, icon, color, created_at
- `habit_logs` 테이블: id, habit_id, user_id, date, completed
- UI: `/habits` 페이지, 오늘의 습관 체크, streak 표시

### 2. 달력 + 일정 관리
- `events` 테이블: id, user_id, title, date, start_time, end_time, memo, color, created_at
- UI: `/calendar` 페이지, 월간 달력 뷰, 날짜 탭 → 일정 목록, 일정 추가/삭제

### 3. 북마크/링크 저장
- `bookmarks` 테이블: id, user_id, url, title, description, category, favicon_url, created_at
- UI: `/bookmarks` 페이지, 카테고리별 분류, 링크 추가/삭제

### 4. 하단 탭 바
- 모바일 앱 스타일 네비게이션
- 탭: 홈(일기), 달력, 습관, 북마크
- 모바일에서만 표시, 데스크탑은 헤더 네비게이션

## 공통 규칙
- 모든 테이블에 `user_id` (RLS)
- 로그인 필수 (읽기/쓰기 모두)
- 모바일 퍼스트 디자인
- 기존 디자인 시스템 (glass, rounded, primary color) 유지
