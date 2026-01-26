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
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/userStore.js'

const router = useRouter()
const route = useRoute()
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
    if (route.query.redirect) {
      await router.push(route.query.redirect)
    } else if (data.role === 'ADMIN') {
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
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: 40px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
}

.login-container h2 {
  font-family: 'Outfit', sans-serif;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 32px;
  text-align: center;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-group input {
  width: 100%;
  padding: 12px 14px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.form-group input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-dim);
}

.login-container button[type="submit"] {
  width: 100%;
  padding: 14px;
  background: var(--accent);
  border: none;
  border-radius: 6px;
  color: var(--bg-primary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
  margin-top: 8px;
}

.login-container button[type="submit"]:hover {
  background: #00e6b8;
}

.error {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: var(--danger);
  margin-top: 16px;
  padding: 12px;
  background: rgba(255, 68, 102, 0.1);
  border: 1px solid var(--danger);
  border-radius: 6px;
  text-align: center;
}
</style>
