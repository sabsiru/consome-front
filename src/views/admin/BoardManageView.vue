<template>
  <div class="board-manage">
    <header class="page-header">
      <div class="header-top">
        <div>
          <h1>Board<span class="accent">.</span>Manager</h1>
          <p class="subtitle">담당 게시판 관리 (MANAGER)</p>
        </div>
        <button class="btn btn-ghost" @click="$router.back()">← 뒤로가기</button>
      </div>
    </header>

    <div class="content-wrapper">
      <!-- 좌측: 담당 게시판 목록 -->
      <div class="board-list-section">
        <div class="board-list">
          <div
            v-for="board in boards"
            :key="board.id"
            :class="['board-item', { selected: selectedBoard?.id === board.id }]"
            @click="selectBoard(board)"
          >
            <span class="board-name">{{ board.name }}</span>
          </div>

          <div v-if="!boards.length" class="empty-list">
            <span class="empty-icon">∅</span>
            <p>담당 게시판이 없습니다</p>
          </div>
        </div>
      </div>

      <!-- 우측: 상세/편집 패널 -->
      <div class="detail-section">
        <!-- 카테고리 생성 모드 -->
        <div v-if="mode === 'create-category'" class="detail-panel create-mode">
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
            <div class="panel-title-row">
              <h2>{{ selectedBoard.name }}</h2>
              <button class="btn btn-link" @click="goToBoard">게시판 이동 →</button>
            </div>
          </div>

          <div class="form-group">
            <label>Name</label>
            <div class="name-check-row">
              <input v-model="editForm.name" class="form-input" @input="onNameInput" />
              <button
                class="btn btn-secondary btn-sm"
                :disabled="!isNameChanged || nameCheckLoading"
                @click="checkNameDuplicate"
              >
                {{ nameCheckLoading ? '확인 중...' : '중복 검사' }}
              </button>
            </div>
            <span v-if="nameCheckResult !== null" :class="['check-msg', nameCheckResult.available ? 'success' : 'error']">
              {{ nameCheckResult.available ? '사용 가능한 이름입니다.' : nameCheckResult.reason }}
            </span>
          </div>

          <div class="form-group">
            <label>Description</label>
            <textarea v-model="editForm.description" class="form-textarea" rows="3"></textarea>
          </div>

          <div class="panel-actions">
            <button class="btn btn-primary" :disabled="isNameChanged && !nameCheckPassed" @click="saveBoard">저장</button>
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
            <p>게시판을 선택하세요</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import draggable from 'vuedraggable'
import { toast } from 'vue-sonner'
import api from '@/api/axios'
import { useUserStore } from '@/stores/userStore'
import '@/assets/styles/admin/admin.css'
import '@/assets/styles/admin/board-manage.css'
import { useConfirm } from '@/composables/useConfirm.js'

const { confirm } = useConfirm()
const router = useRouter()
const userStore = useUserStore()

const goToBoard = () => {
  if (selectedBoard.value) {
    router.push(`/boards/${selectedBoard.value.id}`)
  }
}

// 담당 게시판 목록
const boards = ref([])

// 선택/모드
const mode = ref(null)
const selectedBoard = ref(null)
const categories = ref([])

// 생성 폼
const createForm = ref({ name: '' })

// 편집 폼
const editForm = ref({ name: '', description: '' })

// 이름 중복 검사 상태
const nameCheckResult = ref(null)
const nameCheckLoading = ref(false)
const nameCheckPassed = ref(false)

const isNameChanged = computed(() => {
  return selectedBoard.value && editForm.value.name !== selectedBoard.value.name
})

// 카테고리 편집
const editingCategoryId = ref(null)
const editingCategoryName = ref('')

onMounted(async () => {
  await loadBoards()
})

// 담당 게시판 목록 조회
const loadBoards = async () => {
  try {
    const ids = userStore.managedBoardIds.map(id => Number(id))
    if (ids.length === 0) {
      boards.value = []
      return
    }
    const res = await api.get('/admin/manage/boards', {
      params: { page: 0, size: 100 },
    })
    boards.value = res.data.boards.filter(b => ids.includes(Number(b.id)))
  } catch (err) {
    console.error(err)
  }
}

