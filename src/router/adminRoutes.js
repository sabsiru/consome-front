import AdminView from '@/views/admin/AdminView.vue'
import UserManageView from '@/views/admin/UserManageView.vue'
import MainBoardManageView from '@/views/admin/MainBoardManageView.vue'
import SectionManageView from '@/views/admin/SectionManageView.vue'
import ReportManageView from '@/views/admin/ReportManageView.vue'

export default [
  {
    path: '/admin',
    name: 'admin',
    component: AdminView,
    meta: { role: 'ADMIN' },
  },
  {
    path: '/admin/sections',
    name: 'sectionManage',
    component: SectionManageView,
    meta: { role: 'ADMIN' },
  },
  {
    path: '/admin/main-boards',
    name: 'mainBoardManage',
    component: MainBoardManageView,
    meta: { role: 'ADMIN' },
  },
  {
    path: '/admin/users/',
    name: 'userManage',
    component: UserManageView,
    meta: { role: 'ADMIN' },
  },
  {
    path: '/admin/reports',
    name: 'reportManage',
    component: ReportManageView,
    meta: { role: 'ADMIN' },
  }
]
