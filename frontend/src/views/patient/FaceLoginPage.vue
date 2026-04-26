/** 患者端 - 人脸识别登录组件 */
<template>
    <div class="face-login-container">
        <!-- 视频预览 -->
        <div class="video-wrapper" ref="videoWrapperRef">
            <!-- 初始占位符 -->
            <div v-if="status === 'idle'" class="video-placeholder">
                <el-icon :size="80" color="#3B82F6">
                    <Camera />
                </el-icon>
                <p class="placeholder-text">点击下方按钮启动摄像头</p>
                <p class="placeholder-hint">请允许浏览器访问您的摄像头设备</p>
            </div>

            <video ref="videoRef" autoplay playsinline muted
                :style="{ display: status === 'idle' ? 'none' : 'block' }"></video>
            <canvas ref="canvasRef" style="display: none;"></canvas>

            <!-- 人脸框绘制层 -->
            <canvas ref="faceCanvasRef" class="face-canvas"
                :style="{ display: status === 'idle' ? 'none' : 'block' }"></canvas>

            <!-- 扫描框动画 -->
            <div class="scan-frame" v-if="status === 'scanning'">
                <div class="corner corner-tl"></div>
                <div class="corner corner-tr"></div>
                <div class="corner corner-bl"></div>
                <div class="corner corner-br"></div>
                <div class="scan-line"></div>
            </div>

            <!-- 状态提示 - 只在特定状态显示 -->
            <div class="status-overlay"
                v-if="status === 'loading' || status === 'processing' || status === 'success' || status === 'failed'">
                <div v-if="status === 'loading'" class="status-content">
                    <el-icon class="is-loading" :size="48">
                        <Loading />
                    </el-icon>
                    <p>正在初始化摄像头...</p>
                </div>

                <div v-if="status === 'processing'" class="status-content">
                    <el-icon class="is-loading" :size="48">
                        <Loading />
                    </el-icon>
                    <p>正在识别...</p>
                </div>

                <div v-if="status === 'success'" class="status-content success">
                    <el-icon :size="64" color="#10B981">
                        <CircleCheck />
                    </el-icon>
                    <p>识别成功！</p>
                    <p class="patient-name">{{ matchedPatient?.name }}</p>
                    <!-- 显示人脸截图 -->
                    <img v-if="capturedFaceImage" :src="capturedFaceImage" class="face-captured" />
                </div>

                <div v-if="status === 'failed'" class="status-content failed">
                    <el-icon :size="64" color="#EF4444">
                        <CircleClose />
                    </el-icon>
                    <p>{{ errorMessage || '识别失败' }}</p>
                    <el-button type="primary" @click="restart" size="large">
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
        <div class="action-buttons">
            <el-button v-if="status === 'idle' || status === 'failed'" type="primary" size="large" @click="startCamera">
                <el-icon>
                    <VideoCamera />
                </el-icon>
                启动摄像头
            </el-button>
            <el-tag v-if="status === 'scanning'" type="success" size="large" effect="dark">
                <el-icon>
                    <VideoCamera />
                </el-icon>
                正在自动识别中...
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
import { recognizeFaceApi } from '@/api/face'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const emit = defineEmits(['switch-to-qrcode', 'switch-to-manual', 'login-success'])

const videoRef = ref<HTMLVideoElement>()
const canvasRef = ref<HTMLCanvasElement>()
const faceCanvasRef = ref<HTMLCanvasElement>()  // 用于绘制人脸框
const videoWrapperRef = ref<HTMLDivElement>()
const authStore = useAuthStore()
const router = useRouter()

const status = ref<'idle' | 'loading' | 'scanning' | 'processing' | 'success' | 'failed'>('idle')
const isProcessing = ref(false)
const errorMessage = ref('')
const matchedPatient = ref<any>(null)
const capturedFaceImage = ref<string>('')  // 识别成功的人脸截图

// 连续识别计数器
const consecutiveFailures = ref(0)
const consecutiveSuccesses = ref(0)
const SUCCESS_THRESHOLD = 1  // 识别成功 1 次即确认
const FAILURE_THRESHOLD = 5  // 连续失败 5 次提示用户

