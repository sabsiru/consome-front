<template>
  <div class="board-manage">
    <header class="page-header">
      <h1>Board<span class="accent">.</span>Manager</h1>
      <p class="subtitle">Board → Category</p>
    </header>

    <div class="split-panel">
      <!-- 좌측: 보드 리스트 -->
      <div class="panel-left">
        <div class="search-bar">
          <input
            v-model="searchKeyword"
            class="search-input"
            placeholder="Search boards..."
            @keyup.enter="searchBoards"
          />
          <button class="search-btn" @click="searchBoards">검색</button>
        </div>

        <div class="board-list">
          <div
            v-for="board in boards"
            :key="board.id"
            :class="['board-item', { selected: selectedBoard?.id === board.id }]"
            @click="selectBoard(board)"
          >
            <span class="board-name">{{ board.name }}</span>
            <!--            <span class="category-count">{{ board.categoryCount || 0 }}</span>-->
          </div>

          <div v-if="!boards.length" class="empty-list">
            <span class="empty-icon">∅</span>
            <p>No boards found</p>
          </div>
        </div>

        <!-- 페이지네이션 -->
        <div v-if="totalPages > 1" class="pagination">
          <button :disabled="page === 0" @click="changePage(page - 1)">‹</button>
          <span>{{ page + 1 }} / {{ totalPages }}</span>
          <button :disabled="page >= totalPages - 1" @click="changePage(page + 1)">›</button>
        </div>

        <button class="create-board-btn" @click="startCreateBoard">
          <span class="btn-icon">+</span> 보드 생성
        </button>
      </div>

      <!-- 우측: 상세/편집 패널 -->
      <div class="panel-right">
        <div class="action-bar">
          <button class="back-btn" @click="$router.back()">뒤로가기</button>
        </div>

        <!-- 보드 생성 모드 -->
        <div v-if="mode === 'create-board'" class="detail-panel create-mode">
          <div class="panel-header">
            <span class="panel-tag">CREATE</span>
            <h2>New Board</h2>
          </div>

          <div class="form-group">
            <label>Name</label>
            <input v-model="createForm.name" class="form-input" placeholder="Enter name..." />
          </div>

          <div class="form-group">
            <label>Description</label>
            <textarea
              v-model="createForm.description"
              class="form-textarea"
              placeholder="Enter description..."
              rows="3"
            ></textarea>
          </div>

          <div class="panel-actions">
            <button class="btn btn-ghost" @click="cancelCreate">Cancel</button>
            <button class="btn btn-primary" @click="createBoard">
              <span class="btn-icon">+</span> Create
            </button>
          </div>
        </div>

        <!-- 카테고리 생성 모드 -->
        <div v-else-if="mode === 'create-category'" class="detail-panel create-mode">
          <div class="panel-header">
            <span class="panel-tag">CREATE</span>
            <h2>New Category</h2>
          </div>

          <div class="form-group">
            <label>Parent Board</label>
            <input :value="selectedBoard?.name" class="form-input" disabled />
          </div>

          <div class="form-group">
            <label>Name</label>
            <input v-model="createForm.name" class="form-input" placeholder="Enter name..." />
          </div>

          <div class="panel-actions">
            <button class="btn btn-ghost" @click="cancelCreate">Cancel</button>
            <button class="btn btn-primary" @click="createCategory">
              <span class="btn-icon">+</span> Create
            </button>
          </div>
        </div>

        <!-- 보드 상세 -->
        <div v-else-if="selectedBoard" class="detail-panel edit-mode">
          <div class="panel-header">
            <span class="panel-tag">BOARD</span>
            <h2>{{ editForm.name || 'Untitled' }}</h2>
          </div>

          <div class="form-group">
            <label>Name</label>
            <input v-model="editForm.name" class="form-input" />
          </div>

          <div class="form-group">
            <label>Description</label>
            <textarea v-model="editForm.description" class="form-textarea" rows="3"></textarea>
          </div>

          <div class="meta-info">
            <div class="meta-item">
              <span class="meta-label">ID</span>
              <span class="meta-value">{{ selectedBoard.id }}</span>
            </div>
          </div>

          <div class="panel-actions">
            <button class="btn btn-danger" @click="deleteBoard">Delete</button>
            <button class="btn btn-primary" @click="saveBoard">Save Changes</button>
          </div>

          <!-- 카테고리 섹션 -->
          <div class="category-section">
            <div class="category-header">
              <h3>Categories</h3>
              <button class="add-category-btn" @click="startCreateCategory">+ 카테고리 추가</button>
            </div>

            <draggable
              v-model="categories"
              item-key="id"
              handle=".drag-handle"
              ghost-class="sortable-ghost"
              @end="onCategoryDragEnd"
              class="category-list"
            >
              <template #item="{ element: category }">
                <div :class="['category-item', { editing: editingCategoryId === category.id }]">
                  <span class="drag-handle">⋮⋮</span>
                  <template v-if="editingCategoryId === category.id">
                    <input v-model="editingCategoryName" class="category-edit-input" />
                    <div class="category-actions">
                      <button class="btn-sm btn-primary" @click="saveCategory(category.id)">
                        저장
                      </button>
                      <button class="btn-sm btn-ghost" @click="cancelEditCategory">취소</button>
                    </div>
                  </template>
                  <template v-else>
                    <span class="category-name">{{ category.name }}</span>
                    <div class="category-actions">
                      <button class="btn-sm" @click="startEditCategory(category)">수정</button>
                      <button class="btn-sm btn-danger" @click="deleteCategory(category.id)">
                        삭제
                      </button>
                    </div>
                  </template>
                </div>
              </template>
            </draggable>
            <div v-if="!categories.length" class="empty-categories">카테고리가 없습니다</div>
          </div>
        </div>

        <!-- 미선택 -->
        <div v-else class="detail-panel empty-state">
          <div class="empty-content">
            <span class="empty-icon">◎</span>
            <p>Select a board to edit</p>
            <p class="empty-hint">or create a new one</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import draggable from 'vuedraggable'
