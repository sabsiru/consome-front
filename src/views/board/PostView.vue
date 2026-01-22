<template>
  <div class="board-post-write">
    <form @submit.prevent="submit">
      <!-- 🔹 카테고리: DB 조회 결과를 select로 표시 -->
      <div class="form-row">
        <select id="category" v-model="categoryId">
          <option v-for="category in categories" :key="category.id" :value="String(category.id)">
            {{ category.name }}
          </option>
        </select>
      </div>
      <div class="form-row">
        <input id="title" v-model="title" type="text" placeholder="제목을 입력하세요." />
      </div>

      <div class="form-row">
        <div class="editor-wrapper" @dragover.prevent @drop.prevent="onFileDrop">
          <div v-if="editor" class="toolbar">
            <button
              type="button"
              @click="editor.chain().focus().toggleBold().run()"
              :class="{ active: editor.isActive('bold') }"
            >
              B
            </button>
            <button
              type="button"
              @click="editor.chain().focus().toggleItalic().run()"
              :class="{ active: editor.isActive('italic') }"
            >
              I
            </button>
            <button
              type="button"
              @click="editor.chain().focus().toggleStrike().run()"
              :class="{ active: editor.isActive('strike') }"
            >
              S
            </button>
            <span class="divider"></span>
            <button
              type="button"
              @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
              :class="{ active: editor.isActive('heading', { level: 1 }) }"
            >
              H1
            </button>
            <button
              type="button"
              @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
              :class="{ active: editor.isActive('heading', { level: 2 }) }"
            >
              H2
            </button>
            <button
              type="button"
              @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
              :class="{ active: editor.isActive('heading', { level: 3 }) }"
            >
              H3
            </button>
            <span class="divider"></span>
            <button
              type="button"
              @click="editor.chain().focus().toggleBulletList().run()"
              :class="{ active: editor.isActive('bulletList') }"
            >
              •
            </button>
            <button
              type="button"
              @click="editor.chain().focus().toggleOrderedList().run()"
              :class="{ active: editor.isActive('orderedList') }"
            >
              1.
            </button>
            <button
              type="button"
              @click="editor.chain().focus().toggleCodeBlock().run()"
              :class="{ active: editor.isActive('codeBlock') }"
            >
              &lt;/&gt;
            </button>
            <span class="divider"></span>
            <button type="button" @click="showImageDropZone = true">이미지</button>
            <button type="button" @click="showVideoDropZone = true">영상</button>
          </div>
          <EditorContent :editor="editor" class="editor-content" @click="focusEditor" />

          <!-- 이미지 드롭존 -->
          <div
            v-if="showImageDropZone"
            class="drop-zone-overlay"
            @click.self="showImageDropZone = false"
            @dragover.prevent="onDragOver"
            @dragleave="onDragLeave"
            @drop.prevent.stop="onImageDropZone"
          >
            <div class="drop-zone" :class="{ 'drag-over': isDragOver }">
              <p>이미지를 여기에 드래그하거나</p>
              <button type="button" @click="addImage">파일 선택</button>
            </div>
          </div>

          <!-- 영상 드롭존 -->
          <div
            v-if="showVideoDropZone"
            class="drop-zone-overlay"
            @click.self="showVideoDropZone = false"
            @dragover.prevent="onDragOver"
            @dragleave="onDragLeave"
            @drop.prevent.stop="onVideoDropZone"
          >
            <div class="drop-zone" :class="{ 'drag-over': isDragOver }">
              <p>영상을 여기에 드래그하거나</p>
              <button type="button" @click="addVideo">파일 선택</button>
            </div>
          </div>

          <!-- 영상 변환 중 오버레이 -->
          <div v-if="videoConverting" class="converting-overlay">
            <div class="converting-content">
              <div class="spinner"></div>
              <p>영상 변환 중...</p>
            </div>
          </div>
        </div>
      </div>
      <input
        ref="imageInput"
        type="file"
        accept="image/*"
        multiple
        style="display: none"
        @change="onImageSelected"
      />
      <input
        ref="videoInput"
        type="file"
        accept="video/*"
        style="display: none"
        @change="onVideoSelected"
      />

      <p v-if="error" class="error">{{ error }}</p>

      <div class="actions">
        <button type="button" @click="goBack">목록으로</button>
        <button type="submit" :disabled="loading">
          {{ loading ? (isEditMode ? '수정 중...' : '작성 중...') : (isEditMode ? '수정' : '등록') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { Node, mergeAttributes } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import api from '@/api/axios.js'
import { useUserStore } from '@/stores/userStore.js'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_VIDEO_SIZE = 30 * 1024 * 1024 // 30MB

const boardId = computed(() => Number(route.params.boardId))
const editPostId = computed(() => route.query.postId ? Number(route.query.postId) : null)
const isEditMode = computed(() => route.query.mode === 'edit')
const boardName = ref('')
const categoryId = ref('')
const categories = ref([])

const title = ref('')
const loading = ref(false)
const error = ref('')
const videoInput = ref(null)
const showImageDropZone = ref(false)
const showVideoDropZone = ref(false)
const isDragOver = ref(false)
const videoConverting = ref(false)

const Video = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null },
      controls: { default: true },
    }
  },
  parseHTML() {
    return [{ tag: 'video' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes({ controls: true }, HTMLAttributes)]
  },
  addCommands() {
    return {
      setVideo:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    }
  },
})

