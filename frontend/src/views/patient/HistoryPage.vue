/** 就诊历史页面 */
<template>
    <div class="history-page">
        <!-- 未登录提示 -->
        <div v-if="!isLoggedIn" class="auth-required-overlay">
            <el-empty description="查看就诊历史需要登录" :image-size="160">
                <template #image>
                    <el-icon :size="80" color="#3B82F6">
                        <Lock />
                    </el-icon>
                </template>
                <p class="auth-message">此功能需要登录后才能使用</p>
                <div class="auth-actions">
                    <el-button type="primary" size="large" @click="router.push('/patient-login')">
                        <el-icon>
                            <User />
                        </el-icon>
                        立即登录
                    </el-button>
                    <el-button size="large" @click="router.push('/patient/home')">
                        <el-icon>
                            <ArrowLeft />
                        </el-icon>
                        返回主页
                    </el-button>
                </div>
            </el-empty>
        </div>

        <!-- 已登录：显示历史记录 -->
        <template v-else>
            <!-- 返回主页按钮 -->
            <div class="back-home-bar">
                <el-button text @click="router.push('/patient/home')">
                    <el-icon>
                        <ArrowLeft />
                    </el-icon>
                    返回主页
                </el-button>
            </div>

            <div class="history-timeline" v-loading="loadingHistory">
                <template v-if="diagnoses.length > 0">
                    <div v-for="(d, idx) in diagnoses" :key="d.id" class="timeline-item glass-card">
                        <div class="timeline-dot" :class="{ latest: idx === 0 }">
                            <div class="dot-inner"></div>
                        </div>
                        <div class="timeline-content">
                            <div class="timeline-header">
                                <span class="timeline-date">{{ d.created_at }}</span>
                                <span class="timeline-no">{{ d.diagnosis_no }}</span>
                                <el-tag :type="statusTagType(d.report_status)" size="small">
                                    {{ statusLabelMap[d.report_status] || d.report_status }}
                                </el-tag>
                            </div>
                            <div class="timeline-body">
                                <div class="timeline-results" v-if="d.top_diseases && d.top_diseases.length > 0">
                                    <div v-for="td in d.top_diseases.slice(0, 3)" :key="td.disease_code"
                                        class="result-chip" :class="getProbClass(td.probability)">
                                        {{ td.disease_name_zh }} {{ (td.probability * 100).toFixed(1) }}%
                                    </div>
                                </div>
                                <div class="timeline-actions">
                                    <el-button type="primary" link size="small" @click="viewDiagnosisDetail(d)">
                                        <el-icon>
                                            <View />
                                        </el-icon>详情
                                    </el-button>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
                <el-empty v-else description="暂无就诊记录" :image-size="120" />
            </div>

            <!-- 诊断详情对话框 -->
            <el-dialog v-model="detailVisible" title="诊断详情" width="750px" :close-on-click-modal="false"
                class="patient-detail-dialog" top="5vh">
                <div v-if="currentDiagnosis" class="detail-content">
                    <!-- 头部卡片 -->
                    <div class="detail-header-card">
                        <div class="header-main">
                            <div class="header-icon">
                                <el-icon :size="32">
                                    <Document />
                                </el-icon>
                            </div>
                            <div class="header-info">
                                <h3 class="diagnosis-no">{{ currentDiagnosis.diagnosis_no }}</h3>
                                <div class="diagnosis-meta">
                                    <span class="meta-item">
                                        <el-icon>
                                            <Clock />
                                        </el-icon>
                                        {{ currentDiagnosis.created_at }}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <el-tag :type="statusTagType(currentDiagnosis.report_status)" size="large" effect="light">
                            {{ statusLabelMap[currentDiagnosis.report_status] }}
                        </el-tag>
                    </div>

                    <!-- 诊断结果 -->
                    <div class="detail-section"
                        v-if="currentDiagnosis.top_diseases && currentDiagnosis.top_diseases.length > 0">
                        <div class="section-header">
                            <div class="section-icon">
                                <el-icon>
                                    <CircleCheck />
                                </el-icon>
                            </div>
                            <h4 class="section-title">诊断结果</h4>
                        </div>
                        <div class="disease-list">
                            <div v-for="(td, idx) in currentDiagnosis.top_diseases" :key="td.disease_code"
                                class="disease-card">
                                <div class="disease-left">
                                    <div class="disease-rank" :class="getRankClass(Number(idx))">
                                        {{ Number(idx) + 1 }}
                                    </div>
                                    <div class="disease-info">
                                        <div class="disease-name">{{ td.disease_name_zh }}</div>
                                        <div class="disease-code">{{ td.disease_code }}</div>
                                    </div>
                                </div>
                                <div class="disease-right">
                                    <div class="prob-container">
                                        <div class="prob-bar-bg">
                                            <div class="prob-bar-fill" :class="getProbClass(td.probability)"
                                                :style="{ width: (td.probability * 100) + '%' }"></div>
                                        </div>
                                        <span class="prob-value" :class="getProbClass(td.probability)">
                                            {{ (td.probability * 100).toFixed(1) }}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 影像资料 -->
                    <div class="detail-section" v-if="currentDiagnosis.image_path || currentDiagnosis.heatmap_path">
                        <div class="section-header">
                            <div class="section-icon">
                                <el-icon>
                                    <Picture />
                                </el-icon>
                            </div>
                            <h4 class="section-title">影像资料</h4>
                        </div>
                        <div class="image-gallery">
                            <!-- 原始X光片 -->
                            <div v-if="currentDiagnosis.image_path" class="image-card">
                                <div class="image-label">
                                    <el-icon>
                                        <Camera />
                                    </el-icon>
                                    <span>原始X光片</span>
                                </div>
                                <div class="image-wrapper">
                                    <el-image :src="getImageUrl(currentDiagnosis.image_path)" fit="contain"
                                        class="diagnosis-image"
                                        :preview-src-list="[getImageUrl(currentDiagnosis.image_path)]">
                                        <template #error>
                                            <div class="image-error">
                                                <el-icon :size="40">
                                                    <Picture />
                                                </el-icon>
                                                <span>图片加载失败</span>
                                            </div>
                                        </template>
                                    </el-image>
                                </div>
                            </div>

                            <!-- 热力图 -->
                            <div v-if="currentDiagnosis.heatmap_path" class="image-card">
                                <div class="image-label">
                                    <el-icon>
                                        <Sunny />
                                    </el-icon>
                                    <span>AI热力图</span>
                                </div>
                                <div class="image-wrapper">
                                    <el-image :src="getImageUrl(currentDiagnosis.heatmap_path)" fit="contain"
                                        class="diagnosis-image"
                                        :preview-src-list="[getImageUrl(currentDiagnosis.heatmap_path)]">
                                        <template #error>
                                            <div class="image-error">
                                                <el-icon :size="40">
                                                    <Picture />
                                                </el-icon>
                                                <span>图片加载失败</span>
                                            </div>
                                        </template>
                                    </el-image>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 报告内容 -->
                    <div class="detail-section" v-if="reportContent">
                        <div class="section-header">
                            <div class="section-icon">
                                <el-icon>
                                    <Reading />
                                </el-icon>
                            </div>
                            <h4 class="section-title">AI诊断报告</h4>
                        </div>
                        <div class="report-content-card">
                            <div class="report-text">{{ reportContent }}</div>
                        </div>
                    </div>

                    <!-- 底部说明 -->
                    <div class="detail-footer">
                        <el-icon class="footer-icon">
                            <InfoFilled />
                        </el-icon>
                        <span>本报告由AI辅助诊断系统生成，仅供临床医生参考，最终诊断以医师意见为准</span>
                    </div>
                </div>

                <template #footer>
                    <div class="dialog-footer">
                        <el-button @click="detailVisible = false" size="large">关闭</el-button>
                    </div>
                </template>
            </el-dialog>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
    Clock, ArrowLeft, View, Lock, User,
    CircleCheck, Document, InfoFilled, Reading,
    Picture, Camera, Sunny
} from '@element-plus/icons-vue'
import { getPatientDiagnosesApi, getPatientReportDetailApi } from '@/api/patient-portal'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// 是否已登录
const isLoggedIn = !!authStore.token

