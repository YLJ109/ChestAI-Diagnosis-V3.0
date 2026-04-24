/** 患者登录页面 - 自助终端专用 */
<template>
  <div class="patient-login-page">
    <!-- 顶部栏 -->
    <div class="terminal-header">
      <div class="header-left">
        <el-icon :size="24" color="#22d3ee">
          <Monitor />
        </el-icon>
        <span class="header-title">患者自助服务终端</span>
      </div>
      <div class="header-right">
        <span class="header-time">{{ currentTime }}</span>
        <el-button text size="small" class="staff-link" @click="goStaffLogin">
          <el-icon>
            <SwitchButton />
          </el-icon>
          切换医护登录
        </el-button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="patient-main">
      <!-- 左侧：品牌信息 -->
      <div class="brand-section">
        <div class="brand-logo-large">
          <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M914.28 950.86H109.72c-20.2 0-36.57 16.37-36.57 36.57S89.52 1024 109.72 1024h804.57c20.2 0 36.57-16.37 36.57-36.57s-16.38-36.57-36.58-36.57zM877.71 0H146.28C65.6 0.24 0.24 65.6 0 146.28v585.14c0.24 80.69 65.6 146.04 146.28 146.28h731.43c80.69-0.24 146.05-65.59 146.29-146.28V146.28C1023.76 65.6 958.4 0.24 877.71 0z m-97.13 643.88l-2.12 3.07a43.515 43.515 0 0 1-18.21 15.21c-2.8 1.5-5.74 2.73-8.78 3.66-1.82 0.54-3.68 0.98-5.56 1.32-31.84 5.23-64.51 0.16-93.25-14.48a129.312 129.312 0 0 1-74.02-73.88c-0.57-2.27-1.31-4.49-2.19-6.65-1.19-2.88-2.24-5.8-3.15-8.78a51.962 51.962 0 0 1 4.9-41.18c8.08-15.27 12.2-32.32 12-49.59a89.324 89.324 0 0 0-23.4-64.59 57.278 57.278 0 0 1-17.48-32.91v-1.17a51.326 51.326 0 0 1 4.1-29.99l-39.86-25.82-1.39-0.95-1.24 0.95-39.94 25.75a51.326 51.326 0 0 1 4.1 29.99c-0.17 0.41-0.25 0.86-0.22 1.32A57.06 57.06 0 0 1 457.54 408a89.389 89.389 0 0 0-23.34 64.59c-0.25 17.26 3.83 34.3 11.85 49.59a52.15 52.15 0 0 1 4.6 41.26c-0.9 2.97-1.95 5.9-3.14 8.78-0.89 2.14-1.62 4.34-2.19 6.58a129.504 129.504 0 0 1-73.88 73.88 152.238 152.238 0 0 1-93.33 14.55c-1.9-0.33-3.78-0.77-5.64-1.32-3.03-0.95-5.97-2.17-8.78-3.66a43.883 43.883 0 0 1-18.21-15.22 53.96 53.96 0 0 0-2.12-3.07 319.63 319.63 0 0 1 1.61-250.01c42.86-133.12 124.49-226.96 182.57-209.77a56.324 56.324 0 0 1 30.21 23.48 50.978 50.978 0 0 1 5.63 46.08 112.791 112.791 0 0 0-5.7 47.84l22.67-60.85V165.3c0.81-16.88 14.73-30.15 31.64-30.15 16.9 0 30.82 13.27 31.64 30.15v75.34l22.16 60.71h0.51c0.46-3.52 0.65-7.06 0.59-10.61 0.07-12.65-2.03-25.22-6.22-37.15a50.974 50.974 0 0 1 5.63-46.08 56.238 56.238 0 0 1 30.28-23.4c57.86-17.19 139.7 76.65 182.49 209.7a319.369 319.369 0 0 1 1.53 250.01v0.06z"
              fill="#22d3ee" />
          </svg>
        </div>
        <h1 class="brand-title">胸影智诊</h1>
        <p class="brand-subtitle">胸部X光AI智能辅助诊断系统</p>
        <p class="brand-desc">请选择以下方式登录，查看您的诊断报告与健康信息</p>

        <!-- 安全提示 -->
        <div class="security-tips">
          <el-icon :size="14">
            <Lock />
          </el-icon>
          <span>您的隐私数据已加密保护</span>
        </div>
      </div>

      <!-- 右侧：登录方式 -->
      <div class="login-section">
        <div class="method-tabs">
          <div class="m-tab" :class="{ active: activeMethod === 'qrcode' }" @click="activeMethod = 'qrcode'">
            <el-icon>
              <FullScreen />
            </el-icon>
            <span>扫码登录</span>
          </div>
          <div class="m-tab" :class="{ active: activeMethod === 'face' }" @click="activeMethod = 'face'">
            <el-icon>
              <View />
            </el-icon>
            <span>刷脸登录</span>
          </div>
          <div class="m-tab" :class="{ active: activeMethod === 'number' }" @click="activeMethod = 'number'">
            <el-icon>
              <Ticket />
            </el-icon>
            <span>编号登录</span>
          </div>
        </div>

        <!-- ===== 面板切换区（统一容器，绝对定位叠加）===== -->
        <div class="panels-wrapper">
          <!-- 扫码面板 -->
          <div class="panel" :class="{ active: activeMethod === 'qrcode' }">
            <div class="scanner-area">
              <!-- 未开启摄像头时 -->
              <div v-if="!scannerActive" class="scanner-placeholder">
                <div class="scanner-frame">
                  <div class="corner corner-tl"></div>
                  <div class="corner corner-tr"></div>
                  <div class="corner corner-bl"></div>
                  <div class="corner corner-br"></div>
                  <div class="scanner-center">
                    <el-icon :size="56" color="#22d3ee">
                      <Camera />
                    </el-icon>
                    <p>点击下方按钮开启摄像头</p>
                    <p class="scanner-hint-sm">支持患者专属二维码扫码登录</p>
                  </div>
                </div>
                <div class="action-row" style="margin-top: 24px;">
                  <el-button type="primary" size="large" class="action-btn" @click="startScanner"
                    :loading="startingScanner">
                    <el-icon>
                      <VideoCamera />
                    </el-icon>
                    开启摄像头
                  </el-button>
                </div>
              </div>

              <!-- 摄像头开启后 -->
              <div v-else class="scanner-active">
                <div class="qr-reader-wrapper" :class="{ 'scan-success': scanSuccess }">
                  <div id="qr-reader" class="qr-reader"></div>

                  <!-- 扫描线动画 -->
                  <div v-if="!scanSuccess" class="scan-line"></div>

                  <!-- 扫描角标 -->
                  <div v-if="!scanSuccess" class="scan-corners">
                    <div class="corner-scan corner-tl"></div>
                    <div class="corner-scan corner-tr"></div>
                    <div class="corner-scan corner-bl"></div>
                    <div class="corner-scan corner-br"></div>
                  </div>

                  <!-- 成功提示覆盖层 -->
                  <div v-if="scanSuccess" class="success-overlay">
                    <div class="success-content">
                      <el-icon :size="48" color="#10b981">
                        <CircleCheckFilled />
                      </el-icon>
                      <p class="success-text">扫描成功</p>
                      <p class="success-subtext">正在登录...</p>
                    </div>
                  </div>
                </div>

                <div class="scanner-tips" :class="{ 'success-tip': scanSuccess }">
                  <el-icon v-if="!scanSuccess">
                    <InfoFilled />
                  </el-icon>
                  <el-icon v-else :size="20" color="#10b981">
                    <CircleCheckFilled />
                  </el-icon>
                  <span>{{ scanSuccess ? '识别成功！正在登录...' : '请将患者二维码对准摄像头' }}</span>
                </div>

                <div class="action-row" style="margin-top: 16px;">
                  <el-button type="danger" size="large" class="action-btn" @click="stopScanner" :disabled="scanSuccess">
                    关闭摄像头
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <!-- 刷脸面板 -->
          <div class="panel" :class="{ active: activeMethod === 'face' }">
            <div class="face-area">
              <FaceLoginPage @login-success="handleFaceLoginSuccess" />
            </div>
          </div>

          <!-- 编号面板 -->
          <div class="panel" :class="{ active: activeMethod === 'number' }">
            <div class="number-area">
              <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
                <el-form-item label="患者编号 / 就诊卡号" prop="patient_no">
                  <el-input v-model="form.patient_no" placeholder="请输入您的患者编号或就诊卡号" prefix-icon="Ticket" size="large"
                    clearable @keyup.enter="handleNumberLogin" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" size="large" class="action-btn" :loading="loading"
                    @click="handleNumberLogin">
                    <span v-if="!loading">确认登录</span>
                    <span v-else>验证中...</span>
                  </el-button>
                </el-form-item>
              </el-form>
              <p class="number-help">不知道编号？请联系前台工作人员或查看您的就诊卡</p>
              <div class="register-link">
                <span>还没有患者编号？</span>
                <el-button text type="primary" @click="goToRegister">
                  立即注册
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部状态栏 -->
    <div class="terminal-footer">
      <div class="footer-left">
        <el-icon :size="14">
          <InfoFilled />
        </el-icon>
        <span>本终端仅供患者自助查询使用</span>
      </div>
      <div class="footer-right">
        <span>胸影智诊 V3.0 | Powered by CheXNet + LLM</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Monitor, SwitchButton, Lock, FullScreen, View, Ticket,
  Loading, VideoCamera, InfoFilled, Camera, CircleCheckFilled
} from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { Html5Qrcode } from 'html5-qrcode'
import FaceLoginPage from '@/views/patient/FaceLoginPage.vue'

