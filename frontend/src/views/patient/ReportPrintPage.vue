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

        <!-- 加载完成后显示提示 -->
        <div v-else class="ready-container">
            <el-result icon="success" title="打印内容已就绪" sub-title="点击下方按钮将打开新窗口进行打印预览">
                <template #extra>
                    <div class="action-buttons">
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
                </template>
            </el-result>
        </div>

        <!-- 隐藏的打印内容模板 -->
        <div ref="printContentRef" style="display: none;">
            <div class="report-page">
                <div class="report-header">
                    <h1>胸部X光AI辅助诊断报告</h1>
                    <div class="subtitle">AI-assisted Chest X-ray Diagnosis Report</div>
                </div>

                <div class="report-body">
                    <div class="images-section">
                        <div class="image-box">
                            <div class="image-label">原始胸部X光片</div>
                            <div class="image-container">
                                <img v-if="reportData.imageUrl" :src="reportData.imageUrl" alt="原始X光片" />
                                <span v-else class="no-image">暂无影像</span>
                            </div>
                        </div>

                        <div v-if="reportData.heatmapUrl" class="image-box">
                            <div class="image-label">Grad-CAM 热力图</div>
                            <div class="image-container">
                                <img :src="reportData.heatmapUrl" alt="热力图" />
                            </div>
                        </div>
                    </div>

                    <div class="info-section">
                        <div class="patient-card">
                            <div class="patient-header">
                                <div class="patient-photo">
                                    <img v-if="reportData.patientPhotoUrl" :src="reportData.patientPhotoUrl"
                                        alt="患者照片" />
                                    <div v-else class="patient-logo">AI</div>
                                </div>
                                <div class="patient-info">
                                    <span class="patient-name">{{ reportData.patientName }}</span>
                                    <span class="patient-details">{{ reportData.patientGender }} | {{
                                        reportData.patientAge
                                    }}</span>
                                </div>
                            </div>
                            <div class="patient-grid">
                                <div class="info-row">
                                    <span class="label">患者编号</span>
                                    <span class="value">{{ reportData.patientNo }}</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">记录编号</span>
                                    <span class="value">{{ reportData.diagnosisNo }}</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">报告日期</span>
                                    <span class="value">{{ reportData.reportDate }}</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">诊断时间</span>
                                    <span class="value">{{ reportData.diagnoseTime }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="result-card" :style="{ borderColor: resultColor, backgroundColor: resultBg }">
                            <div class="result-icon" :style="{ color: resultColor }">{{ resultIcon }}</div>
                            <div class="result-text">
                                <div class="result-title" :style="{ color: resultColor }">{{ reportData.resultText }}
                                </div>
                                <div class="result-confidence">置信度 {{ reportData.confidence }}%</div>
                            </div>
                        </div>

                        <div class="probability-list">
                            <div v-for="(prob, idx) in reportData.probabilities" :key="idx" class="prob-item">
                                <span class="prob-name">{{ prob.disease_name_zh }}</span>
                                <div class="prob-bar">
                                    <div class="prob-fill" :style="{
                                        backgroundColor: getProbColor(prob.disease_code),
                                        width: (prob.probability * 100).toFixed(1) + '%'
                                    }"></div>
                                </div>
                                <span class="prob-value">{{ (prob.probability * 100).toFixed(1) }}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="reportData.reportText" class="report-text">
                    <div class="text-content">{{ reportData.reportText }}</div>
                </div>

                <div class="qr-section" v-if="reportData.patientQrcodeBase64">
                    <img :src="reportData.patientQrcodeBase64" alt="患者二维码" class="qr-image" />
                    <div class="qr-label">扫码验证报告真实性</div>
                </div>

                <div class="report-footer">
                    <span>本报告由AI辅助诊断系统生成,仅供临床医生参考</span>
                    <span>打印时间: {{ printTime }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading, Printer, Close } from '@element-plus/icons-vue'
import { getPrintDataApi } from '@/api/diagnose'
import { getPatientQrcodeApi } from '@/api/auth'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const printing = ref(false)
const printContentRef = ref<HTMLElement | null>(null)

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
    probabilities: [] as Array<{ disease_code: string; disease_name_zh: string; probability: number }>,
    patientPhotoUrl: '',
    patientQrcodeBase64: '',
    patientId: 0
})

