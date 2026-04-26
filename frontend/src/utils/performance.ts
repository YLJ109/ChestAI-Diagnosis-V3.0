/**
 * 性能监控工具
 * 用于监控系统性能和用户交互响应时间
 */

interface PerformanceMetric {
    name: string
    duration: number
    timestamp: number
    type: 'navigation' | 'api' | 'component' | 'user-action'
}

class PerformanceMonitor {
    private metrics: PerformanceMetric[] = []
    private maxMetrics: number = 100 // 最多保存100条记录

    /**
     * 记录性能指标
     */
    record(metric: Omit<PerformanceMetric, 'timestamp'>): void {
        this.metrics.push({
            ...metric,
            timestamp: Date.now(),
        })

        // 保持最近的N条记录
        if (this.metrics.length > this.maxMetrics) {
            this.metrics.shift()
        }

        console.log(`[性能监控] ${metric.name}: ${metric.duration.toFixed(2)}ms (${metric.type})`)
    }

    /**
     * 测量异步操作的执行时间
     */
    async measure<T>(name: string, fn: () => Promise<T>, type: PerformanceMetric['type'] = 'api'): Promise<T> {
        const start = performance.now()
        try {
            const result = await fn()
            const duration = performance.now() - start
            this.record({ name, duration, type })
            return result
        } catch (error) {
            const duration = performance.now() - start
            this.record({ name: `${name} (失败)`, duration, type })
            throw error
        }
    }

    /**
     * 获取性能统计
     */
    getStats(): {
        total: number
        average: number
        min: number
        max: number
        byType: Record<string, { count: number; average: number }>
    } {
        if (this.metrics.length === 0) {
            return { total: 0, average: 0, min: 0, max: 0, byType: {} }
        }

        const durations = this.metrics.map((m) => m.duration)
        const byType: Record<string, { count: number; total: number }> = {}

        this.metrics.forEach((m) => {
            if (!byType[m.type]) {
                byType[m.type] = { count: 0, total: 0 }
            }
            byType[m.type].count++
            byType[m.type].total += m.duration
        })

        const byTypeStats: Record<string, { count: number; average: number }> = {}
        Object.keys(byType).forEach((type) => {
            byTypeStats[type] = {
                count: byType[type].count,
                average: byType[type].total / byType[type].count,
            }
        })

        return {
            total: durations.reduce((a, b) => a + b, 0),
            average: durations.reduce((a, b) => a + b, 0) / durations.length,
            min: Math.min(...durations),
            max: Math.max(...durations),
            byType: byTypeStats,
        }
    }

    /**
     * 获取慢操作列表(超过阈值的操作)
     */
    getSlowOperations(threshold: number = 1000): PerformanceMetric[] {
        return this.metrics.filter((m) => m.duration > threshold)
    }

    /**
     * 清空所有记录
     */
    clear(): void {
        this.metrics = []
    }

    /**
     * 导出性能报告
     */
    exportReport(): string {
        const stats = this.getStats()
        const slowOps = this.getSlowOperations()

        return `
=== 性能监控报告 ===
总记录数: ${this.metrics.length}
平均耗时: ${stats.average.toFixed(2)}ms
最小耗时: ${stats.min.toFixed(2)}ms
最大耗时: ${stats.max.toFixed(2)}ms

按类型统计:
${Object.entries(stats.byType)
                .map(([type, data]) => `  ${type}: ${data.count}次, 平均${data.average.toFixed(2)}ms`)
                .join('\n')}

慢操作(>${1000}ms): ${slowOps.length}个
${slowOps.map((op) => `  - ${op.name}: ${op.duration.toFixed(2)}ms`).join('\n')}
        `.trim()
    }
}

// 创建单例实例
export const perfMonitor = new PerformanceMonitor()

// 在控制台输出快捷键提示
if (typeof window !== 'undefined') {
    ; (window as any).__perfReport = () => {
        console.log(perfMonitor.exportReport())
    }
    console.log('[性能监控] 已启用,在控制台输入 __perfReport() 查看报告')
}
