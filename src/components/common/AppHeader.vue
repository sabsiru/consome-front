<template>
  <header class="header">
    <h1 @click="goHome" class="title">콘소메</h1>
    <div class="nav">
      <!-- ✅ 로그인 안 한 상태 -->
      <template v-if="!nickname || nickname.length === 0">
        <RouterLink to="/login" class="link">로그인</RouterLink>
        <RouterLink to="/register" class="link">회원가입</RouterLink>
      </template>

      <!-- ✅ 로그인 한 상태 -->
      <template v-else>
        <span class="user-info">{{ nickname }} 님 · {{ point }}P</span>
        <button v-if="role === 'ADMIN'" @click="goAdmin">관리자페이지</button>
        <button v-if="nickname === '관리자'" @click="goAdmin">관리자페이지</button>
        <button class="logout-btn" @click="logout">로그아웃</button>
      </template>
    </div>
  </header>
</template>

<script setup>
import { useUserStore } from '@/stores/userStore'
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'
import router from '@/router/index.js'

const store = useUserStore()
const { nickname, point, role } = storeToRefs(store)

const logout = (event) => {
  if (!event || event.type !== 'click') return
  event.preventDefault()

  if (confirm('로그아웃 하시겠습니까?')) {
    store.clearUser()
    window.location.href = '/'
  }
}

const goHome = () => {
  router.push('/')
}

const goAdmin = () => {
  router.push('/admin')
}
console.log('🔎 AppHeader role:', role.value)
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background: transparent;
  color: #777;
  position: fixed;
  width: 100%;
  top: 0;
  left: 0;
  z-index: 10;
}

.nav {
  display: flex;
  align-items: center;
  gap: 10px;
}

.link {
  color: #777;
  text-decoration: none;
  font-weight: 500;
}

.link:hover {
  text-decoration: underline;
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

.title {
  cursor: pointer;
}
</style>
