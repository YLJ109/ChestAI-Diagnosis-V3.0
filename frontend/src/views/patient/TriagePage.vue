/** 患者端智能分诊页面 - 引用医护版 */
<template>
    <div class="patient-triage-wrapper">
        <!-- 返回主页按钮 -->
        <div class="back-home-bar">
            <el-button text @click="router.push('/patient/home')">
                <el-icon>
                    <ArrowLeft />
                </el-icon>
                返回主页
            </el-button>
        </div>

        <TriagePage />
    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import TriagePage from '../triage/TriagePage.vue'

const router = useRouter()
</script>

<style scoped>
/* ===== 智能分诊页面 - 自然布局，允许滚动 ===== */
.patient-triage-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 24px 40px;
    overflow-y: auto !important;
    overflow-x: hidden !important;
}

/* 返回主页按钮栏 */
/* 返回主页按钮 - 轻量化商务风格 */
.back-home-bar {
    margin-bottom: 24px;
    flex-shrink: 0;
}

.back-home-bar .el-button {
    font-size: 14px;
    color: var(--patient-text-secondary);
    padding: 10px 20px;
    border-radius: var(--patient-radius-md);
    transition: all 0.3s ease;
    background: var(--patient-card-bg);
    border: 1px solid var(--patient-card-border);
    box-shadow: var(--patient-card-shadow);
    letter-spacing: 0.3px;
}

.back-home-bar .el-button:hover {
    color: var(--patient-primary);
    background: var(--patient-primary-light);
    border-color: var(--patient-primary);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

:deep(.triage-page) {
    flex: 1;
    min-height: 0;
}
</style>
