<template>
  <div class="admin-user-view">
    <h1>회원 관리</h1>

    <!-- 검색 조건 (필요해지면 확장) -->
    <div class="search-bar">
      <select v-model="searchType">
        <option value="keyword">전체</option>
        <option value="loginId">아이디</option>
        <option value="nickname">닉네임</option>
        <option value="id">ID</option>
      </select>
      <input v-model="searchKeyword" type="text" placeholder="검색어" @keyup.enter="reload" />
      <button @click="reload">검색</button>
      <button @click="resetSearch">초기화</button>
      <button class="back-btn" @click="$router.back()">뒤로가기</button>
    </div>

    <!-- 유저 목록 테이블 -->
    <table class="user-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>로그인 아이디</th>
          <th>닉네임</th>
          <th>권한</th>
          <th>포인트</th>
          <th>관리</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.userId">
          <td>{{ user.userId }}</td>
          <td>{{ user.loginId }}</td>
          <td>{{ user.nickname }} <LevelBadge :level="user.level" :role="user.role" /></td>
          <td>
            {{ user.role }}
            <span v-if="user.managedBoards?.length" class="managed-boards">
              ({{ user.managedBoards.map(b => b.boardName).join(', ') }})
            </span>
          </td>
          <td>{{ user.userPoint }}</td>
          <td>
            <button class="role-btn" @click="openRoleModal(user)">권한</button>
            <button class="suspend-btn" @click="openSuspendModal(user)">제재</button>
          </td>
        </tr>
        <tr v-if="users.length === 0">
          <td colspan="6" class="empty">조회된 회원이 없습니다.</td>
        </tr>
      </tbody>
    </table>

    <!-- 페이지네이션 -->
    <div class="pagination">
      <button :disabled="page === 0" @click="movePage(page - 1)">이전</button>

      <span> {{ page + 1 }} / {{ totalPages }} </span>

      <button :disabled="page + 1 >= totalPages" @click="movePage(page + 1)">다음</button>
    </div>

    <!-- 권한 관리 모달 -->
    <div v-if="showRoleModal" class="role-modal-overlay" @click.self="closeRoleModal">
      <div class="role-modal">
        <h3>권한 관리</h3>
        <p>User ID: {{ selectedUser.userId }} / 닉네임: {{ selectedUser.nickname }}</p>

        <!-- 현재 관리 보드 -->
        <div v-if="selectedUser.managedBoards?.length" class="current-boards">
          <p>관리 중인 보드:</p>
          <ul>
            <li v-for="b in selectedUser.managedBoards" :key="b.boardId">
              {{ b.boardName }} (ID: {{ b.boardId }})
              <button @click="removeManager(b.boardId)">해제</button>
            </li>
          </ul>
        </div>

        <!-- 게시판 검색 -->
        <div class="board-search-section">
          <input v-model="boardSearchKeyword" placeholder="게시판 검색" @input="searchBoardsForRole" />
          <ul v-if="boardSearchResults.length" class="board-search-results">
            <li v-for="b in boardSearchResults" :key="b.id" @click="selectBoard(b)">
              {{ b.name }} (ID: {{ b.id }})
            </li>
          </ul>
        </div>

        <!-- 선택된 보드 + 임명 버튼 -->
        <div v-if="selectedBoard" class="assign-section">
          <p>선택: {{ selectedBoard.name }} (ID: {{ selectedBoard.id }})</p>
          <button @click="assignManager">관리자 임명</button>
        </div>

        <button class="close-btn" @click="closeRoleModal">닫기</button>
      </div>
    </div>

    <!-- 제재 모달 -->
    <div v-if="showSuspendModal" class="role-modal-overlay" @click.self="closeSuspendModal">
      <div class="role-modal suspend-modal">
        <h3>사용자 제재</h3>
        <p>{{ suspendTarget?.nickname }} (ID: {{ suspendTarget?.userId }})</p>

        <div class="suspend-options">
          <label v-for="opt in suspensionTypes" :key="opt.value" class="suspend-option">
            <input type="radio" :value="opt.value" v-model="selectedSuspensionType" />
            <span>{{ opt.label }}</span>
          </label>
        </div>

        <div class="suspend-reason">
          <input v-model="suspendReason" placeholder="제재 사유 (선택)" />
        </div>

        <div class="suspend-actions">
          <button class="cancel-btn" @click="closeSuspendModal">취소</button>
          <button class="confirm-btn" :disabled="!selectedSuspensionType" @click="confirmSuspend">
            제재 적용
          </button>
          <button v-if="suspendTarget?.suspensionType" class="unsuspend-btn" @click="confirmUnsuspend">
            제재 해제
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import api from '@/api/axios'
import { suspendUser, unsuspendUser } from '@/api/adminApi.js'
import LevelBadge from '@/components/common/LevelBadge.vue'
import '@/assets/styles/admin/admin.css'
import '@/assets/styles/admin/user-manage.css'

const users = ref([])

const page = ref(0)
const size = ref(50)
const totalElements = ref(0)
const totalPages = ref(0)

