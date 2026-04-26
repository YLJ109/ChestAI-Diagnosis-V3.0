/**
* 移动端二维码页面 - 患者专属二维码展示
*/
<template>
    <div class="mobile-qrcode">
        <!-- 加载中状态 -->
        <div v-if="loading" class="loading-container">
            <el-icon class="is-loading" :size="48" color="#0EA5E9">
                <Loading />
            </el-icon>
            <p class="loading-text">加载中...</p>
        </div>

        <!-- 未登录提示 -->
        <div v-else-if="!isLoggedIn" class="empty-state">
            <el-icon :size="64" color="#9CA3AF">
                <Lock />
            </el-icon>
            <p class="empty-text">请先登录后查看二维码</p>
            <el-button type="primary" @click="goToLogin">立即登录</el-button>
        </div>

        <!-- 无患者信息 -->
        <div v-else-if="!patientInfo.patientNo" class="empty-state">
            <el-icon :size="64" color="#F59E0B">
                <Warning />
            </el-icon>
            <p class="empty-text">未找到患者信息</p>
            <el-button type="primary" @click="loadPatientInfo">重新加载</el-button>
        </div>

        <!-- 二维码卡片 -->
        <div v-else class="qrcode-card glass-card">
            <div class="qrcode-header">
                <h2 class="title">我的专属二维码</h2>
                <p class="subtitle">出示给医护人员扫码</p>
            </div>

            <div class="qrcode-container">
                <div class="qrcode-wrapper" ref="qrcodeRef">
                    <!-- 这里将渲染二维码 -->
                    <canvas id="patient-qrcode"></canvas>
                </div>

                <div class="qrcode-info">
                    <div class="info-item">
                        <span class="label">患者姓名</span>
                        <span class="value">{{ patientInfo.name }}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">患者编号</span>
                        <span class="value">{{ patientInfo.patientNo }}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">性别</span>
                        <span class="value">{{ patientInfo.gender === 'male' ? '男' : '女' }}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">年龄</span>
                        <span class="value">{{ patientInfo.age }}岁</span>
                    </div>
                </div>
            </div>

            <div class="qrcode-actions">
                <el-button type="primary" size="large" block @click="refreshQRCode">
                    <el-icon>
                        <Refresh />
                    </el-icon>
                    刷新二维码
                </el-button>
                <el-button size="large" block @click="downloadQRCode">
                    <el-icon>
                        <Download />
                    </el-icon>
                    保存二维码
                </el-button>
            </div>
        </div>

        <!-- 使用说明 -->
        <div class="usage-tips">
            <h3 class="tips-title">
                <el-icon>
                    <InfoFilled />
                </el-icon>
                使用说明
            </h3>
            <ul class="tips-list">
                <li>1. 就诊时出示此二维码给医护人员</li>
                <li>2. 医护人员扫码后可快速查看您的信息</li>
                <li>3. 二维码每24小时自动刷新一次</li>
                <li>4. 请妥善保管,勿泄露给他人</li>
            </ul>
        </div>

        <!-- 安全提示 -->
        <div class="security-notice">
            <el-icon :size="20" color="#F59E0B">
                <Warning />
            </el-icon>
            <span>为保护隐私,建议定期刷新二维码</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Refresh, Download, InfoFilled, Warning, Loading, Lock } from '@element-plus/icons-vue'
import QRCode from 'qrcode'
import { ElMessage } from 'element-plus'

const router = useRouter()

// 登录状态
const isLoggedIn = ref(false)

// 患者信息
const patientInfo = ref({
    name: '',
    patientNo: '',
    gender: 'male',
    age: 0,
})

const qrcodeRef = ref<HTMLElement>()
const loading = ref(false)

// 加载患者信息
async function loadPatientInfo() {
    loading.value = true
    try {
        // 检查登录状态
        const token = localStorage.getItem('token')
        if (!token) {
            isLoggedIn.value = false
            return
        }
        isLoggedIn.value = true

        // 从localStorage获取用户信息
        const userStr = localStorage.getItem('user')
        if (userStr) {
            const user = JSON.parse(userStr)
            console.log('加载用户信息:', user)

            patientInfo.value = {
                name: user.name || user.real_name || '未知',
                patientNo: user.patient_no || user.patientNo || '',
                gender: user.gender || 'male',
                age: user.age || 0,
            }

            console.log('患者信息:', patientInfo.value)

            // 如果没有患者编号,尝试从API获取
            if (!patientInfo.value.patientNo) {
                await fetchPatientInfoFromAPI()
            }
        } else {
            // localStorage中没有用户信息,从API获取
            await fetchPatientInfoFromAPI()
        }
    } catch (error) {
        console.error('加载患者信息失败:', error)
        ElMessage.error('加载患者信息失败')
    } finally {
        loading.value = false
    }
}