const resultColor = computed(() => reportData.value.resultText === '正常' ? '#06B6D4' : '#D97706')
const resultBg = computed(() => reportData.value.resultText === '正常' ? '#ECFDF5' : '#FFFBEB')
const resultIcon = computed(() => reportData.value.resultText === '正常' ? '✓' : '⚠')
const printTime = computed(() => new Date().toLocaleString('zh-CN'))

function getProbColor(code: string): string {
    const colors: Record<string, string> = {
        'Atelectasis': '#EF4444', 'Cardiomegaly': '#F59E0B', 'Effusion': '#3B82F6',
        'Infiltration': '#8B5CF6', 'Mass': '#EC4899', 'Nodule': '#10B981',
        'Pneumonia': '#F97316', 'Pneumothorax': '#06B6D4', 'Consolidation': '#6366F1',
        'Edema': '#14B8A6', 'Emphysema': '#84CC16', 'Fibrosis': '#64748B',
        'Pleural_Thickening': '#A855F7', 'Hernia': '#F43F5E', 'No Finding': '#22C55E'
    }
    return colors[code] || '#64748B'
}

async function imageToBase64(url: string): Promise<string> {
    try {
        console.log('[ReportPrint] 转换图片:', url)
        const response = await fetch(url)
        if (!response.ok) {
            console.warn('[ReportPrint] 图片加载失败:', url, response.status)
            return ''
        }
        const blob = await response.blob()
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(blob)
        })
    } catch (err) {
        console.error('[ReportPrint] 图片转换失败:', url, err)
        return ''
    }
}

async function loadReportData() {
    try {
        const diagnosisId = route.params.id as string
        console.log('[ReportPrint] 页面加载, diagnosisId:', diagnosisId)
        console.log('[ReportPrint] route.params:', route.params)
        console.log('[ReportPrint] route.query:', route.query)

        if (!diagnosisId) {
            ElMessage.error('缺少诊断ID参数')
            loading.value = false
            return
        }

        console.log('[ReportPrint] 开始调用 getPrintDataApi, diagnosisId:', parseInt(diagnosisId))
        const res: any = await getPrintDataApi(parseInt(diagnosisId))
        console.log('[ReportPrint] API 返回结果:', res)

        if (res.code === 200 && res.data) {
            const data = res.data
            console.log('[ReportPrint] 解析数据:', data)

            reportData.value = {
                patientName: data.patient_name || '-',
                patientGender: data.patient_gender === 'male' ? '男' : (data.patient_gender === 'female' ? '女' : '-'),
                patientAge: data.patient_age ? `${data.patient_age}岁` : '-',
                patientNo: data.patient_no || '-',
                diagnosisNo: data.diagnosis_no || '-',
                reportDate: new Date().toISOString().split('T')[0],
                diagnoseTime: data.created_at || '-',
                resultText: getTopDisease(data.probabilities),
                confidence: data.probabilities.length > 0 ? (data.probabilities[0].probability * 100).toFixed(1) : '0',
                imageUrl: data.image_url || '',
                heatmapUrl: data.heatmap_url || '',
                reportText: data.report_text || '',
                probabilities: (data.probabilities || []).slice(0, 5),
                patientPhotoUrl: data.patient_photo_url || '',
                patientQrcodeBase64: '',
                patientId: data.patient_id || 0
            }

            console.log('[ReportPrint] reportData 已设置:', reportData.value)

            // 转换图片为 base64
            if (reportData.value.imageUrl) {
                reportData.value.imageUrl = await imageToBase64(reportData.value.imageUrl)
            }
            if (reportData.value.heatmapUrl) {
                reportData.value.heatmapUrl = await imageToBase64(reportData.value.heatmapUrl)
            }
            if (reportData.value.patientPhotoUrl) {
                reportData.value.patientPhotoUrl = await imageToBase64(reportData.value.patientPhotoUrl)
            }

            loading.value = false

            if (reportData.value.patientId) {
                await fetchPatientQrcode(reportData.value.patientId)
            }
        } else {
            ElMessage.error('获取打印数据失败')
            loading.value = false
        }
    } catch (err) {
        console.error('[ReportPrint] 加载失败:', err)
        ElMessage.error('加载报告数据失败')
        loading.value = false
    }
}

function getTopDisease(probabilities: any[]): string {
    if (!probabilities || probabilities.length === 0) return '-'
    return probabilities[0].disease_name_zh || '-'
}

async function fetchPatientQrcode(patientId: number) {
    try {
        const res: any = await getPatientQrcodeApi(patientId)
        if (res.data?.qrcode_base64) {
            reportData.value.patientQrcodeBase64 = res.data.qrcode_base64
        }
    } catch (err) {
        console.error('获取患者二维码失败:', err)
    }
}

