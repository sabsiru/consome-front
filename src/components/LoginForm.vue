<template>
  <div class="login-container">
    <h2>로그인</h2>
    <form @submit.prevent="login">
      <div class="form-group">
        <label for="loginId">아이디</label>
        <input type="text" id="loginId" v-model="loginId" required />
      </div>

      <div class="form-group">
        <label for="password">비밀번호</label>
        <input type="password" id="password" v-model="password" required />
      </div>

      <button type="submit">로그인</button>
    </form>

    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from '@/api/axios'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore.js'

const router = useRouter()
const loginId = ref('')
const password = ref('')
const error = ref('')
const store = useUserStore()

const login = async () => {
  try {
    const { data } = await axios.post('/users/login', {
      loginId: loginId.value,
      password: password.value,
    })

    localStorage.setItem('accessToken', data.accessToken)

    store.setUserData(data)
    if (data.role === 'ADMIN') {
      await router.push('/admin')
    } else {
      await router.push('/')
    }
  } catch (err) {
    error.value = err.response?.data?.message || '로그인에 실패하였습니다.'
  }
}
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 50px auto;
}

.error {
  color: red;
  margin-top: 10px;
}
</style>