const router = useRouter()
const authStore = useAuthStore()

// ========== 时钟 ==========
const currentTime = ref('')
let clockTimer: ReturnType<typeof setInterval> | null = null

function updateClock() {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  })
}

onMounted(() => {
  updateClock()
  clockTimer = setInterval(updateClock, 1000)
})

// ========== 扫码登录 ==========
const scannerActive = ref(false)
const startingScanner = ref(false)
const scanSuccess = ref(false) // 扫描成功状态
const scannerStopped = ref(false) // 扫描器是否已停止
let html5QrCode: Html5Qrcode | null = null

async function startScanner() {
  startingScanner.value = true
  try {
    // 先切换到激活状态，让 Vue 渲染 qr-reader 元素
    scannerActive.value = true
    scannerStopped.value = false // 重置停止状态
    scanSuccess.value = false // 重置成功状态

    // 等待 DOM 更新完成
    await new Promise(resolve => setTimeout(resolve, 100))

    html5QrCode = new Html5Qrcode('qr-reader')

    await html5QrCode.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      },
      onScanSuccess,
      onScanFailure
    )

    ElMessage.success('摄像头已开启，请对准二维码')
  } catch (error: any) {
    ElMessage.error('无法访问摄像头：' + (error.message || '请检查权限设置'))
    console.error('Scanner error:', error)
    // 如果失败，回退状态
    scannerActive.value = false
    scannerStopped.value = false
  } finally {
    startingScanner.value = false
  }
}

