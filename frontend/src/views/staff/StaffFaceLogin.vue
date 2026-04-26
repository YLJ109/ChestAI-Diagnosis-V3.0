/** 医护人员端 - 人脸识别登录组件（适配玻璃拟态登录卡片） */
<template>
    <div class="staff-face-login">
        <!-- 视频预览区 -->
        <div class="video-container" ref="videoWrapperRef">
            <!-- 初始占位符 -->
            <div v-if="status === 'idle'" class="video-placeholder">
                <div class="placeholder-icon-wrapper">
                    <el-icon :size="48">
                        <User />
                    </el-icon>
                </div>
                <p class="placeholder-text">请点击下方按钮启动摄像头</p>
                <p class="placeholder-hint">需要允许浏览器访问摄像头权限</p>
            </div>

            <video ref="videoRef" autoplay playsinline muted
                :style="{ display: status === 'idle' ? 'none' : 'block' }"></video>
            <canvas ref="canvasRef" style="display: none;"></canvas>

            <!-- 人脸框绘制层 -->
            <canvas ref="faceCanvasRef" class="face-canvas"
                :style="{ display: status === 'idle' ? 'none' : 'block' }"></canvas>

            <!-- 扫描框动画 -->
            <div class="scan-frame" v-if="status === 'scanning'">
                <div class="scan-corner corner-tl"></div>
                <div class="scan-corner corner-tr"></div>
                <div class="scan-corner corner-bl"></div>
                <div class="scan-corner corner-br"></div>
            </div>

            <!-- 状态提示层 -->
            <div class="status-overlay"
                v-if="status === 'loading' || status === 'processing' || status === 'success' || status === 'failed'">
                <div v-if="status === 'loading'" class="status-content">
                    <el-icon class="is-loading" :size="40">
                        <Loading />
                    </el-icon>
                    <p>正在初始化摄像头...</p>
                </div>

                <div v-if="status === 'processing'" class="status-content">
                    <el-icon class="is-loading" :size="40">
                        <Loading />
                    </el-icon>
                    <p>正在识别身份...</p>
                </div>

                <div v-if="status === 'success'" class="status-content success">
                    <el-icon :size="56" color="#10B981">
                        <CircleCheck />
                    </el-icon>
                    <p class="success-text">识别成功</p>
                    <p class="staff-name">{{ matchedStaff?.real_name }}</p>
                    <p class="staff-role">{{ getRoleText(matchedStaff?.role) }}</p>
                    <img v-if="capturedFaceImage" :src="capturedFaceImage" class="face-captured" />
                </div>

                <div v-if="status === 'failed'" class="status-content failed">
                    <el-icon :size="56" color="#EF4444">
                        <CircleClose />
                    </el-icon>
                    <p>{{ errorMessage || '识别失败' }}</p>
                    <el-button type="primary" @click="restart" size="large" class="retry-btn">
                        重新识别
                    </el-button>
                </div>
            </div>

            <!-- 扫描中提示 -->
            <div v-if="status === 'scanning'" class="status-overlay scanning">
                <div class="guidance-text">
                    <p v-if="consecutiveFailures === 0">请对准摄像头，保持面部清晰</p>
                    <p v-else-if="consecutiveFailures < 3">未识别到，请调整姿势</p>
                    <p v-else-if="consecutiveFailures < 5">光线可能不足，请靠近光源</p>
                    <p v-else>即将停止识别...</p>
                </div>
                <div class="progress-dots">
                    <span v-for="i in 3" :key="i" :class="{ active: i <= ((Date.now() / 500) % 3) + 1 }"></span>
                </div>
            </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-area">
            <el-button v-if="status === 'idle' || status === 'failed'" type="primary" size="large" class="start-btn"
                @click="startCamera">
                <el-icon>
                    <VideoCamera />
                </el-icon>
                启动摄像头
            </el-button>
            <el-tag v-if="status === 'scanning'" type="success" size="large" effect="dark" class="scanning-tag">
                <el-icon>
                    <VideoCamera />
                </el-icon>
                正在识别中...
            </el-tag>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import {
    Loading, CircleCheck, CircleClose,
    Camera, VideoCamera, User
} from '@element-plus/icons-vue'
import { recognizeStaffFaceApi, extractFaceFeatureApi } from '@/api/face'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const emit = defineEmits(['switch-to-qrcode', 'switch-to-manual', 'login-success'])

const videoRef = ref<HTMLVideoElement>()
const canvasRef = ref<HTMLCanvasElement>()
const faceCanvasRef = ref<HTMLCanvasElement>()
const videoWrapperRef = ref<HTMLDivElement>()
const authStore = useAuthStore()
const router = useRouter()

const status = ref<'idle' | 'loading' | 'scanning' | 'processing' | 'success' | 'failed'>('idle')
const isProcessing = ref(false)
const errorMessage = ref('')
const matchedStaff = ref<any>(null)
const capturedFaceImage = ref<string>('')

