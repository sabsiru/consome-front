<template>
  <div class="board-manage">
    <header class="page-header">
      <h1>Board<span class="accent">.</span>Manager</h1>
      <p class="subtitle">Section → Board → Category</p>
    </header>

    <div class="split-panel">
      <!-- 좌측: 트리 -->
      <div class="panel-left">
        <div class="action-bar">
          <button
            v-for="type in ['section', 'board', 'category']"
            :key="type"
            :class="['action-btn', { active: mode === 'create' && createType === type }]"
            @click="startCreate(type)"
          >
            <span class="btn-icon">+</span>
            {{ type }}
          </button>
        </div>

        <div class="tree-container">
          <draggable v-model="treeData" item-key="id" @end="onDragEnd('section', treeData)" handle=".drag-handle">
            <template #item="{ element: section }">
              <div
                :class="['tree-node section-node', { selected: isSelected('section', section.id) }]"
                @click.stop="selectItem('section', section)"
              >
                <div class="node-header">
                  <span class="drag-handle">⋮⋮</span>
                  <span class="node-icon">◆</span>
                  <span class="node-name">{{ section.name }}</span>
                  <span class="node-badge">{{ section.boards?.length || 0 }}</span>
                </div>

                <draggable
                  v-model="section.boards"
                  item-key="id"
                  @end="onDragEnd('board', section.boards)"
                  handle=".drag-handle"
                  class="boards-container"
                >
                  <template #item="{ element: board }">
                    <div
                      :class="['tree-node board-node', { selected: isSelected('board', board.id) }]"
                      @click.stop="selectItem('board', board)"
                    >
                      <div class="node-header">
                        <span class="drag-handle">⋮⋮</span>
                        <span class="node-icon">▸</span>
                        <span class="node-name">{{ board.name }}</span>
                        <span class="node-badge">{{ board.categories?.length || 0 }}</span>
                      </div>

                      <draggable
                        v-model="board.categories"
                        item-key="id"
                        @end="onDragEnd('category', board.categories)"
                        handle=".drag-handle"
                        class="categories-container"
                      >
                        <template #item="{ element: category }">
                          <div
                            :class="['tree-node category-node', { selected: isSelected('category', category.id) }]"
                            @click.stop="selectItem('category', category)"
                          >
                            <span class="drag-handle">⋮⋮</span>
                            <span class="node-icon">─</span>
                            <span class="node-name">{{ category.name }}</span>
                          </div>
                        </template>
                      </draggable>
                    </div>
                  </template>
                </draggable>
              </div>
            </template>
          </draggable>

          <div v-if="!treeData.length" class="empty-tree">
            <span class="empty-icon">∅</span>
            <p>No sections yet</p>
          </div>
        </div>
      </div>

      <!-- 우측: 상세/편집 패널 -->
      <div class="panel-right">
        <!-- 생성 모드 -->
        <div v-if="mode === 'create'" class="detail-panel create-mode">
          <div class="panel-header">
            <span class="panel-tag">CREATE</span>
            <h2>New {{ createType }}</h2>
          </div>

          <div class="form-group" v-if="createType === 'board'">
            <label>Parent Section</label>
            <select v-model="selectedSectionId" class="form-select">
              <option v-for="s in treeData" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>

          <div class="form-group" v-if="createType === 'category'">
            <label>Parent Board</label>
            <select v-model="selectedBoardId" class="form-select">
              <optgroup v-for="s in treeData" :key="s.id" :label="s.name">
                <option v-for="b in s.boards" :key="b.id" :value="b.id">{{ b.name }}</option>
              </optgroup>
            </select>
          </div>

          <div class="form-group">
            <label>Name</label>
            <input v-model="name" class="form-input" placeholder="Enter name..." />
          </div>

          <div class="form-group" v-if="createType === 'board'">
            <label>Description</label>
            <textarea v-model="description" class="form-textarea" placeholder="Enter description..."
                      rows="3"></textarea>
          </div>

          <div class="form-group">
            <label>Display Order</label>
            <input v-model.number="displayOrder" type="number" min="1" class="form-input small" />
          </div>

          <div class="panel-actions">
            <button class="btn btn-ghost" @click="cancelCreate">Cancel</button>
            <button class="btn btn-primary" @click="createItem">
              <span class="btn-icon">+</span> Create
            </button>
          </div>
        </div>

        <!-- 편집 모드 -->
        <div v-else-if="selectedItem" class="detail-panel edit-mode">
          <div class="panel-header">
            <span class="panel-tag">{{ selectedItem.type.toUpperCase() }}</span>
            <h2>{{ editForm.name || 'Untitled' }}</h2>
          </div>

          <div class="form-group">
            <label>Name</label>
            <input v-model="editForm.name" class="form-input" />
          </div>

          <div class="form-group" v-if="selectedItem.type === 'board'">
            <label>Description</label>
            <textarea v-model="editForm.description" class="form-textarea" rows="3"></textarea>
          </div>

          <div class="meta-info">
            <div class="meta-item">
              <span class="meta-label">ID</span>
              <span class="meta-value">{{ selectedItem.data.id }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Order</span>
              <span class="meta-value">{{ selectedItem.data.displayOrder }}</span>
            </div>
          </div>

          <div class="panel-actions">
            <button class="btn btn-danger" @click="deleteSelected">
              Delete
            </button>
            <button
              class="btn btn-primary"
              @click="saveItem"
              :disabled="!canSave"
            >
              Save Changes
            </button>
          </div>
        </div>

        <!-- 미선택 -->
        <div v-else class="detail-panel empty-state">
          <div class="empty-content">
            <span class="empty-icon">◎</span>
            <p>Select an item to edit</p>
            <p class="empty-hint">or create a new one</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import draggable from 'vuedraggable'
import api from '@/api/axios'

// 트리 데이터
const treeData = ref([])

// 모드 & 선택
const mode = ref(null)
const createType = ref('section')
const selectedItem = ref(null)

// 생성 폼
const selectedSectionId = ref(null)
const selectedBoardId = ref(null)
const name = ref('')
const description = ref('')
const displayOrder = ref(1)

// 편집 폼
const editForm = ref({ name: '', description: '' })

// 저장 가능 여부 (Board만 수정 API 있음)
const canSave = computed(() => selectedItem.value?.type === 'board')

// 초기 로드
onMounted(async () => {
  await loadTree()
})

const loadTree = async () => {
  const res = await api.get('/admin/manage/tree')
  treeData.value = res.data.sections
}

// 선택 확인
const isSelected = (type, id) => {
  return selectedItem.value?.type === type && selectedItem.value?.data.id === id
}

// 항목 선택
const selectItem = (type, item) => {
  mode.value = null
  selectedItem.value = { type, data: item }
  editForm.value = {
    name: item.name,
    description: item.description || ''
  }
}

// 생성 시작
const startCreate = (type) => {
  mode.value = 'create'
  createType.value = type
  selectedItem.value = null
  name.value = ''
  description.value = ''
  updateDisplayOrder()

  if (type === 'board' && treeData.value.length > 0) {
    selectedSectionId.value = treeData.value[0].id
  }
  if (type === 'category' && treeData.value.length > 0) {
    const firstBoard = treeData.value[0]?.boards?.[0]
    if (firstBoard) selectedBoardId.value = firstBoard.id
  }
}

const cancelCreate = () => {
  mode.value = null
}

// 순서 자동 계산
const updateDisplayOrder = () => {
  let allOrders = []
  if (createType.value === 'section') {
    allOrders = treeData.value.map((s) => s.displayOrder)
  } else if (createType.value === 'board') {
    const section = treeData.value.find((s) => s.id === selectedSectionId.value)
    allOrders = section?.boards?.map((b) => b.displayOrder) || []
  } else if (createType.value === 'category') {
    const board = treeData.value.flatMap((s) => s.boards || []).find((b) => b.id === selectedBoardId.value)
    allOrders = board?.categories?.map((c) => c.displayOrder) || []
  }
  displayOrder.value = (Math.max(...allOrders, 0) || 0) + 1
}

// 생성
const createItem = async () => {
  try {
    let endpoint = ''
    let body = {}

    if (createType.value === 'section') {
      endpoint = '/admin/sections'
      body = { name: name.value, displayOrder: displayOrder.value }
    } else if (createType.value === 'board') {
      endpoint = '/admin/boards'
      body = {
        sectionId: selectedSectionId.value,
        name: name.value,
        description: description.value,
        displayOrder: displayOrder.value,
      }
    } else {
      endpoint = '/admin/categories'
      body = {
        boardId: selectedBoardId.value,
        name: name.value,
        displayOrder: displayOrder.value,
      }
    }

    await api.post(endpoint, body)
    mode.value = null
    await loadTree()
  } catch (err) {
    console.error(err)
    alert('생성 실패')
  }
}

// 저장 (Board만)
const saveItem = async () => {
  if (selectedItem.value.type !== 'board') return

  try {
    await api.patch(`/admin/boards/${selectedItem.value.data.id}`, {
      name: editForm.value.name,
      description: editForm.value.description
    })
    await loadTree()
    // 선택 유지
    const updated = treeData.value
      .flatMap(s => s.boards || [])
      .find(b => b.id === selectedItem.value.data.id)
    if (updated) selectItem('board', updated)
  } catch (err) {
    console.error(err)
    alert('저장 실패')
  }
}

// 삭제
const deleteSelected = async () => {
  if (!confirm('정말 삭제하시겠습니까?')) return

  const { type, data } = selectedItem.value
  await api.delete(`/admin/${type}s/${data.id}`)
  selectedItem.value = null
  await loadTree()
}

// 드래그 완료
const onDragEnd = async (type, data) => {
  try {
    if (type === 'section') {
      const orders = data.map((item, i) => ({ sectionId: item.id, displayOrder: i + 1 }))
      await api.put('/admin/sections/reorder', { orders })
    } else if (type === 'board') {
      const parent = treeData.value.find((s) => s.boards.some((b) => b.id === data[0]?.id))
      const orders = data.map((item, i) => ({ sectionId: parent?.id, boardId: item.id, displayOrder: i + 1 }))
      await api.put('/admin/boards/reorder', { orders })
    } else if (type === 'category') {
      const parent = treeData.value.flatMap((s) => s.boards || []).find((b) => b.categories?.some((c) => c.id ===
        data[0]?.id))
      const orders = data.map((item, i) => ({ boardId: parent?.id, categoryId: item.id, displayOrder: i + 1 }))
      await api.put('/admin/categories/reorder', { orders })
    }
    await loadTree()
  } catch (err) {
    console.error(err)
    alert('순서 변경 실패')
  }
}

watch(selectedSectionId, updateDisplayOrder)
watch(selectedBoardId, updateDisplayOrder)
</script>

<style scoped>
.board-manage {
  font-family: 'Outfit', sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  min-height: 100vh;
  padding: 32px;
}

/* Header */
.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.5px;
  margin: 0;
}

