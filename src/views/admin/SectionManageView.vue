<template>
  <div class="section-manage">
    <header class="page-header">
      <h1>Section<span class="accent">.</span>Manage</h1>
      <p class="subtitle">섹션 관리 (드래그하여 순서 변경)</p>
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
                <span class="board-count">({{ section.boards.length }})</span>
              </span>
              <div class="section-actions">
                <button class="btn-sm btn-ghost" @click="openEditModal(section)">수정</button>
                <button class="btn-sm btn-danger" @click="deleteSection(section)">삭제</button>
              </div>
            </div>
            <div v-if="expandedId === section.id" class="section-item__boards">
              <div v-if="!section.boards.length" class="empty-boards">
                소속 게시판이 없습니다
              </div>
              <div v-else class="board-list">
                <div v-for="board in section.boards" :key="board.id" class="board-item">
                  <span class="board-name">{{ board.name }}</span>
                  <span class="board-desc">{{ board.description }}</span>
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
import {
  getAdminSections,
  createSection,
  updateSection,
  deleteSection as deleteSectionApi,
  reorderSections
} from '@/api/sectionApi.js'
import '@/assets/styles/admin/admin.css'

const sections = ref([])
const originalOrder = ref([])
const expandedId = ref(null)

// Modal
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

const toggleExpand = (id) => {
  expandedId.value = expandedId.value === id ? null : id
}

const onDragEnd = () => {
  // 드래그 종료 시 버튼으로 저장
}

const saveOrder = async () => {
  const orders = sections.value.map((s, idx) => ({
    sectionId: s.id,
    displayOrder: idx + 1
  }))
  try {
    await reorderSections(orders)
    originalOrder.value = sections.value.map(s => s.id)
    alert('순서가 저장되었습니다.')
  } catch (err) {
    console.error(err)
    alert('순서 저장 실패')
  }
}

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
    alert('섹션 이름을 입력하세요.')
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
    alert(err.response?.data?.message || '요청 실패')
  }
}

const deleteSection = async (section) => {
  if (section.boards.length > 0) {
    alert('소속 게시판이 있어 삭제할 수 없습니다.')
    return
  }
  if (!confirm(`'${section.name}' 섹션을 삭제하시겠습니까?`)) return
  try {
    await deleteSectionApi(section.id)
    await loadSections()
  } catch (err) {
    console.error(err)
    alert(err.response?.data?.message || '삭제 실패')
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
}

.section-name:hover {
  color: var(--accent);
}

.board-count {
  color: var(--text-muted);
  font-size: 12px;
}

.section-actions {
  display: flex;
  gap: 8px;
}

.section-item__boards {
  padding: 12px 16px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}

.empty-boards {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-muted);
}

.board-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.board-item {
  display: flex;
  gap: 12px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
}

.board-item .board-name {
  color: var(--text-primary);
  font-weight: 500;
}

.board-item .board-desc {
  color: var(--text-muted);
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

/* Button styles */
.btn-sm {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
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

.empty-icon {
  font-size: 32px;
  display: block;
  margin-bottom: 12px;
}

.panel-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

</style>
