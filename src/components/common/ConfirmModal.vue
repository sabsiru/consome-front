<template>
  <Teleport to="body">
    <Transition name="confirm-fade">
      <div v-if="visible" class="confirm-overlay" @click.self="handleCancel">
        <div class="confirm-modal">
          <p class="confirm-message">{{ message }}</p>
          <div class="confirm-actions">
            <button class="confirm-cancel" @click="handleCancel">취소</button>
            <button class="confirm-ok" ref="okBtn" @click="handleConfirm">확인</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { watch, ref, nextTick } from 'vue'
import { useConfirm } from '@/composables/useConfirm.js'

const { visible, message, handleConfirm, handleCancel } = useConfirm()
const okBtn = ref(null)

watch(visible, async (v) => {
  if (v) {
    await nextTick()
    okBtn.value?.focus()
  }
})
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.confirm-modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 24px;
  min-width: 320px;
  max-width: 420px;
}

.confirm-message {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  color: var(--text-primary);
  margin: 0 0 20px 0;
  line-height: 1.5;
  word-break: keep-all;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.confirm-cancel,
.confirm-ok {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  padding: 8px 20px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.confirm-cancel {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.confirm-cancel:hover {
  border-color: var(--text-muted);
  color: var(--text-primary);
}

.confirm-ok {
  background: var(--accent);
  border: 1px solid var(--accent);
  color: var(--bg-primary);
  font-weight: 600;
}

.confirm-ok:hover {
  opacity: 0.85;
}

.confirm-ok:focus {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* Transition */
.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: opacity 0.15s ease;
}

.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}
</style>