const Embed = Node.create({
  name: 'embed',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      provider: { default: null },
      url: { default: null },
      videoId: { default: null },
    }
  },
  parseHTML() {
    return [
      {
        tag: 'blockquote.instagram-media',
        getAttrs: (node) => ({
          provider: 'instagram',
          url: node.getAttribute('data-instgrm-permalink'),
        }),
      },
      {
        tag: 'blockquote.tiktok-embed',
        getAttrs: (node) => ({
          provider: 'tiktok',
          url: node.getAttribute('cite'),
          videoId: node.getAttribute('data-video-id'),
        }),
      },
      {
        tag: 'blockquote.twitter-tweet',
        getAttrs: (node) => {
          const anchor = node.querySelector('a[href]')
          return {
            provider: 'x',
            url: anchor?.getAttribute('href') || null,
          }
        },
      },
      {
        tag: 'blockquote.text-post-media',
        getAttrs: (node) => ({
          provider: 'threads',
          url: node.getAttribute('data-text-post-permalink'),
        }),
      },
    ]
  },
  renderHTML({ node }) {
    const { provider, url, videoId } = node.attrs
    if (provider === 'instagram') {
      return [
        'blockquote',
        {
          class: 'instagram-media',
          'data-instgrm-permalink': url,
          'data-instgrm-version': '14',
        },
      ]
    }
    if (provider === 'tiktok') {
      return [
        'blockquote',
        {
          class: 'tiktok-embed',
          cite: url,
          'data-video-id': videoId,
        },
        ['section'],
      ]
    }
    if (provider === 'threads') {
      return [
        'blockquote',
        {
          class: 'text-post-media',
          'data-text-post-permalink': url,
        },
      ]
    }
    if (provider === 'x') {
      return [
        'blockquote',
        { class: 'twitter-tweet' },
        ['a', { href: url }],
      ]
    }
    return ['blockquote', mergeAttributes({ class: 'embed-unsupported' })]
  },
  addCommands() {
    return {
      setEmbed:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    }
  },
})

const focusEditor = () => {
  if (!editor.value) return
  editor.value.chain().focus().run()
}

const extractUrl = (text) => {
  if (!text) return null
  const match = text.match(/https?:\/\/[^\s<>"']+/)
  if (!match) return null
  return match[0].replace(/[)\].,!?]+$/, '')
}

const getPastedUrl = (event) => {
  const uriList = event.clipboardData?.getData('text/uri-list')?.trim()
  if (uriList) return uriList.split('\n')[0]

  const html = event.clipboardData?.getData('text/html')
  if (html) {
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html')
      const anchor = doc.querySelector('a[href]')
      if (anchor?.href) return anchor.href
      const media = doc.querySelector('iframe[src], video[src], source[src]')
      if (media?.src) return media.src
    } catch {
      // ignore parsing errors
    }
  }

  const text = event.clipboardData?.getData('text/plain')?.trim()
  return extractUrl(text)
}

