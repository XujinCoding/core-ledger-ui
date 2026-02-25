<script setup lang="ts">
/**
 * 协议详情弹窗组件
 * @author Core Ledger Team
 * @since 1.0.0
 */

interface Props {
  visible: boolean
  title: string
  content: string
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

/**
 * 关闭弹窗
 */
const handleClose = () => {
  emit('update:visible', false)
  emit('close')
}

/**
 * 点击遮罩层关闭
 */
const handleMaskClick = () => {
  handleClose()
}
</script>

<template>
  <wd-popup
    v-model="props.visible"
    position="center"
    :close-on-click-modal="true"
    custom-style="width: 85%; max-height: 80vh; border-radius: 16rpx; overflow: hidden;"
    @close="handleClose"
  >
    <view class="agreement-modal">
      <!-- 标题栏 -->
      <view class="modal-header">
        <text class="modal-title">{{ props.title }}</text>
        <view class="close-btn" @click="handleClose">
          <wd-icon name="close" size="40rpx" color="#666" />
        </view>
      </view>

      <!-- 内容区域 -->
      <scroll-view class="modal-content" scroll-y :show-scrollbar="true">
        <view class="content-wrapper">
          <rich-text :nodes="props.content" />
        </view>
      </scroll-view>

      <!-- 底部按钮 -->
      <view class="modal-footer">
        <wd-button type="primary" size="large" block @click="handleClose">
          我知道了
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<style lang="scss" scoped>
.agreement-modal {
  display: flex;
  flex-direction: column;
  max-height: 80vh;
  background-color: $color-white;
}

.modal-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx 32rpx 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
  flex-shrink: 0;
}

.modal-title {
  font-size: $font-size-xlarge;
  font-weight: 600;
  color: $color-text-primary;
}

.close-btn {
  position: absolute;
  right: 32rpx;
  top: 32rpx;
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.modal-content {
  flex: 1;
  height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.content-wrapper {
  padding: 32rpx;
}

.modal-footer {
  padding: 24rpx 32rpx 32rpx;
  border-top: 1rpx solid #f0f0f0;
  flex-shrink: 0;
}

// 协议内容样式
:deep(.agreement-content) {
  font-size: $font-size-content;
  line-height: 1.8;
  color: $color-text-primary;

  h2 {
    font-size: $font-size-title;
    font-weight: 600;
    color: $color-text-primary;
    margin: 32rpx 0 16rpx;
    padding-bottom: 12rpx;
    border-bottom: 2rpx solid #e0e0e0;

    &:first-child {
      margin-top: 0;
    }
  }

  h3 {
    font-size: $font-size-large;
    font-weight: 600;
    color: $color-text-primary;
    margin: 24rpx 0 12rpx;
  }

  h4 {
    font-size: $font-size-content;
    font-weight: 600;
    color: $color-text-primary;
    margin: 16rpx 0 8rpx;
  }

  p {
    margin: 12rpx 0;
    text-align: justify;
    color: $color-text-regular;
  }

  ul {
    margin: 12rpx 0;
    padding-left: 32rpx;
  }

  li {
    margin: 8rpx 0;
    color: $color-text-regular;
    list-style: disc;
    line-height: 1.8;
  }

  strong {
    font-weight: 600;
    color: $color-text-primary;
  }

  .agreement-footer {
    margin-top: 32rpx;
    padding-top: 24rpx;
    border-top: 1rpx solid #e0e0e0;
    text-align: center;
    color: $color-text-secondary;
    font-size: $font-size-small;
  }
}
</style>
