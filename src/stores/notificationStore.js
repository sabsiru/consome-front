import { defineStore } from 'pinia'
import { getNotifications, getUnreadNotificationCount, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications } from '@/api/notificationApi.js'

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    unreadCount: 0,
    notifications: [],
    totalPages: 0,
    currentPage: 0
  }),
  actions: {
    async fetchUnreadCount(userId) {
      if (!userId) return
      try {
        const { data } = await getUnreadNotificationCount(userId)
        this.unreadCount = data.count
      } catch (e) {
        console.error('[NotificationStore] unread count 조회 실패', e)
      }
    },

    async fetchNotifications(userId, page = 0) {
      if (!userId) return
      try {
        const { data } = await getNotifications(userId, page)
        this.notifications = data.content
        this.totalPages = data.totalPages
        this.currentPage = data.number
      } catch (e) {
        console.error('[NotificationStore] 알림 목록 조회 실패', e)
      }
    },

    async markAsRead(notificationId, userId) {
      try {
        await markAsRead(notificationId, userId)
        const target = this.notifications.find(n => n.id === notificationId)
        if (target && !target.isRead) {
          target.isRead = true
          this.unreadCount = Math.max(0, this.unreadCount - 1)
        }
      } catch (e) {
        console.error('[NotificationStore] 읽음 처리 실패', e)
      }
    },

    async markAllAsRead(userId) {
      try {
        await markAllAsRead(userId)
        this.notifications.forEach(n => { n.isRead = true })
        this.unreadCount = 0
      } catch (e) {
        console.error('[NotificationStore] 전체 읽음 처리 실패', e)
      }
    },

    async deleteOne(notificationId, userId) {
      try {
        const target = this.notifications.find(n => n.id === notificationId)
        await deleteNotification(notificationId, userId)
        this.notifications = this.notifications.filter(n => n.id !== notificationId)
        if (target && !target.isRead) {
          this.unreadCount = Math.max(0, this.unreadCount - 1)
        }
      } catch (e) {
        console.error('[NotificationStore] 알림 삭제 실패', e)
      }
    },

    async deleteAll(userId) {
      try {
        await deleteAllNotifications(userId)
        this.notifications = []
        this.unreadCount = 0
      } catch (e) {
        console.error('[NotificationStore] 전체 삭제 실패', e)
      }
    },

    incrementUnread() {
      this.unreadCount++
    },

    addNotification(notification) {
      this.notifications.unshift(notification)
      this.incrementUnread()
    },

    clear() {
      this.unreadCount = 0
      this.notifications = []
      this.totalPages = 0
      this.currentPage = 0
    }
  }
})