let stream: MediaStream | null = null
let recognitionInterval: number | null = null

// 启动摄像头
async function startCamera() {
    try {
        status.value = 'loading'
        errorMessage.value = ''

        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280, min: 640 },  // 降低到 HD，提升性能
                height: { ideal: 720, min: 480 },
                facingMode: 'user',
                frameRate: { ideal: 30, min: 24 },
                aspectRatio: { ideal: 16 / 9 }
            },
            audio: false
        })

        if (videoRef.value) {
            videoRef.value.srcObject = stream

            // 设置最高视频质量
            videoRef.value.style.imageRendering = '-webkit-optimize-contrast'
            videoRef.value.style.transform = 'scaleX(-1)'  // 镜像显示，更自然
            videoRef.value.playsInline = true
            videoRef.value.muted = true

            // 设置视频质量相关属性
            videoRef.value.setAttribute('autoplay', 'true')
            videoRef.value.setAttribute('playsinline', 'true')
            videoRef.value.setAttribute('muted', 'true')

            // 等待视频加载
            await new Promise((resolve) => {
                videoRef.value!.onloadedmetadata = resolve
            })

            await new Promise((resolve) => {
                videoRef.value!.onloadeddata = resolve
            })

            // 强制重新渲染
            await new Promise(resolve => setTimeout(resolve, 100))

            status.value = 'scanning'
            ElMessage.success('摄像头已启动，请对准面部')

            // 启动自动识别
            startAutoRecognition()
        }
    } catch (err: any) {
        console.error('摄像头启动失败:', err)
        status.value = 'failed'

        if (err.name === 'NotAllowedError') {
            errorMessage.value = '摄像头权限被拒绝，请在浏览器设置中允许访问'
        } else if (err.name === 'NotFoundError') {
            errorMessage.value = '未检测到摄像头设备'
        } else {
            errorMessage.value = '摄像头启动失败，请检查设备'
        }
    }
}

// 自动识别定时器
let autoRecognitionInterval: number | null = null

// 启动自动识别
function startAutoRecognition() {
    let currentInterval = 1500  // 初始 1.5 秒

    autoRecognitionInterval = window.setInterval(async () => {
        if (status.value === 'scanning' && !isProcessing.value) {
            await captureAndRecognize()

            // 根据连续失败次数调整间隔
            if (consecutiveFailures.value > 3) {
                // 连续失败，降低频率避免浪费资源
                clearInterval(autoRecognitionInterval!)
                currentInterval = 2500  // 增加到 2.5 秒
                autoRecognitionInterval = window.setInterval(async () => {
                    if (status.value === 'scanning' && !isProcessing.value) {
                        await captureAndRecognize()
                    }
                }, currentInterval)
                console.log('[FaceLogin] 连续失败较多，识别间隔调整为 2.5 秒')
            }
        }
    }, currentInterval)
}

