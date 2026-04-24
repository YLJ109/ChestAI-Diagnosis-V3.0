/** 通用诊断报告打印页面 - 所有模块共用 */
<template>
    <div class="print-report-page">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
            <el-icon class="is-loading" :size="40">
                <Loading />
            </el-icon>
            <p>正在准备打印内容...</p>
        </div>

        <!-- 打印预览区域（隐藏，仅用于生成打印内容） -->
        <div ref="printContentRef" class="print-content" v-show="false">
            <div class="page">
                <!-- 页眉 -->
                <div class="hd">
                    <h1>胸部X光AI辅助诊断报告</h1>
                    <div class="sub">AI-assisted Chest X-ray Diagnosis Report</div>
                </div>

                <!-- 主体内容 -->
                <div class="main">
                    <!-- 左侧：影像区域 -->
                    <div class="col-img">
                        <!-- 原始X光片 -->
                        <div class="ib">
                            <div class="il">原始胸部X光片</div>
                            <div class="iw">
                                <img v-if="reportData.imageUrl" :src="reportData.imageUrl" alt="原始X光片" />
                                <span v-else style="color:#94a3b8">暂无影像</span>
                            </div>
                        </div>

                        <!-- 热力图 -->
                        <div v-if="reportData.heatmapUrl" class="ib">
                            <div class="il">Grad-CAM 热力图</div>
                            <div class="iw">
                                <img :src="reportData.heatmapUrl" alt="热力图" />
                            </div>
                        </div>
                    </div>

                    <!-- 右侧：诊断信息 -->
                    <div class="col-res">
                        <!-- 患者信息 -->
                        <div class="pat-info">
                            <div class="pat-header">
                                <span class="pat-name">{{ reportData.patientName }}</span>
                                <span class="pat-ga">{{ reportData.patientGender }} | {{ reportData.patientAge }}</span>
                            </div>
                            <div class="pat-grid">
                                <div class="pi-row">
                                    <span class="pi-lb">患者编号</span>
                                    <span class="pi-vl">{{ reportData.patientNo }}</span>
                                </div>
                                <div class="pi-row">
                                    <span class="pi-lb">记录编号</span>
                                    <span class="pi-vl">{{ reportData.diagnosisNo }}</span>
                                </div>
                                <div class="pi-row">
                                    <span class="pi-lb">报告日期</span>
                                    <span class="pi-vl">{{ reportData.reportDate }}</span>
                                </div>
                                <div class="pi-row">
                                    <span class="pi-lb">诊断时间</span>
                                    <span class="pi-vl">{{ reportData.diagnoseTime }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- 诊断结果 -->
                        <div class="rb" :style="{ borderColor: resultColor, backgroundColor: resultBg }">
                            <div class="ri" :style="{ color: resultColor }">{{ resultIcon }}</div>
                            <div class="rt">
                                <div class="rl" :style="{ color: resultColor }">{{ reportData.resultText }}</div>
                                <div class="rc">置信度 {{ reportData.confidence }}%</div>
                            </div>
                        </div>

                        <!-- 疾病概率 -->
                        <div class="pg">
                            <div v-for="(prob, idx) in reportData.probabilities" :key="idx" class="pr">
                                <span class="pl">{{ prob.disease_name_zh }}</span>
                                <div class="pw">
                                    <div class="pf" :style="{
                                        backgroundColor: getProbColor(prob.disease_code),
                                        width: (prob.probability * 100).toFixed(1) + '%'
                                    }"></div>
                                </div>
                                <span class="pv">{{ (prob.probability * 100).toFixed(1) }}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- AI诊断报告文本 -->
                <div v-if="reportData.reportText" class="rtx">
                    {{ reportData.reportText }}
                </div>

                <!-- 页脚 -->
                <div class="ft">
                    <span>本报告由AI辅助诊断系统生成，仅供临床医生参考</span>
                    <span>打印时间: {{ printTime }}</span>
                </div>
            </div>
        </div>

        <!-- 打印按钮（仅在非打印模式下显示） -->
        <div v-if="!isPrinting" class="print-actions">
            <el-button type="primary" size="large" @click="handlePrint" :loading="printing">
                <el-icon>
                    <Printer />
                </el-icon>
                打印报告
            </el-button>
            <el-button size="large" @click="handleClose">
                <el-icon>
                    <Close />
                </el-icon>
                关闭
            </el-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading, Printer, Close } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// 状态
