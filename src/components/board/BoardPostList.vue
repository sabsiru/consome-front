<template>
  <div class="page-board">
    <div class="page-board__header">
      <div class="page-board__title-row">
        <div class="page-board__meta">{{ totalElements }}개 · {{ page + 1 }} / {{ totalPages }}</div>
        <div class="page-board__actions">
          <template v-if="isAdmin && isManageMode && hasOrderChanged">
            <button class="btn btn-success" @click="savePinnedOrder">순서 저장</button>
            <button class="btn btn-secondary" @click="cancelPinnedOrder">취소</button>
          </template>
          <button
            v-if="isAdmin"
            class="btn"
            :class="isManageMode ? 'btn-danger' : 'btn-secondary'"
            @click="toggleManageMode"
          >
            {{ isManageMode ? '관리 종료' : '관리' }}
          </button>
          <button v-if="canWrite" class="btn btn-primary" @click="emitWrite">글쓰기</button>
        </div>
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
          <th v-if="isAdmin && isManageMode" class="col-drag"></th>
          <th v-if="isAdmin && isManageMode" class="col-pin">고정</th>
          <th class="col-category">카테고리</th>
          <th class="col-title">제목</th>
          <th class="col-author">작성자</th>
          <th class="col-views">조회수</th>
          <th class="col-like">추천</th>
          <th class="col-date">작성일</th>
        </tr>
      </thead>

      <!-- 관리 모드: 드래그앤드롭 가능한 고정 게시글 -->
      <draggable
        v-if="isAdmin && isManageMode && draggablePinnedPosts.length > 0"
        v-model="draggablePinnedPosts"
        tag="tbody"
        item-key="postId"
        handle=".drag-handle"
        ghost-class="sortable-ghost"
        @end="onPinnedDragEnd"
      >
        <template #item="{ element: post }">
          <tr
            :class="{
              'is-active': activePostId === post.postId,
              'is-pinned': true,
              'is-pinned-notice': post.categoryName === '공지사항',
              'is-read': isRead(post.postId)
            }"
            class="board-row"
            @click="emitPostClick(post.postId)"
          >
            <td class="col-drag" @click.stop>
              <span class="drag-handle">⋮⋮</span>
            </td>
            <td class="col-pin" @click.stop>
              <button
                :class="['btn-pin', { 'is-pinned': post.isPinned }]"
                @click="togglePin(post)"
              >
                {{ post.isPinned ? 'ON' : 'OFF' }}
              </button>
            </td>
            <td class="col-category">{{ post.categoryName }}</td>
            <td class="col-title">
              <span v-html="highlightKeyword(post.title, props.keyword)"></span>
              <span v-if="post.hasMedia" class="post-media-icon" title="미디어 포함">🖼️</span>
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
        </template>
      </draggable>

      <tbody>
        <!-- 일반 모드: 고정 게시글 (드래그 불가) -->
        <template v-if="!isManageMode">
          <tr
            v-for="post in visiblePinnedPosts"
            :key="post.postId"
            :class="{
              'is-active': activePostId === post.postId,
              'is-pinned': true,
              'is-pinned-notice': post.categoryName === '공지사항',
              'is-read': isRead(post.postId)
            }"
            class="board-row"
            @click="emitPostClick(post.postId)"
          >
            <td class="col-category">{{ post.categoryName }}</td>
            <td class="col-title">
              <span v-html="highlightKeyword(post.title, props.keyword)"></span>
              <span v-if="post.hasMedia" class="post-media-icon" title="미디어 포함">🖼️</span>
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
        </template>

        <!-- 접기/펼치기 버튼 (일반 모드에서만) -->
        <tr v-if="!isManageMode && pinnedPosts.length > 5" class="pinned-toggle-row">
          <td colspan="6">
            <button class="btn-toggle-pinned" @click="togglePinnedExpand">
              {{ isPinnedExpanded ? '접기 ▲' : `펼치기 (${pinnedPosts.length - 5}개 더보기) ▼` }}
            </button>
          </td>
        </tr>

        <!-- 일반 게시글 -->
        <tr
          v-for="post in regularPosts"
          :key="post.postId"
          :class="{ 'is-active': activePostId === post.postId, 'is-read': isRead(post.postId) }"
          class="board-row"
          @click="emitPostClick(post.postId)"
        >
          <td v-if="isAdmin && isManageMode" class="col-drag"></td>
          <td v-if="isAdmin && isManageMode" class="col-pin" @click.stop>
            <button
              :class="['btn-pin', { 'is-pinned': post.isPinned }]"
              @click="togglePin(post)"
            >
              {{ post.isPinned ? 'ON' : 'OFF' }}
            </button>
          </td>
          <td class="col-category">{{ post.categoryName }}</td>
          <td class="col-title">
            <span v-html="highlightKeyword(post.title, props.keyword)"></span>
            <span v-if="post.hasMedia" class="post-media-icon" title="미디어 포함">🖼️</span>
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
          <td class="board-empty" :colspan="isAdmin && isManageMode ? 8 : 6">게시글이 없습니다.</td>
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
      @report="onReport"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import draggable from 'vuedraggable'
