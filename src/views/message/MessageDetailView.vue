<template>
  <div class="message-detail-view">
    <div class="message-header">
      <button class="back-btn" @click="goBack">
        <ChevronLeft :size="20" />
        목록으로
      </button>
      <div class="actions">
        <button class="reply-btn" @click="reply">답장</button>
        <button class="delete-btn" @click="deleteMsg">삭제</button>
      </div>
    </div>

    <div v-if="loading" class="loading">로딩 중...</div>
    <div v-else-if="message" class="message-content">
      <div class="message-meta">
        <div class="user-info">
          <span class="label">{{ isSender ? '받는 사람' : '보낸 사람' }}</span>
          <span class="nickname">{{ isSender ? message.receiverNickname : message.senderNickname }}</span>
        </div>
        <div class="date">{{ formatDate(message.createdAt) }}</div>
      </div>

      <div v-if="message.point > 0" class="point-gift">
        <Gift :size="20" />
        <span>{{ message.point }}P 선물</span>
      </div>

      <div class="content">{{ message.content }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, Gift } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useUserStore } from '@/stores/userStore.js'
import { readMessage, deleteMessage } from '@/api/messageApi.js'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const message = ref(null)
const loading = ref(false)

const messageId = computed(() => Number(route.params.messageId))
const isSender = computed(() => message.value?.senderId === userStore.userId)

const fetchMessage = async () => {
  loading.value = true
  try {
    const { data } = await readMessage(messageId.value, userStore.userId)
    message.value = data
  } catch (e) {
    console.error(e)
    toast.error('쪽지를 불러올 수 없습니다.')
    router.back()
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push({ name: 'MessageList' })
}

const reply = () => {
  const receiverId = isSender.value ? message.value.receiverId : message.value.senderId
  router.push({ name: 'MessageCompose', query: { to: receiverId } })
}

const deleteMsg = async () => {
  if (!confirm('쪽지를 삭제하시겠습니까?')) return
  try {
    await deleteMessage(messageId.value, userStore.userId)
    router.push({ name: 'MessageList' })
  } catch (e) {
    toast.error('삭제에 실패했습니다.')
  }
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(fetchMessage)
</script>

<style scoped>
.message-detail-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.back-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.actions {
  display: flex;
  gap: 8px;
}

.reply-btn {
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

.reply-btn:hover {
  filter: brightness(1.1);
}

.delete-btn {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--danger);
  color: var(--danger);
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.delete-btn:hover {
  background: var(--danger);
  color: white;
}

.message-content {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 24px;
}

.message-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 16px;
}

.user-info {
  display: flex;
  gap: 8px;
  align-items: center;
}

.label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: var(--text-muted);
}

.nickname {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.date {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-muted);
}

.point-gift {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--accent-dim);
  color: var(--accent);
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 16px;
}

.content {
  white-space: pre-wrap;
  line-height: 1.7;
  font-size: 14px;
  color: var(--text-primary);
}

.loading {
  text-align: center;
  padding: 48px;
  color: var(--text-muted);
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
}
</style>