const loading = ref(true)
const printing = ref(false)
const isPrinting = ref(false)
const printContentRef = ref<HTMLElement | null>(null)

// 报告数据
const reportData = ref({
    patientName: '-',
    patientGender: '-',
    patientAge: '-',
    patientNo: '-',
    diagnosisNo: '-',
    reportDate: '',
    diagnoseTime: '',
    resultText: '-',
    confidence: '0',
    imageUrl: '',
    heatmapUrl: '',
    reportText: '',
    probabilities: [] as Array<{ disease_code: string; disease_name_zh: string; probability: number }>
})

// 计算属性
const resultColor = computed(() => {
    return reportData.value.resultText === '正常' ? '#06B6D4' : '#D97706'
})

const resultBg = computed(() => {
    return reportData.value.resultText === '正常' ? '#ECFDF5' : '#FFFBEB'
})

const resultIcon = computed(() => {
    return reportData.value.resultText === '正常' ? '✓' : '⚠'
})

const printTime = computed(() => {
    return new Date().toLocaleString('zh-CN')
})

// 获取概率条颜色
function getProbColor(code: string): string {
    const colors: Record<string, string> = {
        'Atelectasis': '#EF4444',
        'Cardiomegaly': '#F59E0B',
        'Effusion': '#3B82F6',
        'Infiltration': '#8B5CF6',
        'Mass': '#EC4899',
        'Nodule': '#10B981',
        'Pneumonia': '#F97316',
        'Pneumothorax': '#06B6D4',
        'Consolidation': '#6366F1',
        'Edema': '#14B8A6',
        'Emphysema': '#84CC16',
        'Fibrosis': '#64748B',
        'Pleural_Thickening': '#A855F7',
        'Hernia': '#F43F5E',
        'No Finding': '#22C55E'
    }
    return colors[code] || '#64748B'
}

// 图片转 Base64
async function imageToBase64(url: string): Promise<string> {
    try {
        const response = await fetch(url)
        const blob = await response.blob()
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(blob)
        })
    } catch {
        return ''
    }
}

// 加载报告数据
async function loadReportData() {
    try {
        // 从路由参数或 sessionStorage 获取数据
        const data = route.query.data as string

        if (data) {
            // 从 URL 参数解析
            const parsed = JSON.parse(decodeURIComponent(data))
            reportData.value = { ...reportData.value, ...parsed }
        } else {
            // 尝试从 sessionStorage 读取
            const saved = sessionStorage.getItem('print_report_data')
            if (saved) {
                reportData.value = { ...reportData.value, ...JSON.parse(saved) }
            }
        }

        // 转换图片为 base64（确保打印时能显示）
        if (reportData.value.imageUrl) {
            reportData.value.imageUrl = await imageToBase64(reportData.value.imageUrl)
        }
        if (reportData.value.heatmapUrl) {
            reportData.value.heatmapUrl = await imageToBase64(reportData.value.heatmapUrl)
        }

        loading.value = false
    } catch (err) {
        console.error('加载报告数据失败:', err)
        ElMessage.error('加载报告数据失败')
        loading.value = false
    }
}

