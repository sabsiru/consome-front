<template>
  <section class="comment">
    <!-- 댓글 헤더 -->
    <div class="comment__header">
      <h3 class="comment__title">댓글 {{ totalElements }}개</h3>
    </div>

    <!-- 댓글 목록 -->
    <div class="comment__list">
      <article
        v-for="c in comments"
        :key="c.commentId"
        class="comment-item"
        :style="{ marginLeft: `${(c.depth ?? 0) * INDENT_PX}px` }"
      >
        <div class="comment-item__meta">
          <div class="comment-item__meta-left">
            <span class="comment-item__author">{{ c.userNickname }}</span>
            <span
              v-if="props.postAuthorId != null && c.userId === props.postAuthorId"
              class="comment-badge comment-badge--author"
            >
              작성자
            </span>
          </div>

          <div class="comment-item__meta-right">
            <button
              v-if="!isDeletedComment(c)"
              type="button"
              class="comment-item__vote-btn comment-item__vote-btn--like"
              :class="{ 'comment-item__vote-btn--voted': c.hasLiked }"
              :disabled="c.hasLiked"
              @click="onLikeComment(c.commentId)"
              aria-label="댓글 추천"
            >
              <ThumbsUp :size="13" />
              <span v-if="c.likeCount != null" class="comment-item__vote-count">{{
                c.likeCount
              }}</span>
            </button>

            <button
              v-if="!isDeletedComment(c)"
              type="button"
              class="comment-item__vote-btn comment-item__vote-btn--dislike"
              :class="{ 'comment-item__vote-btn--voted-dislike': c.hasDisliked }"
              :disabled="c.hasDisliked"
              @click="onDislikeComment(c.commentId)"
              aria-label="댓글 비추천"
            >
              <ThumbsDown :size="13" />
              <span v-if="c.dislikeCount != null" class="comment-item__vote-count">{{
                c.dislikeCount
              }}</span>
            </button>
            <span class="comment-item__date">{{ formatDate(c.createdAt) }}</span>
            <button
              v-if="canWrite"
              type="button"
              class="comment-item__reply-btn"
              @click="toggleReply(c.commentId)"
            >
              답글
            </button>
          </div>
        </div>

        <div class="comment-item__content">
          <!-- 보기 모드 -->
          <div v-if="editingId !== c.commentId" class="comment-item__content-text">
            <span v-if="c.parentUserNickname" class="comment-item__parent-author">{{ c.parentUserNickname }}</span>
            <span class="comment-item__content-body">{{ c.content }}</span>
            <span
              v-if="c.updatedAt && !isDeletedComment(c)"
              class="comment-badge comment-badge--edited"
              >수정됨</span
            >
          </div>

          <!-- 수정 모드 -->
          <div v-else class="comment-item__edit">
            <textarea
              class="comment__textarea comment__textarea--edit"
              v-model="editContent"
              rows="2"
              :disabled="submittingEdit"
              placeholder="댓글을 수정하세요."
            />

            <div class="comment-item__edit-actions">
              <button type="button" class="btn" :disabled="submittingEdit" @click="cancelEdit">
                취소
              </button>
              <button
                type="button"
                class="btn btn-primary"
                :disabled="!canSubmitEdit"
                @click="submitEdit(c.commentId)"
              >
                저장
              </button>
            </div>
          </div>

          <!-- 작성자 액션(hover 노출): 수정 -> 삭제 순서 -->
          <div
            v-if="
              editingId !== c.commentId &&
              canWrite &&
              !isDeletedComment(c) &&
              props.currentUserId != null &&
              c.userId === props.currentUserId
            "
            class="comment-item__actions"
          >
            <button type="button" class="comment-item__edit-btn" @click="startEdit(c)">수정</button>
            <button type="button" class="comment-item__delete-btn" @click="onDelete(c.commentId)">
              삭제
            </button>
          </div>
        </div>

        <div
          v-if="replyingTo === c.commentId"
          class="comment-reply"
          :style="{ marginLeft: `${((c.depth ?? 0) + 1) * INDENT_PX}px` }"
        >
          <textarea
            class="comment__textarea"
            v-model="replyContent"
            rows="2"
            :disabled="submittingReply"
            placeholder="답글을 입력하세요."
          />

          <div class="comment__write-actions comment__write-actions--reply">
            <button type="button" class="btn" :disabled="submittingReply" @click="cancelReply">
              취소
            </button>
            <button
              type="button"
              class="btn btn-primary"
              :disabled="!canSubmitReply"
              @click="submitReply(c.commentId)"
            >
              등록
            </button>
          </div>
        </div>
      </article>

      <div v-if="comments.length === 0" class="comment__empty">아직 댓글이 없습니다.</div>
    </div>

    <!-- 댓글 페이징 -->
    <div class="comment__paging" v-if="totalPages > 1">
      <button class="btn" :disabled="page === 0" @click="changePage(page - 1)">이전</button>

      <span class="comment__page"> {{ page + 1 }} / {{ totalPages }} </span>

      <button class="btn" :disabled="page + 1 >= totalPages" @click="changePage(page + 1)">
        다음
      </button>
    </div>

    <!-- 댓글 입력 (페이징 아래) -->
    <div class="comment__write" @click="onCommentAreaClick">
      <textarea
        class="comment__textarea"
        v-model="content"
        rows="3"
        :disabled="!canWrite || submitting"
        :placeholder="canWrite ? '댓글을 입력하세요.' : '댓글을 입력하려면 로그인을 해야됩니다.'"
        :style="!canWrite ? { pointerEvents: 'none' } : {}"
      />

      <div class="comment__write-actions">
        <span v-if="!canWrite" class="comment__hint"> 로그인 후 댓글을 작성할 수 있습니다. </span>

        <button class="btn btn-primary" :disabled="!canSubmit" @click="submit">등록</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ThumbsUp, ThumbsDown } from 'lucide-vue-next'