async function onScanSuccess(decodedText: string) {
  // 防止重复触发：如果已经显示成功状态，直接返回
  if (scanSuccess.value) {
    return
  }

  // 验证二维码格式
  if (!decodedText.startsWith('PATIENT_QRCODE:')) {
    ElMessage.warning('无效的二维码，请扫描患者专属二维码')
    return
  }

  // 提取患者编号
  const patientNo = decodedText.replace('PATIENT_QRCODE:', '')

  // 立即标记成功状态，防止重复触发
  scanSuccess.value = true

  // 暂停扫描器（保持摄像头画面，但停止识别）
  if (html5QrCode && !scannerStopped.value) {
    try {
      await html5QrCode.pause()
    } catch (error) {
      console.error('Pause scanner error:', error)
    }
  }

  // 停顿 1 秒，让用户看到二维码画面和成功提示
  await new Promise(resolve => setTimeout(resolve, 1000))

  // 1 秒后停止摄像头
  if (html5QrCode && !scannerStopped.value) {
    try {
      await html5QrCode.stop()
      scannerStopped.value = true
    } catch (error) {
      console.error('Stop scanner error:', error)
    }
  }

  // 执行登录
  loading.value = true
  try {
    await authStore.patientLogin(patientNo, 'qrcode')
    ElMessage.success('扫码登录成功')
    router.push('/patient')
  } catch { /* handled */ } finally {
    loading.value = false
    scanSuccess.value = false
  }
}