.page-header .accent {
  color: var(--accent);
}

.subtitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-muted);
  margin: 4px 0 0;
}

/* Split Panel */
.split-panel {
  display: flex;
  gap: 24px;
  min-height: calc(100vh - 140px);
}

.panel-left {
  flex: 1;
  max-width: 420px;
}

.panel-right {
  flex: 1;
}

/* Action Bar */
.action-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.action-btn {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 10px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.action-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border-color: var(--text-muted);
}

.action-btn.active {
  background: var(--accent-dim);
  border-color: var(--accent);
  color: var(--accent);
}

.action-btn .btn-icon {
  margin-right: 6px;
}

/* Tree */
.tree-container {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px;
  min-height: 400px;
}

.tree-node {
  border-radius: 6px;
  transition: all 0.15s ease;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  cursor: pointer;
}

.tree-node:hover {
  background: var(--bg-hover);
}

.tree-node.selected {
  background: var(--accent-dim);
}

.tree-node.selected .node-name {
  color: var(--accent);
}

.drag-handle {
  color: var(--text-muted);
  cursor: grab;
  font-size: 10px;
  letter-spacing: -2px;
}

.drag-handle:active {
  cursor: grabbing;
}

.node-icon {
  font-size: 10px;
  color: var(--text-muted);
  width: 12px;
}

