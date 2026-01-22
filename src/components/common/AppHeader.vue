<template>
  <header class="header">
    <div class="header__inner">
      <h1 @click="goHome" class="title"><img src="@/assets/consome-logo.svg" class="logo" /></h1>
      <div class="nav">
        <!-- 🔹 섹션 + 게시판 네비 -->
        <nav class="nav-sections">
          <ul class="section-list">
            <li v-for="section in headerSections" :key="section.sectionId" class="section-item">
              <span class="section-name">
                {{ section.sectionName }}
              </span>

              <!-- 섹션 아래 게시판 목록 -->
              <ul class="board-list">
                <li v-for="board in section.boards" :key="board.boardId" class="board-item">
                  <RouterLink :to="`/boards/${board.boardId}`" class="board-link">
                    {{ board.boardName }}
                  </RouterLink>
                </li>
              </ul>
            </li>
          </ul>
        </nav>
        <!-- ✅ 로그인 안 한 상태 -->
        <div class="nav-auth">
          <template v-if="!nickname || nickname.length === 0">
            <RouterLink to="/login" class="link">로그인</RouterLink>
            <RouterLink to="/register" class="link">회원가입</RouterLink>
          </template>

          <!-- ✅ 로그인 한 상태 -->
          <template v-else>
            <span class="user-info">{{ nickname }} 님 · {{ point }}P</span>
            <button v-if="role === 'ADMIN'" @click="goAdmin">관리자페이지</button>
            <button v-if="nickname === '관리자'" @click="goAdmin">관리자페이지</button>
            <button class="logout-btn" @click="logout">로그아웃</button>
          </template>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useUserStore } from '@/stores/userStore'
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'
import router from '@/router/index.js'
import { ref, onMounted } from 'vue'
import api from '@/api/axios.js'

const store = useUserStore()
const { nickname, point, role } = storeToRefs(store)

const logout = (event) => {
  if (!event || event.type !== 'click') return
  event.preventDefault()

  if (confirm('로그아웃 하시겠습니까?')) {
    store.clearUser()
    window.location.reload()
  }
}

const headerSections = ref([])

const loadHeaderNavigation = async () => {
  try {
    const res = await api.get('/navigation/header')
    headerSections.value = res.data
  } catch (e) {
    console.error('[AppHeader] 헤더 네비게이션 조회 실패', e)
  }
}
const goHome = () => {
  router.push('/')
}

const goAdmin = () => {
  router.push('/admin')
}

onMounted(() => {
  loadHeaderNavigation()
})
</script>

<style scoped>
.header {
  position: fixed;
  width: 100%;
  top: 0;
  left: 0;
  z-index: 10;
  background: transparent;
  color: #777;
}

.header__inner {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: var(--app-max-width);
  margin: 0 auto;
  padding: 10px var(--app-padding-x);
}

.title {
  cursor: pointer;
}

/* 헤더 가운데 영역 전체 */
.nav {
  display: flex;
  align-items: center;
  flex: 1; /* 제목 옆에서 나머지 폭을 차지 */
  margin-left: 16px; /* 로고와 약간 간격 */
}

/* 섹션/게시판 네비: 왼쪽 정렬 */
.nav-sections {
  display: flex;
  align-items: center;
}

.section-list {
  display: flex;
  gap: 16px;
}

.section-item {
  position: relative;
}

.section-name {
  font-weight: 500;
  cursor: pointer;
}

/* 드롭다운 게시판 목록 */
.board-list {
  display: none;
  position: absolute;
  top: 24px;
  left: 0; /* 섹션 이름 기준 왼쪽 정렬 */
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px 0;
  min-width: 120px;
  z-index: 20;
}

.section-item:hover .board-list {
  display: block;
}

.board-item {
  list-style: none;
}

.board-link {
  display: block;
  padding: 4px 12px;
  color: #555;
  text-decoration: none;
}

.board-link:hover {
  background: #f5f5f5;
}

/* 로그인/유저 영역: 오른쪽으로 밀기 */
.nav-auth {
  margin-left: auto; /* 🔹 이게 포인트: 나머지 공간 다 먹고 오른쪽 끝으로 밀림 */
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 기존 링크/버튼 스타일은 그대로 유지 */
.link {
  color: #777;
  text-decoration: none;
  font-weight: 500;
}

.link:hover {
  text-decoration: underline;
}

.logout-btn {
  background: transparent;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
  transition: 0.2s;
}

.logout-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.logo {
  height: 32px; /* 필요하면 24~32 조절 */
  width: auto;
}
</style>
