/**
* 移动端AI咨询页面
* 聊天界面,气泡式对话,输入框固定在底部
*/
<template>
    <div class="mobile-chat">
        <!-- 消息列表 -->
        <div class="messages-container" ref="messagesRef">
            <!-- 欢迎消息 -->
            <div v-if="messages.length === 0" class="welcome-message">
                <div class="welcome-icon">
                    <el-icon :size="48">
                        <ChatDotRound />
                    </el-icon>
                </div>
                <h3>AI健康助手</h3>
                <p>您好!我可以为您解答健康问题</p>

                <div class="quick-questions">
                    <p class="quick-title">您可以问我:</p>
                    <div v-for="q in quickQuestions" :key="q" class="quick-q" @click="sendQuickQ(q)">
                        {{ q }}
                    </div>
                </div>

                <div class="disclaimer">
                    <el-icon>
                        <Warning />
                    </el-icon>
                    <span>AI回复仅供参考,不能替代专业医生诊断</span>
                </div>
            </div>

            <!-- 消息列表 -->
            <div v-for="(msg, index) in messages" :key="index" :class="['message', msg.role]">
                <div v-if="msg.role === 'assistant'" class="message-avatar bot">
                    <el-icon>
                        <ChatDotRound />
                    </el-icon>
                </div>

                <div class="message-bubble" :class="msg.role">
                    <div v-if="msg.role === 'assistant'" v-html="formatMessage(msg.content)"></div>
                    <div v-else>{{ msg.content }}</div>
                </div>

                <div v-if="msg.role === 'user'" class="message-avatar user">
                    <span>{{ userName.charAt(0) }}</span>
                </div>
            </div>

            <!-- AI正在输入 -->
            <div v-if="isTyping" class="message assistant">
                <div class="message-avatar bot">
                    <el-icon>
                        <ChatDotRound />
                    </el-icon>
                </div>
                <div class="message-bubble bot typing">
                    <div class="typing-dots">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 输入区域 -->
        <div class="input-area">
            <el-input v-model="inputText" type="textarea" :rows="1" :autosize="{ minRows: 1, maxRows: 4 }"
                placeholder="输入您的问题..." @keydown.enter.exact.prevent="sendMessage" :disabled="isTyping"
                class="chat-input" />
            <el-button type="primary" :disabled="!inputText.trim() || isTyping" :loading="isTyping" @click="sendMessage"
                class="send-btn">
                <el-icon v-if="!isTyping">
                    <Promotion />
                </el-icon>
            </el-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ChatDotRound, Promotion, Warning } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { llmApi } from '@/api/llm'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// 消息列表
const messages = ref<any[]>([])
const inputText = ref('')
const isTyping = ref(false)
const messagesRef = ref<HTMLElement>()

// 快捷问题
const quickQuestions = [
    '咳嗽怎么办?',
    '发烧需要去医院吗?',
    '胸痛可能是什么原因?',
    '如何预防感冒?',
]

// 用户名
const userName = computed(() => {
    return authStore.user?.name || authStore.user?.real_name || '用户'
})

// 格式化消息(支持简单Markdown)
function formatMessage(content: string) {
    // 将换行符转换为<br>
    let formatted = content.replace(/\n/g, '<br>')
    // 加粗 **text**
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    return formatted
}

// 发送快捷问题
function sendQuickQ(question: string) {
    inputText.value = question
    sendMessage()
}

// 发送消息
async function sendMessage() {
    if (!inputText.value.trim() || isTyping.value) return

    const userMessage = {
        role: 'user',
        content: inputText.value.trim(),
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    }

    messages.value.push(userMessage)
    const question = inputText.value
    inputText.value = ''
    isTyping.value = true

    // 滚动到底部
    await nextTick()
    scrollToBottom()

    try {
        // 调用LLM API(患者端使用公开接口)
        const chatMessages = [
            { role: 'user', content: question },
        ]

        const res: any = await llmApi.patientChat({
            messages: chatMessages,
        })

        if (res.data && res.data.reply) {
            messages.value.push({
                role: 'assistant',
                content: res.data.reply,
                time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            })
        }
    } catch (error: any) {
        console.error('AI回复失败:', error)
        ElMessage.error('AI回复失败,请重试')

        // 添加错误提示
        messages.value.push({
            role: 'assistant',
            content: '抱歉,我遇到了一些问题,请稍后重试。',
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        })
    } finally {
        isTyping.value = false
        await nextTick()
        scrollToBottom()
    }
}

