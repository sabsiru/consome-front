<template>
  <header class="header">
    <h1>콘소메</h1>

    <div class="user-info" v-if="nickname && nickname.length > 0">
      <span>{{ nickname }} 님 · {{ point }}P</span>
      <button class="logout-btn" @click="logout">로그아웃</button>
    </div>
  </header>
</template>

<script setup>
import { useUserStore } from '@/stores/userStore'
import { storeToRefs } from 'pinia'

const store = useUserStore()
const { nickname, point } = storeToRefs(store)

// 로그아웃 함수
const logout = () => {
  store.clearUser()
  // 필요 시 페이지 리로드 or 메인으로 이동
  window.location.href = '/'
}
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background: transparent; /* ✅ 투명 배경 */
  color: white;
  position: fixed;
  width: 100%;
  top: 0;
  left: 0;
  z-index: 10;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logout-btn {
  background: transparent;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
  transition: 0.2s;
}

.logout-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}
</style>
