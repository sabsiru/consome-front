<template>
  <div class="user-dropdown" ref="dropdownRef">
    <button class="user-trigger" @click="toggleDropdown">
      <UserIcon :size="16" />
    </button>

    <div v-if="showDropdown" class="dropdown-panel">
      <!-- 사용자 정보 -->
      <div class="dropdown-section dropdown-user" @click="goMyProfile">
        <div class="dropdown-user__main">
          <LevelBadge :level="level" :role="role" size="xs" />
          <span class="dropdown-user__nickname">{{ nickname }}</span>
        </div>
        <span class="dropdown-user__point">{{ point.toLocaleString() }}P</span>
      </div>

      <div v-if="!emailVerified" class="dropdown-warning">이메일 미인증</div>

      <!-- 네비게이션 -->
      <div class="dropdown-section dropdown-nav">
        <RouterLink to="" class="dropdown-nav__item" @click.prevent="goMyProfile">
          <UserIcon :size="14" />
          <span>내 프로필</span>
        </RouterLink>
        <RouterLink to="/favorites" class="dropdown-nav__item" @click="close">
          <Star :size="14" />
          <span>즐겨찾기</span>
        </RouterLink>
        <RouterLink to="/messages" class="dropdown-nav__item" @click="close">
          <Mail :size="14" />
          <span>쪽지함</span>
          <span v-if="unreadMessageCount > 0" class="nav-badge">{{ unreadMessageCount > 99 ? '99+' : unreadMessageCount }}</span>
        </RouterLink>
      </div>

      <!-- 최근 읽은 게시글 -->
      <div class="dropdown-section">
        <div class="dropdown-section__title">최근 읽은 게시글</div>
        <template v-if="recentReadPosts.length > 0">
          <a
            v-for="post in recentReadPosts"
            :key="post.postId"
            class="dropdown-recent__item"
            @click="goPost(post)"
          >
            <span class="dropdown-recent__title">{{ post.title?.length > 8 ? post.title.slice(0, 8) + '…' : post.title }}</span>
            <span class="dropdown-recent__board">{{ post.boardName?.length > 6 ? post.boardName.slice(0, 6) + '…' : post.boardName }}</span>
          </a>
        </template>
        <div v-else class="dropdown-empty">읽은 게시글이 없습니다</div>
      </div>

      <!-- 나의 신고 -->
      <div class="dropdown-section">
        <div class="dropdown-section__title">나의 신고</div>
        <template v-if="myReports.length > 0">
          <div
            v-for="report in myReports"
            :key="report.id"
            class="dropdown-report__item"
          >
            <span class="dropdown-report__type">{{ targetTypeLabel(report.targetType) }}</span>
            <span class="dropdown-report__reason">{{ reasonLabel(report.reason) }}</span>
            <span class="dropdown-report__status" :class="report.status.toLowerCase()">{{ statusLabel(report.status) }}</span>
          </div>
        </template>
        <div v-else class="dropdown-empty">신고 내역이 없습니다</div>
      </div>

      <!-- 로그아웃 -->
      <div class="dropdown-section dropdown-logout">
        <button class="dropdown-logout__btn" @click="handleLogout">
          <LogOut :size="14" />
          <span>로그아웃</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/userStore.js'
import { useFavoriteStore } from '@/stores/favoriteStore.js'
import { useReadPosts } from '@/composables/useReadPosts.js'
import { getMyReports } from '@/api/reportApi.js'
import { getUnreadCount } from '@/api/messageApi.js'
import { toast } from 'vue-sonner'
import LevelBadge from '@/components/common/LevelBadge.vue'
import { UserIcon, Star, Mail, LogOut } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const favoriteStore = useFavoriteStore()
const { nickname, level, role, emailVerified, point } = storeToRefs(userStore)
const { recentReadPosts } = useReadPosts()

const showDropdown = ref(false)
const dropdownRef = ref(null)
const myReports = ref([])
const unreadMessageCount = ref(0)

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
  if (showDropdown.value) {
    fetchMyReports()
    fetchUnreadMessages()
  }
}

const close = () => {
  showDropdown.value = false
}

const fetchMyReports = async () => {
  try {
    const { data } = await getMyReports(userStore.userId, 0, 5)
    myReports.value = data.content || []
  } catch {
    myReports.value = []
  }
}

