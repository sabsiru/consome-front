<template>
  <div class="find-id-view">
    <section class="find-id-container">
      <h2>아이디 찾기</h2>

      <!-- 결과 -->
      <div v-if="result" class="result-message">
        <div class="result-icon">🔍</div>
        <h3>아이디 찾기 완료</h3>
        <p>입력하신 이메일로 가입된 아이디입니다.</p>
        <div class="masked-id">{{ result }}</div>
        <div class="action-buttons">
          <button class="login-btn" @click="router.push('/login')">로그인</button>
          <button class="reset-btn" @click="router.push('/password/reset-request')">비밀번호 재설정</button>
        </div>
      </div>

      <!-- 이메일 입력 폼 -->
      <form v-else @submit.prevent="findId">
        <p class="description">
          가입 시 등록한 이메일을 입력하면<br />아이디를 알려드립니다.
        </p>

        <div class="form-group">
          <label for="email">이메일</label>
          <input id="email" v-model="email" type="email" placeholder="example@email.com" required />
        </div>

        <button type="submit" :disabled="isLoading || !email">
          {{ isLoading ? '조회 중...' : '아이디 찾기' }}
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
const result = ref('')

const findId = async () => {
  isLoading.value = true
  error.value = ''
  try {
    const { data } = await axios.post('/users/find-id', { email: email.value })
    result.value = data.maskedLoginId
  } catch (err) {
    error.value = err.response?.data?.message || '조회 중 오류가 발생했습니다.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.find-id-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: var(--bg-primary);
  padding: 20px;
}

.find-id-container {
  width: 100%;
  max-width: 400px;
  padding: 40px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
}

.find-id-container h2 {
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

.find-id-container button[type="submit"] {
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

.find-id-container button[type="submit"]:hover {
  background: #00e6b8;
}

.find-id-container button[type="submit"]:disabled {
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

.result-message {
  text-align: center;
  padding: 20px 0;
}

.result-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.result-message h3 {
  font-family: 'Outfit', sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: var(--accent);
  margin-bottom: 12px;
}

.result-message p {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 16px;
}

.masked-id {
  font-family: 'JetBrains Mono', monospace;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  letter-spacing: 2px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.login-btn,
.reset-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.login-btn {
  background: var(--accent);
  color: var(--bg-primary);
}

.login-btn:hover {
  background: #00e6b8;
}

.reset-btn {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.reset-btn:hover {
  color: var(--text-primary);
  border-color: var(--accent);
}
</style>
