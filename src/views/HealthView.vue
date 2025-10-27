<template>
  <section style="padding:16px">
    <h2>백엔드 헬스 체크</h2>
    <button @click="check">/health 호출</button>

    <div style="margin-top:12px">
      <strong>결과:</strong>
      <pre>{{ result }}</pre>
    </div>

    <div v-if="error" style="margin-top:12px; color:crimson">
      <strong>에러:</strong>
      <pre>{{ error }}</pre>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import api from '@/api/axios' // 방금 만든 axios.js 경로

const result = ref('')
const error = ref('')

const check = async () => {
  result.value = ''
  error.value = ''
  try {
    const res = await api.get('/health')
    result.value = JSON.stringify(res.data, null, 2)
  } catch (e) {
    error.value = e.message
  }
}
</script>
