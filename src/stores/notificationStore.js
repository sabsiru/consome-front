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
    async fetchUnreadCount() {
      try {
        const { data } = await getUnreadNotificationCount()
        this.unreadCount = data.count
      } catch (e) {
        console.error('[NotificationStore] unread count 조회 실패', e)
      }
    },

    async fetchNotifications(page = 0) {
      try {
        const { data } = await getNotifications(page)
        this.notifications = data.content
        this.totalPages = data.totalPages
        this.currentPage = data.number
      } catch (e) {
        console.error('[NotificationStore] 알림 목록 조회 실패', e)
      }
    },

    async markAsRead(notificationId) {
      try {
        await markAsRead(notificationId)
        const target = this.notifications.find(n => n.id === notificationId)
        if (target && !target.isRead) {
          target.isRead = true
          this.unreadCount = Math.max(0, this.unreadCount - 1)
        }
      } catch (e) {
        console.error('[NotificationStore] 읽음 처리 실패', e)
      }
    },

    async markAllAsRead() {
      try {
        await markAllAsRead()
        this.notifications.forEach(n => { n.isRead = true })
        this.unreadCount = 0
      } catch (e) {
        console.error('[NotificationStore] 전체 읽음 처리 실패', e)
      }
    },

    async deleteOne(notificationId) {
      try {
        const target = this.notifications.find(n => n.id === notificationId)
        await deleteNotification(notificationId)
        this.notifications = this.notifications.filter(n => n.id !== notificationId)
        if (target && !target.isRead) {
          this.unreadCount = Math.max(0, this.unreadCount - 1)
        }
      } catch (e) {
        console.error('[NotificationStore] 알림 삭제 실패', e)
      }
    },

    async deleteAll() {
      try {
        await deleteAllNotifications()
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
