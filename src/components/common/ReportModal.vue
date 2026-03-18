<template>
  <Teleport to="body">
    <div v-if="visible" class="report-overlay" @click.self="close">
      <div class="report-modal">
        <div class="report-header">
          <Flag :size="18" />
          <span>신고하기</span>
          <button class="close-btn" @click="close">
            <X :size="18" />
          </button>
        </div>

        <div class="report-body">
          <p class="report-target">
            <span class="target-type">{{ targetTypeLabel }}</span>
            신고
          </p>

          <div class="reason-list">
            <label
              v-for="r in reasons"
              :key="r.value"
              class="reason-item"
              :class="{ selected: reason === r.value }"
            >
              <input
                type="radio"
                :value="r.value"
                v-model="reason"
              />
              <span>{{ r.label }}</span>
            </label>
          </div>

          <textarea
            v-if="reason === 'OTHER'"
            v-model="description"
            placeholder="신고 사유를 입력해주세요 (최대 500자)"
            maxlength="500"
            class="description-input"
          />
        </div>

        <div class="report-footer">
          <button class="cancel-btn" @click="close">취소</button>
          <button
            class="submit-btn"
            :disabled="!reason || submitting"
            @click="submit"
          >
            {{ submitting ? '신고 중...' : '신고하기' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Flag, X } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { createReport } from '@/api/reportApi.js'
import { useUserStore } from '@/stores/userStore.js'

const props = defineProps({
  visible: { type: Boolean, default: false },
  targetType: { type: String, default: '' }, // POST, COMMENT, USER
  targetId: { type: Number, default: null }
})

const emit = defineEmits(['close', 'success'])

const userStore = useUserStore()

const reason = ref('')
const description = ref('')
const submitting = ref(false)

const reasons = [
  { value: 'SPAM', label: '스팸/도배' },
  { value: 'ABUSE', label: '욕설/비방' },
  { value: 'ADULT', label: '음란물' },
  { value: 'ILLEGAL', label: '불법정보' },
  { value: 'OTHER', label: '기타' }
]

const targetTypeLabel = computed(() => {
  const labels = { POST: '게시글', COMMENT: '댓글', USER: '사용자' }
  return labels[props.targetType] || ''
})

const close = () => {
  reason.value = ''
  description.value = ''
  emit('close')
}

const submit = async () => {
  if (!reason.value || submitting.value) return

  submitting.value = true
  try {
    await createReport(
      userStore.userId,
      props.targetType,
      props.targetId,
      reason.value,
      description.value
    )
    toast.success('신고가 접수되었습니다.')
    emit('success')
    close()
  } catch (e) {
    const msg = e.response?.data?.message || '신고 접수에 실패했습니다.'
    toast.error(msg)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.report-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.report-modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  margin: 16px;
}

.report-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  color: var(--danger);
  font-weight: 600;
}

.close-btn {
  margin-left: auto;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
}

.close-btn:hover {
  color: var(--text-primary);
}

.report-body {
  padding: 16px;
}

.report-target {
  margin-bottom: 16px;
  color: var(--text-secondary);
  font-size: 14px;
}

.target-type {
  font-weight: 600;
  color: var(--text-primary);
}

.reason-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reason-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.reason-item:hover {
  border-color: var(--accent);
}

.reason-item.selected {
  border-color: var(--accent);
  background: var(--accent-dim);
}

.reason-item input {
  accent-color: var(--accent);
}

.description-input {
  width: 100%;
  margin-top: 12px;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 14px;
  resize: vertical;
  min-height: 80px;
}

.description-input:focus {
  outline: none;
  border-color: var(--accent);
}

.report-footer {
  display: flex;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid var(--border-color);
}

.cancel-btn,
.submit-btn {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
}

.cancel-btn {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.cancel-btn:hover {
  background: var(--border-color);
}

.submit-btn {
  background: var(--danger);
  color: white;
}

.submit-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
