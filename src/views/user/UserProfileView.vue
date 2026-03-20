<template>
  <div class="user-profile">
    <div class="user-profile__header">
      <div class="user-profile__info">
        <div class="user-profile__main">
          <LevelBadge :level="profile.level" :role="profile.role" />
          <span class="user-profile__nickname">{{ profile.nickname }}</span>
        </div>
        <div v-if="levelInfo" class="user-profile__exp">
          <span class="user-profile__exp-text">
            {{ levelInfo.levelName }}
            <template v-if="isMaxLevel">(MAX)</template>
            <template v-else>({{ currentExp.toLocaleString() }} / {{ segmentTotal.toLocaleString() }})</template>
          </span>
          <div class="user-profile__exp-bar">
            <div class="user-profile__exp-fill" :style="{ width: expPercent + '%' }"></div>
          </div>
        </div>
        <div class="user-profile__stats">
          <span>{{ profile.point?.toLocaleString() }}P</span>
          <span class="user-profile__sep">·</span>
          <span>게시글 {{ profile.postCount }}</span>
          <span class="user-profile__sep">·</span>
          <span>댓글 {{ profile.commentCount }}</span>
        </div>
        <div class="user-profile__date">가입일: {{ profile.createdAt }}</div>
      </div>

      <div class="user-profile__actions">
        <button v-if="isMyProfile" class="btn btn-primary" @click="goMessages">
          <Mail :size="16" />
          쪽지함
          <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
        </button>
        <button v-if="canSendMessage" class="btn btn-primary" @click="goSendMessage">
          <Mail :size="16" />
          쪽지 보내기
        </button>
        <template v-if="isMyProfile">
          <button v-if="isAdminOrManager" class="btn btn-secondary" @click="goManageBoard">
            <Shield :size="16" />
            관리 게시판
          </button>
          <button v-if="!userStore.emailVerified" class="btn btn-warning" @click="resendVerificationEmail">이메일 인증하기</button>
          <button class="btn btn-secondary" @click="showNicknameModal = true">닉네임 변경</button>
          <button class="btn btn-secondary" @click="showPasswordModal = true">비밀번호 변경</button>
        </template>
      </div>
    </div>

    <div class="user-profile__tabs">
      <button
        class="user-profile__tab"
        :class="{ 'is-active': activeTab === 'posts' }"
        @click="activeTab = 'posts'"
      >
        작성글
      </button>
      <button
        class="user-profile__tab"
        :class="{ 'is-active': activeTab === 'comments' }"
        @click="activeTab = 'comments'"
      >
        작성댓글
      </button>
    </div>

    <div class="user-profile__content">
      <UserPostList
        v-if="activeTab === 'posts'"
        :user-id="userId"
        @post-click="onPostClick"
      />
      <UserCommentList
        v-if="activeTab === 'comments'"
        :user-id="userId"
        @comment-click="onCommentClick"
      />
    </div>

    <!-- 닉네임 변경 모달 -->
    <div v-if="showNicknameModal" class="modal-overlay" @click.self="showNicknameModal = false">
      <div class="modal">
        <h3>닉네임 변경</h3>
        <p class="modal__info">변경 시 100P가 차감됩니다.</p>
        <p class="modal__rule">2~20자, 한글/영문/숫자만 가능</p>
        <input
          v-model="newNickname"
          type="text"
          class="modal__input"
          placeholder="새 닉네임"
        />
        <div class="modal__actions">
          <button class="btn btn-secondary" @click="showNicknameModal = false">취소</button>
          <button class="btn btn-primary" @click="changeNickname">변경</button>
        </div>
      </div>
    </div>

    <!-- 비밀번호 변경 모달 -->
    <div v-if="showPasswordModal" class="modal-overlay" @click.self="showPasswordModal = false">
      <div class="modal modal--password">
        <h3>비밀번호 변경</h3>
        <input
          v-model="currentPassword"
          type="password"
          class="modal__input"
          placeholder="현재 비밀번호"
        />
        <input
          v-model="newPassword"
          type="password"
          class="modal__input"
          placeholder="새 비밀번호"
        />

        <!-- 실시간 유효성 검사 -->
        <div v-if="newPassword" class="pw-validation">
          <div class="pw-validation__item" :class="{ 'is-valid': pwRules.length }">
            <span class="pw-validation__icon">{{ pwRules.length ? '✓' : '✗' }}</span>
            8~20자
          </div>
          <div class="pw-validation__item" :class="{ 'is-valid': pwRules.lowercase }">
            <span class="pw-validation__icon">{{ pwRules.lowercase ? '✓' : '✗' }}</span>
            소문자 포함
          </div>
          <div class="pw-validation__item" :class="{ 'is-valid': pwRules.uppercase }">
            <span class="pw-validation__icon">{{ pwRules.uppercase ? '✓' : '✗' }}</span>
            대문자 포함
          </div>
          <div class="pw-validation__item" :class="{ 'is-valid': pwRules.number }">
            <span class="pw-validation__icon">{{ pwRules.number ? '✓' : '✗' }}</span>
            숫자 포함
          </div>
        </div>

        <!-- 비밀번호 강도 -->
        <div v-if="newPassword" class="pw-strength">
          <div class="pw-strength__bar">
            <div
              class="pw-strength__fill"
              :class="'pw-strength__fill--' + pwStrength.level"
              :style="{ width: pwStrength.percent + '%' }"
            ></div>
          </div>
          <span class="pw-strength__label" :class="'pw-strength__label--' + pwStrength.level">
            {{ pwStrength.label }}
          </span>
        </div>

        <div class="modal__actions">
          <button class="btn btn-secondary" @click="showPasswordModal = false">취소</button>
          <button
            class="btn btn-primary"
            :disabled="!isPasswordValid"
            @click="changePassword"
          >변경</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Mail, Shield } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import api from '@/api/axios.js'