// 捕获帧并识别
async function captureAndRecognize() {
    if (!videoRef.value || !canvasRef.value) return

    // 添加超时控制
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('识别超时，请重试')), 10000) // 10 秒超时（从 8 秒增加）
    })

    try {
        status.value = 'processing'
        isProcessing.value = true

        const video = videoRef.value
        const canvas = canvasRef.value
        const ctx = canvas.getContext('2d')

        if (!ctx) {
            throw new Error('无法获取画布上下文')
        }

        // 降低画布尺寸以提升传输速度（人脸识别不需要高清）
        const targetWidth = 416  // 进一步降低到 416px 宽度，匹配后端检测尺寸
        const scale = targetWidth / video.videoWidth
        canvas.width = targetWidth
        canvas.height = Math.floor(video.videoHeight * scale)

        // 绘制当前视频帧（缩小后）
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        // 转换为 base64，进一步压缩以提升传输速度（从 0.7 降到 0.5）
        const imageData = canvas.toDataURL('image/jpeg', 0.5)

        console.log('[FaceLogin] 开始发送识别请求...')
        console.log(`[FaceLogin] 图像尺寸: ${canvas.width}x${canvas.height}, 质量: 0.5`)
        console.log(`[FaceLogin] Base64 长度: ${imageData.length} 字符 (${(imageData.length / 1024).toFixed(1)} KB)`)
        const startTime = Date.now()

        // 使用 Promise.race 实现超时控制
        const response = await Promise.race([
            fetch('/api/v1/face/recognize-from-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image_data: imageData
                })
            }),
            timeoutPromise
        ]) as Response

        const elapsedTime = Date.now() - startTime
        console.log(`[FaceLogin] ✅ 识别请求完成，总耗时: ${elapsedTime}ms`)
        console.log(`[FaceLogin] 响应状态: ${response.status}`)

        // 检查是否是超时错误
        if (response instanceof Error) {
            throw response
        }

        const result = await response.json()
        console.log('[FaceLogin] 识别结果:', result)

        // 绘制人脸框（无论成功失败，只要检测到人脸就绘制）
        if (result.data?.face_bbox) {
            drawFaceBox(result.data.face_bbox, result.code === 200)
        } else if (result.data?.faces_detected && result.data.faces_detected > 0) {
            // 如果检测到人脸但没有返回 bbox，清除之前的框
            clearFaceBox()
        }

        if (result.code === 200) {
            // 识别成功
            consecutiveSuccesses.value++
            consecutiveFailures.value = 0

            if (consecutiveSuccesses.value >= SUCCESS_THRESHOLD) {
                // 连续成功，确认识别
                matchedPatient.value = result.data

                // 保存人脸截图
                if (result.data.face_image) {
                    capturedFaceImage.value = `data:image/jpeg;base64,${result.data.face_image}`
                }

                // ✅ 先关闭摄像头，再显示成功界面
                stopCamera()
                console.log('[FaceLogin] 识别成功，已关闭摄像头')

                status.value = 'success'
                ElMessage.success(`识别成功：${result.data.name}`)

                // 延迟后自动登录
                setTimeout(() => {
                    handleLoginSuccess(result.data)
                }, 1500)
            } else {
                // 还需继续验证
                status.value = 'scanning'
                console.log(`[FaceLogin] 连续成功 ${consecutiveSuccesses.value}/${SUCCESS_THRESHOLD} 次`)
            }
        } else {
            // 识别失败
            consecutiveFailures.value++
            consecutiveSuccesses.value = 0

            if (consecutiveFailures.value >= FAILURE_THRESHOLD) {
                // 连续失败达到阈值，停止识别
                status.value = 'failed'
                errorMessage.value = '多次识别失败，请调整姿势或光线后重试'

                // 停止自动识别循环
                if (autoRecognitionInterval) {
                    clearInterval(autoRecognitionInterval)
                    autoRecognitionInterval = null
                }

                // 关闭摄像头
                stopCamera()
                console.log('[FaceLogin] 连续失败过多，已停止识别并关闭摄像头')
            } else {
                // 还未达到阈值，继续尝试
                status.value = 'scanning'
                console.log(`[FaceLogin] 识别失败 (${consecutiveFailures.value}/${FAILURE_THRESHOLD})，继续尝试...`)
            }
        }

    } catch (err: any) {
        console.error('[FaceLogin] 人脸识别失败:', err)
        status.value = 'failed'
        errorMessage.value = err.message || '识别过程出错，请重试'

        // 超时或其他错误，停止自动识别
        if (autoRecognitionInterval) {
            clearInterval(autoRecognitionInterval)
            autoRecognitionInterval = null
            console.log('[FaceLogin] 识别异常，已停止自动识别循环')
        }

        // 异常情况下也关闭摄像头
        stopCamera()
        console.log('[FaceLogin] 识别异常，已关闭摄像头')
    } finally {
        isProcessing.value = false
    }
}

