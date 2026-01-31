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
            <div v-html="post.content"></div>
          </div>
        </section>

        <section class="post-actions" v-if="post">
          <div class="post-actions__center">
            <button type="button" class="btn" :class="{ 'btn--voted': hasLiked }" :disabled="hasLiked" @click="onLike">추천</button>
            <button type="button" class="btn" :class="{ 'btn--voted-dislike': hasDisliked }" :disabled="hasDisliked" @click="onDislike">비추천</button>
          </div>

          <div class="post-actions__right" v-if="isAuthor">
            <button type="button" class="btn" @click="goEdit">수정</button>
            <button type="button" class="btn btn-danger" @click="onDelete">삭제</button>
          </div>
        </section>

        <section class="post-comments" v-if="post">
          <PostCommentSection
            :post-id="postId"
            :comments="comments"
            :page="commentPage"
            :size="commentSize"
            :total-pages="commentTotalPages"
            :total-elements="commentTotalElements"
            :can-write="isLoggedIn"
            :current-user-id="userStore.userId || null"
            :post-author-id="post.authorId"
            @page-change="loadComments"
            @create-comment="createComment"
            @edit-comment="editComment"
            @delete-comment="deleteComment"
            @like-comment="likeComment"
            @dislike-comment="dislikeComment"
            @login-required="onLoginRequired"
          />
        </section>
        <section class="post-related-list" v-if="post">
          <BoardPostList
            :board-id="post.boardId"
            :page="page"
            :size="size"
            :active-post-id="post.postId"
            @post-click="goPostDetailFromList"
            @write-click="onWriteClick"
          />
        </section>
        <div v-if="loading" class="post-status">불러오는 중...</div>
        <div v-else-if="error" class="post-status post-status--error">{{ error }}</div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api/axios.js'
import { useUserStore } from '@/stores/userStore.js'
import '@/assets/styles/components.css'
import '@/assets/styles/board/post.css'
import BoardPostList from '@/components/board/BoardPostList.vue'
import PostCommentSection from '@/components/board/PostCommentSection.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const page = computed(() => Number(route.query.page ?? 0))
const size = computed(() => Number(route.query.size ?? 20))
const postId = computed(() => Number(route.params.postId))

const post = ref(null)
const loading = ref(false)
const error = ref(null)

// 투표 상태
const hasLiked = ref(false)
const hasDisliked = ref(false)

// 댓글 상태
const comments = ref([])
const commentPage = ref(0)
const commentSize = ref(20)
const commentTotalPages = ref(0)
const commentTotalElements = ref(0)

// 댓글 목록 조회
const loadComments = async (p = 0) => {
  try {
    const { data } = await api.get(`/posts/${postId.value}/comments`, {
      params: {
        page: p,
        size: commentSize.value,
        userId: userStore.userId,
      },
    })

    comments.value = Array.isArray(data?.comments) ? data.comments : []
    commentPage.value = Number.isFinite(data?.currentPage) ? data.currentPage : p
    commentTotalPages.value = Number.isFinite(data?.totalPages) ? data.totalPages : 0
    commentTotalElements.value = typeof data?.totalElements === 'number' ? data.totalElements : 0
  } catch (e) {
    console.error(e)
    comments.value = []
    commentPage.value = p
    commentTotalPages.value = 0
    commentTotalElements.value = 0
  }
}

// 댓글 작성
const createComment = async (payload, done, fail) => {
  if (!isLoggedIn.value) {
    alert('로그인 후 이용 가능합니다.')
    fail?.()
    return
  }

  try {
    await api.post(`/posts/${postId.value}/comments`, {
      userId: userStore.userId,
      parentId: payload.parentId ?? null,
      content: payload.content,
    })

    done?.()

    // 정책: 새 댓글이 보이도록 0페이지로 이동
    await loadComments(0)

    // 화면의 댓글 수 즉시 반영
    if (post.value) post.value.commentCount = (post.value.commentCount ?? 0) + 1
  } catch (e) {
    alert(e?.response?.data?.message || '댓글 등록에 실패했습니다.')
    fail?.()
  }
}

