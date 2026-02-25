<script setup lang="ts">
/**
 * 横屏签名页面 - 通用横屏方案
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, onMounted } from 'vue'

const signatureRef = ref<any>(null)
const height = ref(0)
const width = ref(0)
const inited = ref(false)

const handleSignatureConfirm = (result: any) => {
  if (result.success && result.tempFilePath) {
    // 返回上一页并传递签名数据
    const pages = getCurrentPages()
    const prevPage = pages[pages.length - 2] as any
    
    if (prevPage && prevPage.$vm && prevPage.$vm.onSignatureComplete) {
      prevPage.$vm.onSignatureComplete(result.tempFilePath)
    }
    
    uni.navigateBack()
  } else {
    uni.showToast({ title: '签名保存失败', icon: 'none' })
  }
}

const handleCancel = () => {
  uni.navigateBack()
}

// 使用 pause 工具函数（如果没有则用 setTimeout）
const pause = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

onMounted(() => {
  const { windowWidth, windowHeight } = uni.getSystemInfoSync()
  width.value = windowWidth - 48
  height.value = windowHeight - 48
  
  pause(100).then(() => {
    inited.value = true
  })
})
</script>

<template>
  <view class="landscape-signature">
    <wd-signature
      v-if="inited"
      ref="signatureRef"
      :height="height"
      :width="width"
      :pen-color="'#000000'"
      :line-width="5"
      enable-history
      pressure
      background-color="#f5f5f5"
      @confirm="handleSignatureConfirm"
    >
      <template #footer="{ clear, confirm, restore, revoke, canUndo, canRedo }">
        <view class="custom-actions">
          <view class="button-group">
            <wd-button size="small" plain @click="handleCancel">取消</wd-button>
            <wd-button size="small" plain @click="revoke" :disabled="!canUndo">撤回</wd-button>
            <wd-button size="small" plain @click="restore" :disabled="!canRedo">恢复</wd-button>
            <wd-button size="small" plain @click="clear">清除</wd-button>
            <wd-button size="small" type="primary" @click="confirm">完成</wd-button>
          </view>
        </view>
      </template>
    </wd-signature>
  </view>
</template>

<style lang="scss" scoped>
.landscape-signature {
  height: 100vh;
  // #ifdef H5
  height: calc(100vh - 44px);
  // #endif
  background: #fff;
  position: relative;
  padding: 24rpx 0;
  padding-left: 96rpx;
  box-sizing: border-box;
  
  .custom-actions {
    position: fixed;
    left: 0;
    top: 50%;
    width: 96rpx;
    transform: translateY(-50%) rotate(90deg);
    transform-origin: center;
    z-index: 10;
    
    .button-group {
      display: flex;
      flex-direction: row;
      gap: 24rpx;
      white-space: nowrap;
      width: max-content;
      transform: translateX(-50%);
    }
  }
}
</style>

