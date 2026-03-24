import { ref, computed } from 'vue'

const STORAGE_KEY = 'readPosts'
const RECENT_STORAGE_KEY = 'recentReadPosts'
const MAX_POSTS = 500
const MAX_RECENT = 20

// 전역 상태 (컴포저블 외부에서 공유)
const readPostIds = ref(new Set())
const recentPosts = ref([])

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

  try {
    const stored = localStorage.getItem(RECENT_STORAGE_KEY)
    if (stored) {
      recentPosts.value = JSON.parse(stored)
    }
  } catch {
    recentPosts.value = []
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

function saveRecentToStorage() {
  try {
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(recentPosts.value))
  } catch {
    // 시크릿 모드 등에서 실패 가능
  }
}

// 앱 시작 시 로드
loadFromStorage()

export function useReadPosts() {
  const markAsRead = (postId, meta = null) => {
    if (!postId) return
    readPostIds.value.add(postId)
    saveToStorage()

    if (meta && meta.title) {
      // 기존 항목 제거 후 맨 앞에 추가
      recentPosts.value = recentPosts.value.filter(p => p.postId !== postId)
      recentPosts.value.unshift({
        postId,
        title: meta.title,
        boardId: meta.boardId,
        boardName: meta.boardName,
        readAt: Date.now(),
      })
      if (recentPosts.value.length > MAX_RECENT) {
        recentPosts.value = recentPosts.value.slice(0, MAX_RECENT)
      }
      saveRecentToStorage()
    }
  }

  const isRead = (postId) => {
    return readPostIds.value.has(postId)
  }

  // 반응형 Set을 배열로 변환 (템플릿에서 사용 가능)
  const readPostIdList = computed(() => [...readPostIds.value])

  // 최근 읽은 게시글 (최신순, 최대 5개)
  const recentReadPosts = computed(() => recentPosts.value.slice(0, 5))

  return {
    markAsRead,
    isRead,
    readPostIdList,
    recentReadPosts,
  }
}
