<template>
  <div class="page-post">
    <div class="post-layout">
      <!-- MAIN -->
      <article class="post-main">
        <header class="post-header" v-if="post">
          <h1 class="post-title">{{ post.title }}</h1>

          <div class="post-meta" v-if="post">
            <span class="post-meta__author">{{ post.authorNickname }}</span>
            <span class="post-meta__sep"></span>
            추천<span class="post-meta__stat post-meta__stat--like"> {{ post.likeCount }} </span>
            <span class="post-meta__sep">|</span>
            비추천<span class="post-meta__stat post-meta__stat--dislike">
              {{ post.dislikeCount }}
            </span>
            <span class="post-meta__sep">|</span>
            <span class="post-meta__stat"> 댓글 {{ post.commentCount ?? 0 }} </span>
            <span class="post-meta__sep">|</span>
            <span class="post-meta__stat"> 조회 {{ post.viewCount }} </span>
            <span class="post-meta__sep">|</span>
            <span class="post-meta__date">
              {{ formatDateTime(post.createdAt) }}
            </span>
          </div>
        </header>

        <section class="post-body" v-if="post">
          <div class="post-content">
            {{ post.content }}
          </div>
        </section>

        <section class="post-actions" v-if="post">
          <div class="post-actions__center">
            <button type="button" class="btn" @click="onLike">추천</button>
            <button type="button" class="btn" @click="onDislike">비추천</button>
          </div>

          <div class="post-actions__right" v-if="isAuthor">
            <button type="button" class="btn" @click="goEdit">수정</button>
            <button type="button" class="btn btn-danger" @click="onDelete">삭제</button>
          </div>
        </section>

        <section class="post-comments" v-if="post">
          <div class="post-comments__header">
            <div class="post-comments__title">댓글</div>
          </div>

          <!-- 댓글 리스트 -->
          <div class="comment-list">
            <!-- v-for 자리 -->
          </div>

          <!-- 댓글 입력 -->
          <div class="comment-editor">
            <!-- textarea / 등록 버튼 자리 -->
          </div>
        </section>
        <section class="post-related-list" v-if="post">
          <BoardPostList
            :board-id="post.boardId"
            :page="page"
            :size="size"
            :active-post-id="post.postId"
            @post-click="goPostDetailFromList"
          />
        </section>
        <div v-if="loading" class="post-status">불러오는 중...</div>
        <div v-else-if="error" class="post-status post-status--error">{{ error }}</div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api/axios.js'
import { useUserStore } from '@/stores/userStore'
import '@/assets/styles/components.css'
import '@/assets/styles/pages/post.css'
import BoardPostList from '@/components/board/BoardPostList.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const page = computed(() => Number(route.query.page ?? 0))
const size = computed(() => Number(route.query.size ?? 20))

const postId = computed(() => Number(route.params.postId))

const post = ref(null)
const loading = ref(false)
const error = ref(null)

// 작성자 == 현재 로그인 유저 인지 여부
const isAuthor = computed(() => {
  if (!post.value || !userStore.userId) return false
  return post.value.authorId === userStore.userId
})

// 상세 조회
const loadPost = async () => {
  loading.value = true
  error.value = null
  try {
    const { data } = await api.get(`/posts/${postId.value}`, {
      params: {
        userId: userStore.userId, // 조회수 집계에 필요하면 사용
      },
    })
    post.value = data
  } catch (e) {
    error.value = e?.response?.data?.message || '게시글을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

// 수정 페이지 이동 (지금은 작성 화면 재사용 가정)
const goEdit = () => {
  if (!post.value) return

  router.push({
    name: 'Post',
    params: {
      boardId: post.value.boardId,
    },
    query: {
      postId: postId.value,
      mode: 'edit',
    },
  })
}

// 삭제
const onDelete = async () => {
  if (!post.value) return
  if (!confirm('정말 삭제하시겠습니까?')) return

  try {
    await api.delete(`/posts/${postId.value}`, {
      params: {
        userId: userStore.userId,
      },
    })

    // 삭제 후 게시판 목록으로 이동
    await router.push({
      name: 'BoardPosts',
      params: { boardId: post.value.boardId },
    })
  } catch (e) {
    alert(e?.response?.data?.message || '삭제에 실패했습니다.')
  }
}

const onLike = async () => {
  if (!post.value) return
  if (!userStore.userId) {
    alert('로그인 후 이용 가능합니다.')
    return
  }

  try {
    const { data } = await api.post(`/posts/${postId.value}/like`, null, {
      params: {
        userId: userStore.userId,
      },
    })

    // PostStatResponse 기준으로 카운트 반영
    if (post.value) {
      post.value.viewCount = data.viewCount
      post.value.likeCount = data.likeCount
      post.value.dislikeCount = data.dislikeCount
    }
  } catch (e) {
    alert(e?.response?.data?.message || '추천에 실패했습니다.')
  }
}

const onDislike = async () => {
  if (!post.value) return
  if (!userStore.userId) {
    alert('로그인 후 이용 가능합니다.')
    return
  }

  try {
    const { data } = await api.post(`/posts/${postId.value}/dislike`, null, {
      params: {
        userId: userStore.userId,
      },
    })

    if (post.value) {
      post.value.viewCount = data.viewCount
      post.value.likeCount = data.likeCount
      post.value.dislikeCount = data.dislikeCount
    }
  } catch (e) {
    alert(e?.response?.data?.message || '비추천에 실패했습니다.')
  }
}

const formatDateTime = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
}

onMounted(() => {
  if (!postId.value) {
    error.value = '잘못된 게시글 접근입니다.'
    return
  }
  loadPost()
})

watch(
  () => postId.value,
  (next, prev) => {
    if (!next || next === prev) return
    loadPost()
    // 선택: 화면 맨 위로
    // window.scrollTo({ top: 0, behavior: 'auto' })
  },
)

const goPostDetailFromList = (postId) => {
  router.push({
    name: 'PostDetail',
    params: { postId },
    query: {
      ...route.query, // page/size 유지
    },
  })
}
</script>
