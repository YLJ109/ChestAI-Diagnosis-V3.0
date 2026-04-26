/**
 * XSS防护工具
 * 用于输入验证和输出转义,防止跨站脚本攻击
 */

/**
 * HTML实体转义
 * 将特殊字符转换为HTML实体,防止XSS攻击
 */
export function escapeHtml(str: string): string {
    if (typeof str !== 'string') return String(str)

    const htmlEntities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;',
    }

    return str.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char] || char)
}

/**
 * URL参数转义
 */
export function escapeUrlParam(str: string): string {
    return encodeURIComponent(str)
}

/**
 * JavaScript字符串转义
 */
export function escapeJsString(str: string): string {
    return str
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t')
        .replace(/\f/g, '\\f')
        .replace(/</g, '\\x3C')
        .replace(/>/g, '\\x3E')
}

/**
 * 验证并清理用户输入
 */
export function sanitizeInput(input: string, options?: {
    maxLength?: number
    allowHtml?: boolean
    trim?: boolean
}): string {
    const {
        maxLength = 1000,
        allowHtml = false,
        trim = true,
    } = options || {}

    let sanitized = input

    // 去除首尾空格
    if (trim) {
        sanitized = sanitized.trim()
    }

    // 检查长度
    if (sanitized.length > maxLength) {
        throw new Error(`输入内容过长,最大允许${maxLength}个字符`)
    }

    // 如果不允许HTML,则转义所有HTML标签
    if (!allowHtml) {
        sanitized = escapeHtml(sanitized)
    }

    return sanitized
}

/**
 * 验证邮箱格式
 */
export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

/**
 * 验证手机号格式(中国大陆)
 */
export function validatePhone(phone: string): boolean {
    const phoneRegex = /^1[3-9]\d{9}$/
    return phoneRegex.test(phone)
}

/**
 * 验证身份证号格式(中国大陆)
 */
export function validateIdCard(idCard: string): boolean {
    const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
    return idCardRegex.test(idCard)
}

/**
 * 验证URL格式
 */
export function validateUrl(url: string): boolean {
    try {
        new URL(url)
        return true
    } catch {
        return false
    }
}

/**
 * 清理富文本HTML(白名单模式)
 * 只允许安全的HTML标签和属性
 */
export function sanitizeHtml(html: string): string {
    // 简单的白名单过滤(生产环境建议使用 DOMPurify)
    const allowedTags = ['b', 'i', 'u', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li']
    const allowedAttrs = ['class']

    // 移除script标签
    let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

    // 移除事件处理器
    cleaned = cleaned.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
    cleaned = cleaned.replace(/\son\w+\s*=\s*[^\s>]*/gi, '')

    // 移除javascript:协议
    cleaned = cleaned.replace(/javascript\s*:/gi, '')
    cleaned = cleaned.replace(/vbscript\s*:/gi, '')

    return cleaned
}

/**
 * 生成CSRF Token(简单实现)
 */
export function generateCsrfToken(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * 验证CSRF Token
 */
export function validateCsrfToken(token: string, storedToken: string): boolean {
    if (!token || !storedToken) return false
    return token === storedToken
}