const toYoutubeEmbed = (url) => {
  try {
    const u = new URL(url)
    const host = u.hostname.toLowerCase()
    const buildEmbed = (id, isShorts = false) =>
      id ? `https://www.youtube.com/embed/${id}${isShorts ? '?ytshorts=1' : ''}` : null

    if (host.includes('youtu.be')) {
      const id = u.pathname.slice(1)
      return buildEmbed(id)
    }
    if (host.includes('youtube.com')) {
      if (u.pathname.startsWith('/embed/')) {
        return u.toString()
      }
      const id = u.searchParams.get('v')
      if (id) return buildEmbed(id)
      const parts = u.pathname.split('/')
      if (parts[1] === 'shorts' && parts[2]) return buildEmbed(parts[2], true)
    }
    return null
  } catch {
    return null
  }
}

const isVideoUrl = (url) => /\.(mp4|webm|ogg)(\?.*)?$/i.test(url)

const getEmbedInfo = (url) => {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '').toLowerCase()
    const path = u.pathname.replace(/\/$/, '')
    const cleanUrl = `${u.origin}${path}`

    if (host === 'x.com' || host.endsWith('.x.com') || host.endsWith('twitter.com')) {
      const m = path.match(/\/status\/(\d+)/)
      return m ? { provider: 'x', url: cleanUrl } : null
    }

    if (host.endsWith('instagram.com')) {
      const m = path.match(/\/(p|reel|tv)\/([^/]+)/)
      return m ? { provider: 'instagram', url: `https://www.instagram.com/${m[1]}/${m[2]}/` } : null
    }

    if (host.endsWith('tiktok.com')) {
      const m = path.match(/\/video\/(\d+)/)
      return m ? { provider: 'tiktok', url: cleanUrl, videoId: m[1] } : null
    }

    if (host.endsWith('threads.net')) {
      const m = path.match(/\/@[^/]+\/post\/([^/]+)/)
      return m ? { provider: 'threads', url: cleanUrl } : null
    }

    return null
  } catch {
    return null
  }
}

// Tiptap 에디터 설정
const editor = useEditor({
  content: '',
  extensions: [
    StarterKit,
    Image,
    Youtube.configure({
      inline: false,
      width: 640,
      height: 360,
    }),
    Video,
    Embed,
  ],
  editorProps: {
    handlePaste(_, event) {
      const url = getPastedUrl(event)
      if (!url) return false

      const youtube = toYoutubeEmbed(url)
      if (youtube) {
        event.preventDefault()
        editor.value?.chain().focus().setYoutubeVideo({ src: youtube }).run()
        return true
      }

      if (isVideoUrl(url)) {
        event.preventDefault()
        editor.value?.chain().focus().setVideo({ src: url }).run()
        return true
      }

      const embedInfo = getEmbedInfo(url)
      if (embedInfo) {
        event.preventDefault()
        editor.value?.chain().focus().setEmbed(embedInfo).run()
        return true
      }

      return false
    },
    handleDrop() {
      return true
    },
  },
})

