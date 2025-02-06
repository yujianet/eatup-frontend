<template>
  <div class="add-food-page">
    <!-- 返回按钮 -->
    <van-button icon="arrow-left" class="back-button" @click="goBack"/>
    <!-- 摄像头预览区域 -->
    <div class="camera-preview">
      <video ref="videoRef" class="video-stream" autoplay muted playsinline></video>
      <canvas ref="capturedImageRef" class="captured-image" v-show="showCapturedImage"></canvas>
      <van-overlay :show="!hasCameraPermission" class="overlay">
        <div class="overlay-text">
          <van-icon name="warning" size="24"/>
          <p>摄像头权限未开启</p>
        </div>
      </van-overlay>
    </div>

    <!-- 表单区域 -->
    <van-form @submit="onSubmit" class="form-container">
      <!-- 食物名称和保质期显示 -->
      <div class="name-and-expiry">
        <div class="food-name">
          <van-field
              v-model="formData.food_name"
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
          plain
          icon="scan"
          color="#7232dd"
          style="width: 120px; margin: 0 6px"
        @click="toggleAIRecognition">
          {{ aiRecognitionRunning ? '停止识别' : 'AI识别' }}
        </van-button>
        <van-button
            round
            type="primary"
            native-type="submit"
            :loading="isSubmitting"
            loading-text="保存中..."
            style="flex-grow: 1; margin: 0 6px"
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
import type {FoodFormData, RecognitionResult} from "./types.ts";

// --- 摄像头逻辑 ---
const videoRef = ref<HTMLVideoElement | null>(null)
const capturedImageRef = ref<HTMLCanvasElement | null>(null)
const showCapturedImage = ref(false)
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
  30,  // 1 个月
  60,  // 2 个月
  90,  // 3 个月
  180, // 6 个月
  270, // 9 个月
  365, // 1 年
  548, // 1 年半
  730, // 2 年
]
const onSliderChange = (value: number) => {
  sliderValue.value = value
  formData.value.expiry_days = sliderValueToDays[value] || 1
}
const onExpiryDaysChange = (expiry_days: number) => {
  let [lastVal, lastDays, finalVal] = [0, 0, 0]
  for (let val = 0; val < sliderValueToDays.length; val++) {
    let days = sliderValueToDays[val]
    let prevDistance = Math.abs(lastDays - days)
    let nextDistance = Math.abs(days - expiry_days)
    finalVal = prevDistance < nextDistance ? lastVal : val
    if (days >= expiry_days) {
      break
    }
    [lastVal, lastDays] = [val, days]
  }
  sliderValue.value = finalVal
  //showToast('当前值：' + finalVal);
}


// --- 提交表单 ---
const formData = ref<FoodFormData>({
  food_name: '',
  expiry_days: 1,
  photo_path: ''
})
const isSubmitting = ref(false)
const onSubmit = async () => {
  try {
    isSubmitting.value = true;

    // 1. 拍照
    const photoBlob = await takePhoto();
    // 2. 上传图片 保存名称
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
    // 如果有固定的画面，使用固定的画面
    if (showCapturedImage.value && capturedImageRef.value) {
      capturedImageRef.value.toBlob(blob => {
        if (blob) resolve(blob)
        else reject('获取固定画面失败')
      }, 'image/jpeg')
      return
    }

    // 否则使用实时视频画面
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

// --- AI识别逻辑 ---
const aiRecognitionRunning = ref(false)

const toggleAIRecognition = () => {
  if (aiRecognitionRunning.value) {
    stopAIRecognition()
  } else {
    startAIRecognition()
  }
}

// 延迟函数：等待指定的毫秒数
const delay = (ms: number) => {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

const startAIRecognition = async () => {
  // 清除固定的画面
  showCapturedImage.value = false
  const canvas = capturedImageRef.value
  if (canvas) {
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  aiRecognitionRunning.value = true
  
  // 串行执行识别
  while (aiRecognitionRunning.value) {
    try {
      // 1. 拍照
      const photoBlob = await takePhoto()
      
      // 2. 发送识别请求
      const response = await axios.post('/api/image-recognition/', {'file': photoBlob}, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // 3. 处理识别结果
      const recognitionResult = ref<RecognitionResult>( {} as RecognitionResult)
      recognitionResult.value = response.data
      showToast(`${recognitionResult.value.food_name}(${recognitionResult.value.confidence})`)
      
      // 4. 检查是否识别成功
      if (recognitionResult.value.confidence > 0.94) {
        // 停止识别循环
        aiRecognitionRunning.value = false
        
        // 将当前画面固定到canvas上
        const video = videoRef.value
        const canvas = capturedImageRef.value
        if (video && canvas) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(video, 0, 0)
            showCapturedImage.value = true
          }
        }
        
        // 更新表单数据
        formData.value.food_name = recognitionResult.value.food_name
        formData.value.expiry_days = recognitionResult.value.expiry_days
        onExpiryDaysChange(recognitionResult.value.expiry_days)
        break
      }
      
      // 5. 等待1秒后继续下一次识别
      await delay(1000)
    } catch (error) {
      console.error('AI识别失败:', error)
      // 发生错误时也等待1秒再继续
      await delay(1000)
    }
  }
}

const stopAIRecognition = () => {
  aiRecognitionRunning.value = false
}

// 生命周期
onMounted(() => {
  initCamera()
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
  max-width: 95vw;
  height: 100%;
  max-height: 40vh;
  border-radius: 16px;
  overflow: hidden;
  margin: 0 auto 8px;
}

.video-stream {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.captured-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 5;
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

.slider {
  display: inline-flex;
  flex-shrink: 0;
  margin-top: 16px;
}

.submit-button {
  margin-top: 24px;
  display: flex;
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