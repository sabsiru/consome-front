import { ref, watch } from 'vue'
import { useUserStore } from '@/stores/userStore.js'
import { useNotificationStore } from '@/stores/notificationStore.js'
import { toast } from 'vue-sonner'
import { eventBus } from '@/utils/eventBus.js'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

let eventSource = null
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 10
const connected = ref(false)

export function useNotification() {
  const userStore = useUserStore()
  const notificationStore = useNotificationStore()

  function connect() {
    disconnect()

    const token = userStore.token
    if (!token) return

    const url = `${API_BASE}/notifications/subscribe?token=${encodeURIComponent(token)}`
    eventSource = new EventSource(url)

    eventSource.addEventListener('connect', () => {
      connected.value = true
      reconnectAttempts = 0
    })

    eventSource.addEventListener('notification', (event) => {
      try {
        const notification = JSON.parse(event.data)
        notificationStore.addNotification(notification)
        toast.info(notification.message)
        // 쪽지 알림 시 쪽지 unread count 갱신 트리거
        if (notification.type === 'MESSAGE') {
          eventBus.emit('message-received')
        }
      } catch (e) {
        console.error('[SSE] 알림 파싱 실패', e)
      }
    })

    eventSource.addEventListener('heartbeat', () => {
      // heartbeat 수신 - 연결 유지 확인
    })

    eventSource.onerror = () => {
      connected.value = false
      disconnect()
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.warn('[SSE] 최대 재연결 횟수 초과, 재연결 중단')
        return
      }
      // 지수 백오프: 2초, 4초, 8초, ... 최대 60초
      const delay = Math.min(2000 * Math.pow(2, reconnectAttempts), 60000)
      reconnectAttempts++
      setTimeout(() => {
        if (userStore.token) connect()
      }, delay)
    }
  }

  function disconnect() {
    if (eventSource) {
      eventSource.close()
      eventSource = null
      connected.value = false
    }
  }

  // 로그인/로그아웃 감지
  watch(() => userStore.token, (newToken) => {
    if (newToken) {
      connect()
      notificationStore.fetchUnreadCount(userStore.userId)
    } else {
      disconnect()
      notificationStore.clear()
    }
  }, { immediate: true })

  return {
    connected,
    connect,
    disconnect
  }
}
