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
      <button :disabled="page === 0" @click="movePage(page - 1)">이전</button>

      <span> {{ page + 1 }} / {{ totalPages }} </span>

      <button :disabled="page + 1 >= totalPages" @click="movePage(page + 1)">다음</button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import api from '@/api/axios'
import '@/assets/styles/admin/admin.css'
import '@/assets/styles/admin/user-manage.css'

const users = ref([])

const page = ref(0)
const size = ref(20)
const totalElements = ref(0)
const totalPages = ref(0)

// 검색 조건
const searchType = ref('keyword')
const searchKeyword = ref('')

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

onMounted(() => {
  loadUsers()
})
</script>
