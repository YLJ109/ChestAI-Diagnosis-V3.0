/**
 * 设备检测工具
 * 用于判断当前设备类型,决定使用桌面端还是移动端页面
 */

export interface DeviceInfo {
    isMobile: boolean
    isTablet: boolean
    isDesktop: boolean
    platform: string
}

/**
 * 检测是否为移动设备
 * @returns 设备信息对象
 */
export function detectDevice(): DeviceInfo {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera

    // 检测设备类型
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    const isTablet = /iPad|Android(?!.*Mobile)|Tablet/i.test(userAgent)
    const isDesktop = !isMobile && !isTablet

    // 检测平台
    let platform = 'unknown'
    if (/Android/i.test(userAgent)) {
        platform = 'android'
    } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
        platform = 'ios'
    } else if (/Windows/i.test(userAgent)) {
        platform = 'windows'
    } else if (/Mac/i.test(userAgent)) {
        platform = 'macos'
    } else if (/Linux/i.test(userAgent)) {
        platform = 'linux'
    }

    return {
        isMobile,
        isTablet,
        isDesktop,
        platform,
    }
}

/**
 * 判断是否应该使用移动端页面
 * @param forceMobile 是否强制使用移动端(从URL参数或localStorage读取)
 * @returns 是否使用移动端
 */
export function shouldUseMobile(forceMobile?: boolean): boolean {
    // 如果强制使用移动端,直接返回true
    if (forceMobile) return true

    // 检查URL参数
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('mobile') === 'true') {
        return true
    }

    // 检查localStorage
    const storedPreference = localStorage.getItem('mobile_preference')
    if (storedPreference === 'mobile') {
        return true
    }

    // 根据设备类型判断
    const device = detectDevice()
    return device.isMobile || device.isTablet
}

/**
 * 获取移动端专属路由
 * @param originalPath 原始路径
 * @returns 移动端路径
 */
export function getMobileRoute(originalPath: string): string {
    // 患者门户的移动端路由映射
    const mobileRoutes: Record<string, string> = {
        '/patient/home': '/patient/mobile',
        '/patient/report': '/patient/mobile',
        '/patient/history': '/patient/mobile',
        '/patient/triage': '/patient/mobile',
        '/patient/chat': '/patient/mobile',
    }

    return mobileRoutes[originalPath] || '/patient/mobile'
}

/**
 * 切换桌面/移动端模式
 * @param useMobile 是否使用移动端
 */
export function toggleMobileMode(useMobile: boolean): void {
    localStorage.setItem('mobile_preference', useMobile ? 'mobile' : 'desktop')

    // 重新加载页面以应用更改
    window.location.reload()
}

/**
 * 监听窗口大小变化,自动切换模式(可选)
 * @param callback 切换回调
 */
export function watchDeviceChange(callback: (device: DeviceInfo) => void): () => void {
    let lastDevice = detectDevice()

    const handler = () => {
        const currentDevice = detectDevice()

        // 只有当设备类型真正改变时才触发
        if (currentDevice.isMobile !== lastDevice.isMobile) {
            lastDevice = currentDevice
            callback(currentDevice)
        }
    }

    window.addEventListener('resize', handler)

    // 返回取消监听的函数
    return () => {
        window.removeEventListener('resize', handler)
    }
}
