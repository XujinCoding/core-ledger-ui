<script setup lang="ts">
/**
 * 图片上传组件
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, computed } from 'vue'
import { uploadImage } from '@/api/modules/file'

const props = withDefaults(defineProps<{
  /** 图片路径（objectKey，用于保存到数据库） */
  modelValue?: string
  /** 预览URL（用于显示图片） */
  previewUrl?: string
  /** 宽度 */
  width?: string
  /** 高度 */
  height?: string
  /** 占位文字 */
  placeholder?: string
  /** 是否圆形 */
  round?: boolean
  /** 是否禁用 */
  disabled?: boolean
}>(), {
  width: '200rpx',
  height: '200rpx',
  placeholder: '上传图片',
  round: false,
  disabled: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'update:previewUrl', value: string): void
  (e: 'success', path: string, url: string): void
  (e: 'error', error: any): void
}>()

const uploading = ref(false)
const currentPreviewUrl = ref(props.previewUrl || props.modelValue || '')

// 显示的图片URL（优先使用previewUrl，否则使用modelValue）
const displayUrl = computed(() => {
  return currentPreviewUrl.value || props.previewUrl || props.modelValue || ''
})

// 样式
const containerStyle = computed(() => ({
  width: props.width,
  height: props.height,
  borderRadius: props.round ? '50%' : '16rpx'
}))

// 选择并上传图片
const handleChoose = async () => {
  if (props.disabled || uploading.value) return

  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const filePath = res.tempFilePaths[0]
      await handleUpload(filePath)
    },
    fail: (err) => {
      if (!err.errMsg?.includes('cancel')) {
        uni.showToast({ title: '选择图片失败', icon: 'none' })
      }
    }
  })
}

// 上传图片
const handleUpload = async (filePath: string) => {
  try {
    uploading.value = true
    const result = await uploadImage(filePath)
    
    // 更新路径（用于保存到数据库）
    emit('update:modelValue', result.path)
    
    // 更新预览URL（用于立即显示）
    currentPreviewUrl.value = result.url
    emit('update:previewUrl', result.url)
    
    emit('success', result.path, result.url)
  } catch (error) {
    console.error('上传图片失败:', error)
    emit('error', error)
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <view 
    class="image-uploader" 
    :style="containerStyle"
    :class="{ disabled: disabled, round: round }"
    @tap="handleChoose"
  >
    <!-- 已上传图片 -->
    <image 
      v-if="displayUrl" 
      :src="displayUrl" 
      mode="aspectFill" 
      class="preview-image"
      :style="containerStyle"
    />
    <!-- 上传中 -->
    <view v-else-if="uploading" class="upload-loading">
      <wd-loading size="40rpx" />
      <text>上传中...</text>
    </view>
    <!-- 占位 -->
    <view v-else class="upload-placeholder">
      <wd-icon name="add" size="48rpx" color="#999" />
      <text>{{ placeholder }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.image-uploader {
  position: relative;
  overflow: hidden;
  background: $color-bg;
  border: 2rpx dashed #ddd;

  &.round {
    border-radius: 50% !important;
  }

  &.disabled {
    opacity: 0.6;
  }
}

.preview-image {
  width: 100%;
  height: 100%;
  display: block;
}

.upload-loading,
.upload-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12rpx;

  text {
    font-size: $font-size-secondary;
    color: $color-text-secondary;
  }
}
</style>
