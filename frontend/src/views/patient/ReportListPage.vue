/** 诊断报告列表页面 */
<template>
    <div class="report-list-page">
        <!-- 返回主页按钮 -->
        <div class="back-home-bar">
            <el-button text @click="router.push('/patient/home')">
                <el-icon>
                    <ArrowLeft />
                </el-icon>
                返回主页
            </el-button>
        </div>

        <!-- 报告列表 -->
        <div class="reports-list" v-loading="loadingReports">
            <template v-if="reports.length > 0">
                <div v-for="(r, idx) in reports" :key="r.id" class="report-item glass-card"
                    @click="openReportDetail(r)">
                    <div class="report-index">{{ idx + 1 }}</div>
                    <div class="report-info">
                        <div class="report-main">
                            <span class="report-no">{{ r.diagnosis_no }}</span>
                            <el-tag
                                :type="r.status === 'approved' ? 'success' : r.status === 'reviewed' ? 'info' : 'warning'"
                                size="small">
                                {{ statusMap[r.status] || r.status }}
                            </el-tag>
                        </div>
                        <div class="report-meta">
                            <span><el-icon>
                                    <Calendar />
                                </el-icon>{{ r.created_at }}</span>
                            <span><el-icon>
                                    <Cpu />
                                </el-icon>{{ r.model_used || 'CheXNet' }}</span>
                        </div>
                        <div class="report-preview" v-if="r.impression">
                            {{ r.impression.substring(0, 60) }}{{ r.impression.length > 60 ? '...' : '' }}
                        </div>
                    </div>
                    <div class="report-actions">
                        <el-button type="primary" size="small" plain @click.stop="openReportDetail(r)">
                            <el-icon>
                                <View />
                            </el-icon>查看
                        </el-button>
                    </div>
                </div>
            </template>
            <el-empty v-else description="暂无诊断报告" :image-size="120">
                <p class="empty-hint">完成检测后报告将在此处显示</p>
            </el-empty>
        </div>

        <!-- 报告详情弹窗 -->
        <el-dialog v-model="reportDialogVisible" title="诊断报告详情" width="720px" :close-on-click-modal="true"
            class="report-dialog" destroy-on-close>
            <div v-if="currentReport" class="report-detail-content">
                <!-- 基本信息 -->
                <div class="detail-section">
                    <div class="detail-row">
                        <span class="detail-label">诊断编号</span>
                        <span class="detail-value">{{ currentReport.diagnosis?.diagnosis_no || '-' }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">检测时间</span>
                        <span class="detail-value">{{ currentReport.diagnosis?.created_at || '-' }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">使用模型</span>
                        <span class="detail-value">{{ currentReport.report?.model_used || '-' }}</span>
                    </div>
                </div>

                <el-divider />

                <!-- AI发现 -->
                <div class="detail-section" v-if="currentReport.report?.findings">
                    <h4 class="section-title">AI影像发现</h4>
                    <div class="section-text">{{ currentReport.report.findings }}</div>
                </div>

                <!-- 印象/结论 -->
                <div class="detail-section" v-if="currentReport.report?.impression">
                    <h4 class="section-title">诊断印象</h4>
                    <div class="section-text impression-text">{{ currentReport.report.impression }}</div>
                </div>

                <!-- 建议 -->
                <div class="detail-section" v-if="currentReport.report?.recommendations">
                    <h4 class="section-title">医疗建议</h4>
                    <div class="section-text rec-text">{{ currentReport.report.recommendations }}</div>
                </div>

                <!-- 完整报告内容 -->
                <div class="detail-section" v-if="currentReport.report?.ai_generated_content">
                    <h4 class="section-title">完整报告</h4>
                    <div class="section-text full-report" v-html="formatReport(currentReport.report)"></div>
                </div>

                <!-- 疾病概率 -->
                <div class="detail-section"
                    v-if="currentReport.probabilities && currentReport.probabilities.length > 0">
                    <h4 class="section-title">疾病概率分析</h4>
                    <div class="prob-bars">
                        <div v-for="p in currentReport.probabilities.slice(0, 5)" :key="p.disease_code"
                            class="prob-bar-item">
                            <span class="prob-name">{{ p.disease_name_zh }}</span>
                            <el-progress :percentage="Math.round(p.probability * 100)" :stroke-width="10"
                                :color="getProgressColor(p.probability)" :show-text="true"
                                :format="() => `${(p.probability * 100).toFixed(1)}%`" />
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <el-button @click="reportDialogVisible = false">关闭</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
    Document, ArrowLeft, Calendar, Cpu, View
} from '@element-plus/icons-vue'
import { getPatientReportsApi, getPatientReportDetailApi } from '@/api/patient-portal'

const router = useRouter()

const emit = defineEmits(['back'])

// ========== 报告模块 ==========
const loadingReports = ref(false)
const reports = ref<any[]>([])
const reportDialogVisible = ref(false)
const currentReport = ref<any>(null)

const statusMap: Record<string, string> = {
    draft: '草稿', reviewed: '已审核', approved: '已批准', rejected: '已拒绝',
}

onMounted(() => {
    loadReports()
})

async function loadReports() {
    loadingReports.value = true
    try {
        const res: any = await getPatientReportsApi()
        reports.value = res.data || []
    } catch (e) {
        console.error('加载报告失败', e)
    } finally {
        loadingReports.value = false
    }
}

async function openReportDetail(r: any) {
    try {
        const res: any = await getPatientReportDetailApi(r.id)
        currentReport.value = res.data
        reportDialogVisible.value = true
    } catch (e) {
        ElMessage.error('加载报告详情失败')
    }
}

function formatReport(report: any): string {
    const content = report.final_content || report.doctor_edited_content || report.ai_generated_content || ''
    return content.replace(/\n/g, '<br>').replace(/#{1,3}\s(.+)/g, '<strong>$1</strong>')
}

function getProgressColor(prob: number): string {
    if (prob >= 0.85) return 'var(--medical-danger)'
    if (prob >= 0.6) return 'var(--medical-warning)'
    if (prob >= 0.3) return 'var(--medical-accent)'
    return 'var(--text-muted)'
}
</script>

<style scoped>
.report-list-page {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden !important;
}

/* ==================== 报告模块 - 终端列表风格 ==================== */
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

/* ===== 报告列表页面 - 自然布局，允许滚动 ===== */
.report-list-page {
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

.toolbar-right {
    display: flex;
    align-items: center;
    gap: 12px;
}

.report-count {
    font-size: 14px;
    color: var(--text-secondary);
    font-weight: 600;
    padding: 6px 12px;
    background: var(--bg-primary);
    border-radius: var(--radius-md);
    border: 1px solid var(--card-border);
}

.reports-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 1;
    min-height: 0;
}

.report-item {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 24px !important;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(59, 130, 246, 0.15);
    border-radius: 16px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    backdrop-filter: blur(10px);
}

.report-item:hover {
    border-color: rgba(59, 130, 246, 0.4);
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(37, 99, 235, 0.05));
    transform: translateX(4px) translateY(-2px);
    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
}

.report-index {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    background: linear-gradient(135deg, #3B82F6, #2563EB);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 800;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    border: 2px solid rgba(255, 255, 255, 0.3);
}

.report-info {
    flex: 1;
    min-width: 0;
}

.report-main {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
}

.report-no {
    font-size: 18px;
    font-weight: 700;
    color: #1F2937;
    font-family: 'Courier New', monospace;
    letter-spacing: 0.5px;
}

.report-meta {
    display: flex;
    gap: 20px;
    font-size: 13px;
    color: #6B7280;
}

.report-meta span {
    display: flex;
    align-items: center;
    gap: 4px;
}

.report-meta .el-icon {
    color: #3B82F6;
}

.report-preview {
    font-size: 13px;
    color: #6B7280;
    line-height: 1.6;
    margin-top: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 10px 14px;
    background: linear-gradient(135deg, #EFF6FF, #DBEAFE);
    border-radius: 10px;
    border-left: 3px solid #3B82F6;
}

.report-actions {
    display: flex;
    gap: 10px;
    flex-shrink: 0;
}

.empty-hint {
    font-size: 14px;
    color: var(--text-muted);
    margin-top: 12px;
}

/* ==================== 报告弹窗 - 终端详情窗口，固定布局 ===== */
.report-detail-content {
    max-height: 55vh;
    overflow-y: auto;
    padding-right: 8px;
}

.report-detail-content::-webkit-scrollbar {
    width: 0px;
    display: none;
}

.report-detail-content::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 0;
}

.detail-section {
    margin-bottom: 20px;
    padding: 18px;
    background: linear-gradient(135deg, #F9FAFB, #F3F4F6);
    border-radius: 12px;
    border-left: 4px solid #3B82F6;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.detail-row {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    font-size: 14px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.detail-row:last-child {
    border-bottom: none;
}

.detail-label {
    color: #6B7280;
    font-weight: 600;
}

.detail-value {
    color: #1F2937;
    font-weight: 700;
    font-family: 'Courier New', monospace;
}

.section-title {
    font-size: 17px;
    font-weight: 800;
    color: #1F2937;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.section-title::before {
    content: '';
    width: 4px;
    height: 20px;
    background: linear-gradient(180deg, #3B82F6, #2563EB);
    border-radius: 2px;
    box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
}

.section-text {
    font-size: 14px;
    color: #4B5563;
    line-height: 1.8;
    white-space: pre-wrap;
    padding: 14px;
    background: #fff;
    border-radius: 10px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
}

.impression-text {
    font-size: 17px;
    font-weight: 700;
    color: #1F2937;
    background: linear-gradient(135deg, #EFF6FF, #DBEAFE);
    border-left: 4px solid #3B82F6;
}

.rec-text {
    color: #059669;
    font-weight: 600;
    background: linear-gradient(135deg, #ECFDF5, #D1FAE5);
    border-left: 4px solid #10B981;
}

.full-report {
    font-size: 14px;
    line-height: 2;
}

.prob-bars {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.prob-bar-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px;
    background: #fff;
    border-radius: 12px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
    transition: all 0.2s ease;
}

.prob-bar-item:hover {
    border-color: rgba(59, 130, 246, 0.3);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.prob-name {
    width: 120px;
    font-size: 14px;
    color: #4B5563;
    flex-shrink: 0;
    font-weight: 600;
}

.prob-bar-item .el-progress {
    flex: 1;
}
</style>