import api from '@/api/axios'
import '@/assets/styles/admin/admin.css'
import '@/assets/styles/admin/board-manage.css'

// 보드 목록
const boards = ref([])
const page = ref(0)
const size = ref(20)
const totalElements = ref(0)
const totalPages = ref(0)
const searchKeyword = ref('')

// 선택/모드
const mode = ref(null)
const selectedBoard = ref(null)
const categories = ref([])

// 생성 폼
const createForm = ref({ name: '', description: '' })

// 편집 폼
const editForm = ref({ name: '', description: '' })

// 카테고리 편집
const editingCategoryId = ref(null)
const editingCategoryName = ref('')

onMounted(async () => {
  await loadBoards()
})

// 보드 목록 조회
const loadBoards = async () => {
  try {
    const res = await api.get('/admin/manage/boards', {
      params: {
        page: page.value,
        size: size.value,
      },
    })
   const data = res.data
    boards.value = data.boards
    page.value = data.page
    size.value = data.size
    totalElements.value = data.totalElements
    totalPages.value = data.totalPages
  } catch (err) {
    console.error(err)
  }
}

// 보드 검색
const searchBoards = async () => {
  if (!searchKeyword.value.trim()) {
    page.value = 0
    await loadBoards()
    return
  }
  try {
    const res = await api.get('/admin/manage/boards/search', {
      params: { keyword: searchKeyword.value, page: 0, size: 20 },
    })
    const data = res.data
    boards.value = data.boards
    page.value = data.page
    size.value = data.size
    totalElements.value = data.totalElements
    totalPages.value = data.totalPages
  } catch (err) {
    console.error(err)
  }
}

// 페이지 변경
const changePage = async (newPage) => {
  page.value = newPage
  if (searchKeyword.value.trim()) {
    const res = await api.get('/admin/manage/boards/search', {
      params: { keyword: searchKeyword.value, page: newPage, size: 20 },
    })
    boards.value = res.data.content
    totalPages.value = res.data.totalPages
  } else {
    await loadBoards()
  }
}

// 보드 선택
const selectBoard = async (board) => {
  mode.value = null
  selectedBoard.value = board
  editForm.value = {
    name: board.name,
    description: board.description || '',
  }
  await loadCategories(board.id)
}

// 카테고리 목록 조회
const loadCategories = async (boardId) => {
  try {
    const res = await api.get(`/admin/boards/${boardId}/categories`)
    categories.value = res.data
  } catch (err) {
    console.error(err)
    categories.value = []
  }
}

