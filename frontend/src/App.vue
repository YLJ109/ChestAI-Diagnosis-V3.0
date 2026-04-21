<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

// 统一的主题管理系统
function applyTheme(theme: 'light' | 'dark') {
  const html = document.documentElement
  // 移除所有可能存在的主题类名
  html.removeAttribute('class')

  // 设置新的主题
  html.setAttribute('data-theme', theme)

  // 存储到本地
  localStorage.setItem('medical-theme', theme)
}

onMounted(() => {
  // 只在首次加载时应用保存的主题
  const stored = localStorage.getItem('medical-theme') as 'light' | 'dark' | null
  if (stored) {
    applyTheme(stored)
  } else {
    // 默认浅色主题
    applyTheme('light')
  }
})
</script>
