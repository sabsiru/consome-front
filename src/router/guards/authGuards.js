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
      alert('관리자 전용 페이지입니다.')
      return next('/')
    }
  } catch (error) {
    console.error('권한 확인 중 오류:', error)
    alert('세션이 만료되었거나 로그인이 필요합니다.')
    store.clearUser()
    return next('/login')
  }
}

export async function redirectIfLoggedIn(to, next) {
  const store = useUserStore()
  const token = store.accessToken || localStorage.getItem('accessToken')

  if (!token) await next()

  try {
    const { data } = await axios.get('/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (data.role === 'ADMIN') return next('/admin')
    else return next('/')
  } catch (error) {
    console.warn('redirectIfLoggedIn 오류:', error)
    store.clearUser()
    await next()
  }
}