import { getUnreadCount } from '@/api/messageApi.js'
import { useUserStore } from '@/stores/userStore.js'
import LevelBadge from '@/components/common/LevelBadge.vue'
import UserPostList from '@/components/user/UserPostList.vue'
import UserCommentList from '@/components/user/UserCommentList.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const userId = computed(() => Number(route.params.userId))
const isMyProfile = computed(() => userStore.userId === userId.value)
const canSendMessage = computed(() => userStore.userId && !isMyProfile.value)
const isAdminOrManager = computed(() => ['ADMIN', 'MANAGER'].includes(profile.value.role))

const profile = ref({})
const levelInfo = ref(null)
const unreadCount = ref(0)
const activeTab = ref('posts')

// 경험치 계산
const isMaxLevel = computed(() => levelInfo.value && levelInfo.value.nextLevelExp === null)
const currentExp = computed(() => {
  if (!levelInfo.value || isMaxLevel.value) return 0
  return levelInfo.value.totalExp - levelInfo.value.requiredExp
})
const segmentTotal = computed(() => {
  if (!levelInfo.value || isMaxLevel.value) return 1
  return levelInfo.value.nextLevelExp - levelInfo.value.requiredExp
})
const expPercent = computed(() => {
  if (isMaxLevel.value) return 100
  if (!segmentTotal.value) return 0
  return Math.min(100, Math.round((currentExp.value / segmentTotal.value) * 100))
})

// 모달 상태
const showNicknameModal = ref(false)
const showPasswordModal = ref(false)
const newNickname = ref('')
const currentPassword = ref('')
const newPassword = ref('')

// 비밀번호 유효성 검사
const pwRules = computed(() => ({
  length: newPassword.value.length >= 8 && newPassword.value.length <= 20,
  lowercase: /[a-z]/.test(newPassword.value),
  uppercase: /[A-Z]/.test(newPassword.value),
  number: /\d/.test(newPassword.value),
}))

const isPasswordValid = computed(() =>
  pwRules.value.length &&
  pwRules.value.lowercase &&
  pwRules.value.uppercase &&
  pwRules.value.number
)

