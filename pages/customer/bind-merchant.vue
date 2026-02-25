<script setup lang="ts">
/**
 * 客户绑定商户页面
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref } from 'vue'
import { bindMerchant } from '@/api/modules/auth'
import { useUserStore } from '@/stores/modules/user'

const userStore = useUserStore()

// ==================== 状态 ====================

const inviteCode = ref('')
const loading = ref(false)
const scanned = ref(false)

// ==================== 扫码 ====================

/**
 * 处理扫码
 */
const handleScan = async () => {
  try {
    const result = await new Promise<any>((resolve, reject) => {
      uni.scanCode({
        success: resolve,
        fail: reject
      })
    })

    console.log('[Bind Merchant] 扫码结果:', result)

    // 从扫码结果中提取邀请码
    inviteCode.value = result.result || ''
    scanned.value = true

    if (inviteCode.value) {
      uni.showToast({ title: '扫码成功', icon: 'success' })
    }
  } catch (error) {
    console.error('[Bind Merchant] 扫码失败:', error)
    uni.showToast({ title: '扫码失败，请重试', icon: 'none' })
  }
}

// ==================== 绑定 ====================

/**
 * 处理绑定
 */
const handleBind = async () => {
  if (!inviteCode.value) {
    uni.showToast({ title: '请输入或扫描邀请码', icon: 'none' })
    return
  }

  try {
    loading.value = true

    const response = await bindMerchant({
      inviteCode: inviteCode.value
    })

    console.log('[Bind Merchant] 绑定响应:', response)

    if (response?.token) {
      // 保存用户信息
      userStore.setToken(response.token)
      userStore.setUserInfo(response.userInfo)
      userStore.setIdentityType(response.userInfo.identityType)

      uni.showToast({ title: '绑定成功', icon: 'success' })

      // 返回上一页
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    } else {
      uni.showToast({ title: '绑定失败，请重试', icon: 'none' })
    }
  } catch (error) {
    console.error('[Bind Merchant] 绑定失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <view class="bind-merchant-page">
    <!-- 主要内容 -->
    <scroll-view class="page-content" scroll-y>
      <!-- 扫码区域 -->
      <view class="form-section">
        <view class="section-title">
          <wd-icon name="scan" size="32rpx" color="#3B82F6" />
          <text>扫码绑定</text>
        </view>
        <view class="scan-box">
          <view class="scan-icon-large">
            <wd-icon name="scan" size="80rpx" color="#3B82F6" />
          </view>
          <view class="scan-text">使用微信扫一扫快速绑定</view>
          <wd-button class="scan-btn" @click="handleScan" custom-class="scan-btn-custom">
            <wd-icon name="scan" size="32rpx" />
            <text>点击扫码</text>
          </wd-button>
        </view>
      </view>

      <!-- 分割线 -->
      <view class="divider">
        <view class="divider-line"></view>
        <text class="divider-text">或手动输入</text>
        <view class="divider-line"></view>
      </view>

      <!-- 邀请码输入区域 -->
      <view class="form-section">
        <view class="section-title">
          <wd-icon name="edit" size="32rpx" color="#3B82F6" />
          <text>手动输入邀请码</text>
        </view>
        <view class="form-group">
          <wd-input
            v-model="inviteCode"
            placeholder="请输入商户邀请码"
            clearable
          />
        </view>
      </view>

      <!-- 底部占位 -->
      <view style="height: 140rpx;"></view>
    </scroll-view>

    <!-- 底部按钮 -->
    <view class="footer-btns">
      <wd-button 
        type="primary" 
        block 
        size="large"
        :loading="loading" 
        @click="handleBind"
        custom-class="btn-primary-custom"
      >
        确认绑定
      </wd-button>
    </view>
  </view>
</template>

<style lang="scss" scoped>

.bind-merchant-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: $color-bg;
  overflow: hidden;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

.page-content {
  flex: 1;
  padding: 0;
  box-sizing: border-box;
}

.form-section {
  background: $color-white;
  border-radius: $border-radius-lg;
  padding: $spacing-sm;
  margin: $spacing-sm $spacing-md;
}

.section-title {
  font-size: $font-size-content;
  font-weight: 600;
  color: $color-text-primary;
  margin-bottom: $spacing-sm;
  padding-bottom: $spacing-small;
  border-bottom: 2rpx solid #f5f5f5;
  display: flex;
  align-items: center;
  gap: $spacing-small;
}

.scan-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-lg $spacing-md;
}

.scan-icon-large {
  width: 140rpx;
  height: 140rpx;
  background: $color-primary-light;
  border-radius: $border-radius-round;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: $spacing-sm;
}

.scan-text {
  font-size: $font-size-small;
  color: $color-text-regular;
  margin-bottom: $spacing-md;
}

.scan-btn {
  width: 100%;
  height: 80rpx;
  background: $color-white !important;
  border: 2rpx solid #3B82F6 !important;
  border-radius: $border-radius-md;
  color: $color-primary !important;
  font-size: $font-size-content;
}

:deep(.scan-btn-custom) {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-small;
}

.divider {
  display: flex;
  align-items: center;
  margin: $spacing-md $spacing-md $spacing-sm;
}

.divider-line {
  flex: 1;
  height: 2rpx;
  background: $color-border;
}

.divider-text {
  padding: 0 $spacing-md;
  font-size: $font-size-secondary;
  color: $color-text-secondary;
}

.form-group {
  margin-bottom: 0;
}

:deep(.wd-input) {
  width: 100%;
  height: 80rpx;
  background: $color-bg;
  border: 2rpx solid #e5e5e5;
  border-radius: $border-radius-md;
  
  .wd-input__inner {
    font-size: $font-size-content;
    padding: 0 $spacing-sm;
  }
}

.footer-btns {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: $spacing-sm $spacing-lg;
  padding-bottom: calc(#{$spacing-sm} + env(safe-area-inset-bottom));
  background: $color-white;
  box-shadow: $box-shadow-md;
}

:deep(.btn-primary-custom) {
  height: 88rpx;
  border-radius: 44rpx;
  font-size: $font-size-large;
  font-weight: 500;
}
</style>
