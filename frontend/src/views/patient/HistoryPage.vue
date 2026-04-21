/** 就诊历史页面 */
<template>
    <div class="history-page">
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
                                <div v-for="td in d.top_diseases.slice(0, 3)" :key="td.disease_code" class="result-chip"
                                    :class="getProbClass(td.probability)">
                                    {{ td.disease_name_zh }} {{ (td.probability * 100).toFixed(1) }}%
                                </div>
                            </div>
                            <div class="timeline-actions">
                                <el-button type="primary" link size="small" @click="viewDiagnosisDetail(d)">
                                    <el-icon>
                                        <View />
                                    </el-icon>详情
                                </el-button>
                                <el-button type="success" link size="small" v-if="d.has_report"
                                    @click="printFromHistory(d)">
                                    <el-icon>
                                        <Printer />
                                    </el-icon>打印报告
                                </el-button>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
            <el-empty v-else description="暂无就诊记录" :image-size="120" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
    Clock, ArrowLeft, View, Printer
} from '@element-plus/icons-vue'
import { getPatientDiagnosesApi, getPatientReportDetailApi } from '@/api/patient-portal'

const router = useRouter()

const emit = defineEmits(['back'])

// ========== 历史模块 ==========
const loadingHistory = ref(false)
const diagnoses = ref<any[]>([])

const statusLabelMap: Record<string, string> = {
    pending_review: '待审核', reviewed: '已审核', approved: '已批准', rejected: '已拒绝',
}

onMounted(() => {
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

function viewDiagnosisDetail(d: any) {
    // TODO: 实现查看详情功能
    ElMessage.info('查看详情功能开发中')
}

function printFromHistory(d: any) {
    // TODO: 实现打印功能
    ElMessage.info('打印功能开发中')
}

function getProbClass(prob: number): string {
    if (prob >= 0.85) return 'prob-high'
    if (prob >= 0.6) return 'prob-mid'
    return 'prob-low'
}
</script>

<style scoped>
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
            var(--medical-primary) 0%,
            var(--medical-accent) 50%,
            var(--card-border) 100%);
    border-radius: 2px;
}

.timeline-item {
    display: flex;
    gap: 20px;
    padding: 20px !important;
    position: relative;
    background: var(--card-bg);
    border: 2px solid var(--card-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--card-shadow);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.timeline-item:hover {
    border-color: var(--medical-primary);
    transform: translateX(4px);
    box-shadow: var(--card-hover-shadow);
}

.timeline-dot {
    position: absolute;
    left: -32px;
    top: 28px;
    width: 24px;
    height: 24px;
    border-radius: var(--radius-full);
    background: var(--card-bg);
    border: 3px solid var(--card-border);
    z-index: 2;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s;
}

.timeline-dot.latest {
    background: linear-gradient(135deg, var(--medical-primary), var(--medical-accent));
    border-color: var(--medical-primary);
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.2), 0 4px 12px rgba(37, 99, 235, 0.4);
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
    color: var(--text-secondary);
    font-weight: 600;
    font-family: 'Courier New', monospace;
}

.timeline-no {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-primary);
    font-family: 'Courier New', monospace;
    padding: 4px 10px;
    background: var(--bg-primary);
    border-radius: var(--radius-sm);
    border: 1px solid var(--card-border);
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
    border-radius: var(--radius-full);
    font-size: 12px;
    font-weight: 700;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    border: 2px solid rgba(255, 255, 255, 0.3);
    color: #fff;
}

/* 概率等级样式 - 支持深浅主题 */
.result-chip.prob-high {
    background: linear-gradient(90deg, var(--medical-danger), #f97316);
}

.result-chip.prob-mid {
    background: linear-gradient(90deg, var(--medical-warning), #eab308);
}

.result-chip.prob-low {
    background: linear-gradient(90deg, var(--medical-success), var(--medical-accent));
}

.timeline-actions {
    display: flex;
    gap: 6px;
}
</style>
