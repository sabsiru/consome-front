<template>
  <div class="section-manage">
    <header class="page-header">
      <h1>Section<span class="accent">.</span>Manager</h1>
      <p class="subtitle">섹션 → 게시판 → 카테고리 통합 관리</p>
    </header>

    <div class="content-panel">
      <div class="panel-header">
        <span class="panel-tag">SECTIONS</span>
        <h2>섹션 목록</h2>
        <button class="btn btn-primary btn-sm" @click="openCreateModal">+ 섹션 추가</button>
      </div>

      <draggable
        v-model="sections"
        item-key="id"
        handle=".drag-handle"
        ghost-class="sortable-ghost"
        @end="onDragEnd"
        class="section-list"
      >
        <template #item="{ element: section, index }">
          <div class="section-item" :class="{ 'section-item--expanded': expandedId === section.id }">
            <div class="section-item__header">
              <span class="drag-handle">⋮⋮</span>
              <span class="order-number">{{ index + 1 }}</span>
              <span class="section-name" @click="toggleExpand(section.id)">
                {{ section.name }}
                <span class="board-count">({{ section.boards?.length || 0 }})</span>
                <span class="expand-icon">{{ expandedId === section.id ? '▼' : '▶' }}</span>
              </span>
              <div class="section-actions">
                <button class="btn-sm btn-ghost" @click="openEditModal(section)">수정</button>
                <button class="btn-sm btn-danger" @click="deleteSection(section)">삭제</button>
              </div>
            </div>

            <!-- 펼친 내용: 게시판 목록 + 상세 패널 -->
            <div v-if="expandedId === section.id" class="section-item__content">
              <div class="board-toolbar">
                <button class="btn btn-primary btn-sm" @click="startCreateBoard(section.id)">+ 게시판 추가</button>
                <div class="search-bar">
                  <input
                    v-model="sectionBoardSearch[section.id]"
                    class="search-input"
                    placeholder="검색..."
                    @keyup.enter="searchSectionBoards(section.id)"
                  />
                  <button class="search-btn" @click="searchSectionBoards(section.id)">🔍</button>
                </div>
              </div>

              <div class="board-content-split">
                <!-- 좌측: 게시판 목록 -->
                <div class="board-list-panel">
                  <div v-if="sectionBoards[section.id]?.content?.length" class="board-list">
                    <div
                      v-for="board in sectionBoards[section.id].content"
                      :key="board.id"
                      :class="['board-item', { selected: selectedBoard?.id === board.id && selectedSectionId === section.id }]"
                      @click="selectBoard(board, section.id)"
                    >
                      <span class="board-name">{{ board.name }}</span>
                    </div>
                  </div>
                  <div v-else class="empty-boards">
                    소속 게시판이 없습니다
                  </div>

                  <!-- 페이지네이션 -->
                  <div v-if="sectionBoards[section.id]?.totalPages > 1" class="pagination">
                    <button
                      :disabled="sectionBoards[section.id].number === 0"
                      @click="changeBoardPage(section.id, sectionBoards[section.id].number - 1)"
                    >◀</button>
                    <span>{{ sectionBoards[section.id].number + 1 }} / {{ sectionBoards[section.id].totalPages }}</span>
                    <button
                      :disabled="sectionBoards[section.id].number >= sectionBoards[section.id].totalPages - 1"
                      @click="changeBoardPage(section.id, sectionBoards[section.id].number + 1)"
                    >▶</button>
                  </div>
                </div>

                <!-- 우측: 게시판 상세 패널 -->
                <div class="board-detail-panel">
                  <!-- 게시판 생성 모드 -->
                  <div v-if="mode === 'create-board' && selectedSectionId === section.id" class="detail-content create-mode">
                    <div class="detail-header">
                      <span class="detail-tag">CREATE</span>
                      <h3>New Board</h3>
                    </div>
                    <div class="form-group">
                      <label>Name</label>
                      <input v-model="boardForm.name" class="form-input" placeholder="게시판 이름" />
                    </div>
                    <div class="form-group">
                      <label>Description</label>
                      <textarea v-model="boardForm.description" class="form-textarea" rows="2" placeholder="설명"></textarea>
                    </div>
                    <div class="detail-actions">
                      <button class="btn btn-ghost" @click="cancelMode">Cancel</button>
                      <button class="btn btn-primary" @click="createBoard(section.id)">Create</button>
                    </div>
                  </div>

                  <!-- 카테고리 생성 모드 -->
                  <div v-else-if="mode === 'create-category' && selectedSectionId === section.id" class="detail-content create-mode">
                    <div class="detail-header">
                      <span class="detail-tag">CREATE</span>
                      <h3>New Category</h3>
                    </div>
                    <div class="form-group">
                      <label>Name</label>
                      <input v-model="categoryForm.name" class="form-input" placeholder="카테고리 이름" />
                    </div>
                    <div class="detail-actions">
                      <button class="btn btn-ghost" @click="cancelMode">Cancel</button>
                      <button class="btn btn-primary" @click="createCategory">Create</button>
                    </div>
                  </div>

                  <!-- 게시판 상세 -->
                  <div v-else-if="selectedBoard && selectedSectionId === section.id" class="detail-content edit-mode">
                    <div class="detail-header">
                      <span class="detail-tag">BOARD</span>
                      <h3>{{ selectedBoard.name }}</h3>
                    </div>
                    <div class="form-group">
                      <label>Name</label>
                      <div class="name-check-row">
                        <input v-model="boardForm.name" class="form-input" @input="onBoardNameInput" />
                        <button
                          class="btn btn-secondary btn-sm"
                          :disabled="!isBoardNameChanged || boardNameCheckLoading"
                          @click="checkBoardNameDuplicate"
                        >
                          {{ boardNameCheckLoading ? '확인 중...' : '중복 검사' }}
                        </button>
                      </div>
                      <span v-if="boardNameCheckResult !== null" :class="['check-msg', boardNameCheckResult.available ? 'success' : 'error']">
                        {{ boardNameCheckResult.available ? '사용 가능한 이름입니다.' : boardNameCheckResult.reason }}
                      </span>
                    </div>
                    <div class="form-group">
                      <label>Description</label>
                      <textarea v-model="boardForm.description" class="form-textarea" rows="2"></textarea>
                    </div>
                    <div class="detail-actions">
                      <div class="main-toggle">
                        <span>주요 게시판</span>
                        <button
                          :class="['toggle-btn', { active: selectedBoard.isMain }]"
                          @click="toggleMainBoard"
                        >
                          {{ selectedBoard.isMain ? 'ON' : 'OFF' }}
                        </button>
                      </div>
                      <div class="action-btns">
                        <button class="btn btn-danger" @click="deleteBoard">Delete</button>
                        <button class="btn btn-primary" :disabled="isBoardNameChanged && !boardNameCheckPassed" @click="saveBoard">Save</button>
                      </div>
                    </div>

                    <!-- 카테고리 -->
                    <div class="category-section">
                      <div class="category-header">
                        <h4>Categories</h4>
                        <button class="btn btn-sm btn-ghost" @click="startCreateCategory">+ 카테고리 추가</button>
                      </div>
                      <draggable
                        v-model="categories"
                        item-key="id"
                        handle=".cat-drag"
                        ghost-class="sortable-ghost"
                        @end="onCategoryDragEnd"
                        class="category-list"
                      >
                        <template #item="{ element: cat }">
                          <div :class="['category-item', { editing: editingCategoryId === cat.id }]">
                            <span class="cat-drag">⋮⋮</span>
                            <template v-if="editingCategoryId === cat.id">
                              <input v-model="editingCategoryName" class="cat-edit-input" />
                              <button class="btn-sm btn-primary" @click="saveCategory(cat.id)">저장</button>
                              <button class="btn-sm btn-ghost" @click="cancelEditCategory">취소</button>
                            </template>
                            <template v-else>
                              <span class="cat-name">{{ cat.name }}</span>
                              <button class="btn-sm" @click="startEditCategory(cat)">수정</button>
                              <button class="btn-sm btn-danger" @click="deleteCategory(cat.id)">삭제</button>
                            </template>
                          </div>
                        </template>
                      </draggable>
                      <div v-if="!categories.length" class="empty-categories">카테고리가 없습니다</div>
                    </div>
                  </div>

                  <!-- 미선택 -->
                  <div v-else class="detail-content empty-state">
                    <span class="empty-icon">◎</span>
                    <p>게시판을 선택하세요</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </draggable>

      <div v-if="!sections.length" class="empty-list">
        <span class="empty-icon">∅</span>
        <p>등록된 섹션이 없습니다</p>
      </div>

      <div class="panel-actions">
        <button class="btn btn-ghost" @click="$router.back()">뒤로가기</button>
        <button class="btn btn-primary" @click="saveOrder" :disabled="!hasChanges">
          순서 저장
        </button>
      </div>
    </div>

    <!-- 섹션 생성/수정 모달 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h3>{{ isEdit ? '섹션 수정' : '섹션 추가' }}</h3>
        <input
          v-model="modalName"
          type="text"
          placeholder="섹션 이름"
          class="modal-input"
          @keyup.enter="submitModal"
        />
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="closeModal">취소</button>
          <button class="btn btn-primary" @click="submitModal">{{ isEdit ? '수정' : '추가' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import draggable from 'vuedraggable'
import { toast } from 'vue-sonner'
import api from '@/api/axios'
import {
  getAdminSections,
  createSection,
  updateSection,
  deleteSection as deleteSectionApi,
  reorderSections,
  getSectionBoards
} from '@/api/sectionApi.js'
import { eventBus } from '@/utils/eventBus.js'
import '@/assets/styles/admin/admin.css'
import { useConfirm } from '@/composables/useConfirm.js'

const { confirm } = useConfirm()
const sections = ref([])
const originalOrder = ref([])
const expandedId = ref(null)

// 섹션별 게시판 (Lazy Loading)
const sectionBoards = ref({})
const sectionBoardSearch = ref({})

// 선택된 게시판 + 카테고리
const selectedBoard = ref(null)
const selectedSectionId = ref(null)
const categories = ref([])

// 편집 상태
const boardForm = ref({ name: '', description: '' })
const categoryForm = ref({ name: '' })

// 이름 중복 검사 상태
const boardNameCheckResult = ref(null)
const boardNameCheckLoading = ref(false)
const boardNameCheckPassed = ref(false)

const isBoardNameChanged = computed(() => {
  return selectedBoard.value && boardForm.value.name !== selectedBoard.value.name
})
const editingCategoryId = ref(null)
const editingCategoryName = ref('')

// 모드
const mode = ref(null) // 'create-board' | 'create-category' | null

// Section Modal
const showModal = ref(false)
const isEdit = ref(false)
const editingId = ref(null)
const modalName = ref('')

const hasChanges = computed(() => {
  if (sections.value.length !== originalOrder.value.length) return true
  return sections.value.some((s, idx) => s.id !== originalOrder.value[idx])
})

onMounted(async () => {
  await loadSections()
})

const loadSections = async () => {
  try {
    const { data } = await getAdminSections()
    sections.value = data
    originalOrder.value = data.map(s => s.id)
  } catch (err) {
    console.error('[SectionManage] 섹션 조회 실패', err)
  }
}

const toggleExpand = async (id) => {
  if (expandedId.value === id) {
    expandedId.value = null
    selectedBoard.value = null
    selectedSectionId.value = null
    categories.value = []
    mode.value = null
  } else {
    expandedId.value = id
    selectedBoard.value = null
    selectedSectionId.value = null
    categories.value = []
    mode.value = null
    // Lazy Load 게시판
    if (!sectionBoards.value[id]) {
      await loadSectionBoards(id)
    }
  }
}

const loadSectionBoards = async (sectionId, page = 0) => {
  try {
    const keyword = sectionBoardSearch.value[sectionId] || ''
    const { data } = await getSectionBoards(sectionId, { page, size: 20, keyword })
    sectionBoards.value[sectionId] = data
  } catch (err) {
    console.error('[SectionManage] 게시판 조회 실패', err)
  }
}

const searchSectionBoards = async (sectionId) => {
  await loadSectionBoards(sectionId, 0)
}

const changeBoardPage = async (sectionId, page) => {
  await loadSectionBoards(sectionId, page)
}

const selectBoard = async (board, sectionId) => {
  mode.value = null
  selectedBoard.value = board
  selectedSectionId.value = sectionId
  boardForm.value = {
    name: board.name,
    description: board.description || ''
  }
  boardNameCheckResult.value = null
  boardNameCheckPassed.value = false
  await loadCategories(board.id)
}

const loadCategories = async (boardId) => {
  try {
    const res = await api.get(`/admin/boards/${boardId}/categories`)
    categories.value = res.data
  } catch (err) {
    console.error(err)
    categories.value = []
  }
}

// 게시판 생성
const startCreateBoard = (sectionId) => {
  mode.value = 'create-board'
  selectedSectionId.value = sectionId
  selectedBoard.value = null
  boardForm.value = { name: '', description: '' }
}

const createBoard = async (sectionId) => {
  try {
    await api.post('/admin/boards', {
      name: boardForm.value.name,
      description: boardForm.value.description,
      sectionId
    })
    mode.value = null
    await loadSectionBoards(sectionId)
    await loadSections() // 섹션의 게시판 수 갱신
  } catch (err) {
    console.error(err)
    toast.error(err.response?.data?.message || '게시판 생성 실패')
  }
}

// 이름 입력 시 검사 상태 초기화
const onBoardNameInput = () => {
  boardNameCheckResult.value = null
  boardNameCheckPassed.value = false
}

// 이름 중복 검사
const checkBoardNameDuplicate = async () => {
  const name = boardForm.value.name.trim()
  if (!name) {
    boardNameCheckResult.value = { available: false, reason: '이름을 입력해주세요.' }
    return
  }
  boardNameCheckLoading.value = true
  try {
    const res = await api.get('/admin/boards/check-name', {
      params: { name, excludeId: selectedBoard.value.id }
    })
    boardNameCheckResult.value = res.data
    boardNameCheckPassed.value = res.data.available
  } catch {
    boardNameCheckResult.value = { available: false, reason: '검사 실패' }
    boardNameCheckPassed.value = false
  } finally {
    boardNameCheckLoading.value = false
  }
}

// 게시판 저장
const saveBoard = async () => {
  const nameChanged = boardForm.value.name !== (selectedBoard.value.name || '')
  const descChanged = boardForm.value.description !== (selectedBoard.value.description || '')

  if (!nameChanged && !descChanged) {
    toast.info('변경된 내용이 없습니다.')
    return
  }

  if (nameChanged && !boardNameCheckPassed) {
    toast.error('이름 중복 검사를 먼저 진행해주세요.')
    return
  }

  try {
    const payload = {}
    if (nameChanged) payload.name = boardForm.value.name
    if (descChanged) payload.description = boardForm.value.description

    await api.patch(`/admin/boards/${selectedBoard.value.id}`, payload)
    await loadSectionBoards(selectedSectionId.value)

    // 선택된 게시판 갱신
    const updated = sectionBoards.value[selectedSectionId.value]?.content?.find(
      b => b.id === selectedBoard.value.id
    )
    if (updated) {
      selectedBoard.value = { ...selectedBoard.value, ...updated }
      boardForm.value = { name: updated.name, description: updated.description || '' }
    }
    boardNameCheckResult.value = null
    boardNameCheckPassed.value = false
    toast.success('수정이 완료되었습니다.')
  } catch (err) {
    console.error(err)
    toast.error('저장 실패')
  }
}

const deleteBoard = async () => {
  if (!await confirm('정말 삭제하시겠습니까?')) return
  try {
    await api.delete(`/admin/boards/${selectedBoard.value.id}`)
    selectedBoard.value = null
    categories.value = []
    await loadSectionBoards(selectedSectionId.value)
    await loadSections()
  } catch (err) {
    console.error(err)
    toast.error('삭제 실패')
  }
}

const toggleMainBoard = async () => {
  try {
    const res = await api.patch(`/admin/boards/${selectedBoard.value.id}/main`)
    const isMain = res.data.isMain ?? res.data.main
    selectedBoard.value = { ...selectedBoard.value, isMain }
    eventBus.emit('main-boards-updated')
  } catch (err) {
    console.error(err)
    toast.error('주요 게시판 설정 실패')
  }
}

// 카테고리
const startCreateCategory = () => {
  mode.value = 'create-category'
  categoryForm.value = { name: '' }
}

const createCategory = async () => {
  try {
    const maxOrder = categories.value.length > 0
      ? Math.max(...categories.value.map(c => c.displayOrder || 0))
      : 0
    await api.post('/admin/categories', {
      boardId: selectedBoard.value.id,
      name: categoryForm.value.name,
      displayOrder: maxOrder + 1
    })
    mode.value = null
    await loadCategories(selectedBoard.value.id)
  } catch (err) {
    console.error(err)
    toast.error('카테고리 생성 실패')
  }
}

const startEditCategory = (cat) => {
  editingCategoryId.value = cat.id
  editingCategoryName.value = cat.name
}

const cancelEditCategory = () => {
  editingCategoryId.value = null
  editingCategoryName.value = ''
}

const saveCategory = async (categoryId) => {
  try {
    await api.patch(`/admin/categories/${categoryId}/name`, {
      name: editingCategoryName.value,
      boardId: selectedBoard.value.id
    })
    editingCategoryId.value = null
    await loadCategories(selectedBoard.value.id)
  } catch (err) {
    console.error(err)
    toast.error('카테고리 수정 실패')
  }
}

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

const cancelMode = () => {
  mode.value = null
}

// 섹션 드래그
const onDragEnd = () => {}

const saveOrder = async () => {
  const orders = sections.value.map((s, idx) => ({
    sectionId: s.id,
    displayOrder: idx + 1
  }))
  try {
    await reorderSections(orders)
    originalOrder.value = sections.value.map(s => s.id)
    toast.success('순서가 저장되었습니다.')
  } catch (err) {
    console.error(err)
    toast.error('순서 저장 실패')
  }
}

// 섹션 모달
const openCreateModal = () => {
  isEdit.value = false
  editingId.value = null
  modalName.value = ''
  showModal.value = true
}

const openEditModal = (section) => {
  isEdit.value = true
  editingId.value = section.id
  modalName.value = section.name
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  modalName.value = ''
}

const submitModal = async () => {
  if (!modalName.value.trim()) {
    toast.warning('섹션 이름을 입력하세요.')
    return
  }
  try {
    if (isEdit.value) {
      await updateSection(editingId.value, modalName.value)
    } else {
      await createSection(modalName.value)
    }
    closeModal()
    await loadSections()
  } catch (err) {
    console.error(err)
    toast.error(err.response?.data?.message || '요청 실패')
  }
}

const deleteSection = async (section) => {
  if (section.boards?.length > 0) {
    toast.warning('소속 게시판이 있어 삭제할 수 없습니다.')
    return
  }
  if (!await confirm(`'${section.name}' 섹션을 삭제하시겠습니까?`)) return
  try {
    await deleteSectionApi(section.id)
    await loadSections()
  } catch (err) {
    console.error(err)
    toast.error(err.response?.data?.message || '삭제 실패')
  }
}
</script>

<style scoped>
.section-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-item {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
}

.section-item--expanded {
  border-color: var(--accent);
}

.section-item__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
}

.drag-handle {
  cursor: grab;
  color: var(--text-muted);
  font-size: 14px;
  user-select: none;
}

.order-number {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--accent);
  background: var(--accent-dim);
  padding: 2px 8px;
  border-radius: 4px;
}

