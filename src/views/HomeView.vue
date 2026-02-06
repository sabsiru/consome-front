<template>
  <main class="home">
    <!-- Theme Switcher -->
    <div class="theme-dock">
      <button
        v-for="theme in themes"
        :key="theme.id"
        class="theme-orb"
        :class="{ 'theme-orb--active': currentTheme === theme.id }"
        :style="{ '--orb-color': theme.color, '--orb-glow': theme.glow }"
        :title="theme.name"
        @click="setTheme(theme.id)"
      >
        <span class="theme-orb__ring"></span>
        <span class="theme-orb__core"></span>
      </button>
    </div>

    <div class="home__hero">
      <h1 class="home__title">Consome</h1>
      <p class="home__subtitle">Developer Console Community</p>
    </div>

    <div class="home__content">
      <!-- 인기 게시글 -->
      <section class="home__section home__section--posts">
        <div class="home__section-header">
          <h2 class="home__section-title">인기 게시글</h2>
        </div>
        <div v-if="postsLoading" class="home__loading">불러오는 중...</div>
        <div v-else-if="!popularPosts.length" class="home__empty">인기 게시글이 없습니다</div>
        <table v-else class="home__posts-table">
          <thead>
            <tr>
              <th class="col-board">게시판</th>
              <th class="col-title">제목</th>
              <th class="col-views">조회</th>
              <th class="col-likes">추천</th>
              <th class="col-comments">댓글</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="post in popularPosts"
              :key="post.postId"
              @click="goToPost(post)"
            >
              <td class="col-board">{{ post.boardName }}</td>
              <td class="col-title">{{ post.title }}</td>
              <td class="col-views">{{ post.viewCount }}</td>
              <td class="col-likes">{{ post.likeCount }}</td>
              <td class="col-comments">{{ post.commentCount }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- 인기 게시판 -->
      <div class="home__boards-area">
        <div v-if="boardsLoading" class="home__loading">불러오는 중...</div>
        <div v-else-if="!popularBoards.length" class="home__empty">인기 게시판이 없습니다</div>
        <template v-else>
          <section
            v-for="board in popularBoards"
            :key="board.boardId"
            class="home__section home__section--board"
          >
            <div class="home__section-header home__section-header--clickable" @click="goToBoard(board.boardId)">
              <h2 class="home__section-title">{{ board.boardName }}</h2>
            </div>
            <ul class="home__board-list">
              <li v-for="preview in board.posts" :key="preview.postId">
                <router-link
                  :to="`/boards/${board.boardId}/posts/${preview.postId}`"
                  class="home__board-list-item"
                >
                  {{ preview.title }}
                </router-link>
              </li>
              <li v-if="!board.posts?.length" class="home__board-list-empty">
                게시글이 없습니다
              </li>
            </ul>
          </section>
        </template>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getPopularPosts, getPopularBoards } from '@/api/navigationApi.js'

const router = useRouter()

// Theme Switcher
const themes = [
  { id: 'default', name: 'Default', color: '#00d4aa', glow: '#00d4aa50' },
  { id: 'discord', name: 'Discord', color: '#5865f2', glow: '#5865f250' },
  { id: 'glass', name: 'Glass', color: '#ffffff', glow: '#ffffff30' },
]

const currentTheme = ref(localStorage.getItem('theme') || 'default')

const setTheme = (themeId) => {
  currentTheme.value = themeId
  document.documentElement.dataset.theme = themeId === 'default' ? '' : themeId
  localStorage.setItem('theme', themeId)
}

const popularPosts = ref([])
const popularBoards = ref([])
const postsLoading = ref(true)
const boardsLoading = ref(true)

const fetchPopularPosts = async () => {
  try {
    const { data } = await getPopularPosts()
    popularPosts.value = data
  } catch (e) {
    console.error('인기 게시글 로드 실패:', e)
  } finally {
    postsLoading.value = false
  }
}

const fetchPopularBoards = async () => {
  try {
    const { data } = await getPopularBoards()
    popularBoards.value = data
  } catch (e) {
    console.error('인기 게시판 로드 실패:', e)
  } finally {
    boardsLoading.value = false
  }
}

const goToPost = (post) => {
  router.push(`/boards/${post.boardId}/posts/${post.postId}`)
}

const goToBoard = (boardId) => {
  router.push(`/boards/${boardId}`)
}

onMounted(() => {
  // Initialize theme
  if (currentTheme.value && currentTheme.value !== 'default') {
    document.documentElement.dataset.theme = currentTheme.value
  }
  fetchPopularPosts()
  fetchPopularBoards()
})
</script>
