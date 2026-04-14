<script setup>
import { RouterView, useRouter, useRoute } from 'vue-router'
import { ref, onMounted, onUnmounted, watch } from 'vue'
import AppHeader from './components/common/AppHeader.vue'
import ConfirmModal from './components/common/ConfirmModal.vue'
import AdSlot from './components/common/AdSlot.vue'
import { Toaster } from 'vue-sonner'
import 'vue-sonner/style.css'
import { getOnlineCount, getVisitedBoards } from '@/api/statisticsApi.js'
import { refreshToken as refreshTokenApi } from '@/api/authApi.js'
import { useUserStore } from '@/stores/userStore.js'
import './assets/styles/layout.css'

const router = useRouter()
const route = useRoute()
const store = useUserStore()

/**
 * JWT 토큰 만료 여부 확인 (클라이언트 디코딩)
 * base64url → JSON 파싱 후 exp 클레임 비교
 */
const isTokenExpired = (token) => {
  if (!token) return true
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

/**
 * 앱 시작 시 토큰 유효성 검증
 * accessToken 만료 → refreshToken으로 갱신 시도 → 실패 시 로그아웃
 */
const validateAuth = async () => {
  if (!store.token) return

  if (!isTokenExpired(store.token)) return

  // accessToken 만료 → refresh 시도
  if (!store.refreshToken) {
    store.clearUser()
    return
  }

  try {
    const { data } = await refreshTokenApi(store.refreshToken)
    store.setTokens(data.accessToken, data.refreshToken)
  } catch {
    store.clearUser()
  }
}

const toasterTheme = ref(localStorage.getItem('colorMode') === 'light' ? 'light' : 'dark')

const onlineCount = ref(0)
const visitedBoards = ref([])

const fetchOnlineCount = async () => {
  try {
    const { data } = await getOnlineCount()
    onlineCount.value = data.count
  } catch (e) {
    console.error('[App] 접속자 수 조회 실패', e)
  }
}

const fetchVisitedBoards = async () => {
  if (!store.userId) {
    visitedBoards.value = []
    return
  }
  try {
    const { data } = await getVisitedBoards()
    visitedBoards.value = data.boards || []
  } catch (e) {
    console.error('[App] 최근 방문 게시판 조회 실패', e)
  }
}

const goToBoard = (boardId) => {
  router.push(`/boards/${boardId}`)
}

// 탭 스크롤
const tabsContainer = ref(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

const checkScroll = () => {
  if (!tabsContainer.value) return
  const el = tabsContainer.value
  canScrollLeft.value = el.scrollLeft > 0
  canScrollRight.value = el.scrollLeft < el.scrollWidth - el.clientWidth - 1
}

const scrollTabs = (direction) => {
  if (!tabsContainer.value) return
  const scrollAmount = 200
  tabsContainer.value.scrollBy({
    left: direction === 'left' ? -scrollAmount : scrollAmount,
    behavior: 'smooth'
  })
  setTimeout(checkScroll, 300)
}

// 라우트 변경 시 갱신
watch(() => route.path, () => {
  if (store.userId) {
    setTimeout(fetchVisitedBoards, 500)
  }
})

let onlineTimer = null
let visitedTimer = null

onMounted(async () => {
  // 토큰 유효성 검증 (만료 시 refresh 또는 로그아웃)
  await validateAuth()

  // Initialize theme
  const colorMode = localStorage.getItem('colorMode') || 'dark'
  if (colorMode === 'light') {
    document.documentElement.dataset.theme = 'light'
  } else {
    const theme = localStorage.getItem('theme') || 'default'
    document.documentElement.dataset.theme = theme === 'default' ? '' : theme
  }

  // data-theme 변경 감지 → toaster 테마 동기화
  const observer = new MutationObserver(() => {
    toasterTheme.value = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

  fetchOnlineCount()
  fetchVisitedBoards()
  onlineTimer = setInterval(fetchOnlineCount, 30000)
  visitedTimer = setInterval(fetchVisitedBoards, 30000)
})

onUnmounted(() => {
  clearInterval(onlineTimer)
  clearInterval(visitedTimer)
})

// visitedBoards 변경 시 스크롤 체크
watch(visitedBoards, () => {
  setTimeout(checkScroll, 100)
}, { deep: true })
</script>

<template>
  <header>
    <AppHeader />
  </header>

  <!-- 최근 방문 게시판 탭 바 -->
  <div v-if="store.userId && visitedBoards.length > 0" class="visited-bar">
    <div class="visited-bar__inner">
      <span class="visited-label">최근 방문</span>

      <!-- 왼쪽 화살표 -->
      <button
        v-show="canScrollLeft"
        class="scroll-btn scroll-left"
        @click="scrollTabs('left')"
      >
        ‹
      </button>

      <div
        ref="tabsContainer"
        class="visited-tabs"
        @scroll="checkScroll"
      >
        <button
          v-for="board in visitedBoards"
          :key="board.id"
          class="visited-tab"
          @click="goToBoard(board.id)"
        >
          {{ board.name }}
        </button>
      </div>

      <!-- 오른쪽 화살표 -->
      <button
        v-show="canScrollRight"
        class="scroll-btn scroll-right"
        @click="scrollTabs('right')"
      >
        ›
      </button>
    </div>
  </div>

  <div class="app-with-sidebar">
    <aside class="app-sidebar app-sidebar--left">
      <AdSlot placement="sidebar" />
    </aside>

    <div class="app-shell">
      <main class="app-content">
        <RouterView />
      </main>
    </div>

    <aside class="app-sidebar app-sidebar--right">
      <AdSlot placement="sidebar" />
    </aside>
  </div>

  <Toaster position="top-center" :duration="3000" :theme="toasterTheme" rich-colors close-button />
  <ConfirmModal />

  <footer class="app-footer">
    <div class="app-footer__inner">
      <span class="online-count">
        <span class="online-icon">👤</span>
        <span class="online-number">{{ onlineCount }}</span>
      </span>
      <span>© 2026 Consome</span>
    </div>
  </footer>
</template>

<style scoped>
/* 사이드바 광고 레이아웃 */
.app-with-sidebar {
  display: flex;
  justify-content: center;
  gap: 16px;
  max-width: calc(var(--app-max-width) + 160px * 2 + 16px * 2);
  margin: 0 auto;
  padding: 0 8px;
}

.app-with-sidebar > .app-shell {
  flex: 1;
  max-width: var(--app-max-width);
  min-width: 0;
}

.app-sidebar {
  flex-shrink: 0;
  padding-top: 24px;
  position: sticky;
  top: 0;
  height: fit-content;
}

@media (max-width: 1439px) {
  .app-sidebar {
    display: none;
  }

  .app-with-sidebar {
    padding: 0;
  }
}

/* 최근 방문 탭 바 */
.visited-bar {
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
}

.visited-bar__inner {
  display: flex;
  align-items: center;
  max-width: var(--app-max-width);
  margin: 0 auto;
  padding: 0 var(--app-padding-x);
  position: relative;
}

.visited-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--text-muted);
  padding: 8px 12px 8px 0;
  border-right: 1px solid var(--border-color);
  white-space: nowrap;
  flex-shrink: 0;
}

.visited-tabs {
  display: flex;
  align-items: center;
  gap: 0;
  overflow-x: auto;
  scrollbar-width: none;
  flex: 1;
}

.visited-tabs::-webkit-scrollbar {
  display: none;
}

.visited-tab {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  padding: 8px 16px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
  border-right: 1px solid var(--border-color);
  flex-shrink: 0;
}

.visited-tab:last-child {
  border-right: none;
}

.visited-tab:hover {
  color: var(--accent);
  background: var(--accent-dim);
}

/* 스크롤 버튼 */
.scroll-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-secondary);
  font-size: 16px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.scroll-btn:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.scroll-left {
  margin-left: 8px;
}

.scroll-right {
  margin-left: 8px;
}

/* 푸터 */
.online-count {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-muted);
  margin-right: 16px;
}

.online-icon {
  font-size: 14px;
}

.online-number {
  color: var(--accent);
  font-weight: 600;
}
</style>
