<template>
  <div class="page-board">
    <div class="page-board__header">
      <div class="page-board__title-row">
        <h2 class="page-board__title">{{ boardName }}</h2>

        <!-- 글쓰기 버튼 -->
        <button class="btn btn-primary" @click="goPost">글쓰기</button>
      </div>

      <!-- 선택: 메타 라인(필요 없으면 제거) -->
      <div class="page-board__meta">{{ totalElements }}개 · {{ page + 1 }} / {{ totalPages }}</div>
    </div>

    <!-- 선택: 탭/필터 바(지금 기능 없으면 버튼만 둬도 됨) -->
    <div class="page-board__tabs">
      <div class="page-board__tab is-active">전체</div>
      <div class="page-board__tab">개발중</div>
      <div class="page-board__tab">공지</div>
    </div>

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
        <tr v-for="post in posts" :key="post.postId" @click="goPostDetail(post.postId)">
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
          <td class="board-empty" colspan="8">게시글이 없습니다.</td>
        </tr>
      </tbody>
    </table>

    <div class="page-board__footer">
      <div class="pagination">
        <button class="btn" :disabled="page === 0" @click="movePage(page - 1)">이전</button>
        <span>{{ page + 1 }} / {{ totalPages }}</span>
        <button class="btn" :disabled="page + 1 >= totalPages" @click="movePage(page + 1)">
          다음
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api/axios.js'
import router from '@/router/index.js'
import '@/assets/styles/components.css'
import '@/assets/styles/pages/board.css'

const route = useRoute()

// 라우터에서 넘어온 boardId
const boardId = ref(Number(route.params.boardId))

// 페이징 상태
const page = ref(0)
const size = ref(20)
const totalElements = ref(0)
const totalPages = ref(0)
const boardName = ref()

// 데이터
const posts = ref([])

const loadPosts = async () => {
  if (!boardId.value) return

  try {
    const res = await api.get(`/boards/${boardId.value}/posts`, {
      params: {
        page: page.value,
        size: size.value,
      },
    })

    const data = res.data // BoardPostListResponse
    console.log('boardList', data)
    posts.value = data.posts
    page.value = data.page
    size.value = data.size
    totalElements.value = data.totalElements
    totalPages.value = data.totalPages
    boardName.value = data.boardName
  } catch (e) {
    console.error('[BoardPostListView] 게시글 목록 조회 실패', e)
  }
}

const movePage = (targetPage) => {
  if (targetPage < 0 || targetPage >= totalPages.value) return
  page.value = targetPage
  loadPosts()
}

const formatDate = (isoString) => {
  if (!isoString) return ''
  return isoString.replace('T', ' ').substring(0, 16)
}

const goPost = () => {
  router.push({ name: 'Post', params: { boardId: boardId.value } })
}

const goPostDetail = (postId) => {
  router.push({ name: 'PostDetail', params: { postId } })
}

onMounted(() => {
  loadPosts()
})

// URL로 boardId가 바뀌는 경우 대응 (예: 헤더에서 다른 게시판 클릭)
watch(
  () => route.params.boardId,
  (newVal) => {
    boardId.value = Number(newVal)
    page.value = 0
    loadPosts()
  },
)
</script>
