<template>
  <div class="register-view">
    <section class="register-container">
      <h2>회원가입</h2>

      <form @submit.prevent="register">
        <div class="form-group">
          <label for="loginId">아이디</label>
          <input id="loginId" v-model="loginId" type="text" required />
        </div>

        <div class="form-group">
          <label for="nickname">닉네임</label>
          <input id="nickname" v-model="nickname" type="text" required />
        </div>

        <div class="form-group">
          <label for="password">비밀번호</label>
          <input id="password" v-model="password" type="password" required />
        </div>

        <button type="submit">회원가입</button>
      </form>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from '@/api/axios'

const loginId = ref('')
const nickname = ref('')
const password = ref('')

const register = async () => {
  try {
    const response = await axios.post('/users', {
      loginId: loginId.value,
      nickname: nickname.value,
      password: password.value,
    })

    console.log('회원가입 성공:', response.data)
    alert('회원가입이 완료되었습니다.')
    window.location.href = '/'
  } catch (error) {
    console.error('회원가입 실패:', error)

    if (error.response && error.response.data) {
      const { code, message } = error.response.data

      if (code && message) {
        alert(`${message}`)
      } else if (message) {
        alert(message)
      } else {
        alert('회원가입 중 알 수 없는 오류가 발생했습니다.')
      }
    } else {
      alert('서버와의 연결에 실패했습니다.')
    }
  }
}
</script>

<style scoped>
.register-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: var(--bg-primary);
  padding: 20px;
}

.register-container {
  width: 100%;
  max-width: 400px;
  padding: 40px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
}

.register-container h2 {
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

.register-container button[type="submit"] {
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

.register-container button[type="submit"]:hover {
  background: #00e6b8;
}
</style>
