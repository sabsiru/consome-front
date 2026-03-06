import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    userId: localStorage.getItem('userId') ? Number(localStorage.getItem('userId')) : null,
    nickname: localStorage.getItem('nickname') || '',
    point: Number(localStorage.getItem('point')) || 0,
    level: Number(localStorage.getItem('level')) || 1,
    token: localStorage.getItem('accessToken') || '',
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
      this.userId = data.userId
      this.role = data.role
      this.managedBoardIds = data.managedBoardIds || []
      this.emailVerified = data.emailVerified ?? false
      localStorage.setItem('userId', data.userId)
      localStorage.setItem('nickname', data.nickname);
      localStorage.setItem('point', data.point);
      localStorage.setItem('level', data.level ?? 1);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('role', data.role);
      localStorage.setItem('managedBoardIds', JSON.stringify(this.managedBoardIds));
      localStorage.setItem('emailVerified', this.emailVerified);
    },
    setEmailVerified(verified) {
      this.emailVerified = verified
      localStorage.setItem('emailVerified', verified)
    },
    clearUser() {
      this.nickname = ''
      this.point = 0
      this.level = 1
      this.token = ''
      this.userId = ''
      this.role = ''
      this.managedBoardIds = []
      this.emailVerified = false
      localStorage.removeItem('userId')
      localStorage.removeItem('nickname');
      localStorage.removeItem('point');
      localStorage.removeItem('level');
      localStorage.removeItem('accessToken')
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