// 댓글 수정
const editComment = async (payload, done, fail) => {
  if (!isLoggedIn.value) {
    alert('로그인 후 이용 가능합니다.')
    fail?.()
    return
  }

  try {
    await api.put(`/posts/${postId.value}/comments/${payload.commentId}`, {
      userId: userStore.userId,
      content: payload.content,
    })

    done?.()

    // 수정 반영
    await loadComments(commentPage.value)
  } catch (e) {
    alert(e?.response?.data?.message || '댓글 수정에 실패했습니다.')
    fail?.()
  }
}

// 작성자 == 현재 로그인 유저 인지 여부
const isAuthor = computed(() => {
  if (!post.value || !userStore.userId) return false
  return post.value.authorId === userStore.userId
})

// 댓글 삭제
const deleteComment = async (commentId, done, fail) => {
  if (!isLoggedIn.value) {
    alert('로그인 후 이용 가능합니다.')
    fail?.()
    return
  }

  if (!confirm('댓글을 삭제하시겠습니까?')) {
    fail?.()
    return
  }

  try {
    await api.delete(`/posts/${postId.value}/comments/${commentId}`, {
      params: { userId: userStore.userId },
    })

    done?.()

    // 삭제 반영
    await loadComments(commentPage.value)

    // 화면의 댓글 수 즉시 반영(단순 감소)
    if (post.value) post.value.commentCount = Math.max(0, (post.value.commentCount ?? 0) - 1)
  } catch (e) {
    alert(e?.response?.data?.message || '댓글 삭제에 실패했습니다.')
    fail?.()
  }
}

// 로그인 페이지로 이동
const goToLogin = () => {
  const currentPath = route.fullPath
  router.push({ path: '/login', query: { redirect: currentPath } })
}

// 로그인 필요 시 처리
const onLoginRequired = () => {
  if (confirm('로그인이 필요합니다. 로그인 하시겠습니까?')) {
    goToLogin()
  }
}

// 댓글 추천
const likeComment = async (commentId) => {
  if (!userStore.userId) {
    if (confirm('로그인이 필요합니다. 로그인 하시겠습니까?')) {
      goToLogin()
    }
    return
  }

  // 해당 댓글 찾기
  const comment = comments.value.find((c) => c.commentId === commentId)
  if (!comment) return

  // Optimistic UI: 즉시 상태 토글
  const prevHasLiked = comment.hasLiked
  const prevLikeCount = comment.likeCount
  comment.hasLiked = !comment.hasLiked
  comment.likeCount = comment.hasLiked ? (comment.likeCount ?? 0) + 1 : Math.max(0, (comment.likeCount ?? 0) - 1)

  try {
    const { data } = await api.post(`/posts/${postId.value}/comments/${commentId}/like`, null, {
      params: { userId: userStore.userId },
    })
    // 백엔드 응답이 있으면 반영
    if (data?.likeCount !== undefined) comment.likeCount = data.likeCount
    if (data?.hasLiked !== undefined) comment.hasLiked = data.hasLiked
  } catch (e) {
    // 실패 시 원복
    comment.hasLiked = prevHasLiked
    comment.likeCount = prevLikeCount
    alert(e?.response?.data?.message || '추천에 실패했습니다.')
  }
}

