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
      <!-- 分类选择 -->
        <van-picker class="category-picker"
            :columns="pickerColumns"
            :show-toolbar="false"
            visible-option-num="5"
            @change="onPickerChange"
            swipe-duration="200"
        />

      <!-- 食物名称和保质期显示 -->
      <div class="name-and-expiry">
        <div class="food-name">
          <van-field
              v-model="formData.name"
              name="name"
              label="食物名称"
              placeholder="请输入名称"
              :rules="[{ required: true, message: '名称不能为空' }]"
          />
        </div>
        <div class="expiry-label">{{ `保质期 ${days_text}` }}</div>
      </div>

      <!-- 保质期选择 -->
      <div style="padding-left:10px; padding-right:10px">
        <van-slider class="slider"
            v-model="sliderValue"
            :max="sliderValueToDays.length-1"
            @update:model-value="onSliderChange"
        />
      </div>

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
import {type PickerChangeEventParams, showToast} from 'vant'
import type {CategoryData, FoodFormData} from "./types.ts";

// --- 摄像头逻辑 ---
const videoRef = ref<HTMLVideoElement | null>(null)
const hasCameraPermission = ref(true)
let mediaStream: MediaStream | null = null

// 初始化摄像头
async function initCamera() {
  try {
    const constraints = {
      video: {
        facingMode: "environment" // "user" 表示前置摄像头，"environment" 表示后置摄像头
      }
    }
    mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
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

// --- 页面主体逻辑 ---
const router = useRouter()

// 返回首页的方法
const goBack = () => {
  router.push('/')
}

// --- 分类展示逻辑 ---
const categories = ref<CategoryData>({})
const categoriesLoading = ref(true) // 加载状态

async function fetchCategories() {
  try {
    const response = await axios.get(`/api/categories`)
    categories.value = response.data.categories
  } catch (error) {
    console.error('获取分类失败:', error)
    showToast('分类加载失败')
    categories.value = {} // 清空数据
  } finally {
    categoriesLoading.value = false
  }
}
const pickerColumns = computed(() => {
  // 大小分类选项：将对象键转换为 { text, value, children }
  // 第一列：大分类
  return Object.keys(categories.value).map((key) => ({
    text: key,
    value: key,
    children: Object.keys(categories.value[key]).map((smallKey) => ({
      // 第二列：小分类
      text: `${smallKey}(${categories.value[key][smallKey]})`,
      value: smallKey
    }))
  }))
})
const onPickerChange = (params: PickerChangeEventParams) => {
  let [cate_l, cate_s] = params.selectedValues
  formData.value.category_large = cate_l
  formData.value.category_small = cate_s
  formData.value.name = cate_s
  const expiry_days = categories.value[cate_l][cate_s]
  formData.value.expiry_days = expiry_days
  let [lastVal, lastDays, finnalVal] = [0,0,0]
  for (let val=0;val<sliderValueToDays.length;val++) {
    let days = sliderValueToDays[val]
    let prevDistance = Math.abs(lastDays - days )
    let nextDistance = Math.abs(days - expiry_days)
    finnalVal = prevDistance < nextDistance ? lastVal : val
    if (days >= expiry_days) {break}
    [lastVal, lastDays] = [val, days]
  }
  sliderValue.value = finnalVal
  //showToast('当前值：' + finnalVal);
}

// --- 保质期标签 ---
const days_text = computed(() => {
  const totalDays = formData.value.expiry_days

  if (totalDays <= 30) {
    return `${totalDays} 天`;
  } else if (totalDays > 30 && totalDays < 365) {
    const months = totalDays / 30.4;
    let integerMonths = Math.floor(months);
    const decimalPart = months - integerMonths;

    let fractionalPart = '';
    if (decimalPart > 0.75) {
      integerMonths++
    } else if (decimalPart > 0.25) {
      fractionalPart = '.5'
    }

    return `${integerMonths}${fractionalPart} 个月`
  } else {
    const years = Math.floor(totalDays / 365);
    const remainingDays = totalDays % 365;
    const months = Math.floor(remainingDays / 30.4);
    if (months == 0) {
      return `${years} 年`
    }
    if (months == 6) {
      return `${years} 年半`
    }
    return `${years} 年 ${months} 个月`;
  }
});

// --- 保质期拖动条 ---
const sliderValue = ref(1)
const sliderValueToDays = [
    4,   // 4 天
    7,   // 7 天
    10,  // 10 天
    14,  // 14 天
    31,  // 1 个月
    61,  // 2 个月
    92,  // 3 个月
    183, // 6 个月
    274, // 9 个月
    365, // 1 年
    548, // 1 年半
    730, // 2 年
]
const onSliderChange = (value: number) => {
  sliderValue.value = value
  formData.value.expiry_days = sliderValueToDays[value] || 1
}


// --- 提交表单 ---
const formData = ref<FoodFormData>({
  name: '',
  category_large: '',
  category_small: '',
  expiry_days: 1,
  photo_path: ''
})
const isSubmitting = ref(false)
const onSubmit = async () => {
  try {
    isSubmitting.value = true;

    // 1. 拍照
    const photoBlob = await takePhoto();
    // 2. 上传图片（模拟）
    formData.value.photo_path = await uploadPhoto(photoBlob);
    // 3. 提交数据到后端
    await axios.post('/api/foods/', formData.value);

    showToast('保存成功');
    await router.push('/');
  } catch (error) {
    showToast('保存失败，请重试');
  } finally {
    isSubmitting.value = false;
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
    const response = await axios.post('/api/foods/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    console.log(response.data);
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

.add-food-page {
  padding: 12px;
}

.camera-preview {
  position: relative;
  width: 100%;
  max-width: 500px;
  height: 100%;
  max-height: 500vh;
  border-radius: 16px;
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

.name-and-expiry {
  display: flex;
  align-items: center;
}

.food-name {
  margin-left: 10px; /* 外边距 */
  flex-grow: 1;
}

.expiry-label {
  display: inline-flex;
  flex-shrink: 0;
  margin-left: 10px;
  padding: 5px 10px;
  background-color: rgba(255, 255, 255, 0.8);
  border: 1px solid #517451;
  border-radius: 8px;
  color: #517451;
  font-size: 14px;
}

.category-picker {
  border: 1px solid #ccc; /* 浅灰色边框 */
  border-radius: 8px; /* 圆角 */
  padding: 10px; /* 内边距 */
  margin: 10px; /* 外边距 */
}

.slider {
  display: inline-flex;
  flex-shrink: 0;
  margin-top: 16px;
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