// 보드 생성 시작
const startCreateBoard = () => {
  mode.value = 'create-board'
  selectedBoard.value = null
  createForm.value = { name: '', description: '' }
}

// 카테고리 생성 시작
const startCreateCategory = () => {
  mode.value = 'create-category'
  createForm.value = { name: '' }
}

// 생성 취소
const cancelCreate = () => {
  mode.value = null
  if (selectedBoard.value) {
    // 보드가 선택되어 있으면 상세 화면으로 복귀
  }
}

// 보드 생성
const createBoard = async () => {
  try {
    await api.post('/admin/boards', {
      name: createForm.value.name,
      description: createForm.value.description,
    })
    mode.value = null
    await loadBoards()
  } catch (err) {
    console.error(err)
    alert('보드 생성 실패')
  }
}

// 보드 저장 (변경된 필드만 전송)
const saveBoard = async () => {
  const payload = {}
  if (editForm.value.name !== selectedBoard.value.name) {
    payload.name = editForm.value.name
  }
  if (editForm.value.description !== (selectedBoard.value.description || '')) {
    payload.description = editForm.value.description
  }

  if (Object.keys(payload).length === 0) {
    alert('변경된 내용이 없습니다.')
    return
  }

  try {
    await api.patch(`/admin/boards/${selectedBoard.value.id}`, payload)
    await loadBoards()
    const updated = boards.value.find((b) => b.id === selectedBoard.value.id)
    if (updated) selectBoard(updated)
  } catch (err) {
    console.error(err)
    alert('저장 실패')
  }
}

// 보드 삭제
const deleteBoard = async () => {
  if (!confirm('정말 삭제하시겠습니까?')) return
  try {
    await api.delete(`/admin/boards/${selectedBoard.value.id}`)
    selectedBoard.value = null
    categories.value = []
    await loadBoards()
  } catch (err) {
    console.error(err)
    alert('삭제 실패')
  }
}

// 카테고리 생성
const createCategory = async () => {
  try {
    const maxOrder =
      categories.value.length > 0
        ? Math.max(...categories.value.map((c) => c.displayOrder || 0))
        : 0
    await api.post('/admin/categories', {
      boardId: selectedBoard.value.id,
      name: createForm.value.name,
      displayOrder: maxOrder + 1,
    })
    mode.value = null
    await loadCategories(selectedBoard.value.id)
  } catch (err) {
    console.error(err)
    alert('카테고리 생성 실패')
  }
}

// 카테고리 편집 시작
const startEditCategory = (category) => {
  editingCategoryId.value = category.id
  editingCategoryName.value = category.name
}

// 카테고리 편집 취소
const cancelEditCategory = () => {
  editingCategoryId.value = null
  editingCategoryName.value = ''
}

// 카테고리 저장
const saveCategory = async (categoryId) => {
  try {
    await api.patch(`/admin/categories/${categoryId}/name`, {
      name: editingCategoryName.value,
      boardId: selectedBoard.value.id,
    })
    editingCategoryId.value = null
    await loadCategories(selectedBoard.value.id)
  } catch (err) {
    console.error(err)
    alert('카테고리 수정 실패')
  }
}

// 카테고리 삭제
const deleteCategory = async (categoryId) => {
  if (!confirm('정말 삭제하시겠습니까?')) return
  try {
    await api.delete(`/admin/categorys/${categoryId}`)
    await loadCategories(selectedBoard.value.id)
  } catch (err) {
    console.error(err)
    alert('카테고리 삭제 실패')
  }
}

// 카테고리 드래그 순서 변경
const onCategoryDragEnd = async () => {
  const orders = categories.value.map((cat, index) => ({
    boardId: selectedBoard.value.id,
    categoryId: cat.id,
    displayOrder: index + 1
  }))
  try {
    await api.put('/admin/categories/reorder', { orders })
  } catch (err) {
    console.error(err)
    alert('순서 변경 실패')
    await loadCategories(selectedBoard.value.id)
  }
}

watch(searchKeyword, (val) => {
  if (!val.trim()) {
    page.value = 0
    loadBoards()
  }
})
</script>