import api from '@/api/axios.js'
import LevelBadge from '@/components/common/LevelBadge.vue'
import UserActionModal from '@/components/common/UserActionModal.vue'
import { useUserStore } from '@/stores/userStore.js'
import { useReadPosts } from '@/composables/useReadPosts.js'
import '@/assets/styles/components.css'
import '@/assets/styles/board/board.css'

const props = defineProps({
  boardId: { type: Number, required: true },
  page: { type: Number, default: 0 },
  size: { type: Number, default: 50 },
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
  'report', // { targetType, targetId }
])

const userStore = useUserStore()
const { isRead } = useReadPosts()

const posts = ref([])
const totalElements = ref(0)
const totalPages = ref(0)
const boardName = ref('')
const categories = ref([])
const writeEnabled = ref(true)
const isPinnedExpanded = ref(false)
const isManageMode = ref(false)

// 드래그앤드롭용 상태
const draggablePinnedPosts = ref([])
const originalPinnedOrder = ref([])
const hasOrderChanged = ref(false)

const canWrite = computed(() => {
  // 게시판 레벨 설정이 우선 (writeEnabled가 명시적으로 설정된 경우)
  // writeEnabled=true면 sectionAdminOnly 무시하고 글쓰기 허용
  if (writeEnabled.value) {
    return true
  }
  // writeEnabled=false면 ADMIN만 가능
  return userStore.role === 'ADMIN'
})

const isAdmin = computed(() => {
  // ADMIN이거나 해당 게시판의 관리자(MANAGER)
  return userStore.role === 'ADMIN' ||
         (userStore.role === 'MANAGER' && userStore.managedBoardIds.includes(props.boardId))
})

