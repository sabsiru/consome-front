import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    nickname: '',
    point: 0,
  }),
  actions: {
    setUserData(data) {
      this.nickname = data.nickname
      this.point = data.point
    },
    clearUser() {
      this.nickname = ''
      this.point = 0
    },
  },
})