// 绘制人脸框（蓝色四角）
function drawFaceBox(bbox: number[], isSuccess: boolean) {
    if (!faceCanvasRef.value || !videoRef.value) return

    const canvas = faceCanvasRef.value
    const video = videoRef.value

    // 设置画布尺寸与视频一致
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const [x1, y1, x2, y2] = bbox
    const boxWidth = x2 - x1
    const boxHeight = y2 - y1
    const cornerLength = Math.min(boxWidth, boxHeight) * 0.25  // 角的长度
    const lineWidth = 4  // 线条宽度

    // 设置样式
    ctx.strokeStyle = isSuccess ? '#10B981' : '#3B82F6'  // 成功绿色，检测蓝色
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // 由于视频镜像了，需要翻转人脸框坐标
    const videoWidth = canvas.width
    const flipX1 = videoWidth - x2  // 翻转 X 坐标
    const flipX2 = videoWidth - x1

    // 绘制四个角
    ctx.beginPath()

    // 左上角（镜像后变成右上角）
    ctx.moveTo(flipX1, y1 + cornerLength)
    ctx.lineTo(flipX1, y1)
    ctx.lineTo(flipX1 + cornerLength, y1)

    // 右上角（镜像后变成左上角）
    ctx.moveTo(flipX2 - cornerLength, y1)
    ctx.lineTo(flipX2, y1)
    ctx.lineTo(flipX2, y1 + cornerLength)

    // 左下角（镜像后变成右下角）
    ctx.moveTo(flipX1, y2 - cornerLength)
    ctx.lineTo(flipX1, y2)
    ctx.lineTo(flipX1 + cornerLength, y2)

    // 右下角（镜像后变成左下角）
    ctx.moveTo(flipX2 - cornerLength, y2)
    ctx.lineTo(flipX2, y2)
    ctx.lineTo(flipX2, y2 - cornerLength)

    ctx.stroke()

    // 添加发光效果
    ctx.shadowColor = isSuccess ? '#10B981' : '#3B82F6'
    ctx.shadowBlur = 10
    ctx.stroke()
    ctx.shadowBlur = 0  // 重置
}

// 处理登录成功
async function handleLoginSuccess(patientData: any) {
    try {
        // 摄像头已在识别成功时关闭

        await authStore.patientLogin(patientData.patient_no, 'face_recognition')
        ElMessage.success('登录成功')
        emit('login-success', patientData)
        router.push('/patient/home')
    } catch (err) {
        ElMessage.error('登录失败，请重试')
        status.value = 'failed'
        errorMessage.value = '登录失败'
    }
}

// 清除人脸框
function clearFaceBox() {
    if (!faceCanvasRef.value) return
    const ctx = faceCanvasRef.value.getContext('2d')
    if (ctx) {
        ctx.clearRect(0, 0, faceCanvasRef.value.width, faceCanvasRef.value.height)
    }
}

// 重新开始识别（识别失败或用户主动点击）
function restart() {
    console.log('[FaceLogin] 重新开始识别')

    // 先完全停止摄像头和识别循环
    stopCamera()
    clearFaceBox()

    // 重置状态
    status.value = 'idle'
    errorMessage.value = ''
    matchedPatient.value = null

    // 延迟后重新启动摄像头（确保资源已释放）
    setTimeout(async () => {
        await startCamera()
    }, 300)
}

// 停止摄像头
function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop())
        stream = null
    }

    if (recognitionInterval) {
        clearInterval(recognitionInterval)
        recognitionInterval = null
    }

    if (autoRecognitionInterval) {
        clearInterval(autoRecognitionInterval)
        autoRecognitionInterval = null
    }
}

// 生命周期
onMounted(() => {
    // 不自动启动摄像头，等待用户点击按钮
    status.value = 'idle'
})

onBeforeUnmount(() => {
    stopCamera()
})
</script>

<style scoped>
.face-login-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding: 0;
    /* 移除内边距，由父容器控制 */
    width: 100%;
}

