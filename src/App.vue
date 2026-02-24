<script setup>
import { RouterView, useRouter, useRoute } from 'vue-router'
import { ref, onMounted, watch } from 'vue'
import AppHeader from './components/common/AppHeader.vue'
import { getOnlineCount, getVisitedBoards } from '@/api/statisticsApi.js'
import { useUserStore } from '@/stores/userStore.js'
import './assets/styles/layout.css'

const router = useRouter()
const route = useRoute()
const store = useUserStore()

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

onMounted(() => {
  fetchOnlineCount()
  fetchVisitedBoards()
  setInterval(fetchOnlineCount, 30000)
  setInterval(fetchVisitedBoards, 30000)
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

  <div class="app-shell">
    <main class="app-content">
      <RouterView />
    </main>
  </div>

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