function onScanFailure(error: any) {
  // 静默处理
}

async function stopScanner() {
  if (html5QrCode && scannerActive.value && !scannerStopped.value) {
    try {
      await html5QrCode.stop()
      html5QrCode.clear()
      scannerStopped.value = true
    } catch (error) {
      console.error('Stop scanner error:', error)
    }
    scannerActive.value = false
    scanSuccess.value = false // 重置成功状态
  }
}

function handleQrLogin() {
  if (scannerActive.value) {
    ElMessage.info('摄像头已在运行中')
  } else {
    startScanner()
  }
}

// 组件卸载时清理
onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
  stopScanner()
})

// ========== 登录方式切换 ==========
type Method = 'qrcode' | 'face' | 'number'
const activeMethod = ref<Method>('number')

// ========== 编号登录 ==========
const formRef = ref<FormInstance>()
const loading = ref(false)
const form = reactive({ patient_no: '' })

const rules = {
  patient_no: [
    { required: true, message: '请输入患者编号', trigger: 'blur' },
    { min: 3, max: 50, message: '编号长度为3-50个字符', trigger: 'blur' },
  ],
}

async function handleNumberLogin() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await authStore.patientLogin(form.patient_no, 'patient_no')
    ElMessage.success('登录成功')
    router.push('/patient')
  } catch {
    // error handled by interceptor
  } finally {
    loading.value = false
  }
}

// ========== 刷脸登录 ==========
const faceChecking = ref(false)

function handleFaceLoginSuccess(patientData: any) {
  ElMessage.success(`欢迎，${patientData.name}！`)
  router.push('/patient')
}

// ========== 跳转医护登录 ==========
function goStaffLogin() {
  router.push('/login')
}

function goToRegister() {
  router.push('/patient-register')
}
</script>

<style scoped>
.patient-login-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  position: relative;
  overflow: hidden;
}

/* ===== 顶部终端栏 ===== */
.terminal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 28px;
  background: rgba(15, 23, 42, 0.85);
  border-bottom: 1px solid var(--glass-border);
  backdrop-filter: blur(12px);
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 1px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-time {
  font-size: 14px;
  color: var(--text-secondary);
  font-family: 'Consolas', 'Monaco', monospace;
  letter-spacing: 1px;
}

.staff-link {
  color: var(--text-muted);
  font-size: 13px;
}

.staff-link:hover {
  color: var(--primary);
}

/* ===== 主内容区 ===== */
.patient-main {
  flex: 1;
  display: flex;
  padding: 40px 48px;
  gap: 60px;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  align-items: center;
}

/* 左侧品牌 */
.brand-section {
  flex: 0 0 360px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.brand-logo-large svg {
  width: 120px;
  height: 120px;
}

.brand-title {
  font-size: 36px;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: 4px;
}

.brand-subtitle {
  font-size: 17px;
  color: var(--text-secondary);
}

.brand-desc {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.7;
}

.security-tips {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  background: rgba(34, 211, 238, 0.06);
  border: 1px solid rgba(34, 211, 238, 0.15);
  font-size: 12px;
  color: var(--primary);
  margin-top: 8px;
}

/* 右侧登录区 */
.login-section {
  flex: 1;
  max-width: 900px;
  /* 扩大宽度以容纳刷脸视频 */
}

.method-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  background: var(--glass-bg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--glass-border);
  overflow: hidden;
  margin-bottom: 28px;
}