// 검색 조건
const searchType = ref('keyword')
const searchKeyword = ref('')

// 권한 모달
const showRoleModal = ref(false)
const selectedUser = ref(null)
const boardSearchKeyword = ref('')
const boardSearchResults = ref([])
const selectedBoard = ref(null)

const loadUsers = async () => {
  try {
    const res = await api.get('/admin/manage/users', {
      params: {
        page: page.value,
        size: size.value,
      },
    })
    const data = res.data
    users.value = data.users
    page.value = data.page
    size.value = data.size
    totalElements.value = data.totalElements
    totalPages.value = data.totalPages
  } catch (e) {
    console.error('회원 목록 조회 실패', e)
    // TODO: 에러 토스트/알림 처리
  }
}

const movePage = (targetPage) => {
  if (targetPage < 0 || targetPage >= totalPages.value) {
    return
  }
  page.value = targetPage
  loadUsers()
}

const searchUsers = async () => {
  try {
    const res = await api.get('/admin/manage/users/search', {
      params: {
        page: page.value,
        size: size.value,
        [searchType.value]: searchKeyword.value || undefined,
      },
    })
    const data = res.data
    users.value = data.users
    page.value = data.page
    size.value = data.size
    totalElements.value = data.totalElements
    totalPages.value = data.totalPages
  } catch (e) {
    console.error('회원 검색 실패', e)
  }
}

const reload = () => {
  page.value = 0
  searchUsers()
}

const resetSearch = () => {
  searchType.value = 'keyword'
  searchKeyword.value = ''
  reload()
}

// 권한 모달 함수
const openRoleModal = (user) => {
  selectedUser.value = user
  showRoleModal.value = true
}

const searchBoardsForRole = async () => {
  if (!boardSearchKeyword.value.trim()) {
    boardSearchResults.value = []
    return
  }
  try {
    const res = await api.get('/boards/search', { params: { keyword: boardSearchKeyword.value } })
    boardSearchResults.value = res.data
  } catch (e) {
    console.error('게시판 검색 실패', e)
  }
}

const selectBoard = (board) => {
  selectedBoard.value = board
  boardSearchResults.value = []
  boardSearchKeyword.value = ''
}

const assignManager = async () => {
  if (!selectedBoard.value) return
  try {
    await api.post(`/admin/manage/users/${selectedUser.value.userId}/role`, null, {
      params: { boardId: selectedBoard.value.id }
    })
    await loadUsers()
    closeRoleModal()
  } catch (e) {
    console.error('관리자 임명 실패', e)
  }
}

const removeManager = async (boardId) => {
  try {
    await api.delete(`/admin/manage/users/${selectedUser.value.userId}/role`, {
      params: { boardId }
    })
    await loadUsers()
    closeRoleModal()
  } catch (e) {
    console.error('관리자 해제 실패', e)
  }
}

const closeRoleModal = () => {
  showRoleModal.value = false
  selectedUser.value = null
  boardSearchKeyword.value = ''
  boardSearchResults.value = []
  selectedBoard.value = null
}

// 제재 모달
const showSuspendModal = ref(false)
const suspendTarget = ref(null)
const selectedSuspensionType = ref('')
const suspendReason = ref('')

const suspensionTypes = [
  { value: 'DAY_1', label: '1일 정지' },
  { value: 'DAY_2', label: '2일 정지' },
  { value: 'DAY_3', label: '3일 정지' },
  { value: 'DAY_7', label: '7일 정지' },
  { value: 'DAY_15', label: '15일 정지' },
  { value: 'DAY_30', label: '30일 정지' },
  { value: 'PERMANENT', label: '영구 정지' }
]

const openSuspendModal = (user) => {
  suspendTarget.value = user
  selectedSuspensionType.value = ''
  suspendReason.value = ''
  showSuspendModal.value = true
}

const closeSuspendModal = () => {
  showSuspendModal.value = false
  suspendTarget.value = null
  selectedSuspensionType.value = ''
  suspendReason.value = ''
}

const confirmSuspend = async () => {
  if (!selectedSuspensionType.value) return
  const typeLabel = suspensionTypes.find(t => t.value === selectedSuspensionType.value)?.label
  if (!confirm(`${suspendTarget.value.nickname}님을 ${typeLabel} 처리하시겠습니까?`)) return

  try {
    await suspendUser(suspendTarget.value.userId, selectedSuspensionType.value, suspendReason.value)
    alert('제재가 적용되었습니다.')
    await loadUsers()
    closeSuspendModal()
  } catch (e) {
    alert(e.response?.data?.message || '제재 적용에 실패했습니다.')
  }
}

const confirmUnsuspend = async () => {
  if (!confirm(`${suspendTarget.value.nickname}님의 제재를 해제하시겠습니까?`)) return

  try {
    await unsuspendUser(suspendTarget.value.userId)
    alert('제재가 해제되었습니다.')
    await loadUsers()
    closeSuspendModal()
  } catch (e) {
    alert(e.response?.data?.message || '제재 해제에 실패했습니다.')
  }
}

onMounted(() => {
  loadUsers()
})
</script>