// 连续识别计数器
const consecutiveFailures = ref(0)
const consecutiveSuccesses = ref(0)
const isFirstRecognitionDone = ref(false)
const SUCCESS_THRESHOLD = 1
const FAILURE_THRESHOLD = 5

let stream: MediaStream | null = null
let recognitionInterval: number | null = null

function getRoleText(role: string): string {
    const roleMap: Record<string, string> = {
        'admin': '系统管理员',
        'doctor': '医生',
        'nurse': '护士',
        'radiologist': '放射科医师',
        'technician': '技师'
    }
    return roleMap[role] || role
}

async function startCamera() {
    try {
        status.value = 'loading'
        errorMessage.value = ''
        consecutiveFailures.value = 0
        consecutiveSuccesses.value = 0
        isFirstRecognitionDone.value = false

        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280, min: 640 },
                height: { ideal: 720, min: 480 },
                facingMode: 'user',
                frameRate: { ideal: 30, min: 15 }
            }
        })

        if (videoRef.value) {
            videoRef.value.srcObject = stream
            await videoRef.value.play()
        }

        status.value = 'scanning'
        startRecognition()
    } catch (err: any) {
        console.error('[StaffFaceLogin] 摄像头启动失败:', err)
        status.value = 'failed'
        errorMessage.value = err.name === 'NotAllowedError'
            ? '摄像头权限被拒绝，请允许访问'
            : '无法访问摄像头设备'
    }
}

function startRecognition() {
    if (recognitionInterval) clearInterval(recognitionInterval)

    recognitionInterval = window.setInterval(async () => {
        if (isProcessing.value) return
        isProcessing.value = true

        try {
            const feature = await captureAndExtractFeature()
            if (!feature) {
                isProcessing.value = false
                return
            }

            const result = await recognizeStaffFaceApi(feature)

            if (result.code === 200 && result.data) {
                consecutiveFailures.value = 0
                consecutiveSuccesses.value++

                if (consecutiveSuccesses.value >= SUCCESS_THRESHOLD) {
                    matchedStaff.value = result.data
                    if (result.data.face_image) {
                        capturedFaceImage.value = `data:image/jpeg;base64,${result.data.face_image}`
                    }

                    stopCamera()
                    status.value = 'success'
                    isFirstRecognitionDone.value = true
                    ElMessage.success(`识别成功：${result.data.real_name}`)

                    setTimeout(() => {
                        handleLoginSuccess(result.data)
                    }, 1500)
                }
            } else {
                consecutiveSuccesses.value = 0
                consecutiveFailures.value++

                if (consecutiveFailures.value >= FAILURE_THRESHOLD) {
                    stopCamera()
                    status.value = 'failed'
                    errorMessage.value = '多次识别失败，请重试'
                }
            }
        } catch (err) {
            console.error('[StaffFaceLogin] 识别错误:', err)
            consecutiveSuccesses.value = 0
        } finally {
            isProcessing.value = false
        }
    }, 500)
}

async function captureAndExtractFeature(): Promise<number[] | null> {
    if (!videoRef.value || !canvasRef.value) return null

    const video = videoRef.value
    const canvas = canvasRef.value
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)

    const imageData = canvas.toDataURL('image/jpeg', 0.8)
    const base64 = imageData.split(',')[1]

    try {
        const result = await extractFaceFeatureApi(base64)
        if (result.code === 200 && result.data) {
            return result.data.face_descriptor as number[]
        }
    } catch (err) {
        console.error('[StaffFaceLogin] 特征提取失败:', err)
    }
    return null
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop())
        stream = null
    }
    if (recognitionInterval) {
        clearInterval(recognitionInterval)
        recognitionInterval = null
    }
}

function restart() {
    stopCamera()
    startCamera()
}

async function handleLoginSuccess(staffData: any) {
    try {
        await authStore.staffFaceLogin({
            user_id: staffData.user_id,
            username: staffData.username,
            real_name: staffData.real_name,
            role: staffData.role,
            department: staffData.department
        })
        ElMessage.success('登录成功')
        emit('login-success', staffData)
        router.push('/staff/dashboard')
    } catch (err) {
        console.error('[StaffFaceLogin] 登录失败:', err)
        ElMessage.error('登录失败，请重试')
        status.value = 'failed'
        errorMessage.value = '登录失败'
    }
}

onMounted(() => {
    // 组件挂载时的初始化
})

onBeforeUnmount(() => {
    stopCamera()
})
</script>

<style scoped>
.staff-face-login {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
}

