/**
* 移动端报告列表页面
* 卡片式布局,支持搜索和查看详情
*/
<template>
    <div class="mobile-report-list">
        <!-- 加载中状态 -->
        <div v-if="loading" class="mobile-loading">
            <el-icon class="is-loading" :size="48" color="#0EA5E9">
                <Loading />
            </el-icon>
            <p class="loading-text">加载报告中...</p>
        </div>

        <!-- 未登录提示 -->
        <div v-else-if="!isLoggedIn" class="mobile-login-guide">
            <div class="guide-icon">
                <el-icon :size="48">
                    <Lock />
                </el-icon>
            </div>
            <h3 class="guide-title">登录后查看诊断报告</h3>
            <p class="guide-desc">登录后可以查看您的AI诊断报告和影像资料</p>
            <el-button type="primary" class="guide-btn" @click="goToLogin">
                立即登录
            </el-button>
        </div>

        <!-- 空状态 -->
        <div v-else-if="reports.length === 0" class="mobile-empty">
            <el-icon :size="64" color="#9CA3AF">
                <Document />
            </el-icon>
            <p class="empty-text">暂无诊断报告</p>
            <el-button type="primary" @click="goToDiagnose">
                去检测
            </el-button>
        </div>

        <!-- 报告列表 -->
        <div v-else class="report-container">
            <!-- 搜索栏 -->
            <div class="search-bar">
                <el-input v-model="keyword" placeholder="搜索报告编号..." clearable size="large" @input="handleSearch">
                    <template #prefix>
                        <el-icon>
                            <Search />
                        </el-icon>
                    </template>
                </el-input>
            </div>

            <!-- 报告卡片列表 -->
            <div class="report-cards">
                <div v-for="(report, index) in filteredReports" :key="report.id" class="report-card"
                    @click="viewReportDetail(report)">
                    <div class="card-header">
                        <span class="report-no">{{ report.diagnosis_no }}</span>
                        <el-tag :type="getStatusType(report.status)" size="small">
                            {{ getStatusText(report.status) }}
                        </el-tag>
                    </div>

                    <div class="card-body">
                        <div class="info-row">
                            <el-icon>
                                <Calendar />
                            </el-icon>
                            <span>{{ formatDate(report.created_at) }}</span>
                        </div>
                        <div class="info-row" v-if="report.impression">
                            <el-icon>
                                <Document />
                            </el-icon>
                            <span class="impression">{{ report.impression.substring(0, 50) }}{{ report.impression.length
                                > 50 ? '...' : '' }}</span>
                        </div>
                    </div>

                    <div class="card-footer">
                        <el-button size="small" type="primary" plain @click.stop="viewImage(report)">
                            <el-icon>
                                <Picture />
                            </el-icon>
                            查看影像
                        </el-button>
                        <!-- ❌ 移除打印按钮 -->
                    </div>
                </div>
            </div>

            <!-- 加载更多 -->
            <div v-if="hasMore" class="load-more" @click="loadMore">
                <el-button text>
                    <el-icon>
                        <ArrowDown />
                    </el-icon>
                    加载更多
                </el-button>
            </div>
        </div>

        <!-- 报告详情弹窗 -->
        <el-dialog v-model="detailDialogVisible" title="报告详情" width="90%" :close-on-click-modal="true"
            class="mobile-report-dialog">
            <div v-if="currentReport" class="report-detail">
                <!-- 患者信息 -->
                <div class="patient-info">
                    <h3>{{ currentReport.diagnosis?.patient_name || '未知患者' }}</h3>
                    <p>编号: {{ currentReport.diagnosis?.patient_no }}</p>
                </div>

                <!-- 影像图片 -->
                <div class="images-section"
                    v-if="currentReport.diagnosis?.image_url || currentReport.diagnosis?.heatmap_url">
                    <div v-if="currentReport.diagnosis?.image_url" class="image-item">
                        <p class="image-label">原始X光片</p>
                        <img :src="currentReport.diagnosis.image_url" alt="X光片" />
                    </div>
                    <div v-if="currentReport.diagnosis?.heatmap_url" class="image-item">
                        <p class="image-label">热力图</p>
                        <img :src="currentReport.diagnosis.heatmap_url" alt="热力图" />
                    </div>
                </div>

                <!-- 诊断信息 -->
                <div class="diagnosis-info">
                    <div class="info-item">
                        <span class="label">诊断编号</span>
                        <span class="value">{{ currentReport.diagnosis?.diagnosis_no }}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">检测时间</span>
                        <span class="value">{{ currentReport.diagnosis?.created_at }}</span>
                    </div>
                    <div class="info-item" v-if="currentReport.report?.findings">
                        <span class="label">AI发现</span>
                        <span class="value">{{ currentReport.report.findings }}</span>
                    </div>
                    <div class="info-item" v-if="currentReport.report?.impression">
                        <span class="label">印象</span>
                        <span class="value">{{ currentReport.report.impression }}</span>
                    </div>
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
    Loading, Lock, Document, Search, Calendar,
    Picture, ArrowDown
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getPatientReportsApi } from '@/api/patient-portal'

const router = useRouter()

// 登录状态
const isLoggedIn = ref(false)
const loading = ref(false)

