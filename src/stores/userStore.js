import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    userId: localStorage.getItem('userId') || '',
    nickname: localStorage.getItem('nickname') || '',
    point: Number(localStorage.getItem('point')) || 0,
    token: localStorage.getItem('accessToken') || '',
    role: localStorage.getItem('role') || '',
    managedBoardIds: JSON.parse(localStorage.getItem('managedBoardIds')) || []
  }),
  actions: {
    setUserData(data) {
      this.nickname = data.nickname
      this.point = data.point
      this.token = data.accessToken
      this.userId = data.userId
      this.role = data.role
      this.managedBoardIds = data.managedBoardIds || []
      localStorage.setItem('userId', data.userId)
      localStorage.setItem('nickname', data.nickname);
      localStorage.setItem('point', data.point);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('role', data.role);
      localStorage.setItem('managedBoardIds', JSON.stringify(this.managedBoardIds));
    },
    clearUser() {
      this.nickname = ''
      this.point = 0
      this.token = ''
      this.userId = ''
      this.managedBoardIds = []
      localStorage.removeItem('userId')
      localStorage.removeItem('nickname');
      localStorage.removeItem('point');
      localStorage.removeItem('accessToken')
      localStorage.removeItem('role')
      localStorage.removeItem('managedBoardIds')
      localStorage.clear()
    },
  },
  persist: {
    storage: localStorage
  }
})

