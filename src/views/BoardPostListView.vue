<template>
  <div class="board-post-list">
    <h2 class="board-title">
      {{ boardName }}
    </h2>
    <table class="post-table">
      <thead>
      <tr>
        <th>번호</th>
        <th>제목</th>
        <th>작성자</th>
        <th>조회수</th>
        <th>댓글수</th>
        <th>좋아요</th>
        <th>싫어요</th>
        <th>작성일</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="post in posts" :key="post.postId">
        <td>{{ post.postId }}</td>
        <td>
          <span class="post-link" @click="goPostDetail(post.postId)">
            {{ post.title }}
          </span>
        </td>
        <td>{{ post.authorNickName }}</td>
        <td>{{ post.viewCount }}</td>
        <td>{{ post.commentCount }}</td>
        <td>{{ post.likeCount }}</td>
        <td>{{ post.dislikeCount }}</td>
        <td>{{ formatDate(post.createdAt) }}</td>
      </tr>
      <tr v-if="posts.length === 0">
        <td colspan="8" class="empty">게시글이 없습니다.</td>
      </tr>
      </tbody>
    </table>
    <button class="post-btn" @click="goPost">
      글쓰기
    </button>
    <div class="pagination">
      <button :disabled="page === 0" @click="movePage(page - 1)">
        이전
      </button>
      <span>{{ page + 1 }} / {{ totalPages }}</span>
      <button :disabled="page + 1 >= totalPages" @click="movePage(page + 1)">
        다음
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api/axios.js'
import router from '@/router/index.js'

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
  router.push({name: 'Post', params:{boardId:boardId.value}})
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

<style scoped>
.board-post-list {
  padding: 80px 24px 24px; /* 헤더 fixed 고려해서 위쪽 여백 */
}

.board-title {
  margin-bottom: 16px;
}

.post-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
  color: black;
}
.post-table tbody:hover{
  background-color: #f5f5f5
}

.post-table th,
.post-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.post-table thead {
  background: #f5f5f5;
}

.empty {
  text-align: center;
  color: #999;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 8px;
}

.post-btn{
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid #ccc;
  cursor: pointer;
}

.post-link {
  cursor: pointer;
  text-decoration: none;   /* 밑줄 제거 */
  padding: 2px 4px;
  border-radius: 2px;
}

</style>
