import UserProfileView from '@/views/user/UserProfileView.vue'

export default [
  {
    path: '/users/:userId',
    name: 'UserProfile',
    component: UserProfileView,
    props: (route) => ({ userId: Number(route.params.userId) }),
  },
]
