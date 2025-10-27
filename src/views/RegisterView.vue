<template>
  <section style="padding: 20px">
    <h2>회원가입</h2>

    <form @submit.prevent="register">
      <div style="margin-bottom: 10px">
        <label>아이디:</label>
        <input v-model="loginId" type="text" required />
      </div>

      <div style="margin-bottom: 10px">
        <label>닉네임:</label>
        <input v-model="nickname" type="text" required />
      </div>

      <div style="margin-bottom: 10px">
        <label>비밀번호:</label>
        <input v-model="password" type="password" required />
      </div>

      <button type="submit">회원가입</button>
    </form>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import axios from '@/api/axios' // 이미 만든 axios 인스턴스 import

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
    // 회원가입 성공 시 메인 페이지로 이동
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
