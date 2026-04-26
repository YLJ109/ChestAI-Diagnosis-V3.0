<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

// 统一的主题管理系统
function applyTheme(theme: 'light' | 'dark') {
  const html = document.documentElement

  // 同时设置类名和属性，确保两种选择器都生效
  html.classList.remove('light', 'dark')
  html.classList.add(theme)
  html.setAttribute('data-theme', theme)

  // 存储到本地（与 auth.ts 保持一致）
  localStorage.setItem('theme', theme)
}

// 监听主题变化事件
window.addEventListener('storage', (e) => {
  if (e.key === 'theme' && e.newValue) {
    applyTheme(e.newValue as 'light' | 'dark')
  }
})

onMounted(() => {
  // 每次挂载时都从 localStorage 读取最新主题
  const stored = localStorage.getItem('theme') as 'light' | 'dark' | null
  if (stored) {
    applyTheme(stored)
  } else {
    // 默认浅色主题
    applyTheme('light')
  }
})
</script>
