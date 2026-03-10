<template>
  <div class="reset-view">
    <section class="reset-container">
      <h2>새 비밀번호 설정</h2>

      <!-- 성공 -->
      <div v-if="resetDone" class="success-message">
        <div class="success-icon">✓</div>
        <h3>비밀번호 변경 완료</h3>
        <p>새 비밀번호로 로그인해주세요.</p>
        <button class="login-btn" @click="router.push('/login')">로그인하러 가기</button>
      </div>

      <!-- 토큰 없음 -->
      <div v-else-if="!token" class="error-state">
        <p>유효하지 않은 접근입니다.</p>
        <RouterLink to="/password/reset-request" class="retry-link">비밀번호 재설정 다시 요청하기</RouterLink>
      </div>

      <!-- 비밀번호 입력 폼 -->
      <form v-else @submit.prevent="resetPassword">
        <div class="form-group">
          <label for="password">새 비밀번호</label>
          <input id="password" v-model="password" type="password" required />
          <div v-if="password" class="pw-validation">
            <div class="pw-validation__item" :class="{ 'is-valid': pwRules.length }">
              <span class="pw-validation__icon">{{ pwRules.length ? '✓' : '✗' }}</span> 8~20자
            </div>
            <div class="pw-validation__item" :class="{ 'is-valid': pwRules.lowercase }">
              <span class="pw-validation__icon">{{ pwRules.lowercase ? '✓' : '✗' }}</span> 소문자 포함
            </div>
            <div class="pw-validation__item" :class="{ 'is-valid': pwRules.uppercase }">
              <span class="pw-validation__icon">{{ pwRules.uppercase ? '✓' : '✗' }}</span> 대문자 포함
            </div>
            <div class="pw-validation__item" :class="{ 'is-valid': pwRules.number }">
              <span class="pw-validation__icon">{{ pwRules.number ? '✓' : '✗' }}</span> 숫자 포함
            </div>
          </div>
          <div v-if="password" class="pw-strength">
            <div class="pw-strength__bar">
              <div class="pw-strength__fill" :class="'pw-strength__fill--' + pwStrength.level" :style="{ width: pwStrength.percent + '%' }"></div>
            </div>
            <span class="pw-strength__label" :class="'pw-strength__label--' + pwStrength.level">{{ pwStrength.label }}</span>
          </div>
        </div>

        <div class="form-group">
          <label for="confirmPassword">비밀번호 확인</label>
          <input id="confirmPassword" v-model="confirmPassword" type="password" required />
          <div v-if="confirmPassword" class="pw-match" :class="{ 'is-match': passwordMatch, 'is-mismatch': !passwordMatch }">
            {{ passwordMatch ? '✓ 비밀번호가 일치합니다' : '✗ 비밀번호가 일치하지 않습니다' }}
          </div>
        </div>

        <button type="submit" :disabled="isLoading || !isFormValid">
          {{ isLoading ? '처리 중...' : '비밀번호 변경' }}
        </button>

        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from '@/api/axios'

const router = useRouter()
const route = useRoute()
const token = route.query.token || ''

const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const error = ref('')
const resetDone = ref(false)

const pwRules = computed(() => ({
  length: password.value.length >= 8 && password.value.length <= 20,
  lowercase: /[a-z]/.test(password.value),
  uppercase: /[A-Z]/.test(password.value),
  number: /\d/.test(password.value),
}))

const pwStrength = computed(() => {
  const pw = password.value
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[!@#$%^&*(),.?":{}|<>]/.test(pw)) score++
  if (score <= 2) return { level: 'weak', label: 'Weak', percent: 33 }
  if (score <= 3) return { level: 'medium', label: 'Medium', percent: 66 }
  return { level: 'strong', label: 'Strong', percent: 100 }
})

const isPasswordValid = computed(() =>
  pwRules.value.length && pwRules.value.lowercase && pwRules.value.uppercase && pwRules.value.number
)

const passwordMatch = computed(() => password.value === confirmPassword.value)

const isFormValid = computed(() => isPasswordValid.value && passwordMatch.value && confirmPassword.value !== '')

const resetPassword = async () => {
  isLoading.value = true
  error.value = ''
  try {
    await axios.put('/users/password/reset', {
      token,
      newPassword: password.value,
    })
    resetDone.value = true
  } catch (err) {
    const message = err.response?.data?.message
    error.value = message || '비밀번호 변경에 실패했습니다.'
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

.error-state {
  text-align: center;
  padding: 20px 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.retry-link {
  display: inline-block;
  margin-top: 16px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: var(--accent);
  text-decoration: none;
}

.retry-link:hover {
  text-decoration: underline;
}

.pw-validation {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 16px;
  margin-top: 10px;
}

.pw-validation__item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--text-muted);
  transition: color 0.2s ease;
}

.pw-validation__item.is-valid { color: var(--accent); }
.pw-validation__item:not(.is-valid) .pw-validation__icon { color: var(--danger); }

.pw-strength {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
}

.pw-strength__bar {
  flex: 1;
  height: 4px;
  background: var(--bg-tertiary);
  border-radius: 2px;
  overflow: hidden;
}

.pw-strength__fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease, background 0.3s ease;
}

.pw-strength__fill--weak { background: var(--danger); }
.pw-strength__fill--medium { background: #f59e0b; }
.pw-strength__fill--strong { background: var(--accent); }

.pw-strength__label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  min-width: 50px;
}

.pw-strength__label--weak { color: var(--danger); }
.pw-strength__label--medium { color: #f59e0b; }
.pw-strength__label--strong { color: var(--accent); }

.pw-match {
  margin-top: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
}

.pw-match.is-match { color: var(--accent); }
.pw-match.is-mismatch { color: var(--danger); }

.success-message {
  text-align: center;
  padding: 20px 0;
}

.success-icon {
  font-size: 48px;
  color: var(--accent);
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
  color: var(--text-secondary);
  font-size: 14px;
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
