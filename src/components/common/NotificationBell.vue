<template>
  <div class="notification-bell" ref="bellRef">
    <button class="bell-btn" @click="toggleDropdown">
      <Bell :size="16" />
      <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
    </button>

    <div v-if="showDropdown" class="notification-dropdown">
      <div class="dropdown-header">
        <span class="dropdown-title">알림</span>
        <button v-if="unreadCount > 0" class="read-all-btn" @click="handleMarkAllAsRead">전체 읽음</button>
      </div>

      <div v-if="notifications.length === 0" class="dropdown-empty">
        새로운 알림이 없습니다.
      </div>

      <ul v-else class="notification-list">
        <li
          v-for="n in notifications.slice(0, 10)"
          :key="n.id"
          class="notification-item"
          :class="{ unread: !n.isRead }"
          @click="handleClick(n)"
        >
          <button class="delete-btn" @click.stop="handleDelete(n.id)" title="삭제">
            <X :size="12" />
          </button>
          <span class="notification-type" :class="n.type.toLowerCase()">{{ typeLabel(n.type) }}</span>
          <span class="notification-message">{{ n.message }}</span>
          <span class="notification-time">{{ timeAgo(n.createdAt) }}</span>
          <span v-if="n.actorNickname" class="notification-actor">{{ n.actorNickname }}</span>
        </li>
      </ul>

      <div class="dropdown-footer">
        <RouterLink to="/notifications" class="view-all" @click="showDropdown = false">전체 보기</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useUserStore } from '@/stores/userStore.js'
import { useNotificationStore } from '@/stores/notificationStore.js'
import { storeToRefs } from 'pinia'
import { Bell, X } from 'lucide-vue-next'

const router = useRouter()
const userStore = useUserStore()
const notificationStore = useNotificationStore()
const { unreadCount, notifications } = storeToRefs(notificationStore)

const showDropdown = ref(false)
const bellRef = ref(null)

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
  if (showDropdown.value) {
    notificationStore.fetchNotifications(userStore.userId)
  }
}

const handleClick = (notification) => {
  if (!notification.isRead) {
    notificationStore.markAsRead(notification.id, userStore.userId)
  }

  showDropdown.value = false

  if (notification.type === 'MESSAGE') {
    router.push(`/messages/${notification.targetId}`)
  } else {
    // COMMENT, REPLY → 게시글로 이동 (referenceId = boardId)
    router.push(`/boards/${notification.referenceId}/posts/${notification.targetId}`)
  }
}

const handleDelete = (notificationId) => {
  notificationStore.deleteOne(notificationId, userStore.userId)
}

const handleMarkAllAsRead = () => {
  notificationStore.markAllAsRead(userStore.userId)
}

const typeLabel = (type) => {
  switch (type) {
    case 'COMMENT': return '댓글'
    case 'REPLY': return '답글'
    case 'MESSAGE': return '쪽지'
    default: return ''
  }
}

const timeAgo = (dateStr) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)

  if (diff < 60) return '방금'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  return `${Math.floor(diff / 86400)}일 전`
}

// 외부 클릭 시 드롭다운 닫기
const handleOutsideClick = (e) => {
  if (bellRef.value && !bellRef.value.contains(e.target)) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
})
</script>

<style scoped>
.notification-bell {
  position: relative;
}

.bell-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  min-width: 32px;
  padding: 0;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
}

.bell-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
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

.notification-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 340px;
  max-height: 480px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  z-index: 200;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
}

.dropdown-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.read-all-btn {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--accent);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.read-all-btn:hover {
  background: var(--accent-dim);
}

.dropdown-empty {
  padding: 32px 16px;
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-muted);
}

.notification-list {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  max-height: 360px;
}

.notification-item {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 16px;
  padding-right: 32px;
  cursor: pointer;
  transition: background 0.15s ease;
  border-bottom: 1px solid var(--border-color);
}

.delete-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 3px;
  color: var(--text-muted);
  cursor: pointer;
  opacity: 0;
  transition: all 0.15s ease;
}

.notification-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: var(--danger, #ef4444);
  background: rgba(239, 68, 68, 0.1);
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item:hover {
  background: var(--accent-dim);
}

.notification-item.unread {
  background: rgba(var(--accent-rgb, 59, 130, 246), 0.05);
  border-left: 3px solid var(--accent);
}

.notification-type {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 3px;
  width: fit-content;
}

.notification-type.comment {
  color: var(--accent);
  background: var(--accent-dim);
}

.notification-type.reply {
  color: var(--success, #22c55e);
  background: rgba(34, 197, 94, 0.1);
}

.notification-type.message {
  color: var(--warning, #f59e0b);
  background: rgba(245, 158, 11, 0.1);
}

.notification-message {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-primary);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-time {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--text-muted);
}

.notification-actor {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--text-muted);
}

.dropdown-footer {
  padding: 10px 16px;
  border-top: 1px solid var(--border-color);
  text-align: center;
}

.view-all {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--accent);
  text-decoration: none;
}

.view-all:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .notification-dropdown {
    width: 300px;
    right: -60px;
  }
}
</style>