// 打印报告
async function handlePrint() {
    if (!printContentRef.value) return

    printing.value = true
    isPrinting.value = true

    try {
        // 等待 DOM 更新
        await new Promise(resolve => setTimeout(resolve, 100))

        const printWindow = window.open('', '_blank')
        if (!printWindow) {
            ElMessage.error('无法打开打印窗口，请检查浏览器设置')
            return
        }

        // 获取打印内容的 HTML
        const content = printContentRef.value.innerHTML

        // 写入打印窗口
        printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>诊断报告-${reportData.value.diagnosisNo}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: A4; margin: 10mm; }
        body {
            font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
            background: #fff;
            color: #1e293b;
            font-size: 11px;
            line-height: 1.5;
        }
        .page {
            padding: 8mm 10mm;
            max-height: 100vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        .hd {
            text-align: center;
            padding-bottom: 10px;
            margin-bottom: 12px;
            border-bottom: 2px solid #0f172a;
            position: relative;
        }
        .hd::after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 50%;
            transform: translateX(-50%);
            width: 50px;
            height: 2.5px;
            background: #22D3EE;
            border-radius: 2px;
        }
        .hd h1 {
            font-size: 24px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: 3px;
        }
        .hd .sub {
            font-size: 11px;
            color: #94a3b8;
            letter-spacing: 1px;
            margin-top: 3px;
        }
        .main {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            flex: 1;
            min-height: 0;
        }
        .col-img {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .ib {
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            overflow: hidden;
            background: #f8fafc;
        }
        .ib .il {
            font-size: 10px;
            font-weight: 600;
            color: #475569;
            padding: 4px 8px;
            background: #f1f5f9;
            border-bottom: 1px solid #e2e8f0;
        }
        .ib .iw {
            height: 150px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 4px;
        }
        .ib img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }
        .col-res {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .pat-info {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px 14px;
        }
        .pat-info .pat-header {
            display: flex;
            align-items: baseline;
            gap: 10px;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e2e8f0;
        }
        .pat-info .pat-name {
            font-size: 17px;
            font-weight: 700;
            color: #0f172a;
        }
        .pat-info .pat-ga {
            font-size: 11px;
            color: #64748b;
        }
        .pat-info .pat-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px 20px;
            font-size: 10px;
        }
        .pat-info .pi-row {
            display: flex;
            justify-content: space-between;
        }
        .pat-info .pi-lb {
            color: #94a3b8;
        }
        .pat-info .pi-vl {
            color: #0f172a;
            font-weight: 600;
        }
        .rb {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 14px;
            border-radius: 6px;
            border: 2px solid;
        }
        .ri {
            font-size: 28px;
            font-weight: 700;
            line-height: 1;
        }
        .rt .rl {
            font-size: 17px;
            font-weight: 700;
        }
        .rt .rc {
            font-size: 10px;
            color: #64748b;
            margin-top: 2px;
        }
        .pg {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .pr {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 10px;
        }
        .pr .pl {
            width: 50px;
            color: #475569;
            font-weight: 500;
            text-align: right;
            flex-shrink: 0;
        }
        .pr .pw {
            flex: 1;
            height: 6px;
            background: #e2e8f0;
            border-radius: 3px;
            overflow: hidden;
        }
        .pr .pf {
            height: 100%;
            border-radius: 3px;
        }
        .pr .pv {
            width: 48px;
            color: #0f172a;
            font-weight: 600;
            text-align: right;
            flex-shrink: 0;
        }
        .rtx {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 10px;
            font-size: 10.5px;
            line-height: 1.7;
            color: #334155;
            white-space: pre-wrap;
            word-break: break-all;
            margin-top: 8px;
        }
        .ft {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 8px;
            margin-top: 8px;
            border-top: 1px solid #e2e8f0;
            font-size: 9px;
            color: #94a3b8;
        }
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .page {
                padding: 0;
                max-height: none;
                overflow: visible;
            }
        }
    </style>
</head>
<body>
    ${content}
</body>
</html>`)

        printWindow.document.close()

        // 延迟打印，确保图片加载完成
        setTimeout(() => {
            printWindow.print()
            printing.value = false

            // 打印后询问是否关闭窗口
            setTimeout(() => {
                if (confirm('打印完成后是否关闭此窗口？')) {
                    printWindow.close()
                    handleClose()
                } else {
                    isPrinting.value = false
                }
            }, 1000)
        }, 500)

    } catch (err) {
        console.error('打印失败:', err)
        ElMessage.error('打印失败，请重试')
        printing.value = false
        isPrinting.value = false
    }
}

// 关闭页面
function handleClose() {
    router.back()
}

// 生命周期
onMounted(() => {
    loadReportData()
})
</script>

<style scoped lang="scss">
.print-report-page {
    width: 100%;
    min-height: 100vh;
    background: var(--patient-bg, #f8fafc);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
}

.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    color: var(--patient-text-secondary, #64748b);

    p {
        font-size: 14px;
    }
}

.print-actions {
    display: flex;
    gap: 16px;
    margin-top: 24px;
}
</style>
