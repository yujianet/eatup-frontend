import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // 稍后会配置路由
import '@/styles/global.css'

createApp(App).use(router).mount('#app')