const emit = defineEmits(['back'])

// ========== 历史模块 ==========
const loadingHistory = ref(false)
const diagnoses = ref<any[]>([])

// 详情对话框
const detailVisible = ref(false)
const currentDiagnosis = ref<any>(null)
const reportContent = ref('')

const statusLabelMap: Record<string, string> = {
    pending_review: '待审核', reviewed: '已审核', approved: '已批准', rejected: '已拒绝',
}

onMounted(() => {
    // 检查登录状态
    if (!isLoggedIn) {
        ElMessageBox.confirm(
            '查看就诊历史需要登录后才能使用，是否立即登录？',
            '需要登录',
            {
                confirmButtonText: '去登录',
                cancelButtonText: '返回主页',
                type: 'warning',
            }
        ).then(() => {
            router.push('/patient-login')
        }).catch(() => {
            router.push('/patient/home')
        })
        return
    }

    loadDiagnoses()
})

async function loadDiagnoses() {
    loadingHistory.value = true
    try {
        const res: any = await getPatientDiagnosesApi({ per_page: 50 })
        diagnoses.value = res.data?.items || []
    } catch (e) {
        console.error('加载历史失败', e)
    } finally {
        loadingHistory.value = false
    }
}

function statusTagType(s: string): 'success' | 'warning' | 'danger' | 'info' {
    const map: Record<string, any> = { pending_review: 'warning', reviewed: 'info', approved: 'success', rejected: 'danger' }
    return map[s] || 'info'
}

