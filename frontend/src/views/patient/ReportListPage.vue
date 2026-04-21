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
                        <el-button type="success" size="small" plain @click.stop="handlePrint(r)">
                            <el-icon>
                                <Printer />
                            </el-icon>打印
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
                <el-button type="primary" @click="handlePrint(currentReport?.report)">
                    <el-icon>
                        <Printer />
                    </el-icon>打印报告
                </el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
    Document, ArrowLeft, Calendar, Cpu, View, Printer
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

function handlePrint(r: any) {
    if (!r) return
    // 使用浏览器打印功能
    const content = `
    <html><head><title>诊断报告 - ${r.diagnosis_no || '报告'}</title>
    <style>
      body{font-family:'Microsoft YaHei',sans-serif;padding:40px;max-width:800px;margin:auto;color:#333}
      h1{text-align:center;color:#1e293b;border-bottom:2px solid #22d3ee;padding-bottom:16px}
      h2{color:#0f172a;margin-top:24px}
      .label{color:#64748b;font-size:13px}
      .value{color:#1e293b}
      .row{display:flex;justify-content:space-between;margin:8px 0}
      .section{margin:20px 0;padding:16px;background:#f8fafc;border-radius:8px}
      pre{white-space:pre-wrap;line-height:1.8}
    </style></head>
    <body>
    <h1>胸影智诊 - AI辅助诊断报告</h1>
    <div class="row"><span class="label">诊断编号:</span><span class="value">${r.diagnosis_no || '-'}</span></div>
    <div class="row"><span class="label">生成时间:</span><span class="value">${r.created_at || '-'}</span></div>
    <div class="row"><span class="label">模型:</span><span class="value">${r.model_used || '-'}</span></div>
    ${r.findings ? `<div class="section"><h2>AI影像发现</h2><pre>${r.findings}</pre></div>` : ''}
    ${r.impression ? `<div class="section"><h2>诊断印象</h2><pre>${r.impression}</pre></div>` : ''}
    ${r.recommendations ? `<div class="section"><h2>医疗建议</h2><pre>${r.recommendations}</pre></div>` : ''}
    ${r.ai_generated_content ? `<div class="section"><h2>完整报告</h2><pre>${r.ai_generated_content}</pre></div>` : ''}
    <hr/><p style="text-align:center;color:#94a3b8;font-size:12px">本报告由AI生成，仅供参考，最终诊断以执业医师审核为准</p>
    </body></html>`
    const win = window.open('', '_blank')
    win!.document.write(content)
    win!.document.close()
    win!.print()
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
    padding: 20px !important;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: var(--card-bg);
    border: 2px solid var(--card-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--card-shadow);
}

.report-item:hover {
    border-color: var(--medical-primary);
    background: linear-gradient(135deg, rgba(37, 99, 235, 0.03), rgba(6, 182, 212, 0.03));
    transform: translateX(4px);
    box-shadow: var(--card-hover-shadow);
}

.report-index {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-md);
    background: linear-gradient(135deg, var(--medical-primary), var(--medical-accent));
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 800;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
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
    font-size: 17px;
    font-weight: 700;
    color: var(--text-primary);
    font-family: 'Courier New', monospace;
}

.report-meta {
    display: flex;
    gap: 20px;
    font-size: 13px;
    color: var(--text-secondary);
}

.report-meta span {
    display: flex;
    align-items: center;
    gap: 4px;
}

.report-preview {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.6;
    margin-top: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 8px 12px;
    background: var(--bg-primary);
    border-radius: var(--radius-sm);
    border-left: 3px solid var(--medical-primary);
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
    padding: 16px;
    background: var(--bg-primary);
    border-radius: var(--radius-md);
    border-left: 4px solid var(--medical-primary);
}

.detail-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    font-size: 14px;
    border-bottom: 1px solid var(--card-border);
}

.detail-row:last-child {
    border-bottom: none;
}

.detail-label {
    color: var(--text-secondary);
    font-weight: 600;
}

.detail-value {
    color: var(--text-primary);
    font-weight: 700;
    font-family: 'Courier New', monospace;
}

.section-title {
    font-size: 17px;
    font-weight: 800;
    color: var(--text-primary);
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.section-title::before {
    content: '';
    width: 4px;
    height: 20px;
    background: linear-gradient(180deg, var(--medical-primary), var(--medical-accent));
    border-radius: 2px;
    box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);
}

.section-text {
    font-size: 14px;
    color: var(--text-secondary);
    line-height: 1.8;
    white-space: pre-wrap;
    padding: 12px;
    background: var(--card-bg);
    border-radius: var(--radius-sm);
    border: 1px solid var(--card-border);
}

.impression-text {
    font-size: 17px;
    font-weight: 700;
    color: var(--text-primary);
    background: linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(6, 182, 212, 0.08));
    border-left: 4px solid var(--medical-primary);
}

.rec-text {
    color: var(--medical-success);
    font-weight: 600;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.04));
    border-left: 4px solid var(--medical-success);
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
    padding: 10px;
    background: var(--card-bg);
    border-radius: var(--radius-md);
    border: 1px solid var(--card-border);
}

.prob-name {
    width: 120px;
    font-size: 14px;
    color: var(--text-secondary);
    flex-shrink: 0;
    font-weight: 600;
}

.prob-bar-item .el-progress {
    flex: 1;
}
</style>
