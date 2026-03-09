<template>
  <header class="header">
    <div class="header__inner">
      <h1 @click="goHome" class="title"><img src="@/assets/consome-logo.svg" class="logo" /></h1>
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
        <RouterLink to="/boards" class="all-boards-btn">전체 게시판</RouterLink>

        <!-- 즐겨찾기 버튼 (로그인 시) -->
        <RouterLink v-if="nickname" to="/favorites" class="all-boards-btn">★ 즐겨찾기</RouterLink>

        <!-- 주요 게시판 드롭다운 -->
        <div class="main-boards-dropdown" @mouseenter="openMainDropdown" @mouseleave="closeMainDropdown">
          <button class="main-boards-trigger">
            주요 게시판 <span class="arrow">▾</span>
          </button>
          <ul v-if="showMainDropdown" class="main-boards-menu">
            <li v-for="board in featuredBoards.pinnedBoards" :key="'pinned-' + board.boardId">
              <RouterLink :to="`/boards/${board.boardId}`" class="main-board-link pinned">
                {{ board.boardName }}
              </RouterLink>
            </li>
            <li v-if="featuredBoards.pinnedBoards?.length && featuredBoards.popularBoards?.length" class="divider"></li>
            <li v-for="board in featuredBoards.popularBoards" :key="'popular-' + board.boardId">
              <RouterLink :to="`/boards/${board.boardId}`" class="main-board-link">
                {{ board.boardName }}
              </RouterLink>
            </li>
            <li v-if="!featuredBoards.pinnedBoards?.length && !featuredBoards.popularBoards?.length" class="empty">등록된 주요 게시판이 없습니다</li>
          </ul>
        </div>

        <!-- ✅ 로그인 안 한 상태 -->
        <div class="nav-auth">
          <template v-if="!nickname || nickname.length === 0">
            <RouterLink to="/login" class="link">로그인</RouterLink>
            <RouterLink to="/register" class="link">회원가입</RouterLink>
          </template>

          <!-- ✅ 로그인 한 상태 -->
          <template v-else>
            <span v-if="!emailVerified" class="email-unverified-badge">이메일 미인증</span>
            <span class="user-info" @click="goMyProfile"><LevelBadge :level="level" :role="role" /> <span class="nickname-link">{{ nickname }}</span> <span class="sep">·</span> <span class="point">{{ point }}P</span></span>
            <button class="message-btn" @click="goMessages">
              <Mail :size="16" />
              <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
            </button>
            <button v-if="role === 'ADMIN'" @click="goAdmin">관리자페이지</button>
            <button v-if="role === 'MANAGER'" @click="goManagerBoard">게시판관리</button>
            <button class="logout-btn" @click="logout">로그아웃</button>
          </template>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useUserStore } from '@/stores/userStore'
import { useFavoriteStore } from '@/stores/favoriteStore.js'
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'
import router from '@/router/index.js'
import { ref, onMounted, onUnmounted, watch } from 'vue'
import api from '@/api/axios.js'
import LevelBadge from '@/components/common/LevelBadge.vue'
import { Mail } from 'lucide-vue-next'
import { getUnreadCount } from '@/api/messageApi.js'
import { eventBus } from '@/utils/eventBus.js'

const store = useUserStore()
const { nickname, point, level, role, emailVerified } = storeToRefs(store)

const favoriteStore = useFavoriteStore()

const logout = async (event) => {
  if (!event || event.type !== 'click') return
  event.preventDefault()

  if (confirm('로그아웃 하시겠습니까?')) {
    favoriteStore.clear()
    await store.logout()
    window.location.href = '/'
  }
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
const goAdmin = () => router.push('/admin')
const goManagerBoard = () => router.push('/manager/boards')
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
  setInterval(() => {
    if (store.userId) fetchUnreadCount()
  }, 30000)
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
}

.nav {
  display: flex;
  align-items: center;
  flex: 1;
  margin-left: 20px;
}

.main-boards-dropdown {
  position: relative;
  margin-left: 12px;
}

.main-boards-trigger {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 8px 12px;
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
  padding: 8px 14px;
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
  padding: 8px 12px;
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
  gap: 16px;
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

.user-info .point {
  color: var(--accent);
  font-weight: 600;
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

.message-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px !important;
  background: transparent !important;
  border: 1px solid var(--border-color) !important;
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
</style>