async function viewDiagnosisDetail(d: any) {
    currentDiagnosis.value = d
    detailVisible.value = true
    reportContent.value = ''

    // 调试日志：打印图片路径
    console.log('[HistoryPage] 诊断数据:', d)
    console.log('[HistoryPage] 图片路径:', d.image_path)
    console.log('[HistoryPage] 热力图路径:', d.heatmap_path)

    // 检查是否有报告ID
    if (!d.report_id) {
        reportContent.value = '该诊断暂无报告'
        return
    }

    // 加载报告内容(注意:传递的是 report_id 而不是 diagnosis_id)
    try {
        const res: any = await getPatientReportDetailApi(d.report_id)
        if (res.code === 200 && res.data) {
            // 优先使用 AI 生成的完整报告
            reportContent.value = res.data.report?.ai_generated_content ||
                res.data.report?.impression ||
                '暂无报告内容'
        }
    } catch (e: any) {
        console.error('加载报告失败', e)
        if (e.response?.status === 403) {
            reportContent.value = '权限不足,无法查看报告详情'
        } else {
            reportContent.value = '加载报告失败'
        }
    }
}



function getProbClass(prob: number): string {
    if (prob >= 0.85) return 'prob-high'
    if (prob >= 0.6) return 'prob-mid'
    return 'prob-low'
}

function getRankClass(rank: number): string {
    return `rank-${rank}`
}

// 获取图片完整URL
function getImageUrl(path: string): string {
    if (!path) return ''
    // 如果已经是完整URL则直接返回
    if (path.startsWith('http')) return path
    // 数据库存储的是相对路径（如 images/xxx.png），需要添加 /static/ 前缀
    // Vite代理会将 /static/* 转发到后端的 /static/* 路由
    if (path.startsWith('static/')) return '/' + path
    return '/static/' + path
}
</script>

<style scoped>
/* ===== 未登录提示覆盖层 ===== */
.auth-required-overlay {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(180deg, #F0F7FF 0%, #E8F4FD 100%);
}

.auth-message {
    font-size: 16px;
    color: #6B7280;
    margin: 16px 0 24px 0;
}

.auth-actions {
    display: flex;
    gap: 16px;
    justify-content: center;
}

.auth-actions .el-button {
    min-width: 140px;
}

.history-page {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden !important;
}

/* ==================== 历史模块 - 终端时间线风格 ==================== */
.module-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px !important;
    margin-bottom: 24px;
    flex-shrink: 0;
    background: var(--card-bg);
    border-radius: var(--radius-lg);
    border: 2px solid var(--card-border);
    box-shadow: var(--card-shadow);
}

.toolbar-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.toolbar-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 800;
    color: var(--text-primary);
    margin: 0;
}