// 드래그앤드롭 파일 업로드
const onFileDrop = async (event) => {
  const files = event.dataTransfer?.files
  if (!files || files.length === 0) return

  const images = []
  const videos = []
  const oversizedImages = []
  const oversizedVideos = []

  for (const file of files) {
    if (file.type.startsWith('image/')) {
      if (file.size > MAX_IMAGE_SIZE) oversizedImages.push(file.name)
      else images.push(file)
    } else if (file.type.startsWith('video/')) {
      if (file.size > MAX_VIDEO_SIZE) oversizedVideos.push(file.name)
      else videos.push(file)
    }
  }

  if (oversizedImages.length > 0) {
    alert(`이미지 용량 초과 (5MB 제한): ${oversizedImages.join(', ')}`)
  }
  if (oversizedVideos.length > 0) {
    alert(`영상 용량 초과 (30MB 제한): ${oversizedVideos.join(', ')}`)
  }

  if (images.length > 0) {
    const formData = new FormData()
    for (const img of images) {
      formData.append('images', img)
    }
    try {
      const res = await api.post('/posts/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      for (const img of res.data.images) {
        const uploadedUrl = 'http://localhost:8080' + img.url
        editor.value?.chain().focus('end').insertContent(`<p><img src="${uploadedUrl}"></p>`).run()
      }
    } catch (e) {
      console.error('이미지 업로드 실패', e)
      alert('이미지 업로드에 실패했습니다.')
    }
  }

  for (const video of videos) {
    const formData = new FormData()
    formData.append('videos', video)
    try {
      videoConverting.value = true
      const res = await api.post('/posts/videos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const uploadedUrl = 'http://localhost:8080' + res.data.videos[0].url
      editor.value?.chain().focus().setVideo({ src: uploadedUrl }).run()
    } catch (e) {
      console.error('영상 업로드 실패', e)
      alert('영상 업로드에 실패했습니다.')
    } finally {
      videoConverting.value = false
    }
  }
}

// 드롭존 이벤트
const onDragOver = () => {
  isDragOver.value = true
}

const onDragLeave = () => {
  isDragOver.value = false
}

const onImageDropZone = async (event) => {
  isDragOver.value = false
  showImageDropZone.value = false
  const files = event.dataTransfer?.files
  if (!files || files.length === 0) return

  const allImages = Array.from(files).filter((f) => f.type.startsWith('image/'))
  const oversized = allImages.filter((f) => f.size > MAX_IMAGE_SIZE)
  const images = allImages.filter((f) => f.size <= MAX_IMAGE_SIZE)

  if (oversized.length > 0) {
    alert(`이미지 용량 초과 (5MB 제한): ${oversized.map((f) => f.name).join(', ')}`)
  }
  if (images.length === 0) return

  const formData = new FormData()
  for (const img of images) {
    formData.append('images', img)
  }
  try {
    const res = await api.post('/posts/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    for (const img of res.data.images) {
      const uploadedUrl = 'http://localhost:8080' + img.url
      editor.value?.chain().focus('end').insertContent(`<p><img src="${uploadedUrl}"></p>`).run()
    }
  } catch (e) {
    console.error('이미지 업로드 실패', e)
    alert('이미지 업로드에 실패했습니다.')
  }
}

const onVideoDropZone = async (event) => {
  isDragOver.value = false
  showVideoDropZone.value = false
  const files = event.dataTransfer?.files
  if (!files || files.length === 0) return

  const allVideos = Array.from(files).filter((f) => f.type.startsWith('video/'))
  const oversized = allVideos.filter((f) => f.size > MAX_VIDEO_SIZE)
  const videos = allVideos.filter((f) => f.size <= MAX_VIDEO_SIZE)

  if (oversized.length > 0) {
    alert(`영상 용량 초과 (30MB 제한): ${oversized.map((f) => f.name).join(', ')}`)
  }
  if (videos.length === 0) return

  for (const video of videos) {
    const formData = new FormData()
    formData.append('videos', video)
    try {
      videoConverting.value = true
      const res = await api.post('/posts/videos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const uploadedUrl = 'http://localhost:8080' + res.data.videos[0].url
      editor.value?.chain().focus().setVideo({ src: uploadedUrl }).run()
    } catch (e) {
      console.error('영상 업로드 실패', e)
      alert('영상 업로드에 실패했습니다.')
    } finally {
      videoConverting.value = false
    }
  }
}

// 이미지 삽입
const imageInput = ref(null)
const addImage = () => {
  imageInput.value?.click()
  showImageDropZone.value = false
}

const onImageSelected = async (event) => {
  const files = event.target.files
  if (!files || files.length === 0) return

  const allFiles = Array.from(files)
  const oversized = allFiles.filter((f) => f.size > MAX_IMAGE_SIZE)
  const validFiles = allFiles.filter((f) => f.size <= MAX_IMAGE_SIZE)

  if (oversized.length > 0) {
    alert(`이미지 용량 초과 (5MB 제한): ${oversized.map((f) => f.name).join(', ')}`)
  }
  if (validFiles.length === 0) {
    event.target.value = ''
    return
  }

  const formData = new FormData()
  for (const file of validFiles) {
    formData.append('images', file)
  }

  try {
    const res = await api.post('/posts/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    for (const img of res.data.images) {
      const uploadedUrl = 'http://localhost:8080' + img.url
      editor.value.chain().focus('end').insertContent(`<p><img src="${uploadedUrl}"></p>`).run()
    }
  } catch (e) {
    console.error('이미지 업로드 실패', e)
    alert('이미지 업로드에 실패했습니다.')
  }

  event.target.value = ''
}

// 영상 삽입
const addVideo = () => {
  videoInput.value?.click()
  showVideoDropZone.value = false
}

const onVideoSelected = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  if (file.size > MAX_VIDEO_SIZE) {
    alert(`영상 용량 초과 (30MB 제한): ${file.name}`)
    event.target.value = ''
    return
  }

  const formData = new FormData()
  formData.append('videos', file)

  try {
    videoConverting.value = true
    const res = await api.post('/posts/videos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const uploadedUrl = 'http://localhost:8080' + res.data.videos[0].url
    editor.value.chain().focus().setVideo({ src: uploadedUrl }).run()
  } catch (e) {
    console.error('영상 업로드 실패', e)
    alert('영상 업로드에 실패했습니다.')
  } finally {
    videoConverting.value = false
  }

  event.target.value = ''
}

// 카테고리 목록 조회
const loadCategories = async () => {
  try {
    const res = await api.get(`/boards/${boardId.value}/categories`)
    categories.value = res.data
    if (categories.value.length > 0 && !categoryId.value) {
      categoryId.value = String(categories.value[0].id)
    }
  } catch (e) {
    console.error('[PostView] 카테고리 목록 조회 실패', e)
  }
}

const getBoardName = async () => {
  const res = await api.get(`/boards/${boardId.value}`)
  boardName.value = res.data
}

const loadPostForEdit = async () => {
  if (!editPostId.value) return
  try {
    const { data } = await api.get(`/posts/${editPostId.value}`)
    title.value = data.title
    categoryId.value = String(data.categoryId)
    editor.value?.commands.setContent(data.content)
  } catch (e) {
    console.error('게시글 조회 실패', e)
    error.value = '게시글을 불러올 수 없습니다.'
  }
}

onMounted(() => {
  loadCategories()
  getBoardName()
  if (isEditMode.value) {
    loadPostForEdit()
  }
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

const submit = async () => {
  if (!title.value.trim()) {
    error.value = '제목을 입력하세요.'
    return
  }
  if (editor.value.isEmpty) {
    error.value = '내용을 입력하세요.'
    return
  }
  if (!categoryId.value) {
    error.value = '카테고리를 선택하세요.'
    return
  }

  if (isEditMode.value && !confirm('게시글을 수정하시겠습니까?')) {
    return
  }

  loading.value = true
  error.value = ''

  try {
    const payload = {
      userId: userStore.userId,
      boardId: boardId.value,
      categoryId: Number(categoryId.value),
      title: title.value,
      content: editor.value.getHTML(),
    }

    if (isEditMode.value && editPostId.value) {
      const formData = new FormData()
      formData.append('request', new Blob([JSON.stringify({
        title: title.value,
        categoryId: Number(categoryId.value),
        content: editor.value.getHTML(),
      })], { type: 'application/json' }))
      await api.put(`/posts/${editPostId.value}`, formData, {
        params: { userId: userStore.userId },
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      await router.push({ name: 'PostDetail', params: { postId: editPostId.value } })
    } else {
      await api.post('/posts', payload)
      await router.push({ name: 'BoardPosts', params: { boardId: boardId.value } })
    }
  } catch (e) {
    console.error('[PostView] 게시글 저장 실패', e)
    error.value = isEditMode.value ? '게시글 수정에 실패했습니다.' : '게시글 작성에 실패했습니다.'
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push({ name: 'BoardPosts', params: { boardId: boardId.value } })
}
</script>