// 보드 선택
const selectBoard = async (board) => {
  mode.value = null
  selectedBoard.value = board
  editForm.value = {
    name: board.name || '',
    description: board.description || '',
  }
  nameCheckResult.value = null
  nameCheckPassed.value = false
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

// 카테고리 생성 시작
const startCreateCategory = () => {
  mode.value = 'create-category'
  createForm.value = { name: '' }
}

// 생성 취소
const cancelCreate = () => {
  mode.value = null
}

// 이름 입력 시 검사 상태 초기화
const onNameInput = () => {
  nameCheckResult.value = null
  nameCheckPassed.value = false
}

// 이름 중복 검사
const checkNameDuplicate = async () => {
  const name = editForm.value.name.trim()
  if (!name) {
    nameCheckResult.value = { available: false, reason: '이름을 입력해주세요.' }
    return
  }
  nameCheckLoading.value = true
  try {
    const res = await api.get('/admin/boards/check-name', {
      params: { name, excludeId: selectedBoard.value.id }
    })
    nameCheckResult.value = res.data
    nameCheckPassed.value = res.data.available
  } catch {
    nameCheckResult.value = { available: false, reason: '검사 실패' }
    nameCheckPassed.value = false
  } finally {
    nameCheckLoading.value = false
  }
}

// 보드 저장
const saveBoard = async () => {
  const nameChanged = editForm.value.name !== (selectedBoard.value.name || '')
  const descChanged = editForm.value.description !== (selectedBoard.value.description || '')

  if (!nameChanged && !descChanged) {
    toast.info('변경된 내용이 없습니다.')
    return
  }

  if (nameChanged && !nameCheckPassed.value) {
    toast.error('이름 중복 검사를 먼저 진행해주세요.')
    return
  }

  try {
    const payload = {}
    if (nameChanged) payload.name = editForm.value.name
    if (descChanged) payload.description = editForm.value.description

    await api.patch(`/admin/boards/${selectedBoard.value.id}`, payload)
    await loadBoards()
    const updated = boards.value.find((b) => b.id === selectedBoard.value.id)
    if (updated) selectBoard(updated)
    toast.success('수정이 완료되었습니다.')
  } catch (err) {
    console.error(err)
    toast.error('저장 실패')
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
    toast.error('카테고리 생성 실패')
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
    toast.error('카테고리 수정 실패')
  }
}

// 카테고리 삭제
const deleteCategory = async (categoryId) => {
  if (!await confirm('정말 삭제하시겠습니까?')) return
  try {
    await api.delete(`/admin/categorys/${categoryId}`)
    await loadCategories(selectedBoard.value.id)
  } catch (err) {
    console.error(err)
    toast.error('카테고리 삭제 실패')
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
    toast.error('순서 변경 실패')
    await loadCategories(selectedBoard.value.id)
  }
}
</script>

<style scoped>
.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.content-wrapper {
  display: flex;
  gap: 24px;
  margin-top: 24px;
}

.board-list-section {
  width: 280px;
  flex-shrink: 0;
}

.section-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.board-list {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 8px;
  min-height: 400px;
}

.board-item {
  padding: 12px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
}

.board-item:hover {
  background: var(--bg-hover);
}

.board-item.selected {
  background: var(--accent-dim);
  color: var(--accent);
}

.empty-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.detail-section {
  flex: 1;
}

.detail-panel {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 28px;
  min-height: 400px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-content {
  text-align: center;
  color: var(--text-muted);
}

.empty-content .empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 16px;
}

.name-check-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.name-check-row .form-input {
  flex: 1;
}

.check-msg {
  font-size: 12px;
  margin-top: 4px;
  display: block;
}

.check-msg.success {
  color: var(--success, #22c55e);
}

.check-msg.error {
  color: var(--error, #ef4444);
}
</style>