.m-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all 0.3s ease;
  border-right: 1px solid var(--glass-border);
  user-select: none;
}

.m-tab:last-child {
  border-right: none;
}

.m-tab:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.03);
}

.m-tab.active {
  background: var(--primary);
  color: #fff;
  box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.05);
}

/* ===== 面板切换（绝对定位叠加 + 丝滑过渡）===== */
.panels-wrapper {
  position: relative;
  min-height: 380px;
}

.panel {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  opacity: 0;
  transform: translateX(20px);
  pointer-events: none;
  visibility: hidden;
  transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    visibility 0.35s;
}

.panel.active {
  position: relative;
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
  visibility: visible;
}

.action-btn {
  width: 100%;
  height: 48px;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 2px;
  border-radius: var(--radius-md) !important;
}

/* ===== 扫码框 ===== */
.scanner-area {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.scanner-frame {
  width: 280px;
  height: 280px;
  border: 2px dashed rgba(34, 211, 238, 0.35);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: rgba(34, 211, 238, 0.02);
  overflow: hidden;
}

.corner {
  position: absolute;
  width: 24px;
  height: 24px;
  border-color: var(--primary);
  border-style: solid;
  border-width: 0;
}

.corner-tl {
  top: -1px;
  left: -1px;
  border-top-width: 3px;
  border-left-width: 3px;
  border-top-left-radius: 6px;
}

.corner-tr {
  top: -1px;
  right: -1px;
  border-top-width: 3px;
  border-right-width: 3px;
  border-top-right-radius: 6px;
}

.corner-bl {
  bottom: -1px;
  left: -1px;
  border-bottom-width: 3px;
  border-left-width: 3px;
  border-bottom-left-radius: 6px;
}

.corner-br {
  bottom: -1px;
  right: -1px;
  border-bottom-width: 3px;
  border-right-width: 3px;
  border-bottom-right-radius: 6px;
}

.scan-line {
  position: absolute;
  left: 8%;
  right: 8%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--primary), transparent);
  animation: scanMove 2.2s ease-in-out infinite;
}

@keyframes scanMove {

  0%,
  100% {
    top: 12%;
  }

  50% {
    top: 78%;
  }
}

.scanner-center {
  text-align: center;
  z-index: 1;
}

.scanner-center p {
  margin-top: 12px;
  font-size: 14px;
  color: var(--text-secondary);
}

.scanner-hint-sm {
  font-size: 12px !important;
  color: var(--text-muted) !important;
  margin-top: 4px !important;
}

.scanner-placeholder {
  text-align: center;
}

