<template>
  <div class="message-compose-view">
    <div class="compose-header">
      <button class="back-btn" @click="goBack">
        <ChevronLeft :size="20" />
        취소
      </button>
      <h2>쪽지 보내기</h2>
    </div>

    <form @submit.prevent="send" class="compose-form">
      <div class="form-group receiver-group">
        <label>받는 사람</label>
        <div class="receiver-input-wrap">
          <input
            v-model="receiverNickname"
            type="text"
            placeholder="닉네임 입력"
            :disabled="!!selectedReceiverId"
            @input="onNicknameInput"
            required
          />
          <button
            v-if="selectedReceiverId && !initialReceiverId"
            type="button"
            class="clear-receiver-btn"
            @click="clearReceiver"
          >
            <X :size="16" />
          </button>
        </div>
        <ul v-if="searchResults.length > 0 && !selectedReceiverId" class="search-dropdown">
          <li
            v-for="user in searchResults"
            :key="user.userId"
            @mousedown.prevent="selectReceiver(user)"
          >
            {{ user.nickname }}
          </li>
        </ul>
        <span v-if="searching" class="search-status">검색 중...</span>
        <span v-else-if="searchDone && searchResults.length === 0" class="search-status">검색 결과가 없습니다</span>
      </div>

      <div class="form-group">
        <label>내용</label>
        <textarea
          v-model="content"
          placeholder="쪽지 내용을 입력하세요"
          rows="10"
          maxlength="2000"
          required
        ></textarea>
        <span class="char-count">{{ content.length }} / 2000</span>
      </div>

      <div class="form-group point-group">
        <label>
          <Gift :size="16" />
          포인트 선물 (선택)
        </label>
        <div class="point-input">
          <input
            v-model.number="point"
            type="number"
            min="0"
            :max="userStore.point"
            placeholder="0"
          />
          <span class="point-label">P</span>
        </div>
        <span class="point-info">보유: {{ userStore.point?.toLocaleString() }}P</span>
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="sending" class="send-btn">
          {{ sending ? '전송 중...' : '보내기' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, Gift, X } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useUserStore } from '@/stores/userStore.js'
import { sendMessage, searchUsers } from '@/api/messageApi.js'
import api from '@/api/axios.js'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const initialReceiverId = ref(route.query.to ? Number(route.query.to) : null)
const selectedReceiverId = ref(initialReceiverId.value)
const receiverNickname = ref('')
const content = ref('')
const point = ref(0)
const sending = ref(false)
const searchResults = ref([])
const searching = ref(false)
const searchDone = ref(false)
let searchTimer = null

const fetchReceiverNickname = async () => {
  if (!initialReceiverId.value) return
  try {
    const { data } = await api.get(`/users/${initialReceiverId.value}`)
    receiverNickname.value = data.nickname
  } catch (e) {
    console.error(e)
  }
}

const onNicknameInput = () => {
  if (selectedReceiverId.value) return
  clearTimeout(searchTimer)
  searchDone.value = false

  const query = receiverNickname.value.trim()
  if (query.length < 1) {
    searchResults.value = []
    return
  }

  searchTimer = setTimeout(async () => {
    if (selectedReceiverId.value) return
    searching.value = true
    try {
      const { data } = await searchUsers(query)
      if (selectedReceiverId.value) return
      searchResults.value = data
      searchDone.value = true
    } catch (e) {
      console.error(e)
    } finally {
      searching.value = false
    }
  }, 300)
}

const selectReceiver = (user) => {
  clearTimeout(searchTimer)
  selectedReceiverId.value = user.userId
  receiverNickname.value = user.nickname
  searchResults.value = []
}

const clearReceiver = () => {
  selectedReceiverId.value = null
  receiverNickname.value = ''
  searchResults.value = []
}

const goBack = () => {
  router.back()
}

const send = async () => {
  if (!content.value.trim()) {
    toast.warning('내용을 입력해주세요.')
    return
  }

  if (!selectedReceiverId.value) {
    toast.warning('받는 사람을 선택해주세요.')
    return
  }

  sending.value = true
  try {
    await sendMessage(userStore.userId, selectedReceiverId.value, content.value, point.value || 0)
    toast.success('쪽지를 보냈습니다.')
    router.push({ name: 'MessageList' })
  } catch (e) {
    const msg = e.response?.data?.message || '쪽지 전송에 실패했습니다.'
    toast.error(msg)
  } finally {
    sending.value = false
  }
}

onMounted(fetchReceiverNickname)
onUnmounted(() => clearTimeout(searchTimer))
</script>

<style scoped>
.message-compose-view {
  max-width: 600px;
  margin: 0 auto;
  padding: 24px;
}

.compose-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
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
  color: var(--text-secondary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  transition: all 0.2s ease;
}

.back-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.compose-header h2 {
  margin: 0;
  font-family: 'Outfit', sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.compose-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.form-group input,
.form-group textarea {
  padding: 12px 14px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--accent);
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: var(--text-muted);
}

.form-group input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.receiver-group {
  position: relative;
}

.receiver-input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.receiver-input-wrap input {
  flex: 1;
}

.clear-receiver-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.clear-receiver-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin: 4px 0 0;
  padding: 4px 0;
  list-style: none;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
}

.search-dropdown li {
  padding: 10px 14px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  color: var(--text-primary);
  cursor: pointer;
  transition: background 0.15s ease;
}

.search-dropdown li:hover {
  background: var(--bg-tertiary);
}

.search-status {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-muted);
}

.form-group textarea {
  resize: vertical;
  min-height: 200px;
  line-height: 1.6;
}

.char-count {
  text-align: right;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-muted);
}

.point-group .point-input {
  display: flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
}

.point-group input {
  width: 120px;
  text-align: right;
}

.point-label {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
  color: var(--accent);
}

.point-info {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-muted);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.send-btn {
  padding: 10px 28px;
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

.send-btn:hover {
  filter: brightness(1.1);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  .message-compose-view {
    padding: 16px;
  }

  .compose-form {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .compose-header h2 {
    font-size: 18px;
  }

  .form-group textarea {
    min-height: 160px;
  }

  .send-btn {
    width: 100%;
  }

  .form-actions {
    justify-content: stretch;
  }
}
</style>
