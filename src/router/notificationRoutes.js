import NotificationListView from '@/views/notification/NotificationListView.vue'

export default [
  {
    path: '/notifications',
    name: 'NotificationList',
    component: NotificationListView,
    meta: { requiresAuth: true }
  }
]