// 비밀번호 강도 계산
const pwStrength = computed(() => {
  const pw = newPassword.value
  let score = 0

  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[!@#$%^&*(),.?":{}|<>]/.test(pw)) score++

  if (score <= 2) return { level: 'weak', label: 'Weak', percent: 33 }
  if (score <= 3) return { level: 'medium', label: 'Medium', percent: 66 }
  return { level: 'strong', label: 'Strong', percent: 100 }
})

const loadProfile = async () => {
  const res = await api.get(`/users/${userId.value}`)
  profile.value = res.data
}

const loadLevelInfo = async () => {
  try {
    const res = await api.get(`/users/${userId.value}/level`)
    levelInfo.value = res.data
  } catch (e) {
    console.error('[UserProfile] 레벨 정보 조회 실패', e)
  }
}

const fetchUnreadCount = async () => {
  if (!isMyProfile.value || !userStore.userId) return
  try {
    const { data } = await getUnreadCount(userStore.userId)
    unreadCount.value = data.count
  } catch (e) {
    console.error('[UserProfile] 안읽은 쪽지 조회 실패', e)
  }
}

const changeNickname = async () => {
  try {
    const res = await api.put('/users/me/nickname', { nickname: newNickname.value })
    userStore.nickname = res.data.nickname
    userStore.point = res.data.remainingPoint
    localStorage.setItem('nickname', res.data.nickname)
    localStorage.setItem('point', res.data.remainingPoint)
    profile.value.nickname = res.data.nickname
    profile.value.point = res.data.remainingPoint
    showNicknameModal.value = false
    newNickname.value = ''
    toast.success('닉네임이 변경되었습니다.')
  } catch (e) {
    toast.error(e.response?.data?.message || '닉네임 변경에 실패했습니다.')
  }
}

const changePassword = async () => {
  try {
    await api.put('/users/me/password', {
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    })
    showPasswordModal.value = false
    currentPassword.value = ''
    newPassword.value = ''
    toast.success('비밀번호가 변경되었습니다.')
  } catch (e) {
    toast.error(e.response?.data?.message || '비밀번호 변경에 실패했습니다.')
  }
}

const onPostClick = (post) => {
  router.push({
    name: 'PostDetail',
    params: { boardId: post.boardId, postId: post.postId },
  })
}

const onCommentClick = (comment) => {
  router.push({
    name: 'PostDetail',
    params: { boardId: comment.boardId, postId: comment.postId },
  })
}

const goSendMessage = () => {
  router.push({ name: 'MessageCompose', query: { to: userId.value } })
}

const goMessages = () => {
  router.push('/messages')
}

const goManageBoard = () => {
  if (profile.value.role === 'ADMIN') {
    router.push({ name: 'admin' })
  } else {
    router.push({ name: 'manager-boards' })
  }
}

const resendVerificationEmail = async () => {
  try {
    await api.post('/users/email/resend')
    toast.success('인증 메일을 발송했습니다.')
  } catch (e) {
    toast.error(e.response?.data?.message || '메일 발송에 실패했습니다.')
  }
}

onMounted(() => {
  loadProfile()
  loadLevelInfo()
  fetchUnreadCount()
})

watch(userId, () => {
  loadProfile()
  loadLevelInfo()
  fetchUnreadCount()
})
</script>

<style scoped>
/* ==========================================
   User Profile - Developer Console Theme
   ========================================== */
.user-profile {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

/* ==========================================
   Profile Header Card
   ========================================== */
.user-profile__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  padding: 24px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: 24px;
}

.user-profile__main {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.user-profile__nickname {
  font-family: 'Outfit', sans-serif;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.5px;
}

/* Experience Bar */
.user-profile__exp {
  margin-bottom: 12px;
}

.user-profile__exp-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 6px;
  display: block;
}

.user-profile__exp-bar {
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
}

.user-profile__exp-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 3px;
  transition: width 0.4s ease;
}

.user-profile__stats {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.user-profile__stats span:first-child {
  color: var(--accent);
  font-weight: 600;
}

.user-profile__sep {
  margin: 0 8px;
  color: var(--text-muted);
}

.user-profile__date {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-muted);
}

.user-profile__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.user-profile__actions .btn-primary,
.user-profile__actions .btn-secondary {
  display: flex;
  align-items: center;
  gap: 6px;
  position: relative;
}

.user-profile__actions .unread-badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: var(--danger, #ef4444);
  color: white;
  font-size: 11px;
  font-weight: 600;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
}

/* ==========================================
   Tab Navigation - Pill Style
   ========================================== */
.user-profile__tabs {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: 20px;
}

