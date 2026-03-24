<template>
  <header class="header">
    <div class="header__inner">
      <div @click="goHome" class="title"><img src="@/assets/consome-logo.svg" class="logo" /></div>

      <div class="nav">
        <!-- 게시판 검색 -->
        <div class="board-search">
          <input
            v-model="searchKeyword"
            @input="searchBoards"
            @focus="showDropdown = true"
            @blur="hideDropdown"
            placeholder="게시판 검색"
            class="search-input"
          />
          <ul v-if="showDropdown && searchResults.length" class="search-dropdown">
            <li v-for="board in searchResults" :key="board.id" @mousedown="goToBoard(board.id)">
              {{ board.name }}
            </li>
          </ul>
        </div>

        <!-- 전체 게시판 버튼 -->
        <RouterLink to="/boards" class="all-boards-btn">전체</RouterLink>

        <!-- 주요 게시판 드롭다운 -->
        <div class="main-boards-dropdown" @mouseenter="openMainDropdown" @mouseleave="closeMainDropdown">
          <button class="main-boards-trigger" @click="showMainDropdown = !showMainDropdown">
            주요
            <span class="arrow">▾</span>
          </button>
          <ul v-if="showMainDropdown" class="main-boards-menu">
            <li v-for="board in featuredBoards.pinnedBoards" :key="'pinned-' + board.boardId">
              <RouterLink :to="`/boards/${board.boardId}`" class="main-board-link pinned">{{ board.boardName }}</RouterLink>
            </li>
            <li v-if="featuredBoards.pinnedBoards?.length && featuredBoards.popularBoards?.length" class="divider"></li>
            <li v-for="board in featuredBoards.popularBoards" :key="'popular-' + board.boardId">
              <RouterLink :to="`/boards/${board.boardId}`" class="main-board-link">{{ board.boardName }}</RouterLink>
            </li>
            <li v-if="!featuredBoards.pinnedBoards?.length && !featuredBoards.popularBoards?.length" class="empty">등록된 주요 게시판이 없습니다</li>
          </ul>
        </div>

        <!-- 즐겨찾기 버튼 (로그인 시) -->
        <RouterLink v-if="nickname" to="/favorites" class="all-boards-btn">★</RouterLink>

        <!-- 인증 영역 -->
        <div class="nav-auth">
          <template v-if="!nickname || nickname.length === 0">
            <RouterLink to="/login" class="link">로그인</RouterLink>
            <RouterLink to="/register" class="link">회원가입</RouterLink>
          </template>
          <template v-else>
            <NotificationBell />
            <UserDropdown />
          </template>
        </div>
      </div>
    </div>
  </header>

  <!-- 모드토글 플로팅 오브 (드래그 가능) -->
  <div ref="modeDockRef" class="mode-dock" :style="modeDockStyle">
    <button
      class="mode-orb"
      :title="colorMode === 'dark' ? '라이트 모드' : '다크 모드'"
      :style="{
        '--orb-color': colorMode === 'dark' ? '#ffffff' : '#000000',
        '--orb-glow': colorMode === 'dark' ? '#ffffff50' : '#00000050',
        '--mode-orb-icon': colorMode === 'dark' ? '#000000' : '#ffffff'
      }"
      @click="!wasDragged && toggleColorMode()"
    >
      <span class="mode-orb__ring"></span>
      <span class="mode-orb__core">
        <Sun v-if="colorMode === 'dark'" :size="12" />
        <Moon v-else :size="12" />
      </span>
    </button>
  </div>
</template>

<script setup>
import { useUserStore } from '@/stores/userStore'
import { useFavoriteStore } from '@/stores/favoriteStore.js'
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'
import router from '@/router/index.js'
import { ref, onMounted, onUnmounted, watch } from 'vue'
import api from '@/api/axios.js'
import { Sun, Moon } from 'lucide-vue-next'
import { eventBus } from '@/utils/eventBus.js'
import NotificationBell from '@/components/common/NotificationBell.vue'
import UserDropdown from '@/components/common/UserDropdown.vue'
import { useNotification } from '@/composables/useNotification.js'
import { useDraggable } from '@/composables/useDraggable.js'

const store = useUserStore()
const { nickname } = storeToRefs(store)

// 모드토글 드래그
const { elRef: modeDockRef, posStyle: modeDockStyle, wasDragged } = useDraggable('mode-dock-pos', { top: 80, right: 20 })

// Color Mode
const colorMode = ref(localStorage.getItem('colorMode') || 'dark')

const toggleColorMode = () => {
  colorMode.value = colorMode.value === 'dark' ? 'light' : 'dark'
  localStorage.setItem('colorMode', colorMode.value)
  if (colorMode.value === 'light') {
    document.documentElement.dataset.theme = 'light'
  } else {
    const theme = localStorage.getItem('theme') || 'default'
    document.documentElement.dataset.theme = theme === 'default' ? '' : theme
  }
}

const favoriteStore = useFavoriteStore()

// SSE 알림 연결 초기화
useNotification()

const featuredBoards = ref({ pinnedBoards: [], popularBoards: [] })
const showMainDropdown = ref(false)
let hideDropdownTimer = null

const openMainDropdown = () => {
  clearTimeout(hideDropdownTimer)
  showMainDropdown.value = true
}

const closeMainDropdown = () => {
  hideDropdownTimer = setTimeout(() => {
    showMainDropdown.value = false
  }, 150)
}

const fetchFeaturedBoards = async () => {
  try {
    const res = await api.get('/navigation/featured-boards')
    featuredBoards.value = res.data
  } catch (e) {
    console.error('[AppHeader] 주요 게시판 조회 실패', e)
  }
}

const searchKeyword = ref('')
const searchResults = ref([])
const showDropdown = ref(false)