// 打印报告 - 打开新窗口
async function handlePrint() {
    if (!printContentRef.value) return

    printing.value = true

    try {
        await nextTick()
        await new Promise(resolve => setTimeout(resolve, 100))

        const content = printContentRef.value.innerHTML

        const printWindow = window.open('', '_blank')
        if (!printWindow) {
            ElMessage.error('无法打开打印窗口，请检查浏览器设置')
            return
        }

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
        .report-page { padding: 8mm 10mm; }
        .report-header {
            text-align: center;
            padding-bottom: 10px;
            margin-bottom: 12px;
            border-bottom: 2px solid #0f172a;
            position: relative;
        }
        .report-header::after {
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
        .report-header h1 {
            font-size: 24px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: 3px;
        }
        .subtitle {
            font-size: 11px;
            color: #94a3b8;
            letter-spacing: 1px;
            margin-top: 3px;
        }
        .report-body {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 12px;
        }
        .images-section { display: flex; flex-direction: column; gap: 8px; }
        .image-box {
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            overflow: hidden;
            background: #f8fafc;
        }
        .image-label {
            font-size: 10px;
            font-weight: 600;
            color: #475569;
            padding: 4px 8px;
            background: #f1f5f9;
            border-bottom: 1px solid #e2e8f0;
        }
        .image-container {
            height: 150px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 4px;
        }
        .image-container img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .no-image { color: #94a3b8; }
        .info-section { display: flex; flex-direction: column; gap: 8px; }
        .patient-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px 14px;
        }
        .patient-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e2e8f0;
        }
        .patient-photo {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            overflow: hidden;
            border: 2px solid #e2e8f0;
            flex-shrink: 0;
        }
        .patient-photo img { width: 100%; height: 100%; object-fit: cover; }
        .patient-logo {
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #3B82F6, #06B6D4);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 18px;
        }
        .patient-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
        .patient-name { font-size: 17px; font-weight: 700; color: #0f172a; }
        .patient-details { font-size: 12px; color: #64748b; }
        .patient-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
        .info-row { display: flex; justify-content: space-between; font-size: 11px; }
        .label { color: #64748b; }
        .value { color: #1e293b; font-weight: 500; }
        .result-card {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            border-left: 4px solid;
            border-radius: 6px;
        }
        .result-icon { font-size: 28px; font-weight: bold; }
        .result-text { flex: 1; }
        .result-title { font-size: 16px; font-weight: 700; margin-bottom: 2px; }
        .result-confidence { font-size: 12px; color: #64748b; }
        .probability-list { display: flex; flex-direction: column; gap: 6px; }
        .prob-item { display: flex; align-items: center; gap: 8px; }
        .prob-name { font-size: 11px; color: #475569; min-width: 80px; }
        .prob-bar { flex: 1; height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
        .prob-fill { height: 100%; border-radius: 4px; transition: width 0.3s ease; }
        .prob-value { font-size: 11px; color: #1e293b; font-weight: 600; min-width: 40px; text-align: right; }
        .report-text {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 12px;
        }
        .text-content { font-size: 11px; color: #334155; white-space: pre-wrap; line-height: 1.6; }
        .qr-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            margin: 12px 0;
            padding: 12px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
        }
        .qr-image { width: 120px; height: 120px; }
        .qr-label { font-size: 10px; color: #64748b; text-align: center; }
        .report-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            font-size: 10px;
            color: #94a3b8;
        }
    </style>
</head>
<body>
    ${content}
</body>
</html>`)

        printWindow.document.close()

        setTimeout(() => {
            printWindow.print()
        }, 250)

    } catch (err) {
        console.error('[ReportPrint] 打印失败:', err)
        ElMessage.error('打印失败')
    } finally {
        printing.value = false
    }
}

function handleClose() {
    router.back()
}

onMounted(() => {
    loadReportData()
})
</script>

<style scoped>
.print-report-page {
    width: 100%;
    min-height: 100vh;
    background: var(--bg-primary, #f5f7fa);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
}

.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    color: var(--text-secondary, #64748b);
}

.loading-container p {
    font-size: 14px;
}

.ready-container {
    width: 100%;
    max-width: 600px;
}

.action-buttons {
    display: flex;
    gap: 16px;
    justify-content: center;
    margin-top: 24px;
}
</style>
