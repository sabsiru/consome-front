<template>
  <div class="register-view">
    <section class="register-container">
      <h2>회원가입</h2>

      <!-- 회원가입 성공 후 인증 안내 -->
      <div v-if="registered" class="success-message">
        <div class="success-icon">✉️</div>
        <h3>회원가입 완료!</h3>
        <p>
          <strong>{{ registeredEmail }}</strong>으로 인증 메일을 발송했습니다.
        </p>
        <p class="sub-text">
          메일함을 확인하고 인증 링크를 클릭해주세요.<br />
          인증 완료 후 모든 기능을 이용할 수 있습니다.
        </p>
        <button class="login-btn" @click="goToLogin">로그인하러 가기</button>
      </div>

      <!-- 회원가입 폼 -->
      <form v-else @submit.prevent="register">
        <div class="form-group">
          <label for="loginId">아이디</label>
          <input id="loginId" v-model="loginId" type="text" required />
        </div>

        <div class="form-group">
          <label for="nickname">닉네임</label>
          <input id="nickname" v-model="nickname" type="text" required />
        </div>

        <div class="form-group">
          <label for="email">이메일</label>
          <input id="email" v-model="email" type="email" placeholder="example@email.com" required />
        </div>

        <div class="form-group">
          <label for="password">비밀번호</label>
          <input id="password" v-model="password" type="password" required />
        </div>

        <button type="submit" :disabled="isLoading">
          {{ isLoading ? '처리중...' : '회원가입' }}
        </button>
      </form>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/api/axios'

const router = useRouter()

const loginId = ref('')
const nickname = ref('')
const email = ref('')
const password = ref('')
const isLoading = ref(false)
const registered = ref(false)
const registeredEmail = ref('')

const register = async () => {
  isLoading.value = true
  try {
    const res = await axios.post('/users', {
      loginId: loginId.value,
      nickname: nickname.value,
      email: email.value,
      password: password.value,
    })

    if (res.data.verifyToken) {
      console.log('[DEV] 이메일 인증 URL:', `${window.location.origin}/email/verify?token=${res.data.verifyToken}`)
    }

    registeredEmail.value = email.value
    registered.value = true
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
  } finally {
    isLoading.value = false
  }
}

const goToLogin = () => {
  router.push('/')
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

.register-container button[type="submit"]:disabled {
  background: var(--text-muted);
  cursor: not-allowed;
}

.success-message {
  text-align: center;
  padding: 20px 0;
}

.success-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.success-message h3 {
  font-family: 'Outfit', sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: var(--accent);
  margin-bottom: 16px;
}

.success-message p {
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 8px;
}

.success-message .sub-text {
  color: var(--text-secondary);
  font-size: 13px;
  margin-bottom: 24px;
}

.login-btn {
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
}

.login-btn:hover {
  background: #00e6b8;
}
</style>