.section-node > .node-header .node-icon {
  color: var(--accent);
}

.node-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
}

.node-badge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  background: var(--bg-tertiary);
  padding: 2px 8px;
  border-radius: 10px;
  color: var(--text-muted);
}

.boards-container {
  margin-left: 20px;
  border-left: 1px solid var(--border-color);
}

.categories-container {
  margin-left: 20px;
  border-left: 1px dashed var(--border-color);
}

.category-node .node-header {
  padding: 6px 12px;
}

.empty-tree {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--text-muted);
}

.empty-tree .empty-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

/* Detail Panel */
.detail-panel {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 28px;
  min-height: 400px;
}

.panel-header {
  margin-bottom: 28px;
}

.panel-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--accent);
  background: var(--accent-dim);
  padding: 4px 10px;
  border-radius: 4px;
}

.panel-header h2 {
  font-size: 22px;
  font-weight: 500;
  margin: 12px 0 0;
}

/* Form */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 12px 14px;
  font-family: inherit;
  font-size: 14px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  transition: border-color 0.15s ease;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--accent);
}

.form-input.small {
  width: 100px;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-select {
  cursor: pointer;
}

/* Meta Info */
.meta-info {
  display: flex;
  gap: 24px;
  padding: 16px;
  background: var(--bg-tertiary);
  border-radius: 6px;
  margin-bottom: 24px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  color: var(--text-muted);
}

.meta-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  color: var(--text-secondary);
}

/* Buttons */
.panel-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

.btn {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 12px 20px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
}

.btn-ghost:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.btn-primary {
  background: var(--accent);
  color: var(--bg-primary);
}

.btn-primary:hover {
  filter: brightness(1.1);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-danger {
  background: transparent;
  border: 1px solid var(--danger);
  color: var(--danger);
}

.btn-danger:hover {
  background: var(--danger);
  color: white;
}

/* Empty State */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.empty-content {
  text-align: center;
}

.empty-content .empty-icon {
  font-size: 48px;
  color: var(--text-muted);
  margin-bottom: 16px;
  display: block;
}

.empty-content p {
  color: var(--text-secondary);
  margin: 0;
}

.empty-hint {
  font-size: 12px;
  color: var(--text-muted) !important;
  margin-top: 4px !important;
}
</style>
