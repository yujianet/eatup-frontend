import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'Home',
            component: () => import('@/views/HomePage.vue') // 稍后创建
        },
        {
            path: '/add',
            name: 'AddFood',
            component: () => import('@/views/AddFoodPage.vue') // 稍后创建
        }
    ]
})

export default router