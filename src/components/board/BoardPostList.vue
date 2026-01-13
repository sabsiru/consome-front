<template>
  <div class="board-post-list">
    <!-- 로딩 -->
    <div v-if="loading" class="board-post-list__status">불러오는 중...</div>

    <!-- 에러 -->
    <div v-else-if="error" class="board-post-list__status board-post-list__status--error">
      {{ error }}
    </div>

    <!-- 리스트 -->
    <template v-else>
      <!-- 헤더 -->
      <div class="page-board__header">
        <div class="page-board__title-row">
          <h2 class="page-board__title"></h2>
          <button class="btn btn-primary" @click="goPost">글쓰기</button>
        </div>
        <div class="page-board__meta">
          {{ totalElements }}개 · {{ page + 1 }} / {{ totalPages }}
        </div>
      </div>

      <!-- 테이블 -->
      <table class="board-table">
        <thead>
        <tr>
          <th class="col-category">카테고리</th>
          <th class="col-title">제목</th>
          <th class="col-author">작성자</th>
          <th class="col-views">조회수</th>
          <th class="col-like">좋아요</th>
          <th class="col-dislike">싫어요</th>
          <th class="col-date">작성일</th>
        </tr>
        </thead>

        <tbody>
        <tr
          v-for="post in posts"
          :key="post.postId"
          :class="{ 'is-active': activePostId === post.postId }"
          @click="goPostDetail(post.postId)"
        >
          <td class="col-category">{{ post.categoryName }}</td>
          <td class="col-title">
                {{ post.title }}
                <span v-if="post.commentCount > 0" class="post-comment-count">
                  [{{ post.commentCount }}]
                </span>
          </td>
          <td class="col-author">{{ post.authorNickName }}</td>
          <td class="col-views">{{ post.viewCount }}</td>
          <td class="col-like">{{ post.likeCount }}</td>
          <td class="col-dislike">{{ post.dislikeCount }}</td>
          <td class="col-date">{{ formatDate(post.createdAt) }}</td>
        </tr>

        <tr v-if="posts.length === 0">
          <td colspan="7" class="board-empty">게시글이 없습니다.</td>
        </tr>
        </tbody>
      </table>

      <!-- 페이징 (View와 동일한 UX) -->
      <div class="page-board__footer">
        <div class="pagination">
          <button class="btn" :disabled="page === 0" @click="movePage(page - 1)">이전</button>
          <span>{{ page + 1 }} / {{ totalPages }}</span>
          <button
            class="btn"
            :disabled="page + 1 >= totalPages"
            @click="movePage(page + 1)"
          >
            다음
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
<script setup>
import { ref, onMounted, watch } from 'vue'
import api from '@/api/axios.js'
import '@/assets/styles/components.css'
import '@/assets/styles/pages/board.css'

const props = defineProps({
  boardId: { type: Number, required: true },
  page: { type: Number, required: true }, // 0-based
  size: { type: Number, default: 20 },
  activePostId: { type: Number, default: null },
})

const emit = defineEmits(['page-change', 'post-click', 'write-click'])

// ===== state (View와 동일한 역할) =====
const posts = ref([])
const totalElements = ref(0)
const totalPages = ref(0)
const boardName = ref()
const loading = ref(false)
const error = ref(null)

// ===== API =====
const loadPosts = async () => {
  if (!props.boardId) return

  loading.value = true
  error.value = null

  try {
    const res = await api.get(`/boards/${props.boardId}/posts`, {
      params: {
        page: props.page,
        size: props.size,
      },
    })

    const data = res.data
    posts.value = data.posts
    totalElements.value = data.totalElements
    totalPages.value = data.totalPages
    boardName.value = data.boardName
  } catch (e) {
    console.error('[BoardPostList] 게시글 목록 조회 실패', e)
    error.value = '게시글을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

onMounted(loadPosts)

watch(
  () => [props.boardId, props.page, props.size],
  loadPosts,
)

// ===== events =====
const movePage = (targetPage) => {
  if (targetPage < 0 || targetPage >= totalPages.value) return
  emit('page-change', targetPage)
}

const goPostDetail = (postId) => {
  emit('post-click', postId)
}

const goPost = () => {
  emit('write-click')
}

const formatDate = (isoString) => {
  if (!isoString) return ''
  return isoString.replace('T', ' ').substring(0, 16)
}
</script>