/* ===== 就诊历史页面 - 自然布局，允许滚动 ===== */
.history-page {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 24px 40px;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    background: linear-gradient(180deg, #F0F7FF 0%, #E8F4FD 100%);
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

.history-timeline {
    display: flex;
    flex-direction: column;
    gap: 16px;
    position: relative;
    padding-left: 32px;
    flex: 1;
    min-height: 0;
}

/* 时间线轴线 */
.history-timeline::before {
    content: '';
    position: absolute;
    left: 11px;
    top: 0;
    bottom: 0;
    width: 3px;
    background: linear-gradient(180deg,
            #3B82F6 0%,
            #2563EB 50%,
            rgba(59, 130, 246, 0.2) 100%);
    border-radius: 2px;
}

.timeline-item {
    display: flex;
    gap: 20px;
    padding: 24px !important;
    position: relative;
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    transition: all 0.2s ease;
}

.timeline-item:hover {
    border-color: #3B82F6;
    background: #F8FAFC;
    transform: translateX(4px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.timeline-dot {
    position: absolute;
    left: -32px;
    top: 28px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #fff;
    border: 3px solid rgba(59, 130, 246, 0.3);
    z-index: 2;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s;
}

.timeline-dot.latest {
    background: linear-gradient(135deg, #3B82F6, #2563EB);
    border-color: #3B82F6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2), 0 4px 12px rgba(59, 130, 246, 0.4);
    animation: pulse 2s infinite;
}

@keyframes pulse {

    0%,
    100% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.05);
    }
}

.timeline-content {
    flex: 1;
}

.timeline-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    flex-wrap: wrap;
}

.timeline-date {
    font-size: 14px;
    color: #94A3B8;
    font-weight: 600;
    font-family: 'Courier New', monospace;
}

.timeline-no {
    font-size: 14px;
    font-weight: 700;
    color: #334155;
    font-family: 'Courier New', monospace;
    padding: 4px 10px;
    background: #F8FAFC;
    border-radius: 8px;
    border: 1px solid #E2E8F0;
}

.timeline-body {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
}

.timeline-results {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.result-chip {
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 700;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.9);
    color: #FFFFFF !important;
    transition: all 0.2s ease;
    letter-spacing: 0.5px;
}

.result-chip:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* 概率等级样式 - 使用明亮的纯色确保文字清晰可读 */
.result-chip.prob-high {
    background: #EF4444;
}

.result-chip.prob-mid {
    background: #F59E0B;
}

.result-chip.prob-low {
    background: #10B981;
}

.timeline-actions {
    display: flex;
    gap: 6px;
}

.timeline-actions :deep(.el-button) {
    color: #FFFFFF !important;
    padding: 10px;
}

/* ===== 详情对话框样式 - 现代医疗风格 ===== */
.patient-detail-dialog :deep(.el-dialog__header) {
    padding: 24px 32px;
    border-bottom: 1px solid rgba(59, 130, 246, 0.1);
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.03), rgba(37, 99, 235, 0.05));
}

.patient-detail-dialog :deep(.el-dialog__title) {
    font-size: 20px;
    font-weight: 700;
    color: #1F2937;
    letter-spacing: 0.5px;
}

.patient-detail-dialog :deep(.el-dialog__body) {
    padding: 0;
    max-height: 70vh;
    overflow-y: auto;
}

.detail-content {
    padding: 32px;
}

/* 头部卡片 */
.detail-header-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px;
    background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
    border-radius: 16px;
    border: 2px solid rgba(59, 130, 246, 0.15);
    margin-bottom: 28px;
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.08);
}

.header-main {
    display: flex;
    align-items: center;
    gap: 16px;
}

.header-icon {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    background: linear-gradient(135deg, #3B82F6, #2563EB);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.header-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.diagnosis-no {
    font-size: 22px;
    font-weight: 800;
    color: #1E40AF;
    margin: 0;
    font-family: 'Courier New', monospace;
    letter-spacing: 0.5px;
}

.diagnosis-meta {
    display: flex;
    align-items: center;
    gap: 6px;
}

.meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: #6B7280;
    font-weight: 500;
}

/* 区块样式 */
.detail-section {
    margin-bottom: 28px;
}

.section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
}

.section-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.15));
    display: flex;
    align-items: center;
    justify-content: center;
    color: #3B82F6;
}

.section-title {
    font-size: 17px;
    font-weight: 700;
    color: #1F2937;
    margin: 0;
    letter-spacing: 0.3px;
}

/* 疾病列表卡片 */
.disease-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.disease-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 20px;
    background: linear-gradient(135deg, #FFFFFF, #FAFBFC);
    border: 1.5px solid rgba(59, 130, 246, 0.12);
    border-radius: 12px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.disease-card:hover {
    transform: translateY(-2px);
    border-color: rgba(59, 130, 246, 0.3);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.12);
}