.section-name {
  flex: 1;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-name:hover {
  color: var(--accent);
}

.board-count {
  color: var(--text-muted);
  font-size: 12px;
}

.expand-icon {
  font-size: 10px;
  color: var(--text-muted);
}

.section-actions {
  display: flex;
  gap: 8px;
}

/* 펼침 내용 */
.section-item__content {
  padding: 16px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}

.board-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.search-bar {
  display: flex;
  gap: 4px;
}

.search-input {
  padding: 6px 10px;
  font-size: 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
  width: 160px;
}

.search-btn {
  padding: 6px 10px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
}

.board-content-split {
  display: flex;
  gap: 16px;
  min-height: 300px;
}

.board-list-panel {
  width: 200px;
  flex-shrink: 0;
}

.board-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 250px;
  overflow-y: auto;
}

.board-item {
  padding: 8px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.board-item:hover {
  border-color: var(--accent);
}

.board-item.selected {
  background: var(--accent-dim);
  border-color: var(--accent);
  color: var(--accent);
}

.empty-boards {
  font-size: 12px;
  color: var(--text-muted);
  padding: 12px;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 12px;
}

.pagination button {
  padding: 4px 8px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 상세 패널 */
.board-detail-panel {
  flex: 1;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 16px;
}

.detail-content {
  height: 100%;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.detail-tag {
  font-size: 10px;
  padding: 2px 6px;
  background: var(--accent);
  color: var(--bg-primary);
  border-radius: 3px;
}

.detail-header h3 {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  margin: 0;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 8px 10px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: var(--accent);
}

.toggle-btn {
  padding: 4px 10px;
  font-size: 11px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
}

.toggle-btn.active {
  background: var(--accent);
  color: var(--bg-primary);
  border-color: var(--accent);
}

.detail-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.main-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-muted);
}

.action-btns {
  display: flex;
  gap: 8px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

/* 카테고리 */
.category-section {
  border-top: 1px solid var(--border-color);
  padding-top: 12px;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.category-header h4 {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 12px;
}

.cat-drag {
  cursor: grab;
  color: var(--text-muted);
}

.cat-name {
  flex: 1;
}

.cat-edit-input {
  flex: 1;
  padding: 4px 8px;
  font-size: 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 3px;
  color: var(--text-primary);
}

.empty-categories {
  font-size: 11px;
  color: var(--text-muted);
  padding: 8px;
}

/* 기존 스타일 유지 */
.btn-sm {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.btn-sm:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.btn-sm.btn-primary {
  background: var(--accent);
  color: var(--bg-primary);
  border-color: var(--accent);
}

.btn-ghost {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.btn-ghost:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.btn-danger {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-muted);
}

.btn-danger:hover {
  border-color: var(--danger);
  color: var(--danger);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.panel-header .btn {
  margin-left: auto;
}

.sortable-ghost {
  opacity: 0.5;
  background: var(--accent-dim);
}

.empty-list {
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
}

.panel-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 24px;
  min-width: 320px;
}

.modal h3 {
  font-family: 'JetBrains Mono', monospace;
  font-size: 16px;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.modal-input {
  width: 100%;
  padding: 10px 12px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.modal-input:focus {
  outline: none;
  border-color: var(--accent);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
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
