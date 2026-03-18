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

        <!-- 모바일 햄버거 버튼 -->
        <button class="mobile-menu-btn" @click="mobileMenuOpen = !mobileMenuOpen">
          <span class="hamburger" :class="{ 'is-open': mobileMenuOpen }">
            <span></span><span></span><span></span>
          </span>
        </button>

        <!-- 인증 영역 (PC: 인라인 / 모바일: 햄버거) -->
        <div class="nav-auth" :class="{ 'is-open': mobileMenuOpen }">
          <template v-if="!nickname || nickname.length === 0">
            <RouterLink to="/login" class="link">로그인</RouterLink>
            <RouterLink to="/register" class="link">회원가입</RouterLink>
          </template>
          <template v-else>
            <span v-if="!emailVerified" class="email-unverified-badge">이메일 미인증</span>
            <NotificationBell />
            <button class="message-btn" @click="goMessages()">
              <Mail :size="16" />
              <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
            </button>
            <span class="user-info" @click="goMyProfile()"><LevelBadge :level="level" :role="role" size="xs" /> <span class="nickname-link">{{ nickname }}</span></span>
            <button class="logout-btn" @click="logout">로그아웃</button>
          </template>
        </div>
      </div>
    </div>

    <!-- 모바일 메뉴 배경 오버레이 -->
    <div v-if="mobileMenuOpen" class="mobile-overlay" @click="mobileMenuOpen = false"></div>
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
import { useRoute } from 'vue-router'
import api from '@/api/axios.js'
import LevelBadge from '@/components/common/LevelBadge.vue'
import { Mail, Sun, Moon } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { getUnreadCount } from '@/api/messageApi.js'
import { eventBus } from '@/utils/eventBus.js'
import NotificationBell from '@/components/common/NotificationBell.vue'
import { useNotification } from '@/composables/useNotification.js'
import { useDraggable } from '@/composables/useDraggable.js'

const store = useUserStore()
const { nickname, level, role, emailVerified } = storeToRefs(store)
const currentRoute = useRoute()

const mobileMenuOpen = ref(false)

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

// 라우트 변경 시 모바일 메뉴 닫기
watch(() => currentRoute.path, () => {
  mobileMenuOpen.value = false
})

const favoriteStore = useFavoriteStore()

// SSE 알림 연결 초기화
useNotification()

const logout = async (event) => {
  if (!event || event.type !== 'click') return
  event.preventDefault()

  favoriteStore.clear()
  await store.logout()
  toast.success('로그아웃 되었습니다.')
  router.push('/')
}

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
const goMyProfile = () => router.push(`/users/${store.userId}`)

const unreadCount = ref(0)
const goMessages = () => router.push('/messages')

const fetchUnreadCount = async () => {
  if (!store.userId) return
  try {
    const { data } = await getUnreadCount(store.userId)
    unreadCount.value = data.count
  } catch (e) {
    console.error('[AppHeader] 안읽은 쪽지 조회 실패', e)
  }
}

watch(() => store.userId, (newVal) => {
  if (newVal) {
    fetchUnreadCount()
    favoriteStore.fetchFavorites()
  } else {
    unreadCount.value = 0
    favoriteStore.clear()
  }
}, { immediate: true })

onMounted(() => {
  fetchFeaturedBoards()
  if (store.userId) {
    fetchUnreadCount()
    favoriteStore.fetchFavorites()
  }
  eventBus.on('main-boards-updated', fetchFeaturedBoards)
  eventBus.on('message-received', fetchUnreadCount)
  eventBus.on('message-read', fetchUnreadCount)
})

onUnmounted(() => {
  eventBus.off('main-boards-updated', fetchFeaturedBoards)
  eventBus.off('message-received', fetchUnreadCount)
  eventBus.off('message-read', fetchUnreadCount)
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

.user-info {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-primary);
  cursor: pointer;
}

.nickname-link:hover {
  color: var(--accent);
  text-decoration: underline;
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

.nav-auth button {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  height: 32px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 0 12px;
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

.message-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px !important;
  height: 32px !important;
  min-width: 32px;
  padding: 0 !important;
  background: transparent !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 6px !important;
}

.message-btn:hover {
  border-color: var(--accent) !important;
  color: var(--accent) !important;
  background: transparent !important;
}

.email-unverified-badge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--warning, #f59e0b);
  border: 1px solid var(--warning, #f59e0b);
  border-radius: 4px;
  padding: 3px 8px;
  cursor: default;
}

.unread-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: var(--danger, #ef4444);
  color: white;
  font-size: 10px;
  font-weight: 600;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
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

/* 모바일 햄버거 버튼 */
.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  margin-left: auto;
}

.hamburger {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 22px;
}

.hamburger span {
  display: block;
  height: 2px;
  background: var(--text-primary);
  border-radius: 2px;
  transition: all 0.3s ease;
}

.hamburger.is-open span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.hamburger.is-open span:nth-child(2) {
  opacity: 0;
}

.hamburger.is-open span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

.mobile-overlay {
  display: none;
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

  /* 햄버거 표시 - 우측 정렬 */
  .mobile-menu-btn {
    display: flex;
    margin-left: auto;
  }

  /* 인증 영역: PC에선 인라인, 모바일에선 드로어 */
  .nav-auth {
    display: none;
    position: fixed;
    top: 0;
    right: 0;
    width: 260px;
    height: 100vh;
    flex-direction: column;
    gap: 8px;
    margin-left: 0;
    padding: 60px 16px 16px;
    background: var(--bg-secondary);
    border-left: 1px solid var(--border-color);
    z-index: 100;
    overflow-y: auto;
    box-shadow: -4px 0 24px rgba(0, 0, 0, 0.3);
  }

  .nav-auth.is-open {
    display: flex;
  }

  .nav-auth button,
  .nav-auth .link {
    width: 100%;
    text-align: center;
    display: block;
  }

  .user-info {
    text-align: center;
  }

  .message-btn {
    width: 100% !important;
    justify-content: center;
  }

  .email-unverified-badge {
    text-align: center;
    display: block;
  }

  .mobile-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 99;
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
