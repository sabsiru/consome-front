<template>
  <main style="padding: 20px;">
    <h1>Consome 메인 페이지</h1>

    <!-- 회원가입 버튼 -->
    <button @click="goToRegister">회원가입</button>
    <button @click="goToLogin">로그인</button>
  </main>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goToRegister = () => {
  router.push('/register')
}
const goToLogin = () => {
  router.push('/login')
}
</script>
