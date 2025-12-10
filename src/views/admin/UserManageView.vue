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
}

.search-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.search-bar input {
  padding: 4px 8px;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
}

.user-table th,
.user-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.user-table thead {
}

.user-table .empty {
  text-align: center;
  color: #999;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
