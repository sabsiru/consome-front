<template>
  <div class="board-manage">
    <h2>게시판 트리 관리</h2>

    <!-- ✅ 생성 폼 -->
    <div class="create-form">
      <h3>새 항목 생성</h3>

      <label>생성 타입</label>
      <select v-model="createType">
        <option value="section">섹션</option>
        <option value="board">게시판</option>
        <option value="category">카테고리</option>
      </select>

      <div v-if="createType === 'board'">
        <label>섹션 선택</label>
        <select v-model="selectedSectionId">
          <option v-for="section in treeData" :key="section.id" :value="section.id">
            {{ section.name }}
          </option>
        </select>
      </div>

      <div v-if="createType === 'category'">
        <label>게시판 선택</label>
        <select v-model="selectedBoardId">
          <optgroup v-for="section in treeData" :key="section.id" :label="section.name">
            <option v-for="board in section.boards" :key="board.id" :value="board.id">
              {{ board.name }}
            </option>
          </optgroup>
        </select>
      </div>

      <label>이름</label>
      <input v-model="name" placeholder="이름 입력" />

      <label>순서</label>
      <input v-model.number="displayOrder" type="number" min="1" />

      <div v-if="createType === 'board'">
        <label>설명</label>
        <input v-model="description" placeholder="게시판 설명 입력" />
      </div>

      <button @click="createItem">생성</button>
    </div>

    <!-- ✅ 드래그 가능한 트리 -->
    <div class="tree">
      <draggable v-model="treeData" item-key="id" @end="onDragEnd('section', treeData)">
        <template #item="{ element: section }">
          <div class="tree-section">
            <strong>{{ section.name }}</strong>
            <button class="delete-btn" @click="deleteItem('section', section.id)">X</button>

            <draggable
              v-model="section.boards"
              item-key="id"
              @end="onDragEnd('board', section.boards)"
            >
              <template #item="{ element: board }">
                <div class="tree-board">
                  {{ board.name }}
                  <button class="delete-btn" @click="deleteItem('board', board.id)">X</button>

                  <draggable
                    v-model="board.categories"
                    item-key="id"
                    @end="onDragEnd('category', board.categories)"
                  >
                    <template #item="{ element: category }">
                      <div class="tree-category">
                        - {{ category.name }}
                        <button class="delete-btn" @click="deleteItem('category', category.id)">
                          X
                        </button>
                      </div>
                    </template>
                  </draggable>
                </div>
              </template>
            </draggable>
          </div>
        </template>
      </draggable>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import draggable from 'vuedraggable'
import api from '@/api/axios'

const treeData = ref([])
const createType = ref('section')
const selectedSectionId = ref(null)
const selectedBoardId = ref(null)
const name = ref('')
const description = ref('')
const displayOrder = ref(1)

// ✅ 초기 데이터 로드
onMounted(async () => {
  await loadTree()
})

const loadTree = async () => {
  const res = await api.get('/admin/manage/tree')
  treeData.value = res.data.sections
  updateDisplayOrder()
  name.value = ''
  description.value = ''
}

// ✅ 순서 자동 계산
const updateDisplayOrder = () => {
  let allOrders = []
  if (createType.value === 'section') {
    allOrders = treeData.value.map((s) => s.displayOrder)
  } else if (createType.value === 'board') {
    const section = treeData.value.find((s) => Number(s.id) === Number(selectedSectionId.value))
    if (section && section.boards) {
      allOrders = section.boards.map((b) => b.displayOrder)
    }
  } else if (createType.value === 'category') {
    const targetBoard = treeData.value
      .flatMap((s) => s.boards || [])
      .find((b) => Number(b.id) === Number(selectedBoardId.value))

    if (targetBoard?.categories) {
      allOrders = targetBoard.categories.map((c) => c.displayOrder)
    }
  }
  displayOrder.value = (Math.max(...allOrders, 0) || 0) + 1
}

