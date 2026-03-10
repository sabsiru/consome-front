<template>
  <div class="email-verify-view">
    <section class="verify-container">
      <!-- 로딩 중 -->
      <div v-if="isLoading" class="status-message">
        <div class="loading-spinner"></div>
        <p>이메일 인증 중...</p>
      </div>

      <!-- 인증 성공 -->
      <div v-else-if="verified" class="status-message success">
        <div class="status-icon">✓</div>
        <h2>이메일 인증 완료!</h2>
        <p>이제 모든 기능을 이용할 수 있습니다.</p>
        <button class="primary-btn" @click="goToHome">홈으로 가기</button>
      </div>

      <!-- 인증 실패 -->
      <div v-else class="status-message error">
        <div class="status-icon">✗</div>
        <h2>인증 실패</h2>
        <p>{{ errorMessage }}</p>
        <div class="action-buttons">
          <button class="secondary-btn" @click="goToHome">홈으로 가기</button>
          <button v-if="canResend" class="primary-btn" @click="resendEmail">
            인증 메일 재발송
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import axios from '@/api/axios'
import { useUserStore } from '@/stores/userStore'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isLoading = ref(true)
const verified = ref(false)
const errorMessage = ref('')
const canResend = ref(false)

onMounted(async () => {
  const token = route.query.token

  if (!token) {
    isLoading.value = false
    errorMessage.value = '유효하지 않은 인증 링크입니다.'
    return
  }

  try {
    await axios.get(`/users/email/verify?token=${token}`)
    verified.value = true

    // 로그인 중이면 store 업데이트
    if (userStore.userId) {
      userStore.setEmailVerified(true)
    }
  } catch (error) {
    const code = error.response?.data?.code
    const message = error.response?.data?.message

    if (code === 'INVALID_VERIFICATION_TOKEN') {
      errorMessage.value = '만료되었거나 유효하지 않은 인증 링크입니다.'
      canResend.value = true
    } else if (code === 'ALREADY_VERIFIED') {
      errorMessage.value = '이미 인증된 이메일입니다.'
    } else {
      errorMessage.value = message || '인증 처리 중 오류가 발생했습니다.'
    }
  } finally {
    isLoading.value = false
  }
})

const goToHome = () => {
  router.push('/')
}

const resendEmail = async () => {
  if (!userStore.token) {
    toast.info('로그인 후 인증 메일을 재발송할 수 있습니다.')
    router.push('/')
    return
  }

  try {
    await axios.post('/users/email/resend')
    toast.success('인증 메일이 재발송되었습니다. 메일함을 확인해주세요.')
  } catch (error) {
    const code = error.response?.data?.code
    if (code === 'EMAIL_COOLDOWN') {
      toast.warning('인증 메일은 1분에 한 번만 발송할 수 있습니다.')
    } else {
      toast.error('메일 발송에 실패했습니다.')
    }
  }
}
</script>

<style scoped>
.email-verify-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: var(--bg-primary);
  padding: 20px;
}

.verify-container {
  width: 100%;
  max-width: 400px;
  padding: 40px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  text-align: center;
}

.status-message {
  padding: 20px 0;
}

.status-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: bold;
}

.success .status-icon {
  background: rgba(0, 255, 180, 0.1);
  color: var(--accent);
}

.error .status-icon {
  background: rgba(255, 82, 82, 0.1);
  color: #ff5252;
}

.status-message h2 {
  font-family: 'Outfit', sans-serif;
  font-size: 22px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.status-message p {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 24px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 20px;
  border: 3px solid var(--border-color);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.primary-btn,
.secondary-btn {
  padding: 12px 24px;
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.primary-btn {
  background: var(--accent);
  color: var(--bg-primary);
}

.primary-btn:hover {
  background: #00e6b8;
}

.secondary-btn {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.secondary-btn:hover {
  border-color: var(--accent);
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>
