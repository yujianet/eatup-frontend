<template>
  <div class="home-page">
    <!-- TODO 首页顶部增加 DropdownMenu 切换当前库存/含删除，切换排序-->
    <!-- 列表区域 -->
    <van-pull-refresh v-model="isLoading" @refresh="onRefresh">
      <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="onLoad"
      >
        <van-swipe-cell v-for="food in foodList" :key="food.id">
          <div class="food-item">
            <!-- 左侧图片 -->
            <van-image
                width="80"
                height="80"
                :src="'/api' + food.photo_path"
                fit="cover"
            />
            <!-- 中间文字 -->
            <div class="food-info">
              <div class="name">{{ food.name }}</div>
              <div class="remaining-days">
                剩余天数：{{ food.remaining_days }} 天
              </div>
            </div>
          </div>
          <template #right>
            <van-button square text="删除" type="danger" class="delete-button" @click="deleteFood(food.id)" />
          </template>
        </van-swipe-cell>
      </van-list>
    </van-pull-refresh>

    <!-- 侧滑删除后，显示浮动按钮，撤销删除 -->
    <van-floating-bubble v-if="deletedFoods.length > 0" @click="undoDelete" class="undo-button" style="position: fixed; bottom: 20px; left: 20px;">
      <van-icon name="revoke" size="24" />
    </van-floating-bubble>

    <!-- 右下角浮动按钮 -->
    <van-floating-bubble
        axis="xy"
        magnetic="x"
        class="add-button"
        @click="router.push('/add')"
    >
      <van-icon name="plus" size="24" />
    </van-floating-bubble>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import 'vant/es/floating-bubble/style'
import axios from 'axios'
import type { FoodItem } from "../views/types.ts";

// 路由实例
const router = useRouter()

// 食物列表数据（暂用模拟数据，后续替换为 API）
const foodList = ref<FoodItem[]>([])
const loading = ref(false)
const finished = ref(false)
const isLoading = ref(false)
// 保存被删除的食物项
const deletedFoods = ref<FoodItem[]>([])

const fetchFoodList = async () => {
  try {
    const response = await axios.get(`/api/foods/`)
    console.log('获取食物列表成功:', response)
    return response.data.data
  } catch (error) {
    console.error('获取食物列表失败:', error)
    return []
  }
}

const onLoad = async () => {
  const data = await fetchFoodList()
  foodList.value.push(...data)
  loading.value = false
  finished.value = true // 假设只有一页数据
}

const onRefresh = async () => {
  foodList.value = []
  finished.value = false
  loading.value = false // 重置加载状态，让 van-list 自动触发 onLoad
  isLoading.value = false
}

// 删除食物时将食物项添加到 deletedFoods 数组中
const deleteFood = async (foodId: number) => {
  try {
    await axios.delete(`/api/foods/${foodId}`)
    const deletedFood = foodList.value.find(food => food.id === foodId)
    if (deletedFood) {
      deletedFoods.value.push(deletedFood)
    }
    foodList.value = foodList.value.filter(food => food.id !== foodId)
    console.log('删除食物成功:', foodId)
  } catch (error) {
    console.error('删除食物失败:', error)
  }
}

// 新增：撤销删除操作
const undoDelete = async () => {
  if (deletedFoods.value.length > 0) {
    const lastDeletedFood = deletedFoods.value.pop()
    if (lastDeletedFood) {
      try {
        await axios.put(`/api/foods/${lastDeletedFood.id}/undo_delete`)
        foodList.value.push(lastDeletedFood)
        console.log('撤销删除成功:', lastDeletedFood.id)
      } catch (error) {
        console.error('撤销删除失败:', error)
        // 如果撤销失败，将食物项重新添加到 deletedFoods 数组中
        deletedFoods.value.push(lastDeletedFood)
      }
    }
  }
}
</script>

<style scoped>
.food-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.food-info {
  flex: 1;
}

.name {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
}

.remaining-days {
  color: #f44;
  font-size: 14px;
}

.add-button {
  --van-floating-bubble-size: 56px;
  --van-floating-bubble-background: #1989fa;
}

.delete-button {
  height: 100%;
}

.undo-button {
  --van-floating-bubble-size: 56px;
  --van-floating-bubble-background: #ff976a;
}
</style>