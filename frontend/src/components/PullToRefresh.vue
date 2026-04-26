/**
* 下拉刷新组件
* 移动端常见的下拉刷新交互
*/
<template>
    <div class="pull-to-refresh" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
        <!-- 刷新提示 -->
        <div class="refresh-indicator" :style="{ height: pullDistance + 'px' }">
            <div class="indicator-content">
                <el-icon v-if="status === 'pulling'" class="arrow-icon"
                    :style="{ transform: `rotate(${pullDistance / 2}deg)` }">
                    <ArrowDown />
                </el-icon>
                <el-icon v-else-if="status === 'ready'" class="ready-icon">
                    <Refresh />
                </el-icon>
                <el-icon v-else-if="status === 'refreshing'" class="loading-icon">
                    <Loading />
                </el-icon>
                <el-icon v-else class="success-icon">
                    <Check />
                </el-icon>

                <span class="indicator-text">{{ statusText }}</span>
            </div>
        </div>

        <!-- 内容区域 -->
        <div class="refresh-content">
            <slot></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowDown, Refresh, Loading, Check } from '@element-plus/icons-vue'

const emit = defineEmits<{
    refresh: []
}>()

// 状态
const pullDistance = ref(0)
const startY = ref(0)
const isPulling = ref(false)
const status = ref<'pulling' | 'ready' | 'refreshing' | 'success'>('pulling')

// 配置
const THRESHOLD = 80    // 触发刷新的阈值
const MAX_DISTANCE = 150 // 最大拉动距离

// 状态文本
const statusText = computed(() => {
    switch (status.value) {
        case 'pulling':
            return '下拉刷新'
        case 'ready':
            return '释放刷新'
        case 'refreshing':
            return '刷新中...'
        case 'success':
            return '刷新成功'
        default:
            return ''
    }
})

// 触摸开始
function onTouchStart(e: TouchEvent) {
    // 只有在顶部时才允许下拉
    if (window.scrollY === 0) {
        startY.value = e.touches[0].clientY
        isPulling.value = true
    }
}

// 触摸移动
function onTouchMove(e: TouchEvent) {
    if (!isPulling.value) return

    const currentY = e.touches[0].clientY
    const distance = currentY - startY.value

    // 只处理向下拉
    if (distance > 0) {
        e.preventDefault()

        // 限制最大距离
        pullDistance.value = Math.min(distance * 0.6, MAX_DISTANCE)

        // 更新状态
        if (pullDistance.value >= THRESHOLD) {
            status.value = 'ready'
        } else {
            status.value = 'pulling'
        }
    }
}

// 触摸结束
async function onTouchEnd() {
    if (!isPulling.value) return

    isPulling.value = false

    // 判断是否触发刷新
    if (pullDistance.value >= THRESHOLD) {
        status.value = 'refreshing'
        pullDistance.value = THRESHOLD

        try {
            // 触发刷新事件
            await emit('refresh')

            // 显示成功状态
            status.value = 'success'

            // 延迟后重置
            setTimeout(() => {
                reset()
            }, 500)
        } catch (error) {
            console.error('刷新失败:', error)
            reset()
        }
    } else {
        // 未达到阈值,回弹
        reset()
    }
}

// 重置状态
function reset() {
    pullDistance.value = 0
    status.value = 'pulling'
}

// 暴露方法给父组件
defineExpose({
    reset
})
</script>

<style scoped lang="scss">
.pull-to-refresh {
    position: relative;
    overflow: hidden;
    min-height: 100vh;
}

.refresh-indicator {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: height 0.2s ease;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    z-index: 10;
}

.indicator-content {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
}

.arrow-icon,
.ready-icon,
.loading-icon,
.success-icon {
    font-size: 20px;
}

.loading-icon {
    animation: rotate 1s linear infinite;
}

.success-icon {
    animation: scaleIn 0.3s ease;
}

@keyframes rotate {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

@keyframes scaleIn {
    from {
        transform: scale(0);
    }

    to {
        transform: scale(1);
    }
}

.refresh-content {
    position: relative;
    z-index: 1;
}
</style>