const fetchUnreadMessages = async () => {
  try {
    const { data } = await getUnreadCount(userStore.userId)
    unreadMessageCount.value = data.count || 0
  } catch {
    unreadMessageCount.value = 0
  }
}

const goMyProfile = () => {
  close()
  router.push(`/users/${userStore.userId}`)
}

const goPost = (post) => {
  close()
  router.push(`/boards/${post.boardId}/posts/${post.postId}`)
}

const handleLogout = async () => {
  close()
  favoriteStore.clear()
  await userStore.logout()
  toast.success('로그아웃 되었습니다.')
  router.push('/')
}

const targetTypeLabel = (type) => {
  const map = { POST: '게시글', COMMENT: '댓글', USER: '사용자' }
  return map[type] || type
}

const reasonLabel = (reason) => {
  const map = { SPAM: '스팸', ABUSE: '욕설', ADULT: '성인', ILLEGAL: '불법', OTHER: '기타' }
  return map[reason] || reason
}

const statusLabel = (status) => {
  const map = { PENDING: '처리중', RESOLVED: '완료', REJECTED: '반려' }
  return map[status] || status
}

// 외부 클릭 시 닫기
const handleOutsideClick = (e) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    showDropdown.value = false
  }
}

// 라우트 변경 시 닫기
watch(() => route.path, () => {
  showDropdown.value = false
})

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
})
</script>

<style scoped>
.user-dropdown {
  position: relative;
}

.user-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-primary);
}

.user-trigger:hover {
  border-color: var(--accent);
  color: var(--accent);
}

/* 드롭다운 패널 */
.dropdown-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 280px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  z-index: 200;
  overflow: hidden;
}

/* 섹션 구분 */
.dropdown-section {
  padding: 8px 0;
  border-bottom: 1px solid var(--border-color);
}

.dropdown-section:last-child {
  border-bottom: none;
}

.dropdown-section__title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 4px 16px 8px;
}

/* 사용자 정보 */
.dropdown-user {
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.dropdown-user:hover {
  background: var(--accent-dim);
}

.dropdown-user__main {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.dropdown-user__nickname {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.dropdown-user__point {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--accent);
  font-weight: 600;
}

/* 이메일 미인증 경고 */
.dropdown-warning {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--warning, #f59e0b);
  text-align: center;
  padding: 6px 16px;
  background: rgba(245, 158, 11, 0.08);
  border-bottom: 1px solid var(--border-color);
}

/* 네비게이션 */
.dropdown-nav__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-primary);
  text-decoration: none;
  transition: all 0.15s ease;
  cursor: pointer;
}

.dropdown-nav__item:hover {
  background: var(--accent-dim);
  color: var(--accent);
}

.nav-badge {
  margin-left: auto;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: var(--danger, #ef4444);
  color: white;
  font-size: 10px;
  font-weight: 600;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* 최근 읽은 게시글 */
.dropdown-recent__item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.dropdown-recent__item:hover {
  background: var(--accent-dim);
}

.dropdown-recent__title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-primary);
  white-space: nowrap;
}

.dropdown-recent__board {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
}

.dropdown-recent__item:hover .dropdown-recent__title,
.dropdown-recent__item:hover .dropdown-recent__board {
  color: var(--accent);
}

/* 나의 신고 */
.dropdown-report__item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
}

.dropdown-report__type {
  color: var(--text-secondary);
  font-weight: 600;
}

.dropdown-report__reason {
  color: var(--text-muted);
}

.dropdown-report__status {
  margin-left: auto;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
}

.dropdown-report__status.pending {
  color: var(--warning, #f59e0b);
  background: rgba(245, 158, 11, 0.1);
}

.dropdown-report__status.resolved {
  color: var(--accent);
  background: var(--accent-dim);
}

.dropdown-report__status.rejected {
  color: var(--text-muted);
  background: var(--bg-tertiary);
}

/* 빈 상태 */
.dropdown-empty {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--text-muted);
  padding: 8px 16px;
}

/* 로그아웃 */
.dropdown-logout {
  padding: 4px 0;
}

.dropdown-logout__btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 16px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.dropdown-logout__btn:hover {
  color: var(--danger, #ef4444);
  background: rgba(239, 68, 68, 0.05);
}

/* 모바일 */
@media (max-width: 768px) {
  .dropdown-panel {
    width: 260px;
    max-height: 70vh;
    overflow-y: auto;
  }
}
</style>
