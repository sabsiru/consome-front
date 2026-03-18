<template>
  <div class="reset-view">
    <section class="reset-container">
      <h2>비밀번호 재설정</h2>

      <!-- 요청 성공 -->
      <div v-if="sent" class="success-message">
        <div class="success-icon">✉️</div>
        <h3>메일 발송 완료</h3>
        <p>
          <strong>{{ sentEmail }}</strong>으로 비밀번호 재설정 링크를 발송했습니다.
        </p>
        <p class="sub-text">
          메일함을 확인하고 재설정 링크를 클릭해주세요.<br />
          링크는 1시간 동안 유효합니다.
        </p>
        <button class="login-btn" @click="router.push('/login')">로그인으로 돌아가기</button>
      </div>

      <!-- 이메일 입력 폼 -->
      <form v-else @submit.prevent="requestReset">
        <p class="description">
          가입 시 등록한 이메일을 입력하면<br />비밀번호 재설정 링크를 보내드립니다.
        </p>

        <div class="form-group">
          <label for="email">이메일</label>
          <input id="email" v-model="email" type="email" placeholder="example@email.com" required />
        </div>

        <button type="submit" :disabled="isLoading || !email">
          {{ isLoading ? '발송 중...' : '재설정 링크 발송' }}
        </button>

        <p v-if="error" class="error">{{ error }}</p>

        <div class="back-link">
          <RouterLink to="/login">로그인으로 돌아가기</RouterLink>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/api/axios'

const router = useRouter()
const email = ref('')
const isLoading = ref(false)
const error = ref('')
const sent = ref(false)
const sentEmail = ref('')

const requestReset = async () => {
  isLoading.value = true
  error.value = ''
  try {
    const { data } = await axios.post('/users/password/reset-request', {
      email: email.value,
    })


    sentEmail.value = email.value
    sent.value = true
  } catch (err) {
    const message = err.response?.data?.message
    error.value = message || '요청 처리 중 오류가 발생했습니다.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.reset-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: var(--bg-primary);
  padding: 20px;
}

.reset-container {
  width: 100%;
  max-width: 400px;
  padding: 40px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
}

.reset-container h2 {
  font-family: 'Outfit', sans-serif;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 24px;
  text-align: center;
}

.description {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
  text-align: center;
  margin-bottom: 24px;
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

.reset-container button[type="submit"] {
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

.reset-container button[type="submit"]:hover {
  background: #00e6b8;
}

.reset-container button[type="submit"]:disabled {
  background: var(--text-muted);
  cursor: not-allowed;
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

.back-link {
  text-align: center;
  margin-top: 20px;
}

.back-link a {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.2s ease;
}

.back-link a:hover {
  color: var(--accent);
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