/* 视频容器 */
.video-container {
    position: relative;
    width: 100%;
    aspect-ratio: 4 / 3;
    border-radius: 12px;
    overflow: hidden;
    background: var(--bg-secondary, #f8fafc);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    border: solid 1px rgb(66, 75, 91);
}

/* 初始占位符 */
.video-placeholder {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    background: var(--bg-secondary, #f8fafc);
}

.placeholder-icon-wrapper {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--primary, #3B82F6) 0%, #2563EB 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
}

.placeholder-text {
    font-size: 15px;
    font-weight: 500;
    color: var(--text-primary, #1e293b);
    margin: 0;
}

.placeholder-hint {
    font-size: 13px;
    color: var(--text-secondary, #64748b);
    margin: 0;
}

video,
canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 2;
    /* 视频清晰度优化 */
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    transform: translateZ(0);
}

.face-canvas {
    z-index: 3;
}

/* 扫描框 */
.scan-frame {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 240px;
    height: 240px;
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
    z-index: 8;
    /* 提高层级，在视频上方但在文字提示下方 */
    pointer-events: none;
    /* 移除遮罩，只保留边框 */
}

.scan-frame::before {
    content: '';
    position: absolute;
    top: -4px;
    left: -4px;
    right: -4px;
    bottom: -4px;
    border-radius: 50%;
    border: 4px solid rgba(96, 165, 250, 0.9);
    box-shadow: 0 0 40px rgba(96, 165, 250, 0.8),
        0 0 80px rgba(96, 165, 250, 0.4),
        inset 0 0 40px rgba(96, 165, 250, 0.3);
    animation: border-glow 2s ease-in-out infinite;
}

@keyframes border-glow {

    0%,
    100% {
        border-color: rgba(96, 165, 250, 0.9);
        box-shadow: 0 0 40px rgba(96, 165, 250, 0.8),
            0 0 80px rgba(96, 165, 250, 0.4),
            inset 0 0 40px rgba(96, 165, 250, 0.3);
    }

    50% {
        border-color: rgba(147, 197, 253, 1);
        box-shadow: 0 0 50px rgba(147, 197, 253, 1),
            0 0 100px rgba(147, 197, 253, 0.6),
            inset 0 0 50px rgba(147, 197, 253, 0.4);
    }
}

/* 四角标记 */
.scan-corner {
    position: absolute;
    width: 30px;
    height: 30px;
    border-color: rgba(96, 165, 250, 1);
    border-style: solid;
    border-width: 0;
    z-index: 9;
}

.corner-tl {
    top: -2px;
    left: -2px;
    border-top-width: 4px;
    border-left-width: 4px;
    border-top-left-radius: 8px;
}

.corner-tr {
    top: -2px;
    right: -2px;
    border-top-width: 4px;
    border-right-width: 4px;
    border-top-right-radius: 8px;
}

.corner-bl {
    bottom: -2px;
    left: -2px;
    border-bottom-width: 4px;
    border-left-width: 4px;
    border-bottom-left-radius: 8px;
}

.corner-br {
    bottom: -2px;
    right: -2px;
    border-bottom-width: 4px;
    border-right-width: 4px;
    border-bottom-right-radius: 8px;
}

@keyframes pulse {

    0%,
    100% {
        transform: translate(-50%, -50%) scale(1);
    }

    50% {
        transform: translate(-50%, -50%) scale(1.05);
    }
}

/* 状态覆盖层 */
.status-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.7);
    z-index: 10;
    /* backdrop-filter: blur(4px); */
}

.status-content {
    text-align: center;
    color: white;
    padding: 20px;
}

.status-content p {
    margin: 8px 0 0 0;
    font-size: 16px;
}

.success-text {
    font-size: 20px !important;
    font-weight: 600;
    color: #10B981;
}

.staff-name {
    font-size: 24px !important;
    font-weight: 700;
    color: #10B981;
}

.staff-role {
    font-size: 14px !important;
    color: rgba(255, 255, 255, 0.8);
}

/* 人脸截图 */
.face-captured {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    border: 3px solid #10B981;
    object-fit: cover;
    margin-top: 12px;
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
    animation: pulse-success 1s ease-in-out;
}

@keyframes pulse-success {
    0% {
        transform: scale(0.8);
        opacity: 0;
    }

    50% {
        transform: scale(1.1);
    }

    100% {
        transform: scale(1);
        opacity: 1;
    }
}

/* 扫描中提示 */
.status-overlay.scanning {
    background: transparent;
}

.guidance-text {
    position: absolute;
    bottom: 60px;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
    color: white;
    z-index: 11;
}

.guidance-text p {
    font-size: 14px;
    margin: 0;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.progress-dots {
    position: absolute;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 8px;
    z-index: 11;
}

.progress-dots span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transition: all 0.3s;
}

.progress-dots span.active {
    background: white;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
}

/* 操作按钮区域 */
.action-area {
    display: flex;
    justify-content: center;
}

.start-btn {
    width: 100%;
    height: 44px;
    font-size: 15px;
    font-weight: 600;
    border-radius: 8px;
}

.scanning-tag {
    width: 100%;
    height: 44px;
    font-size: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 8px;
}

/* 深色模式适配 */
:global(html.dark) .video-container {
    background: var(--bg-secondary, #1e293b);
}

:global(html.dark) .video-placeholder {
    background: var(--bg-secondary, #1e293b);
}

:global(html.dark) .placeholder-text {
    color: var(--text-primary, #f1f5f9);
}

:global(html.dark) .placeholder-hint {
    color: var(--text-secondary, #94a3b8);
}
</style>
