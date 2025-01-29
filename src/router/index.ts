import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'Home',
            component: () => import('@/views/HomePage.vue')
        },
        {
            path: '/add',
            name: 'AddFood',
            component: () => import('@/views/AddFoodPage.vue')
        }
    ]
})


export default router