// 滚动到底部
function scrollToBottom() {
    if (messagesRef.value) {
        messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
}

onMounted(() => {
    // 可以加载历史消息(如果需要)
})
</script>

<style scoped lang="scss">
@import '@/styles/mobile.scss';

.mobile-chat {
    display: flex;
    flex-direction: column;
    height: 100vh; // 使用视口高度
    background: $mobile-bg;
}

// 消息容器
.messages-container {
    flex: 1;
    overflow-y: auto;
    padding: $spacing-md;
    -webkit-overflow-scrolling: touch;
}

// 欢迎消息
.welcome-message {
    text-align: center;
    padding: $spacing-xl $spacing-md;

    .welcome-icon {
        width: 80px;
        height: 80px;
        margin: 0 auto $spacing-md;
        border-radius: $radius-full;
        background: linear-gradient(135deg, $mobile-primary, $mobile-secondary);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
    }

    h3 {
        font-size: $text-xl;
        color: $mobile-text;
        margin: 0 0 $spacing-xs 0;
    }

    p {
        font-size: $text-sm;
        color: $mobile-text-secondary;
        margin: 0 0 $spacing-lg 0;
    }
}

.quick-questions {
    margin-bottom: $spacing-lg;

    .quick-title {
        font-size: $text-sm;
        color: $mobile-text-secondary;
        margin-bottom: $spacing-sm;
    }

    .quick-q {
        background: white;
        border: 1px solid $mobile-border;
        border-radius: $radius-md;
        padding: $spacing-sm $spacing-md;
        margin-bottom: $spacing-sm;
        font-size: $text-sm;
        color: $mobile-text;
        cursor: pointer;
        transition: all 0.2s ease;

        &:active {
            background: $mobile-primary;
            color: white;
            border-color: $mobile-primary;
        }
    }
}

.disclaimer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-xs;
    padding: $spacing-sm;
    background: #FEF3C7;
    border-radius: $radius-md;
    font-size: $text-xs;
    color: #D97706;

    .el-icon {
        flex-shrink: 0;
    }
}

// 消息项
.message {
    display: flex;
    gap: $spacing-sm;
    margin-bottom: $spacing-md;
    animation: fadeIn 0.3s ease;

    &.user {
        flex-direction: row-reverse;
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.message-avatar {
    width: 36px;
    height: 36px;
    border-radius: $radius-full;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: $text-sm;
    font-weight: 600;

    &.bot {
        background: linear-gradient(135deg, $mobile-primary, $mobile-secondary);
        color: white;
    }

    &.user {
        background: linear-gradient(135deg, #8B5CF6, #7C3AED);
        color: white;
    }
}

.message-bubble {
    max-width: 70%;
    padding: $spacing-sm $spacing-md;
    border-radius: $radius-lg;
    font-size: $text-sm;
    line-height: 1.6;
    word-break: break-word;

    &.assistant {
        background: white;
        color: $mobile-text;
        border-top-left-radius: $radius-sm;
        box-shadow: $shadow-sm;
    }

    &.user {
        background: linear-gradient(135deg, $mobile-primary, $mobile-secondary);
        color: white;
        border-top-right-radius: $radius-sm;
    }

    &.typing {
        padding: $spacing-md;
    }
}

.typing-dots {
    display: flex;
    gap: 4px;

    span {
        width: 8px;
        height: 8px;
        border-radius: $radius-full;
        background: $mobile-text-secondary;
        animation: typing 1.4s infinite;

        &:nth-child(2) {
            animation-delay: 0.2s;
        }

        &:nth-child(3) {
            animation-delay: 0.4s;
        }
    }
}

@keyframes typing {

    0%,
    60%,
    100% {
        transform: translateY(0);
        opacity: 0.5;
    }

    30% {
        transform: translateY(-8px);
        opacity: 1;
    }
}

// 输入区域
.input-area {
    display: flex;
    gap: $spacing-sm;
    padding: $spacing-md;
    background: white;
    border-top: 1px solid $mobile-border;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

.chat-input {
    flex: 1;

    :deep(.el-textarea__inner) {
        padding: $spacing-sm $spacing-md;
        border-radius: $radius-md;
        border: 1px solid $mobile-border;
        resize: none;
        font-size: $text-sm;

        &:focus {
            border-color: $mobile-primary;
        }
    }
}

.send-btn {
    width: 48px;
    height: 48px;
    padding: 0;
    border-radius: $radius-md;
    flex-shrink: 0;
}
</style>
