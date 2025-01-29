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
        // },
        // {
        //     // 添加 404 处理
        //     path: '/:pathMatch(.*)*',
        //     component: () => import('@/views/NotFound.vue')
        }
    ]
})


export default router