const searchBoards = async () => {
  if (!searchKeyword.value.trim()) {
    searchResults.value = []
    return
  }
  try {
    const res = await api.get('/boards/search', {
      params: { keyword: searchKeyword.value, size: 10 }
    })
    searchResults.value = res.data
  } catch (e) {
    console.error('[AppHeader] 게시판 검색 실패', e)
  }
}

const goToBoard = (id) => {
  router.push(`/boards/${id}`)
  showDropdown.value = false
  searchKeyword.value = ''
  searchResults.value = []
}

const hideDropdown = () => {
  setTimeout(() => { showDropdown.value = false }, 150)
}

const goHome = () => router.push('/')

watch(() => store.userId, (newVal) => {
  if (newVal) {
    favoriteStore.fetchFavorites()
  } else {
    favoriteStore.clear()
  }
}, { immediate: true })

onMounted(() => {
  fetchFeaturedBoards()
  if (store.userId) {
    favoriteStore.fetchFavorites()
  }
  eventBus.on('main-boards-updated', fetchFeaturedBoards)
})

onUnmounted(() => {
  eventBus.off('main-boards-updated', fetchFeaturedBoards)
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
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  margin: 0;
  line-height: 1;
  display: flex;
  align-items: center;
}

.nav {
  display: flex;
  align-items: center;
  flex: 1;
  margin-left: 20px;
  overflow: visible;
}

.main-boards-dropdown {
  position: relative;
  margin-left: 8px;
}

.main-boards-trigger {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  height: 32px;
  padding: 0 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.main-boards-trigger:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.main-boards-trigger .arrow {
  font-size: 10px;
}

.main-boards-menu {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 160px;
  margin-top: 4px;
  padding: 4px 0;
  list-style: none;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 100;
}

.main-boards-menu li {
  padding: 0;
}

.main-board-link {
  display: block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: var(--text-primary);
  text-decoration: none;
  padding: 10px 14px;
  transition: all 0.15s ease;
}

.main-board-link:hover {
  color: var(--accent);
  background: var(--accent-dim);
}

.main-boards-menu .empty {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-muted);
  padding: 10px 14px;
}

.main-boards-menu .divider {
  height: 1px;
  background: var(--border-color);
  margin: 4px 10px;
  padding: 0;
}

.main-board-link.pinned {
  color: var(--accent);
}

.board-search {
  position: relative;
}

.search-input {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  height: 32px;
  padding: 0 14px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  width: 200px;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent);
}

.search-input::placeholder {
  color: var(--text-muted);
}

.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  margin-top: 4px;
  padding: 0;
  list-style: none;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 100;
  max-height: 300px;
  overflow-y: auto;
}

.search-dropdown li {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  padding: 10px 14px;
  cursor: pointer;
  color: var(--text-primary);
  transition: all 0.15s ease;
}

.search-dropdown li:hover {
  background: var(--accent-dim);
  color: var(--accent);
}

.all-boards-btn {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-secondary);
  text-decoration: none;
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  margin-left: 8px;
  transition: all 0.2s ease;
}

.all-boards-btn:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.nav-auth {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

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

.logo {
  height: 32px;
  width: auto;
  filter: brightness(1.1);
}

/* 모드토글 플로팅 독 — theme-dock과 동일한 디자인 */
.mode-dock {
  position: fixed;
  top: 120px;
  right: 20px;
  z-index: 1000;
  display: flex;
  cursor: grab;
  user-select: none;
  touch-action: none;
  align-items: center;
  justify-content: center;
  padding: 10px;
  background: var(--mode-dock-bg, rgba(10, 10, 15, 0.85));
  backdrop-filter: blur(12px);
  border: 1px solid var(--mode-dock-border, rgba(255, 255, 255, 0.08));
  border-radius: 24px;
  box-shadow: var(--mode-dock-shadow,
    0 4px 24px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.05));
}

.mode-orb {
  position: relative;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  margin: 0;
  display: block;
  line-height: 0;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.mode-orb:hover {
  transform: scale(1.15);
}

.mode-orb__ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid var(--orb-color);
  opacity: 0.4;
  transition: opacity 0.2s, transform 0.3s;
  animation: orb-pulse-mode 2s ease-in-out infinite;
}

.mode-orb__core {
  position: absolute;
  inset: 6px;
  border-radius: 50%;
  background: var(--orb-color);
  box-shadow: 0 0 16px var(--orb-glow), 0 0 32px var(--orb-glow);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--mode-orb-icon, rgba(0, 0, 0, 0.7));
  transition: box-shadow 0.2s, transform 0.2s;
}

.mode-orb:hover .mode-orb__ring {
  opacity: 0.8;
  transform: scale(1.1);
}

.mode-orb:hover .mode-orb__core {
  box-shadow: 0 0 20px var(--orb-glow), 0 0 40px var(--orb-glow);
}

@keyframes orb-pulse-mode {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.6; }
}

/* ==========================================
   Responsive - Tablet & Mobile
   ========================================== */
@media (max-width: 768px) {
  .nav {
    margin-left: 8px;
    gap: 4px;
  }

  /* 검색 입력 축소 */
  .search-input {
    width: 100px;
    font-size: 12px;
    padding: 6px 8px;
  }

  /* 버튼 축소 */
  .all-boards-btn {
    font-size: 11px;
    padding: 6px 8px;
    margin-left: 4px;
  }

  .main-boards-dropdown {
    margin-left: 4px;
  }

  .main-boards-trigger {
    font-size: 11px;
    padding: 6px 8px;
  }

  .logo {
    height: 24px;
  }

  .mode-dock {
    padding: 8px;
    border-radius: 20px;
  }

  .mode-orb {
    width: 28px;
    height: 28px;
  }

  .mode-orb__core {
    inset: 5px;
  }
}
</style>
