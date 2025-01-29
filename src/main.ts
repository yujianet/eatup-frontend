import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import '@/styles/global.css'
import 'vant/lib/index.css';
import '@vant/touch-emulator'

createApp(App).use(router).mount('#app')