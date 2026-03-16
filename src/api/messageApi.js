import api from '@/api/axios.js'

// 사용자 검색
export const searchUsers = (nickname) =>
  api.get('/users/search', { params: { nickname } })

// 쪽지
export const sendMessage = (userId, receiverId, content, point = 0) =>
  api.post('/messages', { receiverId, content, point }, { params: { userId } })

export const getReceivedMessages = (userId, page = 0, size = 20) =>
  api.get('/messages/received', { params: { userId, page, size } })

export const getSentMessages = (userId, page = 0, size = 20) =>
  api.get('/messages/sent', { params: { userId, page, size } })

export const readMessage = (messageId, userId) =>
  api.get(`/messages/${messageId}`, { params: { userId } })

export const deleteMessage = (messageId, userId) =>
  api.delete(`/messages/${messageId}`, { params: { userId } })

export const getUnreadCount = (userId) =>
  api.get('/messages/unread-count', { params: { userId } })

// 차단
export const blockUser = (userId, blockedId) =>
  api.post(`/messages/blocks/${blockedId}`, null, { params: { userId } })

export const unblockUser = (userId, blockedId) =>
  api.delete(`/messages/blocks/${blockedId}`, { params: { userId } })

export const getBlockList = (userId, page = 0, size = 20) =>
  api.get('/messages/blocks', { params: { userId, page, size } })
