<template>
  <div class="post-detail">
    <div class="post-back">
      <button type="button" class="btn" @click="goBackToList">
        목록
      </button>
    </div>
    <!-- 제목 -->
    <h1 class="post-title">
      {{ post?.title }}
    </h1>

    <!-- 메타 정보 (작성자/작성시간 좌측, 조회/추천/비추천 우측) -->
    <div class="post-meta" v-if="post">
      <div class="meta-left">
        <span class="author">{{ post.authorNickname }}</span>
        <span class="dot">·</span>
        <span class="created-at">{{ formatDateTime(post.createdAt) }}</span>
      </div>
      <div class="meta-right">
        <span class="meta-item">조회 {{ post.viewCount }}</span>
        <span class="meta-item">추천 {{ post.likeCount }}</span>
        <span class="meta-item">비추천 {{ post.dislikeCount }}</span>
      </div>
    </div>


    <!-- 본문 -->
    <div class="post-content" v-if="post">
      <!-- 백엔드에서 content를 순수 텍스트로 주면 그냥 {{ post.content }} 로 써도 됨 -->
      <p class="content-text">
        {{ post.content }}
      </p>
    </div>

    <!-- 추천 / 비추천 + 수정 / 삭제 (같은 행) -->
    <div class="post-bottom" v-if="post">
      <div class="post-reactions">
        <button type="button" class="btn reaction" @click="onLike">
          추천
        </button>
        <button type="button" class="btn reaction" @click="onDislike">
          비추천
        </button>
      </div>

      <!-- 작성자일 때만 오른쪽에 수정/삭제 노출 -->
      <div class="post-actions" v-if="isAuthor">
        <button type="button" class="btn" @click="goEdit">
          수정
        </button>
        <button type="button" class="btn danger" @click="onDelete">
          삭제
        </button>
      </div>
    </div>

    <!-- 댓글 영역 (추후 구현 예정) -->
    <div class="post-comments" v-if="post">
      <div class="post-comments-header">
        댓글
      </div>
      <!-- TODO: 댓글 리스트 & 입력 폼 -->
    </div>

    <!-- 로딩 / 에러 표시 (선택 사항) -->
    <div v-if="loading" class="status-text">
      불러오는 중...
    </div>
    <div v-else-if="error" class="status-text error">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api/axios.js'
import { useUserStore } from '@/stores/userStore'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const postId = computed(() => Number(route.params.postId))

const post = ref(null)
const loading = ref(false)
const error = ref(null)

// 작성자 == 현재 로그인 유저 인지 여부
const isAuthor = computed(() => {
  if (!post.value || !userStore.userId) return false
  return post.value.authorId === userStore.userId
})

// 상세 조회
const loadPost = async () => {
  loading.value = true
  error.value = null
  try {
    const { data } = await api.get(`/posts/${postId.value}`, {
      params: {
        userId: userStore.userId, // 조회수 집계에 필요하면 사용
      },
    })
    post.value = data
  } catch (e) {
    error.value =
      e?.response?.data?.message || '게시글을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

// 수정 페이지 이동 (지금은 작성 화면 재사용 가정)
const goEdit = () => {
  if (!post.value) return

  router.push({
    name: 'Post',
    params: {
      boardId: post.value.boardId,
    },
    query: {
      postId: postId.value,
      mode: 'edit',
    },
  })
}

// 삭제
const onDelete = async () => {
  if (!post.value) return
  if (!confirm('정말 삭제하시겠습니까?')) return

  try {
    await api.delete(`/posts/${postId.value}`, {
      params: {
        userId: userStore.userId,
      },
    })

    // 삭제 후 게시판 목록으로 이동
    await router.push({
      name: 'BoardPosts',
      params: { boardId: post.value.boardId },
    })
  } catch (e) {
    alert(e?.response?.data?.message || '삭제에 실패했습니다.')
  }
}

const onLike = async () => {
  if (!post.value) return
  if (!userStore.userId) {
    alert('로그인 후 이용 가능합니다.')
    return
  }

  try {
    const { data } = await api.post(`/posts/${postId.value}/like`, null, {
      params: {
        userId: userStore.userId,
      },
    })

    // PostStatResponse 기준으로 카운트 반영
    if (post.value) {
      post.value.viewCount = data.viewCount
      post.value.likeCount = data.likeCount
      post.value.dislikeCount = data.dislikeCount
    }
  } catch (e) {
    alert(e?.response?.data?.message || '추천에 실패했습니다.')
  }
}


const onDislike = async () => {
  if (!post.value) return
  if (!userStore.userId) {
    alert('로그인 후 이용 가능합니다.')
    return
  }

  try {
    const { data } = await api.post(`/posts/${postId.value}/dislike`, null, {
      params: {
        userId: userStore.userId,
      },
    })

    if (post.value) {
      post.value.viewCount = data.viewCount
      post.value.likeCount = data.likeCount
      post.value.dislikeCount = data.dislikeCount
    }
  } catch (e) {
    alert(e?.response?.data?.message || '비추천에 실패했습니다.')
  }
}

const goBackToList = () => {
  router.back()
}

const formatDateTime = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
}

onMounted(() => {
  if (!postId.value) {
    error.value = '잘못된 게시글 접근입니다.'
    return
  }
  loadPost()
})
</script>

<style scoped>
.post-detail {
  max-width: 840px;
  margin: 0 auto;
  padding: 24px 16px 40px;
}

.post-back {
  margin-bottom: 12px;
}

.post-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 16px;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
}

.meta-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.author {
  font-weight: 600;
}

.dot {
  font-size: 12px;
}

.post-content {
  padding-top: 16px;
  border-top: 1px solid #e5e5e5;
}

.content-text {
  white-space: pre-wrap;
  line-height: 1.6;
  font-size: 15px;
}

/* 본문 아래: 추천/비추천 + (작성자인 경우) 수정/삭제 한 줄 */
.post-bottom {
  margin-top: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.post-reactions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex: 1;
}

.btn.reaction {
  min-width: 80px;
}

.post-actions {
  display: flex;
  gap: 8px;
}

/* 댓글 영역 자리 */
.post-comments {
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid #e5e5e5;
}

.post-comments-header {
  font-weight: 600;
  margin-bottom: 12px;
}

.btn {
  padding: 6px 12px;
  font-size: 13px;
  border-radius: 4px;
  border: 1px solid #ddd;
  background: #f7f7f7;
  cursor: pointer;
}

.btn:hover {
  background: #eee;
}

.btn.danger {
  border-color: #e35858;
  color: #e35858;
}

.btn.danger:hover {
  background: #ffeaea;
}

.status-text {
  margin-top: 24px;
  font-size: 14px;
  color: #777;
}

.status-text.error {
  color: #e35858;
}
</style>
