<template>
  <nav class="post-fab" aria-label="게시글 네비게이션">
    <button type="button" class="post-fab__btn" aria-label="맨 위로" @click="scrollTop">
      <ChevronUp :size="20" />
    </button>
    <button type="button" class="post-fab__btn" aria-label="본문으로 이동" @click="scrollBody">
      <FileText :size="20" />
    </button>
    <button
      v-if="showComment"
      type="button"
      class="post-fab__btn"
      aria-label="댓글로 이동"
      @click="scrollComments"
    >
      <MessageCircle :size="20" />
    </button>
    <button type="button" class="post-fab__btn" aria-label="맨 아래로" @click="scrollBottom">
      <ChevronDown :size="20" />
    </button>
  </nav>
</template>

<script setup>
import { ChevronUp, ChevronDown, FileText, MessageCircle } from 'lucide-vue-next'

defineProps({
  showComment: {
    type: Boolean,
    default: true,
  },
})

function scrollTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function scrollBottom() {
  window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })
}

function scrollBody() {
  const target = document.querySelector('.post-body')
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function scrollComments() {
  const target = document.querySelector('.post-comments')
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>

<style scoped>
.post-fab {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 950;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.post-fab__btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--border-color);
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: background 0.15s ease, color 0.15s ease, transform 0.1s ease;
}

.post-fab__btn:hover {
  background: var(--bg-hover);
  color: var(--accent);
}

.post-fab__btn:active {
  transform: scale(0.95);
}

@media (max-width: 768px) {
  .post-fab {
    right: 16px;
    bottom: 16px;
  }
}
</style>