import '@/assets/styles/board/comment.css'

const router = useRouter()
const route = useRoute()
const INDENT_PX = 20

const props = defineProps({
  postId: { type: Number, required: true },

  comments: { type: Array, default: () => [] },
  page: { type: Number, default: 0 },
  size: { type: Number, default: 20 },
  totalPages: { type: Number, default: 0 },
  totalElements: { type: Number, default: 0 },

  canWrite: { type: Boolean, default: false },
  currentUserId: { type: Number, required: false },

  postAuthorId: { type: Number, required: false },
})

const emit = defineEmits([
  'page-change', // (page:number)
  'create-comment', // ({ content, parentId }, done, fail)
  'edit-comment', // ({ commentId, content }, done, fail)
  'delete-comment', // (commentId, done, fail)
  'like-comment', // (commentId)
  'dislike-comment', // (commentId)
  'login-required', // 비로그인 시 로그인 필요
])

const onCommentAreaClick = () => {
  if (!props.canWrite) {
    emit('login-required')
  }
}

const content = ref('')
const submitting = ref(false)

// 답글(대댓글)
const replyingTo = ref(null) // commentId
const replyContent = ref('')
const submittingReply = ref(false)

// 수정
const editingId = ref(null) // commentId
const editContent = ref('')
const submittingEdit = ref(false)

const canSubmit = computed(
  () => props.canWrite && !submitting.value && content.value.trim().length > 0,
)

const canSubmitReply = computed(
  () => props.canWrite && !submittingReply.value && replyContent.value.trim().length > 0,
)

const canSubmitEdit = computed(
  () => props.canWrite && !submittingEdit.value && editContent.value.trim().length > 0,
)

const changePage = (p) => {
  if (p < 0 || p >= props.totalPages) return
  emit('page-change', p)
}

const submit = () => {
  if (!canSubmit.value) return

  submitting.value = true
  const text = content.value.trim()

  emit(
    'create-comment',
    { content: text, parentId: null },
    () => {
      content.value = ''
      submitting.value = false
    },
    () => {
      submitting.value = false
    },
  )
}

const toggleReply = (commentId) => {
  if (!props.canWrite) return

  if (replyingTo.value === commentId) {
    cancelReply()
    return
  }

  // 수정 중이면 닫기
  cancelEdit()

  replyingTo.value = commentId
  replyContent.value = ''
}

const cancelReply = () => {
  replyingTo.value = null
  replyContent.value = ''
  submittingReply.value = false
}

const startEdit = (comment) => {
  if (!props.canWrite) return
  if (props.currentUserId == null || comment.userId !== props.currentUserId) return

  // 동시에 여러 입력창이 열리지 않게
  cancelReply()

  editingId.value = comment.commentId
  editContent.value = String(comment.content ?? '')
  submittingEdit.value = false
}

const cancelEdit = () => {
  editingId.value = null
  editContent.value = ''
  submittingEdit.value = false
}

const submitEdit = (commentId) => {
  if (!canSubmitEdit.value) return

  submittingEdit.value = true
  const text = editContent.value.trim()

  emit(
    'edit-comment',
    { commentId, content: text },
    () => {
      cancelEdit()
    },
    () => {
      submittingEdit.value = false
    },
  )
}

const submitReply = (parentId) => {
  if (!canSubmitReply.value) return

  submittingReply.value = true
  const text = replyContent.value.trim()

  emit(
    'create-comment',
    { content: text, parentId },
    () => {
      cancelReply()
    },
    () => {
      submittingReply.value = false
    },
  )
}

const onDelete = (commentId) => {
  emit(
    'delete-comment',
    commentId,
    () => {},
    () => {},
  )
}

const onLikeComment = (commentId) => {
  emit('like-comment', commentId)
}

const onDislikeComment = (commentId) => {
  emit('dislike-comment', commentId)
}

const isDeletedComment = (c) => {
  if (!c) return false

  const v = c.isDeleted

  if (typeof v === 'boolean') return v

  if (typeof v === 'string') {
    const s = v.trim().toUpperCase()
    if (s === 'Y' || s === 'YES' || s === 'TRUE' || s === 'DELETED') return true
    if (s === 'N' || s === 'NO' || s === 'FALSE') return false
  }

  if (typeof v === 'number') return v === 1

  if (c.deletedAt) return true

  const st = (c.status ?? c.state ?? '').toString().toUpperCase()
  if (st === 'DELETED' || st === 'REMOVED') return true

  return false
}

const formatDate = (isoString) => {
  if (!isoString) return ''

  const createdAt = new Date(isoString)
  const now = new Date()

  const diffMs = now - createdAt
  const diffHours = diffMs / (1000 * 60 * 60)

  // 24시간 이내 → 시간만
  if (diffHours < 24) {
    const hh = String(createdAt.getHours()).padStart(2, '0')
    const mm = String(createdAt.getMinutes()).padStart(2, '0')
    return `${hh}:${mm}`
  }

  // 24시간 초과 → 날짜만
  const yyyy = createdAt.getFullYear()
  const mm = String(createdAt.getMonth() + 1).padStart(2, '0')
  const dd = String(createdAt.getDate()).padStart(2, '0')
  return `${yyyy}.${mm}.${dd}`
}
</script>
