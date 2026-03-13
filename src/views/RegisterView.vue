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
          {{ isLoading ? '처리중...' : '회원가입' }}
        </button>
      </form>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import axios from '@/api/axios'

const router = useRouter()

const loginId = ref('')
const nickname = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const registered = ref(false)
const registeredEmail = ref('')

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
        toast.error(message)
      } else if (message) {
        toast.error(message)
      } else {
        toast.error('회원가입 중 알 수 없는 오류가 발생했습니다.')
      }
    } else {
      toast.error('서버와의 연결에 실패했습니다.')
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

/* Responsive */
@media (max-width: 480px) {
  .register-container {
    padding: 24px 20px;
  }

  .register-container h2 {
    font-size: 20px;
    margin-bottom: 24px;
  }

  .pw-validation {
    grid-template-columns: 1fr;
  }
}
</style>
