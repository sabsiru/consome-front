<script setup>
import { computed } from 'vue'

const props = defineProps({
  level: { type: Number, required: true },
  role: { type: String, default: null },
  size: { type: String, default: 'md' } // 'xs' | 'sm' | 'md'
})

const displayText = computed(() => {
  if (props.role === 'ADMIN') return '시스템관리자'
  if (props.role === 'MANAGER') return '완장'
  return `Lv.${props.level}`
})

const badgeClass = computed(() => {
  if (props.role === 'ADMIN') return 'level-badge--admin'
  if (props.role === 'MANAGER') return 'level-badge--manager'
  return `level-badge--${props.level}`
})
</script>

<template>
  <span class="level-badge" :class="[badgeClass, `level-badge--${props.size}`]">{{ displayText }}</span>
</template>
