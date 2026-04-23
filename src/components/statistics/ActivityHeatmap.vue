<template>
  <section class="heatmap">
    <div class="heatmap__header">
      <h3 class="heatmap__title">시간대별 활동량</h3>
      <div class="heatmap__controls">
        <select v-model="days" class="heatmap__select">
          <option v-for="opt in periods" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <select v-model="type" class="heatmap__select">
          <option v-for="opt in types" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="heatmap__state">불러오는 중...</div>
    <div v-else class="heatmap__scroll">
      <div class="heatmap__grid" :style="gridStyle">
        <div class="heatmap__corner"></div>
        <div
          v-for="h in 24"
          :key="'h-' + h"
          class="heatmap__hour-label"
        >
          {{ h - 1 }}
        </div>

        <template v-for="row in displayRows" :key="row.date">
          <div class="heatmap__date-label">{{ formatRowLabel(row) }}</div>
          <div
            v-for="(value, idx) in row.hours"
            :key="row.date + '-' + idx"
            class="heatmap__cell"
            :style="{ background: cellColor(value) }"
            :title="`${formatRowLabel(row)} ${idx}시 · ${value}`"
          ></div>
        </template>
      </div>
    </div>

    <div class="heatmap__legend">
      <span class="heatmap__legend-label">적음</span>
      <span
        v-for="step in 5"
        :key="'lg-' + step"
        class="heatmap__legend-cell"
        :style="{ background: legendColor(step - 1) }"
      ></span>
      <span class="heatmap__legend-label">많음</span>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { getHourlyActivity } from '@/api/statisticsApi.js'

const types = [
  { value: 'ALL', label: '전체' },
  { value: 'VISIT', label: '방문' },
  { value: 'POST', label: '게시글' },
  { value: 'COMMENT', label: '댓글' },
  { value: 'POST_LIKE', label: '글추천' },
  { value: 'POST_DISLIKE', label: '글비추' },
  { value: 'COMMENT_LIKE', label: '댓추' },
  { value: 'COMMENT_DISLIKE', label: '댓비추' }
]

const periods = [
  { value: 7, label: '최근 7일' },
  { value: 30, label: '최근 30일' },
  { value: 90, label: '최근 90일' }
]

const type = ref('ALL')
const days = ref(7)
const rows = ref([])
const loading = ref(true)

const gridStyle = computed(() => {
  const labelWidth = 40
  return { gridTemplateColumns: `${labelWidth}px repeat(24, 22px)` }
})

const rawRows = computed(() => {
  if (rows.value.length) return rows.value
  const today = new Date()
  const result = []
  for (let i = days.value - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    result.push({
      date: d.toISOString().slice(0, 10),
      hours: Array(24).fill(0)
    })
  }
  return result
})

const displayRows = computed(() => {
  const source = rawRows.value
  if (days.value === 7) return source

  // 7일씩 묶어 주별 집계 (뒤에서부터 묶어 가장 최근 주가 마지막)
  const chunks = []
  let i = source.length
  while (i > 0) {
    const start = Math.max(0, i - 7)
    chunks.unshift(source.slice(start, i))
    i = start
  }
  return chunks.map((chunk) => {
    const hours = Array(24).fill(0)
    for (const row of chunk) {
      for (let h = 0; h < 24; h++) hours[h] += row.hours[h]
    }
    return {
      date: chunk[0].date,
      endDate: chunk[chunk.length - 1].date,
      hours,
      isWeek: true
    }
  })
})

const maxValue = computed(() => {
  let m = 0
  for (const row of displayRows.value) {
    for (const v of row.hours) {
      if (v > m) m = v
    }
  }
  return m
})

const cellColor = (value) => {
  if (!value || maxValue.value === 0) return 'var(--bg-tertiary)'
  const intensity = Math.min(value / maxValue.value, 1)
  // 5단계 디스크리트 컬러
  const step = Math.ceil(intensity * 5)
  return legendColor(step - 1)
}

const legendColor = (step) => {
  // step: 0~4
  const palette = [
    'var(--bg-tertiary)',
    'rgba(100, 181, 246, 0.25)',
    'rgba(100, 181, 246, 0.45)',
    'rgba(100, 181, 246, 0.7)',
    'rgba(100, 181, 246, 1)'
  ]
  return palette[step] || palette[4]
}

const formatDate = (isoDate) => {
  const d = new Date(isoDate)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

const formatRowLabel = (row) => {
  if (row.isWeek) {
    const d = new Date(row.endDate)
    const week = Math.ceil(d.getDate() / 7)
    return `${d.getMonth() + 1}-${week}`
  }
  return formatDate(row.date)
}

const fetchData = async () => {
  loading.value = true
  try {
    const { data } = await getHourlyActivity(days.value, type.value)
    rows.value = data.rows || []
  } catch (e) {
    console.error('[ActivityHeatmap] 시간대별 활동량 로드 실패', e)
    rows.value = []
  } finally {
    loading.value = false
  }
}

watch([type, days], fetchData)
onMounted(fetchData)
</script>

<style scoped>
.heatmap {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 16px;
}

.heatmap__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 8px;
}

.heatmap__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.heatmap__controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.heatmap__select {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 3px 6px;
  border-radius: 3px;
  cursor: pointer;
}

.heatmap__state {
  font-size: 12px;
  color: var(--text-muted);
  padding: 24px 0;
  text-align: center;
}

.heatmap__scroll {
  overflow-x: auto;
  overflow-y: auto;
  max-height: 560px;
  padding-bottom: 4px;
}

.heatmap__scroll::-webkit-scrollbar {
  height: 6px;
}

.heatmap__scroll::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.heatmap__grid {
  display: grid;
  gap: 2px;
}

.heatmap__corner {
  height: 16px;
}

.heatmap__hour-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  color: var(--text-muted);
  text-align: center;
  line-height: 16px;
  height: 16px;
}

.heatmap__date-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  height: 22px;
}

.heatmap__cell {
  width: 22px;
  height: 22px;
  border-radius: 2px;
}

.heatmap__legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 12px;
}

.heatmap__legend-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--text-muted);
}

.heatmap__legend-cell {
  width: 14px;
  height: 14px;
  border-radius: 2px;
}
</style>
