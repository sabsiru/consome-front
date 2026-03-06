import BoardLayout from '@/layouts/BoardLayout.vue'
import BoardPostListView from '@/views/board/BoardPostListView.vue'
import PostWriteView from '@/views/board/PostWriteView.vue'
import PostDetailView from '@/views/board/PostDetailView.vue'
import { requireEmailVerified } from '@/router/guards/authGuards.js'

export default [
  {
    path: '/boards/:boardId',
    component: BoardLayout,
    children: [
      {
        path: '',
        name: 'BoardPosts',
        component: BoardPostListView,
        props: (route) => ({ boardId: Number(route.params.boardId) }),
      },
      {
        path: 'post', // 또는 posts/new
        name: 'PostWrite',
        component: PostWriteView,
        beforeEnter: requireEmailVerified,
        props: (route) => ({ boardId: Number(route.params.boardId) }),
      },
      {
        path: 'posts/:postId',
        name: 'PostDetail',
        component: PostDetailView,
        props: (route) => ({
          boardId: Number(route.params.boardId),
          postId: Number(route.params.postId),
        }),
      },
    ],
  },
]