const pinnedPosts = computed(() => posts.value.filter(p => p.isPinned))
const regularPosts = computed(() => posts.value.filter(p => !p.isPinned))
const visiblePinnedPosts = computed(() => {
  if (isPinnedExpanded.value) {
    return pinnedPosts.value
  }
  return pinnedPosts.value.slice(0, 5)
})

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
  writeEnabled.value = data.writeEnabled ?? true

  emit('loaded', {
    boardName: boardName.value,
    totalPages: totalPages.value,
    totalElements: totalElements.value,
    writeEnabled: writeEnabled.value,
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
    isPinnedExpanded.value = false // 페이지/카테고리 변경 시 접기 상태 초기화
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

const onReport = (payload) => {
  emit('report', payload)
}

// 검색어 강조 (TITLE, TITLE_CONTENT일 때만)
const highlightKeyword = (text, keyword) => {
  if (!keyword || !text) return text
  // 제목/내용 검색일 때만 강조
  if (!['TITLE', 'TITLE_CONTENT'].includes(props.searchType)) return text
  // 정규식 특수문자 이스케이프
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
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

const togglePinnedExpand = () => {
  isPinnedExpanded.value = !isPinnedExpanded.value
}

const togglePin = async (post) => {
  try {
    await api.patch(`/admin/posts/${post.postId}/pin`, {
      isPinned: !post.isPinned,
      pinnedOrder: null  // 자동 계산
    })
    await loadPosts()  // 목록 새로고침
    if (isManageMode.value) {
      syncDraggablePinnedPosts()
    }
  } catch (error) {
    alert('고정 상태를 변경할 수 없습니다.')
  }
}

const toggleManageMode = () => {
  isManageMode.value = !isManageMode.value
  if (isManageMode.value) {
    // 관리 모드 진입 시 드래그용 배열 초기화
    syncDraggablePinnedPosts()
  } else {
    // 관리 모드 종료 시 변경 취소
    hasOrderChanged.value = false
  }
}

// 드래그앤드롭 관련 함수
const syncDraggablePinnedPosts = () => {
  draggablePinnedPosts.value = [...pinnedPosts.value]
  originalPinnedOrder.value = pinnedPosts.value.map(p => p.postId)
  hasOrderChanged.value = false
}

const onPinnedDragEnd = () => {
  // 순서가 변경되었는지 체크
  const currentOrder = draggablePinnedPosts.value.map(p => p.postId)
  hasOrderChanged.value = JSON.stringify(currentOrder) !== JSON.stringify(originalPinnedOrder.value)
}

const savePinnedOrder = async () => {
  try {
    const orders = draggablePinnedPosts.value.map((post, index) => ({
      postId: post.postId,
      pinnedOrder: index + 1
    }))

    await api.put('/admin/posts/pinned/reorder', {
      boardId: props.boardId,
      orders
    })

    alert('순서가 저장되었습니다.')
    hasOrderChanged.value = false
    await loadPosts()
    syncDraggablePinnedPosts()
  } catch (error) {
    alert('순서 저장에 실패했습니다.')
  }
}

const cancelPinnedOrder = () => {
  syncDraggablePinnedPosts()
}
</script>

<style scoped>
/* 관리 모드 버튼 */
.btn-danger {
  background-color: #dc3545;
  color: white;
  border: 1px solid #dc3545;
}

.btn-danger:hover {
  background-color: #c82333;
  border-color: #bd2130;
}

.btn-success {
  background-color: #28a745;
  color: white;
  border: 1px solid #28a745;
}

.btn-success:hover {
  background-color: #218838;
  border-color: #1e7e34;
}

/* 드래그 핸들 */
.col-drag {
  width: 30px;
  text-align: center;
}

.drag-handle {
  cursor: grab;
  color: #888;
  font-size: 14px;
  user-select: none;
}

.drag-handle:hover {
  color: #fff;
}

.drag-handle:active {
  cursor: grabbing;
}

/* 드래그 중인 항목 */
.sortable-ghost {
  opacity: 0.4;
  background-color: #3d3d5c !important;
}

/* 고정 핀 버튼 - ON (고정됨) */
.btn-pin.is-pinned {
  background-color: #28a745 !important;
  border: 2px solid #28a745 !important;
  color: white !important;
  font-size: 12px !important;
  font-weight: 700 !important;
  padding: 6px 12px !important;
  border-radius: 4px !important;
  box-shadow: 0 2px 4px rgba(40, 167, 69, 0.3) !important;
}

.btn-pin.is-pinned:hover {
  background-color: #218838 !important;
  border-color: #1e7e34 !important;
  transform: scale(1.05) !important;
  box-shadow: 0 3px 6px rgba(40, 167, 69, 0.4) !important;
}

/* 고정 핀 버튼 - OFF (미고정) */
.btn-pin:not(.is-pinned) {
  background-color: #6c757d !important;
  border: 2px solid #6c757d !important;
  color: white !important;
  font-size: 12px !important;
  font-weight: 700 !important;
  padding: 6px 12px !important;
  border-radius: 4px !important;
  opacity: 0.6 !important;
}

.btn-pin:not(.is-pinned):hover {
  background-color: #5a6268 !important;
  border-color: #545b62 !important;
  opacity: 1 !important;
  transform: scale(1.05) !important;
}

/* 고정 게시글 - 일반 (베이지톤 제거, 테두리만) */
.board-row.is-pinned {
  border-left: 3px solid #ffa500 !important;
}

/* 고정 게시글 - 공지사항 (보라색 배경 톤업) */
.board-row.is-pinned-notice {
  background-color: #25253a !important;
  border-left: 3px solid #888 !important;
}

.board-row.is-pinned-notice:hover {
  background-color: #2d2d42 !important;
}

/* 미디어 아이콘 */
.post-media-icon {
  margin-left: 6px;
  font-size: 12px;
  opacity: 0.8;
}

/* 읽은 게시글 */
.board-row.is-read .col-title {
  color: #888;
}
</style>
