/**
* 上拉加载更多组件(无限滚动)
* 移动端常见的上拉加载交互
*/
<template>
    <div class="infinite-scroll" ref="containerRef" @scroll="onScroll">
        <!-- 内容区域 -->
        <div class="scroll-content">
            <slot></slot>
        </div>

        <!-- 加载状态 -->
        <div class="load-more-indicator" v-if="!finished">
            <div v-if="loading" class="loading-state">
                <el-icon class="loading-icon">
                    <Loading />
                </el-icon>
                <span>加载中...</span>
            </div>
            <div v-else-if="hasMore" class="ready-state">
                <span>上拉加载更多</span>
            </div>
        </div>

        <!-- 已加载完成 -->
        <div class="finished-state" v-if="finished">
            <span>没有更多了</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Loading } from '@element-plus/icons-vue'

const props = defineProps<{
    loading: boolean      // 是否正在加载
    finished: boolean     // 是否加载完成
    hasMore?: boolean     // 是否还有更多数据
    threshold?: number    // 触发加载的阈值(px)
}>()

const emit = defineEmits<{
    loadMore: []
}>()

const containerRef = ref<HTMLElement | null>(null)
const threshold = props.threshold || 100

// 滚动事件处理
function onScroll() {
    if (!containerRef.value) return
    if (props.loading || props.finished) return

    const { scrollTop, scrollHeight, clientHeight } = containerRef.value

    // 距离底部小于阈值时触发加载
    const distanceToBottom = scrollHeight - scrollTop - clientHeight

    if (distanceToBottom <= threshold) {
        emit('loadMore')
    }
}

// 监听窗口大小变化
function handleResize() {
    onScroll()
}

onMounted(() => {
    window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
})
</script>

<style scoped lang="scss">
.infinite-scroll {
    height: 100%;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
}

.scroll-content {
    min-height: 100%;
}

.load-more-indicator,
.finished-state {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    color: #9CA3AF;
    font-size: 14px;
}

.loading-state {
    display: flex;
    align-items: center;
    gap: 8px;

    .loading-icon {
        animation: rotate 1s linear infinite;
    }
}

@keyframes rotate {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}
</style>
