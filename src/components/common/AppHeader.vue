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
            <span class="user-info">{{ nickname }} <span class="sep">·</span> <span class="point">{{ point }}P</span></span>
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
  width: 100%;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.header__inner {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: var(--app-max-width);
  margin: 0 auto;
  padding: 12px var(--app-padding-x);
}

.title {
  cursor: pointer;
}

/* 헤더 가운데 영역 전체 */
.nav {
  display: flex;
  align-items: center;
  flex: 1;
  margin-left: 20px;
}

/* 섹션/게시판 네비: 왼쪽 정렬 */
.nav-sections {
  display: flex;
  align-items: center;
}

.section-list {
  display: flex;
  gap: 24px;
}

.section-item {
  position: relative;
  padding: 8px 0;
}

.section-name {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: color 0.2s ease;
  display: block;
}

.section-name:hover {
  color: var(--accent);
}

/* 드롭다운 게시판 목록 */
.board-list {
  display: none;
  position: absolute;
  top: calc(100% - 4px);
  left: -12px;
  min-width: 160px;
  z-index: 20;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 8px 0;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

/* 투명한 브릿지 영역 - hover 유지 */
.board-list::before {
  content: '';
  position: absolute;
  top: -12px;
  left: 0;
  right: 0;
  height: 12px;
}

.section-item:hover .board-list {
  display: block;
}

.board-item {
  list-style: none;
}

.board-link {
  display: block;
  padding: 10px 16px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-primary);
  text-decoration: none;
  transition: all 0.15s ease;
}

.board-link:hover {
  background: var(--bg-hover);
  color: var(--accent);
}

/* 로그인/유저 영역: 오른쪽으로 밀기 */
.nav-auth {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-primary);
}

.user-info .point {
  color: var(--accent);
  font-weight: 600;
}

/* 링크 스타일 */
.link {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-primary);
  text-decoration: none;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.link:hover {
  color: var(--accent);
  background: var(--accent-dim);
  text-decoration: none;
}

/* 버튼 스타일 */
.nav-auth button {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 6px 14px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-auth button:hover {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--bg-primary);
}

.logout-btn {
  background: transparent !important;
  border: 1px solid var(--border-color) !important;
  color: var(--text-muted) !important;
}

.logout-btn:hover {
  background: transparent !important;
  border-color: var(--danger) !important;
  color: var(--danger) !important;
}

.logo {
  height: 32px;
  width: auto;
  filter: brightness(1.1);
}
</style>
