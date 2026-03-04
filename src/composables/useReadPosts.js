import { ref, computed } from 'vue'

const STORAGE_KEY = 'readPosts'
const MAX_POSTS = 500

// 전역 상태 (컴포저블 외부에서 공유)
const readPostIds = ref(new Set())

// 초기 로드
function loadFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const arr = JSON.parse(stored)
      readPostIds.value = new Set(arr)
    }
  } catch {
    readPostIds.value = new Set()
  }
}

// 저장
function saveToStorage() {
  try {
    let arr = [...readPostIds.value]
    if (arr.length > MAX_POSTS) {
      arr = arr.slice(-MAX_POSTS)
      readPostIds.value = new Set(arr)
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr))
  } catch {
    // 시크릿 모드 등에서 실패 가능
  }
}

// 앱 시작 시 로드
loadFromStorage()

export function useReadPosts() {
  const markAsRead = (postId) => {
    if (!postId) return
    readPostIds.value.add(postId)
    saveToStorage()
  }

  const isRead = (postId) => {
    return readPostIds.value.has(postId)
  }

  // 반응형 Set을 배열로 변환 (템플릿에서 사용 가능)
  const readPostIdList = computed(() => [...readPostIds.value])

  return {
    markAsRead,
    isRead,
    readPostIdList,
  }
}
