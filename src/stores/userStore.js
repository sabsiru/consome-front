import { defineStore } from 'pinia'
import { logoutApi } from '@/api/authApi.js'

export const useUserStore = defineStore('user', {
  state: () => ({
    userId: localStorage.getItem('userId') ? Number(localStorage.getItem('userId')) : null,
    nickname: localStorage.getItem('nickname') || '',
    point: Number(localStorage.getItem('point')) || 0,
    level: Number(localStorage.getItem('level')) || 1,
    token: localStorage.getItem('accessToken') || '',
    refreshToken: localStorage.getItem('refreshToken') || '',
    role: localStorage.getItem('role') || '',
    managedBoardIds: JSON.parse(localStorage.getItem('managedBoardIds')) || [],
    emailVerified: localStorage.getItem('emailVerified') === 'true'
  }),
  actions: {
    setUserData(data) {
      this.nickname = data.nickname
      this.point = data.point
      this.level = data.level ?? 1
      this.token = data.accessToken
      this.refreshToken = data.refreshToken || ''
      this.userId = data.userId
      this.role = data.role
      this.managedBoardIds = data.managedBoardIds || []
      this.emailVerified = data.emailVerified ?? false
      localStorage.setItem('userId', data.userId)
      localStorage.setItem('nickname', data.nickname)
      localStorage.setItem('point', data.point)
      localStorage.setItem('level', data.level ?? 1)
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken || '')
      localStorage.setItem('role', data.role)
      localStorage.setItem('managedBoardIds', JSON.stringify(this.managedBoardIds))
      localStorage.setItem('emailVerified', this.emailVerified)
    },
    setTokens(accessToken, newRefreshToken) {
      this.token = accessToken
      this.refreshToken = newRefreshToken
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', newRefreshToken)
    },
    setEmailVerified(verified) {
      this.emailVerified = verified
      localStorage.setItem('emailVerified', verified)
    },
    async logout() {
      try {
        if (this.token) {
          await logoutApi(this.token)
        }
      } catch (e) {
        // 로그아웃 API 실패해도 클라이언트는 정리
      }
      this.clearUser()
    },
    clearUser() {
      this.nickname = ''
      this.point = 0
      this.level = 1
      this.token = ''
      this.refreshToken = ''
      this.userId = ''
      this.role = ''
      this.managedBoardIds = []
      this.emailVerified = false
      localStorage.removeItem('userId')
      localStorage.removeItem('nickname')
      localStorage.removeItem('point')
      localStorage.removeItem('level')
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('role')
      localStorage.removeItem('managedBoardIds')
      localStorage.removeItem('emailVerified')
      localStorage.clear()
    },
  },
  persist: {
    storage: localStorage
  }
})
