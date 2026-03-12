<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="not-found">
    <div class="not-found-content">
      <span class="error-code">404</span>
      <h1 class="error-title">페이지를 찾을 수 없습니다</h1>
      <p class="error-description">요청하신 페이지가 존재하지 않거나 이동되었습니다.</p>
      <div class="error-actions">
        <button class="btn-back" @click="router.back()">이전 페이지</button>
        <button class="btn-home" @click="router.push('/')">홈으로</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
}

.not-found-content {
  text-align: center;
}

.error-code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 6rem;
  font-weight: 600;
  color: var(--accent);
  line-height: 1;
  opacity: 0.8;
}

.error-title {
  margin-top: 1rem;
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--text-primary);
}

.error-description {
  margin-top: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.error-actions {
  margin-top: 2rem;
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.btn-back,
.btn-home {
  padding: 0.6rem 1.5rem;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-back:hover {
  background: var(--bg-hover);
}

.btn-home {
  background: var(--accent);
  color: var(--bg-primary);
  border: none;
  font-weight: 500;
}

.btn-home:hover {
  opacity: 0.9;
}
</style>