// 从API获取患者信息
async function fetchPatientInfoFromAPI() {
    try {
        // TODO: 调用后端API获取患者详细信息
        // const res = await getPatientInfoApi()
        // if (res.data) {
        //     patientInfo.value = {
        //         name: res.data.name,
        //         patientNo: res.data.patient_no,
        //         gender: res.data.gender,
        //         age: res.data.age,
        //     }
        // }
        console.warn('需要从API获取患者信息(暂未实现)')
    } catch (error) {
        console.error('从API获取患者信息失败:', error)
    }
}

// 生成二维码
async function generateQRCode() {
    try {
        // 等待DOM更新
        await new Promise(resolve => setTimeout(resolve, 100))

        const canvas = document.getElementById('patient-qrcode') as HTMLCanvasElement
        if (!canvas) {
            console.error('找不到canvas元素')
            return
        }

        const qrData = JSON.stringify({
            patient_no: patientInfo.value.patientNo,
            name: patientInfo.value.name,
            timestamp: Date.now(),
        })

        console.log('生成二维码数据:', qrData)

        await QRCode.toCanvas(canvas, qrData, {
            width: 240,
            margin: 2,
            color: {
                dark: '#1F2937',
                light: '#FFFFFF',
            },
        })

        console.log('二维码生成成功')
    } catch (error) {
        console.error('生成二维码失败:', error)
        ElMessage.error('生成二维码失败')
    }
}

// 刷新二维码
function refreshQRCode() {
    generateQRCode()
    ElMessage.success('二维码已刷新')

    // Haptic Feedback
    if ('vibrate' in navigator) {
        navigator.vibrate(20)
    }
}

// 下载二维码
function downloadQRCode() {
    const canvas = document.getElementById('patient-qrcode') as HTMLCanvasElement
    const url = canvas.toDataURL('image/png')

    const link = document.createElement('a')
    link.download = `患者二维码_${patientInfo.value.patientNo}.png`
    link.href = url
    link.click()

    ElMessage.success('二维码已保存')
}

// 跳转到登录页
function goToLogin() {
    router.push('/patient-login/mobile')
}

onMounted(async () => {
    console.log('MobileQRCodePage mounted')

    // 加载患者信息
    await loadPatientInfo()

    // 生成二维码(确保有患者编号且已登录)
    if (isLoggedIn.value && patientInfo.value.patientNo) {
        await generateQRCode()
    }
})
</script>

<style scoped lang="scss">
.mobile-qrcode {
    padding: 16px;
    min-height: 100%;
    height: 100%; // 确保填满父容器
    background: #f5f7fa;
}

/* ===== 加载状态 ===== */
.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    gap: 16px;
}

.loading-text {
    font-size: 14px;
    color: #6B7280;
    margin: 0;
}

/* ===== 空状态 ===== */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    gap: 16px;
    padding: 40px 20px;
    text-align: center;
}

.empty-text {
    font-size: 16px;
    color: #6B7280;
    margin: 0;
}

/* ===== 二维码卡片 ===== */
.qrcode-card {
    background: white;
    border-radius: 20px;
    padding: 24px 20px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    margin-bottom: 16px;
}

.qrcode-header {
    text-align: center;
    margin-bottom: 24px;
}

.title {
    font-size: 20px;
    font-weight: 700;
    color: #1F2937;
    margin: 0 0 8px 0;
}

.subtitle {
    font-size: 14px;
    color: #6B7280;
    margin: 0;
}

.qrcode-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    margin-bottom: 24px;
}

.qrcode-wrapper {
    width: 240px;
    height: 240px;
    padding: 16px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
}

#patient-qrcode {
    width: 100%;
    height: 100%;
}

.qrcode-info {
    width: 100%;
    background: #F9FAFB;
    border-radius: 12px;
    padding: 16px;
}

.info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid #E5E7EB;

    &:last-child {
        border-bottom: none;
    }
}

.label {
    font-size: 14px;
    color: #6B7280;
}

.value {
    font-size: 15px;
    font-weight: 600;
    color: #1F2937;
}

.qrcode-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

/* ===== 使用说明 ===== */
.usage-tips {
    background: white;
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.tips-title {
    font-size: 16px;
    font-weight: 600;
    color: #1F2937;
    margin: 0 0 12px 0;
    display: flex;
    align-items: center;
    gap: 8px;

    .el-icon {
        color: #0EA5E9;
    }
}

.tips-list {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
        font-size: 14px;
        color: #4B5563;
        line-height: 1.8;
        padding: 4px 0;
    }
}

/* ===== 安全提示 ===== */
.security-notice {
    background: linear-gradient(135deg, #FEF3C7, #FDE68A);
    border-left: 4px solid #F59E0B;
    border-radius: 12px;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 10px;

    span {
        font-size: 13px;
        color: #92400E;
        font-weight: 500;
    }
}

/* ===== 玻璃态效果 ===== */
.glass-card {
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
}
</style>