/* 视频容器 - 自适应父容器 */
.video-wrapper {
    position: relative;
    width: 100%;
    max-width: 640px;
    /* 调整最大宽度以适应登录区域 */
    aspect-ratio: 4 / 3;
    border-radius: 16px;
    overflow: hidden;
    background: #F0F7FF;
    /* 左右对称阴影 */
    box-shadow: -12px 0 24px rgba(59, 130, 246, 0.1), 12px 0 24px rgba(59, 130, 246, 0.1), 0 8px 32px rgba(59, 130, 246, 0.15);
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
    gap: 16px;
    /* 使用 CSS 变量支持主题切换，默认浅蓝色渐变 */
    background: var(--bg-secondary, linear-gradient(135deg, #f0f7ff 0%, #e6f0fa 100%));
    z-index: 1;
}

.placeholder-text {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary, #1e293b);
    margin: 0;
}

.placeholder-hint {
    font-size: 14px;
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
    /* 保持比例填充 */
    z-index: 2;
    /* 确保视频在占位符上方 */
    image-rendering: -webkit-optimize-contrast;
    /* WebKit 优化 */
    image-rendering: crisp-edges;
    /* 清晰边缘 */
    -webkit-backface-visibility: hidden;
    /* 防止闪烁 */
    backface-visibility: hidden;
}

.face-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    /* 让点击事件穿透到视频 */
    z-index: 5;
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
}

canvas {
    display: none;
    /* 隐藏画布，仅用于捕获 */
}

/* 扫描框 */
.scan-frame {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 350px;
    height: 350px;
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
    z-index: 6;
    /* 确保在视频和人脸框上方 */
    pointer-events: none;
    /* 让点击穿透 */
    box-shadow: 0 0 0 2000px rgba(0, 0, 0, 0.4);
    /* 四周暗角效果，突出扫描区域 */
}

/* 扫描框边框增强 */
.scan-frame::before {
    content: '';
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    bottom: -3px;
    border-radius: 50%;
    border: 3px solid rgba(59, 130, 246, 0.8);
    /* 更明显的蓝色边框 */
    box-shadow: 0 0 30px rgba(59, 130, 246, 0.6), inset 0 0 30px rgba(59, 130, 246, 0.3);
    /* 更强的蓝色发光效果 */
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

.corner {
    position: absolute;
    width: 50px;
    height: 50px;
    border: 5px solid #3B82F6;
    filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.8));
    /* 添加发光效果 */
}

.corner-tl {
    top: 0;
    left: 0;
    border-right: none;
    border-bottom: none;
    border-top-left-radius: 20px;
}

.corner-tr {
    top: 0;
    right: 0;
    border-left: none;
    border-bottom: none;
    border-top-right-radius: 20px;
}

.corner-bl {
    bottom: 0;
    left: 0;
    border-right: none;
    border-top: none;
    border-bottom-left-radius: 20px;
}

.corner-br {
    bottom: 0;
    right: 0;
    border-left: none;
    border-top: none;
    border-bottom-right-radius: 20px;
}

.scan-line {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, transparent, #3B82F6, #60A5FA, #3B82F6, transparent);
    animation: scan 2s linear infinite;
    box-shadow: 0 0 15px #3B82F6, 0 0 30px rgba(59, 130, 246, 0.5);
    /* 更强的扫描线发光 */
}

@keyframes scan {
    0% {
        top: 0;
    }

    100% {
        top: 100%;
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
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(4px);
    z-index: 10;
}

/* 扫描中的引导提示 */
.status-overlay.scanning {
    background: transparent;
    backdrop-filter: none;
    pointer-events: none;
    align-items: flex-end;
    padding-bottom: 60px;
}

.guidance-text {
    text-align: center;
    color: #1F2937;
    text-shadow: 0 2px 8px rgba(255, 255, 255, 0.8);
}

.guidance-text p {
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 16px 0;
}

.progress-dots {
    display: flex;
    gap: 8px;
    justify-content: center;
}

.progress-dots span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(31, 41, 55, 0.3);
    transition: all 0.3s ease;
}

.progress-dots span.active {
    background: #3B82F6;
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);
}



.status-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    color: #fff;
    text-align: center;
}

.status-content p {
    margin: 0;
    font-size: 18px;
}

.scan-text {
    font-size: 24px !important;
    font-weight: 700;
}

.scan-hint {
    font-size: 14px !important;
    opacity: 0.8;
}

.patient-name {
    font-size: 28px !important;
    font-weight: 700;
    color: #10B981;
}

/* 人脸截图 */
.face-captured {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: 4px solid #10B981;
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

.success p {
    color: #10B981;
}

.failed p {
    color: #EF4444;
}

/* 操作按钮 */
.action-buttons {
    display: flex;
    gap: 16px;
}

.action-buttons .el-button {
    min-width: 160px;
    height: 48px;
    font-size: 16px;
}
</style>
