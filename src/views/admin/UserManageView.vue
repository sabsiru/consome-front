<template>
  <div class="admin-user-view">
    <h1>회원 관리</h1>

    <!-- 검색 조건 (필요해지면 확장) -->
    <div class="search-bar">
      <input
        v-model="searchLoginId"
        type="text"
        placeholder="로그인 아이디"
      />
      <input
        v-model="searchNickname"
        type="text"
        placeholder="닉네임"
      />
      <button @click="reload">검색</button>
      <button @click="resetSearch">초기화</button>
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
      </tr>
      </thead>
      <tbody>
      <tr v-for="user in users" :key="user.userId">
        <td>{{ user.userId }}</td>
        <td>{{ user.loginId }}</td>
        <td>{{ user.nickname }}</td>
        <td>{{ user.role }}</td>
        <td>{{ user.userPoint }}</td>
      </tr>
      <tr v-if="users.length === 0">
        <td colspan="5" class="empty">조회된 회원이 없습니다.</td>
      </tr>
      </tbody>
    </table>

    <!-- 페이지네이션 -->
    <div class="pagination">
      <button
        :disabled="page === 0"
        @click="movePage(page - 1)"
      >
        이전
      </button>

      <span>
        {{ page + 1 }} / {{ totalPages }}
      </span>

      <button
        :disabled="page + 1 >= totalPages"
        @click="movePage(page + 1)"
      >
        다음
      </button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import api from '@/api/axios'

const users = ref([])

const page = ref(0)
const size = ref(20)
const totalElements = ref(0)
const totalPages = ref(0)

// 검색 조건 (지금은 쿼리 파라미터로만 전송)
const searchLoginId = ref('')
const searchNickname = ref('')

const loadUsers = async () => {
  try {
    const res = await api.get('/admin/manage/users', {
      params: {
        page: page.value,
        size: size.value,
        loginId: searchLoginId.value || undefined,
        nickname: searchNickname.value || undefined,
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

const reload = () => {
  page.value = 0
  loadUsers()
}

const resetSearch = () => {
  searchLoginId.value = ''
  searchNickname.value = ''
  reload()
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.admin-user-view {
  padding: 24px;
  background: var(--bg-primary);
  min-height: 100vh;
}

.admin-user-view h1 {
  font-family: 'Outfit', sans-serif;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 24px;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-bar input {
  padding: 10px 14px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  min-width: 180px;
}

.search-bar input::placeholder {
  color: var(--text-muted);
}

.search-bar input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-dim);
}

.search-bar button {
  padding: 10px 18px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-secondary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-bar button:hover {
  background: var(--bg-hover);
  border-color: var(--accent);
  color: var(--accent);
}

.user-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  background: var(--bg-secondary);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.user-table th,
.user-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.user-table th {
  background: var(--bg-tertiary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.user-table td {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: var(--text-primary);
}

.user-table tbody tr {
  transition: background 0.15s ease;
}

.user-table tbody tr:hover {
  background: var(--bg-hover);
}

.user-table .empty {
  text-align: center;
  color: var(--text-muted);
  padding: 32px;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: var(--text-secondary);
}

.pagination button {
  padding: 8px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-secondary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination button:hover:not(:disabled) {
  background: var(--bg-hover);
  border-color: var(--accent);
  color: var(--accent);
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
