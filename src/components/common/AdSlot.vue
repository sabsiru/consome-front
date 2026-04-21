<template>
  <div :class="['ad-placement', `ad-placement--${placement}`]">
    <div class="ad-placement__inner">
      <Megaphone class="ad-placement__icon" :size="20" :stroke-width="1.5" />
    </div>
  </div>
</template>

<script setup>
import { Megaphone } from 'lucide-vue-next'

defineProps({
  placement: {
    type: String,
    required: true,
    validator: (v) => ['sidebar', 'infeed', 'content-bottom'].includes(v)
  }
})
</script>

<style scoped>
.ad-placement {
  display: flex;
  align-items: center;
  justify-content: center;
}

.ad-placement__inner {
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
  border: 1px dashed var(--border-color);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-muted);
}

.ad-placement__icon {
  opacity: 0.5;
}

/* 사이드바: 160x600 */
.ad-placement--sidebar .ad-placement__inner {
  width: 160px;
  min-height: 600px;
}

/* 인피드: 728x90 */
.ad-placement--infeed .ad-placement__inner {
  width: 100%;
  max-width: 728px;
  height: 90px;
  margin: 0 auto;
}

/* 본문 하단: 728x60 */
.ad-placement--content-bottom .ad-placement__inner {
  width: 100%;
  max-width: 728px;
  height: 60px;
  margin: 24px auto;
}

/* 모바일: 사이드바 숨김 */
@media (max-width: 1439px) {
  .ad-placement--sidebar {
    display: none;
  }
}
</style>
