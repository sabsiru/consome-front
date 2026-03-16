<template>
  <div class="notification-page">
    <div class="page-header">
      <h2 class="page-title">알림</h2>
      <button v-if="unreadCount > 0" class="read-all-btn" @click="handleMarkAllAsRead">전체 읽음 처리</button>
    </div>

    <div v-if="notifications.length === 0" class="empty-state">
      알림이 없습니다.
    </div>

    <ul v-else class="notification-list">
      <li
        v-for="n in notifications"
        :key="n.id"
        class="notification-item"
        :class="{ unread: !n.isRead }"
        @click="handleClick(n)"
      >
        <div class="item-top">
          <span class="notification-type" :class="n.type.toLowerCase()">{{ typeLabel(n.type) }}</span>
          <span class="notification-time">{{ formatDate(n.createdAt) }}</span>
        </div>
        <p class="notification-message">{{ n.message }}</p>
        <p v-if="n.actorNickname" class="notification-actor">by {{ n.actorNickname }}</p>
      </li>
    </ul>

    <div v-if="totalPages > 1" class="pagination">
      <button :disabled="currentPage === 0" @click="loadPage(currentPage - 1)">이전</button>
      <span class="page-info">{{ currentPage + 1 }} / {{ totalPages }}</span>
      <button :disabled="currentPage >= totalPages - 1" @click="loadPage(currentPage + 1)">다음</button>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore.js'
import { useNotificationStore } from '@/stores/notificationStore.js'
import { storeToRefs } from 'pinia'

const router = useRouter()
const userStore = useUserStore()
const notificationStore = useNotificationStore()
const { notifications, unreadCount, totalPages, currentPage } = storeToRefs(notificationStore)

onMounted(() => {
  notificationStore.fetchNotifications(userStore.userId)
})

const loadPage = (page) => {
  notificationStore.fetchNotifications(userStore.userId, page)
}

const handleClick = (notification) => {
  if (!notification.isRead) {
    notificationStore.markAsRead(notification.id, userStore.userId)
  }

  if (notification.type === 'MESSAGE') {
    router.push(`/messages/${notification.targetId}`)
  } else {
    router.push(`/boards/${notification.referenceId}/posts/${notification.targetId}`)
  }
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

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)

  if (diff < 60) return '방금'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`

  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.notification-page {
  max-width: 700px;
  margin: 0 auto;
  padding: 24px var(--app-padding-x);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 18px;
  color: var(--text-primary);
}

.read-all-btn {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--accent);
  background: transparent;
  border: 1px solid var(--accent);
  border-radius: 4px;
  padding: 6px 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.read-all-btn:hover {
  background: var(--accent);
  color: var(--bg-primary);
}

.empty-state {
  text-align: center;
  padding: 48px 16px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: var(--text-muted);
}

.notification-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.notification-item {
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  background: var(--bg-secondary);
}

.notification-item:hover {
  border-color: var(--accent);
  background: var(--accent-dim);
}

.notification-item.unread {
  border-left: 3px solid var(--accent);
  background: rgba(var(--accent-rgb, 59, 130, 246), 0.03);
}

.item-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.notification-type {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 3px;
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

.notification-time {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--text-muted);
}

.notification-message {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: var(--text-primary);
  margin: 0 0 4px 0;
  line-height: 1.5;
}

.notification-actor {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--text-muted);
  margin: 0;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}

.pagination button {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  padding: 8px 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination button:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}

.pagination button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-muted);
}
</style>
