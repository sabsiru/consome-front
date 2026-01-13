<template>
  <div class="page-board">
    <div class="page-board__header">
      <div class="page-board__title-row">
        <h2 class="page-board__title" @click="goBoardPosts">{{ boardName }}</h2>
        <button class="btn btn-primary" @click="emitWrite">글쓰기</button>
      </div>
      <div class="page-board__meta">{{ totalElements }}개 · {{ page + 1 }} / {{ totalPages }}</div>
    </div>

    <div class="page-board__tabs">
      <div
        class="page-board__tab"
        :class="{ 'is-active': selectedCategoryId === null }"
        @click="selectCategory(null)"
      >
        전체
      </div>

      <div
        v-for="c in categories"
        :key="c.id"
        class="page-board__tab"
        :class="{ 'is-active': selectedCategoryId === c.id }"
        @click="selectCategory(c.id)"
      >
        {{ c.name }}
      </div>
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
        <tr
          v-for="post in posts"
          :key="post.postId"
          :class="{ 'is-active': activePostId === post.postId }"
          class="board-row"
          @click="emitPostClick(post.postId)"
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
import { useRoute, useRouter } from 'vue-router'
import api from '@/api/axios.js'
import '@/assets/styles/components.css'
import '@/assets/styles/pages/board.css'
const route = useRoute()
const router = useRouter()

const props = defineProps({
  boardId: { type: Number, required: true },
  page: { type: Number, default: 0 },
  size: { type: Number, default: 20 },
  categoryId: { type: [Number, null], default: null },
  activePostId: { type: Number, default: null },
})

const emit = defineEmits([
  'page-change',
  'category-change',
  'post-click',
  'write-click',
  'loaded', // { boardName, totalPages, totalElements }
])

const posts = ref([])
const totalElements = ref(0)
const totalPages = ref(0)
const boardName = ref('')
const categories = ref([])

// 내부 선택 상태는 props로부터 동기화
const selectedCategoryId = ref(props.categoryId ?? null)

watch(
  () => props.categoryId,
  (v) => {
    selectedCategoryId.value = v ?? null
  },
)

// ===== API =====
const loadPosts = async () => {
  if (!props.boardId) return

  const params = {
    page: props.page,
    size: props.size,
  }
  if (selectedCategoryId.value !== null) {
    params.categoryId = selectedCategoryId.value
  }

  const res = await api.get(`/boards/${props.boardId}/posts`, { params })
  const data = res.data

  posts.value = data.posts
  totalElements.value = data.totalElements
  totalPages.value = data.totalPages
  boardName.value = data.boardName

  emit('loaded', {
    boardName: boardName.value,
    totalPages: totalPages.value,
    totalElements: totalElements.value,
  })
}

const loadCategories = async () => {
  if (!props.boardId) return

  const res = await api.get(`/boards/${props.boardId}/categories`)
  const raw = res.data.categories ?? res.data

  // id 통일
  categories.value = raw.map((c) => ({
    id: c.id ?? c.categoryId,
    name: c.name,
  }))
}

onMounted(() => {
  loadPosts()
  loadCategories()
})

watch(
  () => [props.boardId, props.page, props.size, props.categoryId],
  () => {
    loadPosts()
    loadCategories()
  },
)

const goBoardPosts = () => {
  // “자유게시판(현재 게시판)”의 목록(페이징)으로 이동
  router.push({
    name: 'BoardPosts',
    params: { boardId: props.boardId},
    query: {
      page: route.query.page,
      size: route.query.size,
    },
  })
}

// ===== UI handlers =====
const movePage = (targetPage) => {
  if (targetPage < 0 || targetPage >= totalPages.value) return
  emit('page-change', targetPage)
}

const selectCategory = (categoryId) => {
  selectedCategoryId.value = categoryId
  emit('category-change', categoryId) // 부모가 page=0으로 리셋 + URL 갱신
}

const emitPostClick = (postId) => emit('post-click', postId)
const emitWrite = () => emit('write-click')

const formatDate = (isoString) => {
  if (!isoString) return ''
  return isoString.replace('T', ' ').substring(0, 16)
}
</script>
