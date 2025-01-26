<template>
  <div class="detail-page">
    <!-- 返回按钮 -->
    <van-nav-bar
        title="食物详情"
        left-text="返回"
        left-arrow
        @click-left="$router.back()"
    />

    <!-- 内容区域 -->
    <div v-if="food" class="content">
      <van-image :src="food.photo_path" width="100%" height="200px" fit="cover" />
      <van-cell-group>
        <van-cell title="名称" :value="food.name" />
        <van-cell title="大分类" :value="food.category_large" />
        <van-cell title="小分类" :value="food.category_small" />
        <van-cell title="入库时间" :value="formatDate(food.storage_time)" />
        <van-cell title="保质期天数" :value="food.expiry_days" />
        <van-cell title="剩余天数" :value="food.remaining_days" />
      </van-cell-group>
    </div>

    <!-- 加载状态 -->
    <van-loading v-else size="24px">加载中...</van-loading>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

interface FoodItem {
  id: string
  name: string
  category_large: string
  category_small: string
  storage_time: string
  expiry_days: number
  remaining_days: number
  photo_path: string
}

const route = useRoute()
const food = ref<FoodItem | null>(null)

// 格式化日期显示
const formatDate = (timestamp: string) => {
  return new Date(timestamp).toLocaleString()
}

// 调用接口获取详情
onMounted(async () => {
  try {
    const response = await axios.get(`/foods/${route.params.id}`)
    food.value = response.data
  } catch (error) {
    console.error('获取详情失败:', error)
  }
})
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  background: #f7f8fa;
}
</style>