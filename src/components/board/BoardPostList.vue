<template>
  <div class="page-board">
    <div class="page-board__header">
      <div class="page-board__title-row">
        <div class="page-board__meta">{{ totalElements }}개 · {{ page + 1 }} / {{ totalPages }}</div>
        <button class="btn btn-primary" @click="emitWrite">글쓰기</button>
      </div>
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
          <th class="col-like">추천</th>
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
          <td class="col-author" @click.stop="openUserModal($event, post)">
            <span class="author-link">
              <LevelBadge :level="post.authorLevel" :role="post.authorRole" size="sm" /> {{ post.authorNickName }}
            </span>
          </td>
          <td class="col-views">{{ post.viewCount }}</td>
          <td class="col-like">{{ post.likeCount-post.dislikeCount }}</td>
          <td class="col-date">{{ formatDate(post.createdAt) }}</td>
        </tr>

        <tr v-if="posts.length === 0">
          <td class="board-empty" colspan="8">게시글이 없습니다.</td>
        </tr>
      </tbody>
    </table>

    <div class="page-board__footer">
      <div class="pagination pagination--numbered">
        <button
          class="pagination__btn"
          :disabled="currentGroup === 0"
          @click="movePage(currentGroup * 10 - 1)"
        >
          &lt;&lt;
        </button>
        <button
          class="pagination__btn"
          :disabled="page === 0"
          @click="movePage(page - 1)"
        >
          &lt;
        </button>
        <button
          v-for="p in pageNumbers"
          :key="p"
          class="pagination__num"
          :class="{ 'is-active': p === page }"
          @click="movePage(p)"
        >
          {{ p + 1 }}
        </button>
        <button
          class="pagination__btn"
          :disabled="page + 1 >= totalPages"
          @click="movePage(page + 1)"
        >
          &gt;
        </button>
        <button
          class="pagination__btn"
          :disabled="(currentGroup + 1) * 10 >= totalPages"
          @click="movePage((currentGroup + 1) * 10)"
        >
          &gt;&gt;
        </button>
      </div>

      <div class="page-board__search">
        <select v-model="localSearchType" class="page-board__search-select">
          <option value="TITLE_CONTENT">전체</option>
          <option value="TITLE">제목</option>
          <option value="CONTENT">내용</option>
          <option value="NICKNAME">작성자</option>
          <option value="COMMENT">댓글</option>
        </select>
        <input
          v-model="localSearchKeyword"
          class="page-board__search-input"
          placeholder="검색어"
          @keyup.enter="onSearch"
        />
        <button class="btn btn-primary" @click="onSearch">검색</button>
      </div>
    </div>

    <!-- 유저 액션 모달 -->
    <UserActionModal
      :visible="userModal.visible"
      :user-id="userModal.userId"
      :nickname="userModal.nickname"
      :level="userModal.level"
      :role="userModal.role"
      :position="userModal.position"
      @close="closeUserModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import api from '@/api/axios.js'
import LevelBadge from '@/components/common/LevelBadge.vue'
import UserActionModal from '@/components/common/UserActionModal.vue'
import '@/assets/styles/components.css'
import '@/assets/styles/board/board.css'

const props = defineProps({
  boardId: { type: Number, required: true },
  page: { type: Number, default: 0 },
  size: { type: Number, default: 20 },
  categoryId: { type: [Number, null], default: null },
  activePostId: { type: Number, default: null },
  keyword: { type: String, default: '' },
  searchType: { type: String, default: 'TITLE_CONTENT' },
})

const emit = defineEmits([
  'page-change',
  'category-change',
  'post-click',
  'write-click',
  'search',
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

// 검색 로컬 상태
const localSearchKeyword = ref(props.keyword)
const localSearchType = ref(props.searchType)

watch(
  () => props.keyword,
  (v) => {
    localSearchKeyword.value = v
  },
)
watch(
  () => props.searchType,
  (v) => {
    localSearchType.value = v
  },
)

// 숫자 페이징 computed
const currentGroup = computed(() => Math.floor(props.page / 10))
const pageNumbers = computed(() => {
  const start = currentGroup.value * 10
  const end = Math.min(start + 10, totalPages.value)
  return Array.from({ length: end - start }, (_, i) => start + i)
})

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

  let res
  if (props.keyword) {
    params.keyword = props.keyword
    params.type = props.searchType
    res = await api.get(`/boards/${props.boardId}/posts/search`, { params })
  } else {
    res = await api.get(`/boards/${props.boardId}/posts`, { params })
  }
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
  () => [props.boardId, props.page, props.size, props.categoryId, props.keyword, props.searchType],
  () => {
    loadPosts()
    loadCategories()
  },
)

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

const onSearch = () => {
  emit('search', {
    keyword: localSearchKeyword.value.trim(),
    type: localSearchType.value,
  })
}

// 유저 모달 상태
const userModal = ref({
  visible: false,
  userId: 0,
  nickname: '',
  level: 1,
  role: 'USER',
  position: { x: 0, y: 0 }
})

const openUserModal = (event, post) => {
  userModal.value = {
    visible: true,
    userId: post.authorId,
    nickname: post.authorNickName,
    level: post.authorLevel,
    role: post.authorRole || 'USER',
    position: { x: event.clientX, y: event.clientY }
  }
}

const closeUserModal = () => {
  userModal.value.visible = false
}

const formatDate = (isoString) => {
  if (!isoString) return ''

  const createdAt = new Date(isoString)
  const now = new Date()

  const diffMs = now - createdAt
  const diffHours = diffMs / (1000 * 60 * 60)

  // 24시간 이내 → 시간만
  if (diffHours < 24) {
    const hh = String(createdAt.getHours()).padStart(2, '0')
    const mm = String(createdAt.getMinutes()).padStart(2, '0')
    return `${hh}:${mm}`
  }

  // 24시간 초과 → 날짜만
  const yyyy = createdAt.getFullYear()
  const mm = String(createdAt.getMonth() + 1).padStart(2, '0')
  const dd = String(createdAt.getDate()).padStart(2, '0')
  return `${yyyy}.${mm}.${dd}`
}
</script>
