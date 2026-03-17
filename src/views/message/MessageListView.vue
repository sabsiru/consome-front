<template>
  <div class="message-list-view">
    <div class="message-header">
      <h2>쪽지함</h2>
      <div class="tab-buttons">
        <button
          :class="{ active: activeTab === 'received' }"
          @click="activeTab = 'received'"
        >
          받은 쪽지
        </button>
        <button
          :class="{ active: activeTab === 'sent' }"
          @click="activeTab = 'sent'"
        >
          보낸 쪽지
        </button>
      </div>
      <button class="compose-btn" @click="goToCompose">
        <Mail :size="16" />
        쪽지 쓰기
      </button>
    </div>

    <div class="message-list">
      <div v-if="loading" class="loading">로딩 중...</div>
      <div v-else-if="messages.length === 0" class="empty">
        {{ activeTab === 'received' ? '받은 쪽지가 없습니다.' : '보낸 쪽지가 없습니다.' }}
      </div>
      <div
        v-else
        v-for="message in messages"
        :key="message.id"
        class="message-item"
        :class="{ unread: !message.isRead && activeTab === 'received' }"
        @click="goToDetail(message.id)"
      >
        <div class="message-info">
          <span class="nickname">{{ message.otherUserNickname }}</span>
          <span class="date">{{ formatDate(message.createdAt) }}</span>
        </div>
        <div class="message-preview">
          {{ message.contentPreview }}
          <span v-if="message.point > 0" class="point-badge">
            +{{ message.point }}P
          </span>
        </div>
      </div>
    </div>

    <div v-if="totalPages > 1" class="pagination">
      <button :disabled="page === 0" @click="changePage(page - 1)">이전</button>
      <span>{{ page + 1 }} / {{ totalPages }}</span>
      <button :disabled="page >= totalPages - 1" @click="changePage(page + 1)">다음</button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Mail } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useUserStore } from '@/stores/userStore.js'
import { getReceivedMessages, getSentMessages } from '@/api/messageApi.js'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('received')
const messages = ref([])
const loading = ref(false)
const page = ref(0)
const totalPages = ref(0)

const fetchMessages = async () => {
  if (!userStore.userId) return
  loading.value = true
  try {
    const api = activeTab.value === 'received' ? getReceivedMessages : getSentMessages
    const { data } = await api(userStore.userId, page.value)
    messages.value = data.content
    totalPages.value = data.totalPages
  } catch (e) {
    toast.error('쪽지를 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
}

const changePage = (newPage) => {
  page.value = newPage
  fetchMessages()
}

const goToDetail = (messageId) => {
  router.push({ name: 'MessageDetail', params: { messageId } })
}

const goToCompose = () => {
  router.push({ name: 'MessageCompose' })
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  if (isToday) {
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
  }
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

watch(activeTab, () => {
  page.value = 0
  fetchMessages()
})

onMounted(fetchMessages)
</script>

<style scoped>
.message-list-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.message-header h2 {
  margin: 0;
  font-family: 'Outfit', sans-serif;
  font-size: 22px;
  font-weight: 600;
  color: var(--text-primary);
  flex-shrink: 0;
}

.tab-buttons {
  display: flex;
  gap: 4px;
}

.tab-buttons button {
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  background: var(--bg-tertiary);
  border-radius: 6px;
  cursor: pointer;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.tab-buttons button:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.tab-buttons button.active {
  background: var(--accent);
  color: var(--bg-primary);
  border-color: var(--accent);
}

.compose-btn {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--accent);
  color: var(--bg-primary);
  border: none;
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.compose-btn:hover {
  filter: brightness(1.1);
}

.message-list {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.message-item {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.15s ease;
}

.message-item:last-child {
  border-bottom: none;
}

.message-item:hover {
  background: var(--bg-hover);
}

.message-item.unread {
  background: var(--accent-dim);
  border-left: 3px solid var(--accent);
}

.message-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.nickname {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
  color: var(--text-primary);
}

.date {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-muted);
}

.message-preview {
  font-size: 14px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.point-badge {
  background: var(--accent);
  color: var(--bg-primary);
  padding: 2px 8px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 600;
}

.loading, .empty {
  padding: 48px;
  text-align: center;
  color: var(--text-muted);
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
}

.pagination button {
  padding: 8px 14px;
  border: 1px solid var(--border-color);
  background: var(--bg-tertiary);
  border-radius: 6px;
  cursor: pointer;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: var(--text-secondary);
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

.pagination span {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: var(--text-muted);
}

/* Responsive */
@media (max-width: 768px) {
  .message-list-view {
    padding: 16px;
  }

  .message-header {
    flex-wrap: wrap;
    gap: 12px;
  }

  .compose-btn {
    margin-left: 0;
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .message-header h2 {
    font-size: 18px;
  }

  .tab-buttons {
    width: 100%;
  }

  .tab-buttons button {
    flex: 1;
    text-align: center;
    font-size: 12px;
    padding: 8px 10px;
  }

  .message-item {
    padding: 12px;
  }

  .message-preview {
    font-size: 13px;
  }
}
</style>
