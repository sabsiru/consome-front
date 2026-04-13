import api from '@/api/axios.js'

export const getNotifications = (page = 0, size = 20) =>
  api.get('/notifications', { params: { page, size } })

export const getUnreadNotificationCount = () =>
  api.get('/notifications/unread-count')

export const markAsRead = (notificationId) =>
  api.patch(`/notifications/${notificationId}/read`)

export const markAllAsRead = () =>
  api.patch('/notifications/read-all')

export const deleteNotification = (notificationId) =>
  api.delete(`/notifications/${notificationId}`)

export const deleteAllNotifications = () =>
  api.delete('/notifications')

export const createSseToken = () =>
  api.post('/notifications/sse-token')
