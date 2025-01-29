<template>
  <div class="add-food-page">
    <!-- 返回按钮 -->
    <van-button icon="arrow-left" class="back-button" @click="goBack" />
    <!-- 摄像头预览区域 -->
    <div class="camera-preview">
      <video ref="videoRef" class="video-stream" autoplay muted playsinline></video>
      <van-overlay :show="!hasCameraPermission" class="overlay">
        <div class="overlay-text">
          <van-icon name="warning" size="24" />
          <p>摄像头权限未开启</p>
        </div>
      </van-overlay>
    </div>

    <!-- 表单区域 -->
    <van-form @submit="onSubmit" class="form-container">
      <!-- 食物名称 -->
      <van-field
          v-model="formData.name"
          name="name"
          label="食物名称"
          placeholder="请输入名称"
          :rules="[{ required: true, message: '名称不能为空' }]"
      />

      <!-- 分类选择 -->
      <van-field
          v-model="formData.category_small"
          is-link
          readonly
          label="分类"
          placeholder="选择分类"
          @click="onCategoryFieldClick"
      />
      <van-popup v-model:show="showCategoryPicker" destroy-on-close round position="bottom">
        <template v-if="categoriesLoading">
          <div style="padding: 20px; text-align: center">
            <van-loading size="24px">加载分类中...</van-loading>
          </div>
        </template>
        <template v-else-if="Object.keys(categories).length === 0">
          <div style="padding: 20px; color: var(--van-gray-6); text-align: center">
            <van-icon name="warning" size="24px" />
            <p>暂无分类数据</p>
          </div>
        </template>
        <van-picker
            v-else
            title="选择分类"
            :columns="pickerColumns"
            @cancel="showCategoryPicker = false"
            @confirm="onCategoryPickerConfirm"
        />
      </van-popup>

      <!-- 保质期选择 -->
      <van-slider
          v-model="formData.expiry_days">
        <template #button>
          <div class="slider-button">{{ formData.expiry_days }}</div>
        </template>
      </van-slider>

      <!-- 保存按钮 -->
      <div class="submit-button">
        <van-button
            round
            block
            type="primary"
            native-type="submit"
            :loading="isSubmitting"
            loading-text="保存中..."
        >
          保存
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref} from 'vue'
import {useRouter} from 'vue-router'
import axios from 'axios'
import {showToast} from 'vant'
import type {CategoryData, FoodFormData} from "./types.ts";
import { API_BASE_URL } from '../config/index.ts'

// 修改后的后端地址配置
const categories = ref<CategoryData>({})
const categoriesLoading = ref(true) // 加载状态

async function fetchCategories() {
  try {
    const response = await axios.get(`${API_BASE_URL}/categories`)
    categories.value = response.data.categories
  } catch (error) {
    console.error('获取分类失败:', error)
    showToast('分类加载失败')
    categories.value = {} // 清空数据
  } finally {
    categoriesLoading.value = false
  }
}

// --- 摄像头逻辑 ---
const videoRef = ref<HTMLVideoElement | null>(null)
const hasCameraPermission = ref(true)
let mediaStream: MediaStream | null = null

// 初始化摄像头
async function initCamera() {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ video: true })
    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream
    }
  } catch (error) {
    hasCameraPermission.value = false
    showToast('请允许摄像头权限')
  }
}

// 清理摄像头资源
function cleanupCamera() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop())
  }
}

// --- 表单逻辑 ---
const router = useRouter()

// 返回首页的方法
const goBack = () => {
  router.push('/')
}

const isSubmitting = ref(false)

// 大小分类选项：将对象键转换为 { text, value, children }
const pickerColumns = computed(() => {
  // 第一列：大分类
  return Object.keys(categories.value).map((key) => ({
    text: key,
    value: key,
    children: Object.keys(categories.value[key]).map((smallKey) => ({
      text: smallKey,
      value: smallKey
    }))
  }))
})

const showCategoryPicker = ref(false);
function onCategoryFieldClick() {
  showCategoryPicker.value = true
  if (!categoriesLoading.value && Object.keys(categories.value).length != 0) return
  fetchCategories()
}
function onCategoryPickerConfirm(eventData: {selectedValues: string[]}) {
  showCategoryPicker.value = false
  // console.log(eventData.selectedValues)
  // console.log(typeof eventData.selectedValues)
  const [cl, cs] = eventData.selectedValues
  formData.value.category_large = cl
  formData.value.category_small = cs
  formData.value.name = cs + "-自定义"
  formData.value.expiry_days = categories.value[cl][cs]
  // console.log(formData.value.expiry_days)
}


const formData = ref<FoodFormData>({
  name: '',
  category_large: '',
  category_small: '',
  expiry_days: 1,
  photo_path: ''
})


// 提交表单
const onSubmit = async () => {
  try {
    isSubmitting.value = true

    // 1. 拍照
    const photoBlob = await takePhoto()
    // 2. 上传图片（模拟）
    formData.value.photo_path = await uploadPhoto(photoBlob)
    // 3. 提交数据到后端
    await axios.post(`${API_BASE_URL}/foods/`, formData.value)

    showToast('保存成功')
    await router.push('/')
  } catch (error) {
    showToast('保存失败，请重试')
  } finally {
    isSubmitting.value = false
  }
}

// 拍照功能
const takePhoto = (): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const video = videoRef.value
    if (!video) return reject('摄像头未初始化')

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    canvas.toBlob(blob => {
      if (blob) resolve(blob)
      else reject('拍照失败')
    }, 'image/jpeg')
  })
}

const uploadPhoto = async (blob: Blob): Promise<string> => {
  const formData = new FormData();
  formData.append('file', blob);

  try {
    const response = await axios.post(`${API_BASE_URL}/foods/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    console.log(response.data)
    return response.data.path;
  } catch (error) {
    console.error('图片上传失败:', error);
    throw error;
  }
}

// 生命周期
onMounted(() => {
      initCamera()
      fetchCategories()
})
onUnmounted(cleanupCamera)
</script>

<style scoped>

.slider-button {
  width: 26px;
  color: #fff;
  font-size: 10px;
  line-height: 18px;
  text-align: center;
  background-color: var(--van-primary-color);
  border-radius: 100px;
}

.add-food-page {
  padding: 12px;
}

.camera-preview {
  position: relative;
  width: 100%;
  max-width: 500px;
  height: 100%;
  max-height: 500px;
  border-radius: 8px;
  overflow: hidden;
  margin: 0 auto; /* 居中显示 */
}

.video-stream {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.overlay {
  display: flex;
  align-items: center;
  justify-content: center;
}

.overlay-text {
  text-align: center;
  color: white;
}

.expiry-picker {
  margin: 16px 0;
}

.submit-button {
  margin-top: 24px;
}

.back-button {
  position: absolute;
  top: 12px;
  left: 12px;
  background-color: rgba(255, 255, 255, 0.5);
  border: none;
  z-index: 10;
}
</style>