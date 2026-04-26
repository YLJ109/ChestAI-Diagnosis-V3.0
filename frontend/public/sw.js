/**
 * Service Worker - 离线缓存支持
 * 实现PWA功能,支持离线访问
 */

const CACHE_NAME = 'patient-portal-v1'
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/patient/mobile',
]

// 安装Service Worker
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...')

    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching static assets')
            return cache.addAll(STATIC_ASSETS)
        })
    )

    // 立即激活新的SW
    self.skipWaiting()
})

// 激活Service Worker
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...')

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name)
                        return caches.delete(name)
                    })
            )
        })
    )

    // 立即控制所有客户端
    self.clients.claim()
})

// 拦截请求
self.addEventListener('fetch', (event) => {
    const { request } = event

    // 只处理GET请求
    if (request.method !== 'GET') return

    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
                console.log('[SW] Cache hit:', request.url)
                return cachedResponse
            }

            // 缓存未命中,从网络获取
            return fetch(request)
                .then((networkResponse) => {
                    // 检查是否是有效响应
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse
                    }

                    // 克隆响应(因为响应流只能读取一次)
                    const responseToCache = networkResponse.clone()

                    // 异步缓存
                    caches.open(CACHE_NAME).then((cache) => {
                        // 只缓存静态资源
                        if (
                            request.url.includes('.js') ||
                            request.url.includes('.css') ||
                            request.url.includes('.png') ||
                            request.url.includes('.jpg') ||
                            request.url.includes('.svg')
                        ) {
                            cache.put(request, responseToCache)
                            console.log('[SW] Cached:', request.url)
                        }
                    })

                    return networkResponse
                })
                .catch((error) => {
                    console.error('[SW] Fetch failed:', error)

                    // 如果是HTML请求失败,返回离线页面
                    if (request.headers.get('accept')?.includes('text/html')) {
                        return caches.match('/index.html')
                    }

                    throw error
                })
        })
    )
})

// 后台同步(可选)
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        console.log('[SW] Background sync triggered')
        event.waitUntil(doBackgroundSync())
    }
})

async function doBackgroundSync() {
    // 实现后台数据同步逻辑
    console.log('[SW] Performing background sync...')
}

// 推送通知(可选)
self.addEventListener('push', (event) => {
    console.log('[SW] Push received')

    const options = {
        body: event.data ? event.data.text() : '新消息',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        vibrate: [200, 100, 200],
        data: {
            url: '/patient/mobile',
        },
    }

    event.waitUntil(
        self.registration.showNotification('胸影智诊', options)
    )
})

// 通知点击事件
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked')

    event.notification.close()

    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    )
})