// ✅ 항목 생성
const createItem = async () => {
  try {
    let endpoint = ''
    let body = {}
    if (createType.value === 'section') {
      endpoint = '/admin/sections'
      body = { name: name.value, displayOrder: Number(displayOrder.value) }
    } else if (createType.value === 'board') {
      endpoint = '/admin/boards'
      body = {
        sectionId: selectedSectionId.value,
        name: name.value,
        description: description.value,
        displayOrder: Number(displayOrder.value),
      }
    } else {
      endpoint = '/admin/categories'
      body = {
        boardId: selectedBoardId.value,
        name: name.value,
        displayOrder: Number(displayOrder.value),
      }
    }

    await api.post(endpoint, body)
    alert('생성 완료!')
    await loadTree()
  } catch (err) {
    console.error(err)
    alert('생성 중 오류 발생')
  }
}

// ✅ 삭제
const deleteItem = async (type, id) => {
  if (!confirm('정말 삭제하시겠습니까?')) return
  const endpoint = `/admin/${type}s/${id}`
  await api.delete(endpoint)
  alert('삭제 완료!')
  await loadTree()
}

// ✅ 드래그 완료 시 순서 업데이트
const onDragEnd = async (type, data) => {
  try {
    if (type === 'section') {
      // ✅ 섹션은 한 번에 재정렬 API 호출
      const orders = data.map((item, index) => ({
        sectionId: item.id,
        displayOrder: index + 1,
      }))
      await api.put('/admin/sections/reorder', { orders })
      console.log('[section] 순서 변경 완료')
    } else if (type === 'board') {
      const parentSection = treeData.value.find((section) =>
        section.boards.some((board) => board.id === data[0]?.id),
      )
      const orders = data.map((item, index) => ({
        sectionId: parentSection?.id,
        boardId: item.id,
        displayOrder: index + 1,
      }))
      await api.put('/admin/boards/reorder', { orders })
      console.log('[board] 순서 변경 완료')
    } else if (type === 'category') {
      const parentBoard = treeData.value
        .flatMap((section) => section.boards || [])
        .find((board) => board.categories?.some((cat) => cat.id === data[0]?.id))
      const orders = data.map((item, index) => ({
        boardId: parentBoard?.id,
        categoryId: item.id,
        displayOrder: index + 1,
      }))
      await api.put('/admin/categories/reorder', { orders })
      console.log('[category] 순서 변경 완료')
    }
    await loadTree()
  } catch (err) {
    console.error(`${type} 순서 변경 실패:`, err)
    alert('순서 변경 중 오류가 발생했습니다.')
  }
}
// ✅ 타입 변경 시 초기화
watch(createType, async () => {
  name.value = ''
  description.value = ''
  selectedSectionId.value = null
  selectedBoardId.value = null
  await nextTick()
  if (createType.value === 'board' && treeData.value.length > 0) {
    selectedSectionId.value = treeData.value[0].id
  }
  if (createType.value === 'category' && treeData.value.length > 0) {
    const firstBoard = treeData.value[0]?.boards?.[0]
    if (firstBoard) {
      selectedBoardId.value = firstBoard.id
    }
  }
})

watch(selectedSectionId, () => {
  if (createType.value === 'board') {
    name.value = ''
    description.value = ''
    updateDisplayOrder()
  }
})

watch(selectedBoardId, async () => {
  if (createType.value === 'category') {
    name.value = ''
    updateDisplayOrder()
  }
})
</script>

<style scoped>
.create-form {
  margin-bottom: 30px;
  padding: 16px;
  border: 1px solid #ccc;
  border-radius: 8px;
}

.tree {
  margin-top: 20px;
}

.tree-section,
.tree-board,
.tree-category {
  margin: 6px 0;
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.delete-btn {
  margin-left: 8px;
  background-color: #f44336;
  font-size: 12px;
  padding: 2px 6px;
  border: none;
  color: white;
  border-radius: 3px;
  visibility: hidden;
  transition: all 0.2s;
}

.tree-section:hover .delete-btn,
.tree-board:hover .delete-btn,
.tree-category:hover .delete-btn {
  visibility: visible;
}
</style>
