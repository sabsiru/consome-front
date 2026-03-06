import axios from '@/api/axios.js'
import { useUserStore } from '@/stores/userStore.js'

export async function adminGuard(to, next) {
  const store = useUserStore()
  const token = store.accessToken || localStorage.getItem('accessToken')

  if (!token) {
    alert('로그인이 필요합니다.')
    return next('/login')
  }

  try {
    const { data } = await axios.get('/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (data.role !== 'ADMIN') {
      return next('/')
    }
  } catch (error) {
    console.error('권한 확인 중 오류:', error)
    alert('세션이 만료되었거나 로그인이 필요합니다.')
    store.clearUser()
    return next('/login')
  }
}

export function requireEmailVerified(to, from, next) {
  const store = useUserStore()
  if (!store.token) {
    return next('/login')
  }
  if (!store.emailVerified) {
    alert('이메일 인증 후 글쓰기가 가능합니다.')
    return next(false)
  }
  next()
}

export function redirectIfLoggedIn(to, next) {
  const store = useUserStore()

  if (!store.token) return next()

  if (store.role === 'ADMIN') return next('/admin')
  return next('/')
}