.user-profile__tab {
  padding: 10px 20px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.user-profile__tab:hover {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

.user-profile__tab.is-active {
  color: var(--bg-primary);
  background: var(--accent);
  font-weight: 600;
}

/* ==========================================
   Content Section
   ========================================== */
.user-profile__content {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

/* Table Styles (for child components) */
.user-profile__content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.user-profile__content :deep(thead) {
  background: var(--bg-tertiary);
}

.user-profile__content :deep(th) {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
  font-size: 11px;
  color: var(--text-secondary);
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
}

.user-profile__content :deep(td) {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
  vertical-align: middle;
}

.user-profile__content :deep(tbody tr) {
  background: var(--bg-secondary);
  transition: background 0.15s ease;
  cursor: pointer;
}

.user-profile__content :deep(tbody tr:nth-child(even)) {
  background: var(--bg-tertiary);
}

.user-profile__content :deep(tbody tr:hover) {
  background: var(--bg-hover);
}

/* ==========================================
   Modal - Console Theme
   ========================================== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 28px;
  min-width: 360px;
  max-width: 90vw;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.modal h3 {
  font-family: 'Outfit', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.modal__info {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--accent);
  margin-bottom: 8px;
  padding: 8px 12px;
  background: var(--accent-dim);
  border-radius: 6px;
  border-left: 3px solid var(--accent);
}

.modal__rule {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.modal__input {
  width: 100%;
  padding: 12px 14px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  margin-bottom: 12px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  color: var(--text-primary);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.modal__input::placeholder {
  color: var(--text-muted);
}

.modal__input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-dim);
}

.modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

/* ==========================================
   Password Validation
   ========================================== */
.pw-validation {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 16px;
  margin-bottom: 16px;
}

.pw-validation__item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--text-muted);
  transition: color 0.2s ease;
}

.pw-validation__item.is-valid {
  color: var(--accent);
}

.pw-validation__icon {
  font-size: 12px;
}

.pw-validation__item:not(.is-valid) .pw-validation__icon {
  color: var(--danger);
}

/* ==========================================
   Password Strength
   ========================================== */
.pw-strength {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.pw-strength__bar {
  flex: 1;
  height: 4px;
  background: var(--bg-tertiary);
  border-radius: 2px;
  overflow: hidden;
}

.pw-strength__fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease, background 0.3s ease;
}

.pw-strength__fill--weak {
  background: var(--danger);
}

.pw-strength__fill--medium {
  background: #f59e0b;
}

.pw-strength__fill--strong {
  background: var(--accent);
}

.pw-strength__label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  min-width: 50px;
}

.pw-strength__label--weak {
  color: var(--danger);
}

.pw-strength__label--medium {
  color: #f59e0b;
}

.pw-strength__label--strong {
  color: var(--accent);
}

/* ==========================================
   Responsive - Tablet
   ========================================== */
@media (max-width: 768px) {
  .user-profile {
    padding: 24px 16px;
  }

  .user-profile__header {
    flex-direction: column;
    gap: 16px;
  }

  .user-profile__actions {
    width: 100%;
  }

  .user-profile__actions .btn {
    flex: 1;
  }

  .user-profile__nickname {
    font-size: 20px;
  }
}

/* ==========================================
   Responsive - Mobile
   ========================================== */
@media (max-width: 480px) {
  .user-profile__stats {
    flex-wrap: wrap;
    font-size: 12px;
  }

  .user-profile__tabs {
    width: 100%;
  }

  .user-profile__tab {
    flex: 1;
    text-align: center;
    padding: 10px 12px;
    font-size: 12px;
  }

  .modal {
    min-width: auto;
    width: calc(100vw - 32px);
    padding: 20px;
  }
}

/* ==========================================
   THEME: Discord
   ========================================== */
:global([data-theme="discord"]) .user-profile__header {
  border-radius: 4px;
}

:global([data-theme="discord"]) .user-profile__tabs {
  border-radius: 4px;
}

:global([data-theme="discord"]) .user-profile__tab {
  border-radius: 3px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

:global([data-theme="discord"]) .user-profile__content {
  border-radius: 4px;
}

:global([data-theme="discord"]) .modal {
  border-radius: 4px;
}

/* ==========================================
   THEME: Glass
   ========================================== */
:global([data-theme="glass"]) .user-profile__header {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

:global([data-theme="glass"]) .user-profile__tabs {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border-radius: 12px;
}

:global([data-theme="glass"]) .user-profile__tab.is-active {
  background: rgba(255, 255, 255, 0.15);
  color: var(--text-primary);
}

:global([data-theme="glass"]) .user-profile__content {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

:global([data-theme="glass"]) .user-profile__content :deep(thead) {
  background: rgba(255, 255, 255, 0.03);
}

:global([data-theme="glass"]) .user-profile__content :deep(tbody tr) {
  background: transparent;
}

:global([data-theme="glass"]) .user-profile__content :deep(tbody tr:nth-child(even)) {
  background: rgba(255, 255, 255, 0.02);
}

:global([data-theme="glass"]) .user-profile__content :deep(tbody tr:hover) {
  background: rgba(255, 255, 255, 0.08);
}

:global([data-theme="glass"]) .modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
}

:global([data-theme="glass"]) .modal {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border-radius: 20px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
}

:global([data-theme="glass"]) .modal__input {
  background: rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.1);
}

:global([data-theme="glass"]) .modal__input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
}
</style>