.disease-left {
    display: flex;
    align-items: center;
    gap: 14px;
    flex: 1;
}

.disease-rank {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 16px;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.disease-rank.rank-0 {
    background: linear-gradient(135deg, #EF4444, #DC2626);
    color: white;
}

.disease-rank.rank-1 {
    background: linear-gradient(135deg, #F59E0B, #D97706);
    color: white;
}

.disease-rank.rank-2 {
    background: linear-gradient(135deg, #10B981, #059669);
    color: white;
}

.disease-rank:not(.rank-0):not(.rank-1):not(.rank-2) {
    background: linear-gradient(135deg, #3B82F6, #2563EB);
    color: white;
}

.disease-info {
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.disease-name {
    font-size: 15px;
    font-weight: 700;
    color: #1F2937;
    letter-spacing: 0.2px;
}

.disease-code {
    font-size: 12px;
    color: #9CA3AF;
    font-family: 'Courier New', monospace;
    font-weight: 500;
}

.disease-right {
    min-width: 140px;
}

.prob-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.prob-bar-bg {
    height: 10px;
    background: #E5E7EB;
    border-radius: 5px;
    overflow: hidden;
    position: relative;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.08);
}

.prob-bar-fill {
    height: 100%;
    border-radius: 5px;
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
}

.prob-bar-fill::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 100%);
    animation: shimmer 2s infinite;
}

@keyframes shimmer {
    0% {
        transform: translateX(-100%);
    }

    100% {
        transform: translateX(100%);
    }
}

.prob-bar-fill.prob-high {
    background: linear-gradient(90deg, #EF4444, #F97316);
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}

.prob-bar-fill.prob-mid {
    background: linear-gradient(90deg, #F59E0B, #EAB308);
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
}

.prob-bar-fill.prob-low {
    background: linear-gradient(90deg, #10B981, #06B6D4);
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.prob-value {
    font-size: 16px;
    font-weight: 800;
    text-align: right;
    letter-spacing: 0.3px;
}

.prob-value.prob-high {
    color: #EF4444;
}

.prob-value.prob-mid {
    color: #F59E0B;
}

.prob-value.prob-low {
    color: #10B981;
}

/* 影像资料画廊 */
.image-gallery {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
}

.image-card {
    background: linear-gradient(135deg, #FFFFFF, #F9FAFB);
    border: 1.5px solid rgba(59, 130, 246, 0.12);
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.image-card:hover {
    transform: translateY(-4px);
    border-color: rgba(59, 130, 246, 0.3);
    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
}

.image-label {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 18px;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(37, 99, 235, 0.08));
    border-bottom: 1px solid rgba(59, 130, 246, 0.1);
    font-size: 14px;
    font-weight: 700;
    color: #1E40AF;
    letter-spacing: 0.3px;
}

.image-label .el-icon {
    color: #3B82F6;
    font-size: 18px;
}

.image-wrapper {
    padding: 16px;
    background: #000;
    min-height: 280px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.diagnosis-image {
    width: 100%;
    height: auto;
    max-height: 400px;
    object-fit: contain;
    border-radius: 8px;
    cursor: zoom-in;
}

.image-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: #9CA3AF;
    font-size: 14px;
}

.image-error .el-icon {
    color: #D1D5DB;
}

/* 报告内容卡片 */
.report-content-card {
    padding: 24px;
    background: linear-gradient(135deg, #F9FAFB, #F3F4F6);
    border: 1.5px solid rgba(59, 130, 246, 0.1);
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.report-text {
    font-size: 14px;
    line-height: 1.9;
    color: #374151;
    white-space: pre-wrap;
    word-break: break-word;
    letter-spacing: 0.2px;
}

/* 底部说明 */
.detail-footer {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 20px 24px;
    margin-top: 28px;
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(245, 158, 11, 0.05));
    border: 1.5px solid rgba(239, 68, 68, 0.15);
    border-radius: 12px;
    color: #92400E;
    font-size: 13px;
    font-weight: 500;
    line-height: 1.6;
}

.footer-icon {
    color: #F59E0B;
    font-size: 18px;
    flex-shrink: 0;
}

/* 对话框底部 */
.dialog-footer {
    display: flex;
    justify-content: center;
    padding: 0 32px 24px;
}

.dialog-footer .el-button {
    min-width: 120px;
    font-weight: 600;
    letter-spacing: 0.3px;
}
</style>