.scanner-active {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.qr-reader-wrapper {
  position: relative;
  width: 320px;
  height: 320px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 2px solid var(--glass-border);
  transition: all 0.4s ease;
}

.qr-reader-wrapper.scan-success {
  border-color: #10b981;
  box-shadow: 0 0 30px rgba(16, 185, 129, 0.3);
}

.qr-reader {
  width: 100%;
  height: 100%;
}

/* 扫描线动画 */
.scan-line {
  position: absolute;
  left: 10%;
  right: 10%;
  height: 3px;
  background: linear-gradient(90deg,
      transparent 0%,
      rgba(34, 211, 238, 0.8) 20%,
      rgba(34, 211, 238, 1) 50%,
      rgba(34, 211, 238, 0.8) 80%,
      transparent 100%);
  box-shadow: 0 0 10px rgba(34, 211, 238, 0.8),
    0 0 20px rgba(34, 211, 238, 0.4);
  animation: scanLineMove 2s ease-in-out infinite;
  z-index: 10;
  pointer-events: none;
}

@keyframes scanLineMove {

  0%,
  100% {
    top: 10%;
    opacity: 0;
  }

  10% {
    opacity: 1;
  }

  90% {
    opacity: 1;
  }

  50% {
    top: 85%;
  }
}

/* 扫描角标 */
.scan-corners {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 10;
}

.corner-scan {
  position: absolute;
  width: 30px;
  height: 30px;
  border-color: rgba(34, 211, 238, 0.8);
  border-style: solid;
  border-width: 0;
  animation: cornerPulse 2s ease-in-out infinite;
}

.corner-scan.corner-tl {
  top: 15px;
  left: 15px;
  border-top-width: 3px;
  border-left-width: 3px;
  border-top-left-radius: 8px;
}

.corner-scan.corner-tr {
  top: 15px;
  right: 15px;
  border-top-width: 3px;
  border-right-width: 3px;
  border-top-right-radius: 8px;
  animation-delay: 0.5s;
}

.corner-scan.corner-bl {
  bottom: 15px;
  left: 15px;
  border-bottom-width: 3px;
  border-left-width: 3px;
  border-bottom-left-radius: 8px;
  animation-delay: 1s;
}

.corner-scan.corner-br {
  bottom: 15px;
  right: 15px;
  border-bottom-width: 3px;
  border-right-width: 3px;
  border-bottom-right-radius: 8px;
  animation-delay: 1.5s;
}

@keyframes cornerPulse {

  0%,
  100% {
    opacity: 0.6;
    transform: scale(1);
  }

  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

/* 成功提示覆盖层 */
.success-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(16, 185, 129, 0.15);
  /* 绿色半透明，更轻盈 */
  backdrop-filter: blur(1px);
  /* 轻微模糊 */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  animation: overlayFadeIn 0.3s ease;
}

@keyframes overlayFadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.success-content {
  text-align: center;
  animation: contentPopIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes contentPopIn {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.success-text {
  margin: 12px 0 4px 0;
  font-size: 20px;
  font-weight: 600;
  color: #10b981;
  letter-spacing: 2px;
}

.success-subtext {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.scanner-tips {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: rgba(34, 211, 238, 0.06);
  border: 1px solid rgba(34, 211, 238, 0.15);
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--primary);
  transition: all 0.3s ease;

  .el-icon {
    flex-shrink: 0;
  }
}

.scanner-tips.success-tip {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.3);
  color: #10b981;
  animation: successPulse 0.6s ease;
}

@keyframes successPulse {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }

  100% {
    transform: scale(1);
  }
}

.action-row {
  display: flex;
  justify-content: center;
}

/* ===== 刷脸框 ===== */
.face-area {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  /* 移除内边距，让 FaceLoginPage 自适应 */
  min-height: auto;
  /* 移除最小高度限制 */
}

.face-frame {
  width: 340px;
  padding: 36px 28px 28px;
  border-radius: var(--radius-xl);
  border: 1.5px solid var(--glass-border);
  background: linear-gradient(180deg, rgba(99, 102, 241, 0.04), transparent);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.face-oval {
  width: 140px;
  height: 170px;
  border-radius: 50% / 45%;
  border: 2px dashed rgba(99, 102, 241, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(99, 102, 241, 0.03);
  transition: all 0.3s;
}

.face-oval.checking {
  border-color: #6366f1;
  border-style: solid;
  background: rgba(99, 102, 241, 0.08);
  box-shadow: 0 0 24px rgba(99, 102, 241, 0.15);
}

.face-hint {
  font-size: 14px;
  color: var(--text-secondary);
}

.face-status-box {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  border-radius: var(--radius-full);
  background: var(--glass-bg);
  font-size: 13px;
  color: var(--text-muted);
  transition: all 0.3s;
}

.face-status-box.checking {
  color: #6366f1;
  background: rgba(99, 102, 241, 0.1);
}

/* ===== 编号输入 ===== */
.number-area {
  padding: 8px 4px;
}

.number-help {
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 12px;
}

.register-link {
  text-align: center;
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-secondary);

  span {
    color: #94a3b8;
  }

  .el-button {
    padding: 4px 12px;
    font-size: 14px;
    font-weight: 600;
  }
}

/* ===== 底部状态栏 ===== */
.terminal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 28px;
  background: rgba(15, 23, 42, 0.7);
  border-top: 1px solid var(--glass-border);
  font-size: 12px;
  color: var(--text-muted);
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.footer-right {
  letter-spacing: 0.5px;
}
</style>
