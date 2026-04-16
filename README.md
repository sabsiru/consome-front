# 🎮 CONSOME Frontend

> **CONSOLE + MOBILE** — 통합 게임 커뮤니티 프론트엔드

[![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Pinia](https://img.shields.io/badge/Pinia-3.0-FFD859?logo=pinia&logoColor=black)](https://pinia.vuejs.org/)

---

## 📖 프로젝트 소개

CONSOME 백엔드 API와 연동하는 SPA(Single Page Application) 프론트엔드입니다.
게시판/게시글/댓글/쪽지/알림/관리자 등 커뮤니티 전체 기능의 UI를 담당합니다.

---

## 🛠 기술 스택

| 분류 | 기술 | 비고 |
|------|------|------|
| **Framework** | Vue 3.5 (Composition API) | SFC + `<script setup>` |
| **Build** | Vite 7.1 | HMR, 프로덕션 빌드 |
| **상태 관리** | Pinia 3.0 + Persisted State | 인증/UI 상태 영속화 |
| **라우팅** | Vue Router 4.6 | History 모드 |
| **HTTP** | Axios 1.12 | 인터셉터 기반 인증/에러 처리 |
| **에디터** | Tiptap 3.15 | 이미지/YouTube 확장 |
| **아이콘** | Lucide Vue | 트리셰이킹 지원 |
| **보안** | DOMPurify 3.3 | XSS 방어 (HTML Sanitize) |
| **UI** | vue-sonner, vuedraggable | 토스트 알림, 드래그 앤 드롭 |

---

## 📏 프로젝트 규모

- **Vue 컴포넌트:** 44개
- **페이지(Views):** 27개
- **API 연동:** 135개 백엔드 엔드포인트

---

## 💡 주요 기능

- **게시판 시스템:** 섹션 → 게시판 → 카테고리 계층 탐색, 게시글 CRUD, 이미지/영상 업로드
- **댓글 시스템:** 대댓글, 추천/비추천
- **실시간 알림:** SSE 기반 알림 수신 + Exponential Backoff 자동 재연결
- **쪽지:** 1:1 송수신, 포인트 선물, 닉네임 검색 (debounce + IME 대응)
- **인증:** JWT Silent Refresh (Axios 인터셉터), 토큰 만료 자동 로그아웃
- **관리자:** 게시판/카테고리 관리 (드래그 앤 드롭 정렬), 사용자 정지, 신고 처리
- **인기 게시글:** 인기글 탭 + 인기 배지 표시
- **광고 슬롯:** 인피드/사이드바/본문하단 광고 시스템
- **보안:** DOMPurify XSS 방어, Open Redirect 방지, 커스텀 ConfirmModal

---

## 🚀 시작하기

### Prerequisites

- Node.js 20.19+ 또는 22.12+
- 백엔드 서버 실행 중 (localhost:8080)

### Setup & Run

```bash
npm install
npm run dev      # http://localhost:5173
```

### Build

```bash
npm run build    # dist/ 디렉토리에 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
```
