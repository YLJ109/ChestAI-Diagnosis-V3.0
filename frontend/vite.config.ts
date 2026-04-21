import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      imports: ['vue', 'vue-router', 'pinia'],
      dts: 'src/auto-imports.d.ts',
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: 'src/components.d.ts',
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    // ✅ 新增：开启局域网访问（手机必备）
    host: true,
    proxy: {
      '/api': {
        // ✅ 修改：把 localhost 换成【你的电脑局域网IP】
        target: 'http://192.168.31.210:5000',
        changeOrigin: true,
      },
      '/static': {
        // ✅ 修改：和上面保持一致
        target: 'http://192.168.31.210:5000',
        changeOrigin: true,
      },
    },
  },
})