/**
 * 推送通知工具
 * 封装浏览器Notification API,提供统一的推送通知功能
 */

export interface NotificationOptions {
    title: string
    body?: string
    icon?: string
    badge?: string
    tag?: string
    data?: any
    requireInteraction?: boolean
    vibrate?: number[]
}

/**
 * 请求通知权限
 * @returns 权限状态
 */
export async function requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
        console.warn('[通知] 当前浏览器不支持通知功能')
        return 'denied'
    }

    if (Notification.permission === 'granted') {
        return 'granted'
    }

    if (Notification.permission === 'denied') {
        console.warn('[通知] 用户已拒绝通知权限')
        return 'denied'
    }

    try {
        const permission = await Notification.requestPermission()
        console.log('[通知] 权限状态:', permission)
        return permission
    } catch (error) {
        console.error('[通知] 请求权限失败:', error)
        return 'denied'
    }
}

/**
 * 发送本地通知
 * @param options 通知选项
 * @returns 是否发送成功
 */
export async function sendNotification(options: NotificationOptions): Promise<boolean> {
    // 检查浏览器支持
    if (!('Notification' in window)) {
        console.warn('[通知] 当前浏览器不支持通知功能')
        return false
    }

    // 检查权限
    if (Notification.permission !== 'granted') {
        const permission = await requestPermission()
        if (permission !== 'granted') {
            return false
        }
    }

    try {
        const notification = new Notification(options.title, {
            body: options.body || '',
            icon: options.icon || '/favicon.svg',
            badge: options.badge || '/favicon.svg',
            tag: options.tag || 'default',
            data: options.data,
            requireInteraction: options.requireInteraction || false,
        } as NotificationOptions & { vibrate?: number[] })

        // 点击通知事件
        notification.onclick = (event) => {
            event.preventDefault()

            // 如果有数据URL,打开对应页面
            if (options.data?.url) {
                window.open(options.data.url, '_blank')
            }

            notification.close()
        }

        // 关闭通知事件
        notification.onclose = () => {
            console.log('[通知] 通知已关闭')
        }

        // 错误事件
        notification.onerror = (error) => {
            console.error('[通知] 通知错误:', error)
        }

        console.log('[通知] 通知已发送:', options.title)
        return true
    } catch (error) {
        console.error('[通知] 发送通知失败:', error)
        return false
    }
}

/**
 * 发送诊断报告完成通知
 * @param patientName 患者姓名
 * @param reportCount 报告数量
 */
export async function sendReportReadyNotification(
    patientName: string,
    reportCount: number
): Promise<boolean> {
    return sendNotification({
        title: '📋 诊断报告已完成',
        body: `${patientName},您有${reportCount}份新的诊断报告待查看`,
        icon: '/icons/notification-report.png',
        tag: 'report-ready',
        data: {
            url: '/patient/mobile?tab=report',
        },
        requireInteraction: true,
    })
}

/**
 * 发送AI咨询回复通知
 * @param message 回复消息预览
 */
export async function sendChatReplyNotification(message: string): Promise<boolean> {
    return sendNotification({
        title: '💬 AI医生回复',
        body: message.length > 50 ? message.substring(0, 50) + '...' : message,
        icon: '/icons/notification-chat.png',
        tag: 'chat-reply',
        data: {
            url: '/patient/mobile?tab=chat',
        },
    })
}

/**
 * 发送分诊建议通知
 * @param urgency 紧急程度
 * @param suggestion 建议内容
 */
export async function sendTriageNotification(
    urgency: string,
    suggestion: string
): Promise<boolean> {
    const urgencyIcon = {
        '紧急': '🚨',
        '较急': '⚠️',
        '一般': 'ℹ️',
        '轻微': '✅',
    }

    return sendNotification({
        title: `${urgencyIcon[urgency as keyof typeof urgencyIcon] || '🏥'} 智能分诊建议`,
        body: `紧急程度:${urgency}\n${suggestion}`,
        icon: '/icons/notification-triage.png',
        tag: 'triage-result',
        data: {
            url: '/patient/mobile?tab=triage',
        },
        requireInteraction: urgency === '紧急' || urgency === '较急',
    })
}

/**
 * 检查通知权限状态
 * @returns 权限状态
 */
export function getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
        return 'denied'
    }
    return Notification.permission
}

/**
 * 订阅推送通知(需要后端支持)
 * @param publicKey VAPID公钥
 * @returns Subscription对象
 */
export async function subscribePush(publicKey: string): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('[推送] 当前浏览器不支持推送功能')
        return null
    }

    try {
        const registration = await navigator.serviceWorker.ready

        // 检查是否已订阅
        let subscription = await registration.pushManager.getSubscription()

        if (subscription) {
            console.log('[推送] 已存在订阅:', subscription)
            return subscription
        }

        // 创建新订阅
        const convertedVapidKey = urlBase64ToUint8Array(publicKey)
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey as unknown as BufferSource,
        })

        console.log('[推送] 订阅成功:', subscription)
        return subscription
    } catch (error) {
        console.error('[推送] 订阅失败:', error)
        return null
    }
}

/**
 * 取消推送订阅
 * @returns 是否取消成功
 */
export async function unsubscribePush(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
        return false
    }

    try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()

        if (subscription) {
            await subscription.unsubscribe()
            console.log('[推送] 已取消订阅')
            return true
        }

        return false
    } catch (error) {
        console.error('[推送] 取消订阅失败:', error)
        return false
    }
}

/**
 * 将Base64转换为Uint8Array(VAPID密钥转换)
 * @param base64String Base64字符串
 * @returns Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }

    return outputArray
}
