<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="close">
      <div class="modal-content" :style="modalStyle">
        <div class="modal-header" :class="{ 'is-me': isMe }">
          <LevelBadge :level="level" :role="role" />
          <span class="nickname">{{ nickname }}</span>
          <span v-if="isMe" class="me-badge">나</span>
        </div>
        <div class="modal-actions">
          <button @click="goProfile">
            <User :size="16" />
            정보 보기
          </button>
          <button v-if="canSendMessage" @click="sendMessage">
            <Mail :size="16" />
            쪽지 보내기
          </button>
          <button v-if="canReport" class="report-btn" @click="reportUser">
            <Flag :size="16" />
            신고하기
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { User, Mail, Flag } from 'lucide-vue-next'
import LevelBadge from '@/components/common/LevelBadge.vue'
import { useUserStore } from '@/stores/userStore.js'

const props = defineProps({
  visible: { type: Boolean, default: false },
  userId: { type: Number, required: true },
  nickname: { type: String, required: true },
  level: { type: Number, default: 1 },
  role: { type: String, default: 'USER' },
  position: { type: Object, default: () => ({ x: 0, y: 0 }) }
})

const emit = defineEmits(['close', 'report'])

const router = useRouter()
const userStore = useUserStore()

const isMe = computed(() => userStore.userId === props.userId)

const canSendMessage = computed(() => {
  return userStore.userId && !isMe.value
})

const canReport = computed(() => {
  return userStore.userId && !isMe.value
})

const modalStyle = computed(() => ({
  position: 'fixed',
  left: `${props.position.x}px`,
  top: `${props.position.y}px`
}))

const close = () => emit('close')

const goProfile = () => {
  router.push(`/users/${props.userId}`)
  close()
}

const sendMessage = () => {
  router.push({ name: 'MessageCompose', query: { to: props.userId } })
  close()
}

const reportUser = () => {
  emit('report', { targetType: 'USER', targetId: props.userId })
  close()
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  min-width: 160px;
  z-index: 1001;
}

.modal-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 8px;
}

.nickname {
  font-weight: 600;
  color: var(--text-primary);
}

.me-badge {
  margin-left: auto;
  padding: 2px 8px;
  background: var(--accent);
  color: var(--bg-primary);
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 600;
}

.modal-header.is-me {
  background: var(--accent-dim);
}

.modal-actions {
  padding: 8px 0;
}

.modal-actions button {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  text-align: left;
}

.modal-actions button:hover {
  background: var(--accent-dim);
  color: var(--accent);
}

.modal-actions .report-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}
</style>
