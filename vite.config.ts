import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from 'unplugin-vue-components/resolvers'
import { resolve } from 'path'

export default defineConfig({
  base: './',
  plugins: [
    vue(),
    Components({
      resolvers: [VantResolver()], // 自动按需引入 Vant 组件
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src') // 确保 @ 指向 src 目录
    }
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: ['eatup-test.i.yujianet.cn', 'eatup.i.yujianet.cn'],
    proxy: {
      '/api': {
        target: 'http://198.18.9.21:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})