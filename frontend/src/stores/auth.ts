/** 认证状态管理 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginApi, patientLoginApi, getCurrentUserApi } from '@/api/auth'

function applyTheme(theme: string) {
  const html = document.documentElement

  // 同时设置类名和属性，确保两种选择器都生效
  html.classList.remove('light', 'dark')
  html.classList.add(theme)
  html.setAttribute('data-theme', theme)
}

function detectSystemTheme(): string {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref<any>(null)
  const theme = ref(localStorage.getItem('theme') || detectSystemTheme())

  const isLoggedIn = computed(() => !!token.value)
  const userRole = computed(() => user.value?.role || '')
  const isAdmin = computed(() => userRole.value === 'admin')
  const isDoctor = computed(() => userRole.value === 'doctor')
  const isNurse = computed(() => userRole.value === 'nurse')
  const isPatient = computed(() => userRole.value === 'patient')

  async function login(username: string, password: string) {
    const res: any = await loginApi({ username, password })
    token.value = res.data.token
    user.value = res.data.user
    theme.value = res.data.theme || 'dark'
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    localStorage.setItem('theme', theme.value)
    applyTheme(theme.value)
  }

  async function patientLogin(patientNo: string, loginMethod = 'patient_no') {
    const res: any = await patientLoginApi({ patient_no: patientNo, login_method: loginMethod })
    token.value = res.data.token
    user.value = res.data.user
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
  }

  async function fetchUser() {
    try {
      const res: any = await getCurrentUserApi()
      user.value = res.data
      localStorage.setItem('user', JSON.stringify(res.data))
    } catch {
      logout()
    }
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  function setTheme(newTheme: string) {
    theme.value = newTheme
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }

  // 初始化
  function init() {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try { user.value = JSON.parse(savedUser) } catch { /* ignore */ }
    }
    applyTheme(theme.value)
  }

  init()

  return { token, user, theme, isLoggedIn, userRole, isAdmin, isDoctor, isNurse, isPatient, login, patientLogin, fetchUser, logout, setTheme }
})