// 报告列表
const reports = ref<any[]>([])
const keyword = ref('')

// 详情弹窗
const detailDialogVisible = ref(false)
const currentReport = ref<any>(null)

// 分页
const page = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)

// 过滤后的报告列表
const filteredReports = computed(() => {
    if (!keyword.value) return reports.value
    return reports.value.filter(r =>
        r.diagnosis_no?.toLowerCase().includes(keyword.value.toLowerCase())
    )
})

// 跳转到登录页
function goToLogin() {
    router.push('/patient-login/mobile')
}

// 跳转到诊断页面
function goToDiagnose() {
    // TODO: 跳转到诊断页面
    ElMessage.info('诊断功能开发中')
}

// 获取状态类型
function getStatusType(status: string) {
    const types: Record<string, any> = {
        approved: 'success',
        reviewed: 'info',
        pending: 'warning',
    }
    return types[status] || 'info'
}

// 获取状态文本
function getStatusText(status: string) {
    const texts: Record<string, string> = {
        approved: '已审核',
        reviewed: '待审批',
        pending: '处理中',
    }
    return texts[status] || status
}

// 格式化日期
function formatDate(dateStr: string) {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 加载报告列表
async function loadReports() {
    loading.value = true
    try {
        const res: any = await getPatientReportsApi()

        if (res.data) {
            // API返回的是数组还是对象?
            reports.value = Array.isArray(res.data) ? res.data : (res.data.reports || [])
            hasMore.value = false // 当前API不支持分页
        }
    } catch (error: any) {
        console.error('加载报告失败:', error)
        if (error.response?.status === 401) {
            isLoggedIn.value = false
            ElMessage.error('登录已过期,请重新登录')
        } else {
            ElMessage.error('加载报告失败')
        }
    } finally {
        loading.value = false
    }
}

// 加载更多(当前API不支持分页,暂不实现)
function loadMore() {
    ElMessage.info('已加载全部报告')
}

// 搜索(前端过滤)
function handleSearch() {
    // 前端已经通过computed属性filteredReports实现过滤
}

// 查看报告详情
function viewReportDetail(report: any) {
    currentReport.value = report
    detailDialogVisible.value = true
}

// 查看影像
function viewImage(report: any) {
    viewReportDetail(report)
}

// 检查登录状态
function checkLoginStatus() {
    const token = localStorage.getItem('token')
    isLoggedIn.value = !!token
}

onMounted(() => {
    checkLoginStatus()
    if (isLoggedIn.value) {
        loadReports()
    }
})
</script>

<style scoped lang="scss">
@import '@/styles/mobile.scss';

.mobile-report-list {
    min-height: 100%;
    height: 100%; // 确保填满父容器
    background: $mobile-bg;
}

// 搜索栏
.search-bar {
    padding: $spacing-md;
    background: white;
    position: sticky;
    top: 0;
    z-index: 10;
    box-shadow: $shadow-sm;
}

// 报告卡片列表
.report-cards {
    padding: $spacing-md;
}

.report-card {
    @include mobile-card;
    cursor: pointer;
    transition: all 0.2s ease;

    &:active {
        transform: scale(0.98);
        box-shadow: $shadow-md;
    }
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-sm;
}

.report-no {
    font-size: $text-sm;
    font-weight: 600;
    color: $mobile-text;
}

.card-body {
    margin-bottom: $spacing-sm;
}

.info-row {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: $text-sm;
    color: $mobile-text-secondary;
    margin-bottom: $spacing-xs;

    .el-icon {
        flex-shrink: 0;
    }

    .impression {
        @include text-clamp(2);
    }
}

.card-footer {
    display: flex;
    justify-content: flex-end;
    padding-top: $spacing-sm;
    border-top: 1px solid $mobile-border;
}

// 加载更多
.load-more {
    padding: $spacing-md;
    text-align: center;
}

// 报告详情弹窗
:deep(.mobile-report-dialog) {
    .el-dialog__body {
        padding: $spacing-md;
        max-height: 70vh;
        overflow-y: auto;
    }
}

.report-detail {
    .patient-info {
        text-align: center;
        margin-bottom: $spacing-lg;

        h3 {
            font-size: $text-xl;
            color: $mobile-text;
            margin: 0 0 $spacing-xs 0;
        }

        p {
            font-size: $text-sm;
            color: $mobile-text-secondary;
            margin: 0;
        }
    }

    .images-section {
        margin-bottom: $spacing-lg;
    }

    .image-item {
        margin-bottom: $spacing-md;

        .image-label {
            font-size: $text-sm;
            color: $mobile-text-secondary;
            margin-bottom: $spacing-xs;
        }

        img {
            width: 100%;
            border-radius: $radius-md;
            box-shadow: $shadow-sm;
        }
    }

    .diagnosis-info {
        .info-item {
            display: flex;
            justify-content: space-between;
            padding: $spacing-sm 0;
            border-bottom: 1px solid $mobile-border;

            &:last-child {
                border-bottom: none;
            }

            .label {
                font-size: $text-sm;
                color: $mobile-text-secondary;
            }

            .value {
                font-size: $text-sm;
                color: $mobile-text;
                font-weight: 500;
                text-align: right;
                max-width: 60%;
                word-break: break-word;
            }
        }
    }
}
</style>
