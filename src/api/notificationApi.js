import api from '@/api/axios.js'

export const getNotifications = (userId, page = 0, size = 20) =>
  api.get('/notifications', { params: { userId, page, size } })

export const getUnreadNotificationCount = (userId) =>
  api.get('/notifications/unread-count', { params: { userId } })

export const markAsRead = (notificationId, userId) =>
  api.patch(`/notifications/${notificationId}/read`, null, { params: { userId } })

export const markAllAsRead = (userId) =>
  api.patch('/notifications/read-all', null, { params: { userId } })
