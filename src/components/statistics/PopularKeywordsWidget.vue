<template>
  <section class="pkw">
    <div class="pkw__header">
      <h3 class="pkw__title">인기 검색어</h3>
      <div class="pkw__tabs">
        <button
          v-for="p in periods"
          :key="p.value"
          class="pkw__tab"
          :class="{ 'pkw__tab--active': period === p.value }"
          @click="period = p.value"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="pkw__state">불러오는 중...</div>
    <div v-else-if="!items.length" class="pkw__state">집계된 검색어가 없습니다</div>
    <ol v-else class="pkw__list">
      <li
        v-for="item in items"
        :key="item.rank"
        class="pkw__item"
        @click="emit('select', item.keyword)"
      >
        <span class="pkw__rank" :class="{ 'pkw__rank--top': item.rank <= 3 }">{{ item.rank }}</span>
        <span class="pkw__keyword">{{ item.keyword }}</span>
        <span class="pkw__count">{{ item.count }}</span>
      </li>
    </ol>
  </section>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { getPopularKeywords } from '@/api/statisticsApi.js'

const emit = defineEmits(['select'])

const periods = [
  { value: 'hour', label: '실시간' },
  { value: 'day', label: '오늘' }
]

const period = ref('hour')
const items = ref([])
const loading = ref(true)

const fetchKeywords = async () => {
  loading.value = true
  try {
    const { data } = await getPopularKeywords(period.value, 10)
    items.value = data.items || []
  } catch (e) {
    console.error('[PopularKeywordsWidget] 인기 검색어 로드 실패', e)
    items.value = []
  } finally {
    loading.value = false
  }
}

watch(period, fetchKeywords)
onMounted(fetchKeywords)
</script>

<style scoped>
.pkw {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 16px;
}

.pkw__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 8px;
}

.pkw__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.pkw__tabs {
  display: flex;
  gap: 4px;
}

.pkw__tab {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 3px 8px;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.pkw__tab:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.pkw__tab--active {
  background: var(--accent-dim);
  color: var(--accent);
  border-color: var(--accent);
}

.pkw__state {
  font-size: 12px;
  color: var(--text-muted);
  padding: 16px 0;
  text-align: center;
}

.pkw__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.pkw__item {
  display: grid;
  grid-template-columns: 24px 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 6px 4px;
  cursor: pointer;
  border-radius: 3px;
  transition: background 0.15s ease;
}

.pkw__item:hover {
  background: var(--bg-tertiary);
}

.pkw__rank {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
}

.pkw__rank--top {
  color: var(--accent);
  font-weight: 600;
}

.pkw__keyword {
  font-size: 13px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pkw__count {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--text-muted);
}
</style>
