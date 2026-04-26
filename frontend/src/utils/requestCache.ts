/**
 * API请求缓存工具
 * 用于缓存频繁请求的数据,减少网络请求次数
 */

interface CacheItem {
    data: any
    timestamp: number
    ttl: number // Time to live in milliseconds
}

class RequestCache {
    private cache: Map<string, CacheItem> = new Map()
    private defaultTTL: number = 5 * 60 * 1000 // 默认5分钟

    /**
     * 获取缓存数据
     * @param key 缓存键
     * @returns 缓存的数据,如果不存在或已过期则返回null
     */
    get(key: string): any | null {
        const item = this.cache.get(key)
        if (!item) return null

        // 检查是否过期
        if (Date.now() - item.timestamp > item.ttl) {
            this.cache.delete(key)
            return null
        }

        console.log(`[缓存命中] ${key}`)
        return item.data
    }

    /**
     * 设置缓存
     * @param key 缓存键
     * @param data 要缓存的数据
     * @param ttl 过期时间(毫秒),默认5分钟
     */
    set(key: string, data: any, ttl?: number): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttl || this.defaultTTL,
        })
        console.log(`[缓存设置] ${key}, TTL: ${ttl || this.defaultTTL}ms`)
    }

    /**
     * 删除缓存
     * @param key 缓存键
     */
    delete(key: string): void {
        this.cache.delete(key)
        console.log(`[缓存删除] ${key}`)
    }

    /**
     * 清空所有缓存
     */
    clear(): void {
        this.cache.clear()
        console.log('[缓存清空] 所有缓存已清除')
    }

    /**
     * 清理过期的缓存
     */
    cleanup(): void {
        const now = Date.now()
        let cleanedCount = 0

        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > item.ttl) {
                this.cache.delete(key)
                cleanedCount++
            }
        }

        if (cleanedCount > 0) {
            console.log(`[缓存清理] 清理了 ${cleanedCount} 个过期缓存`)
        }
    }

    /**
     * 获取缓存统计信息
     */
    getStats(): { size: number; keys: string[] } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
        }
    }
}

// 创建单例实例
export const requestCache = new RequestCache()

// 定期清理过期缓存(每10分钟)
setInterval(() => {
    requestCache.cleanup()
}, 10 * 60 * 1000)

/**
 * 生成缓存键
 * @param prefix 前缀
 * @param params 参数对象
 * @returns 缓存键字符串
 */
export function generateCacheKey(prefix: string, params?: Record<string, any>): string {
    if (!params) return prefix
    const sortedParams = Object.keys(params)
        .sort()
        .map((key) => `${key}=${JSON.stringify(params[key])}`)
        .join('&')
    return `${prefix}?${sortedParams}`
}
