/** Vue Router 路由配置 */
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  // ===== 公开页面 =====
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/LoginPage.vue'),
    meta: { title: '医护登录', public: true },
  },
  {
    path: '/patient-login',
    name: 'PatientLogin',
    component: () => import('@/views/login/PatientLoginPage.vue'),
    meta: { title: '患者登录', public: true },
  },

  // ===== 患者门户（独立布局，与医护系统完全隔离）=====
  {
    path: '/patient',
    name: 'PatientPortal',
    component: () => import('@/views/patient/PatientPage.vue'),
    meta: { title: '患者门户', role: 'patient' },
  },

  // ===== 医护人员系统（MainLayout）=====
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/DashboardPage.vue'),
        meta: { title: '数据看板', icon: 'DataBoard' },
      },
      {
        path: 'diagnose',
        name: 'Diagnose',
        component: () => import('@/views/diagnose/DiagnosePage.vue'),
        meta: { title: '诊断中心', icon: 'FirstAidKit' },
      },
      {
        path: 'triage',
        name: 'Triage',
        component: () => import('@/views/triage/TriagePage.vue'),
        meta: { title: '智能分诊', icon: 'Triage' },
      },
      {
        path: 'chat',
        name: 'Chat',
        component: () => import('@/views/chat/ChatPage.vue'),
        meta: { title: 'AI咨询', icon: 'ChatDotRound' },
      },
      {
        path: 'history',
        name: 'History',
        component: () => import('@/views/history/HistoryPage.vue'),
        meta: { title: '诊断历史', icon: 'Clock' },
      },
      {
        path: 'approval',
        name: 'Approval',
        component: () => import('@/views/approval/ApprovalPage.vue'),
        meta: { title: '诊断审批', icon: 'Stamp' },
      },
      {
        path: 'batch',
        name: 'BatchDiagnose',
        component: () => import('@/views/batch/BatchPage.vue'),
        meta: { title: '批量诊断', icon: 'Files' },
      },
    ],
  },

  // ===== 管理后台（AdminLayout）=====
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    redirect: '/admin/overview',
    meta: { role: 'admin' },
    children: [
      {
        path: 'overview',
        name: 'AdminOverview',
        component: () => import('@/views/admin/OverviewPage.vue'),
        meta: { title: '系统概览', icon: 'Monitor', role: 'admin' },
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/UsersPage.vue'),
        meta: { title: '用户管理', icon: 'User', role: 'admin' },
      },
      {
        path: 'patients',
        name: 'AdminPatients',
        component: () => import('@/views/admin/PatientsPage.vue'),
        meta: { title: '患者管理', icon: 'UserFilled', role: 'admin' },
      },
      {
        path: 'models',
        name: 'AdminModels',
        component: () => import('@/views/admin/ModelsPage.vue'),
        meta: { title: '权重文件管理', icon: 'Cpu', role: 'admin' },
      },
      {
        path: 'llm',
        name: 'AdminLlm',
        component: () => import('@/views/admin/LlmPage.vue'),
        meta: { title: '大模型API管理', icon: 'Connection', role: 'admin' },
      },
      {
        path: 'audit',
        name: 'AdminAudit',
        component: () => import('@/views/admin/AuditPage.vue'),
        meta: { title: '审计日志', icon: 'Document', role: 'admin' },
      },
      {
        path: 'settings',
        name: 'AdminSettings',
        component: () => import('@/views/admin/SettingsPage.vue'),
        meta: { title: '系统设置', icon: 'Setting', role: 'admin' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫 - 完全隔离医护和患者
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')
  let userRole = ''

  if (userStr) {
    try { userRole = JSON.parse(userStr).role } catch { /* ignore */ }
  }

  // 设置页面标题
  document.title = `${to.meta.title || '胸影智诊V3.0'} - 胸影智诊`

  // ========== 公开页面 ==========
  if (to.meta.public) {
    if (token) {
      // 已登录：根据角色跳转到对应首页，不能停留在登录页
      if (userRole === 'patient') {
        next('/patient')
      } else {
        next('/dashboard')
      }
      return
    }
    next()
    return
  }

  // ========== 未登录 ==========
  if (!token) {
    next('/login')
    return
  }

  // ========== 患者权限隔离 ==========
  if (userRole === 'patient') {
    // 患者只能访问 /patient 页面
    if (to.meta.role === 'patient') {
      next()
    } else {
      // 患者试图访问医护页面 → 强制跳回患者门户
      next('/patient')
    }
    return
  }

  // ========== 医护人员权限 ==========
  // 患者专属页面，医护人员无法访问
  if (to.meta.role === 'patient') {
    next('/dashboard')
    return
  }

  // 管理员页面权限检查
  if (to.meta.role === 'admin' && userRole !== 'admin') {
    next('/dashboard')
    return
  }

  next()
})

export default router
