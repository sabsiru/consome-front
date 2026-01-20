import BoardLayout from '@/layouts/BoardLayout.vue'
import BoardPostListView from '@/views/board/BoardPostListView.vue'
import PostView from '@/views/board/PostView.vue'
import PostDetail from '@/views/board/PostDetail.vue'

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
        component: PostView,
        props: (route) => ({ boardId: Number(route.params.boardId) }),
      },
      {
        path: 'posts/:postId',
        name: 'PostDetail',
        component: PostDetail,
        props: (route) => ({
          boardId: Number(route.params.boardId),
          postId: Number(route.params.postId),
        }),
      },
    ],
  },
]