// 댓글 비추천
const dislikeComment = async (commentId) => {
  if (!userStore.userId) {
    if (confirm('로그인이 필요합니다. 로그인 하시겠습니까?')) {
      goToLogin()
    }
    return
  }

  // 해당 댓글 찾기
  const comment = comments.value.find((c) => c.commentId === commentId)
  if (!comment) return

  // Optimistic UI: 즉시 상태 토글
  const prevHasDisliked = comment.hasDisliked
  const prevDislikeCount = comment.dislikeCount
  comment.hasDisliked = !comment.hasDisliked
  comment.dislikeCount = comment.hasDisliked ? (comment.dislikeCount ?? 0) + 1 : Math.max(0, (comment.dislikeCount ?? 0) - 1)

  try {
    const { data } = await api.post(`/posts/${postId.value}/comments/${commentId}/dislike`, null, {
      params: { userId: userStore.userId },
    })
    // 백엔드 응답이 있으면 반영
    if (data?.dislikeCount !== undefined) comment.dislikeCount = data.dislikeCount
    if (data?.hasDisliked !== undefined) comment.hasDisliked = data.hasDisliked
  } catch (e) {
    // 실패 시 원복
    comment.hasDisliked = prevHasDisliked
    comment.dislikeCount = prevDislikeCount
    alert(e?.response?.data?.message || '비추천에 실패했습니다.')
  }
}

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
    // 투표 상태 로드 (백엔드에서 반환 시)
    hasLiked.value = data.hasLiked ?? false
    hasDisliked.value = data.hasDisliked ?? false
    await nextTick()
    await processEmbeds()
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
    name: 'PostWrite',
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
    if (confirm('로그인이 필요합니다. 로그인 하시겠습니까?')) {
      goToLogin()
    }
    return
  }

  // Optimistic UI: 즉시 상태 토글
  const prevLiked = hasLiked.value
  hasLiked.value = !hasLiked.value

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
    // 백엔드 응답에 투표 상태가 있으면 반영
    if (data.hasLiked !== undefined) hasLiked.value = data.hasLiked
    if (data.hasDisliked !== undefined) hasDisliked.value = data.hasDisliked
  } catch (e) {
    // 실패 시 원복
    hasLiked.value = prevLiked
    alert(e?.response?.data?.message || '추천에 실패했습니다.')
  }
}

const onDislike = async () => {
  if (!post.value) return
  if (!userStore.userId) {
    if (confirm('로그인이 필요합니다. 로그인 하시겠습니까?')) {
      goToLogin()
    }
    return
  }

  // Optimistic UI: 즉시 상태 토글
  const prevDisliked = hasDisliked.value
  hasDisliked.value = !hasDisliked.value

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
    // 백엔드 응답에 투표 상태가 있으면 반영
    if (data.hasLiked !== undefined) hasLiked.value = data.hasLiked
    if (data.hasDisliked !== undefined) hasDisliked.value = data.hasDisliked
  } catch (e) {
    // 실패 시 원복
    hasDisliked.value = prevDisliked
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
  loadComments(0)
})

watch(
  () => postId.value,
  (next, prev) => {
    if (!next || next === prev) return
    loadPost()
    loadComments(0)
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

const onWriteClick = () => {
  router.push({ name: 'PostWrite', params: { boardId: post.boardId } })
}

const isLoggedIn = computed(() => !!userStore.userId)

const loadScript = (src, id, forceReload = false) =>
  new Promise((resolve) => {
    const existing = document.getElementById(id)
    if (existing && forceReload) {
      existing.remove()
    }
    if (document.getElementById(id)) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.id = id
    script.src = src
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => resolve()
    document.body.appendChild(script)
  })

const markYoutubeAspect = async () => {
  const iframes = document.querySelectorAll('.post-content iframe[src*="youtube.com/embed/"]')
  await Promise.all(
    Array.from(iframes).map(async (iframe) => {
      const src = iframe.getAttribute('src')
      if (!src) return
      if (src.includes('ytshorts=1')) {
        iframe.classList.add('yt-vertical')
        return
      }
      const id = src.split('/embed/')[1]?.split('?')[0]
      if (!id) return
      try {
        const res = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`,
        )
        if (!res.ok) return
        const data = await res.json()
        if (data.thumbnail_width && data.thumbnail_height && data.thumbnail_height > data.thumbnail_width) {
          iframe.classList.add('yt-vertical')
        }
      } catch {
        // ignore oEmbed failures
      }
    }),
  )
}

const processEmbeds = async () => {
  await loadScript('https://platform.twitter.com/widgets.js', 'embed-twitter')
  await loadScript('https://www.instagram.com/embed.js', 'embed-instagram')
  await loadScript('https://www.tiktok.com/embed.js', 'embed-tiktok', true)
  await loadScript('https://www.threads.net/embed.js', 'embed-threads', true)

  window.twttr?.widgets?.load()
  window.instgrm?.Embeds?.process()
  await markYoutubeAspect()
}
</script>
