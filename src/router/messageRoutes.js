import MessageListView from '@/views/message/MessageListView.vue'
import MessageDetailView from '@/views/message/MessageDetailView.vue'
import MessageComposeView from '@/views/message/MessageComposeView.vue'

export default [
  {
    path: '/messages',
    name: 'MessageList',
    component: MessageListView,
    meta: { requiresAuth: true }
  },
  {
    path: '/messages/compose',
    name: 'MessageCompose',
    component: MessageComposeView,
    meta: { requiresAuth: true }
  },
  {
    path: '/messages/:messageId',
    name: 'MessageDetail',
    component: MessageDetailView,
    meta: { requiresAuth: true }
  }
]
