<script setup lang="ts">
/**
 * 首页 - 登录成功后的首页
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { useUserStore } from '@/stores/modules/user'

const userStore = useUserStore()

// 使用 uni 的 showToast 替代 WOT-UI 的 useToast
const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'error') => {
  uni.showToast({
    title: message,
    icon: type === 'success' ? 'success' : 'none',
    duration: 2000
  })
}

/**
 * 处理登出
 */
const handleLogout = () => {
  userStore.logout()
}
</script>

<template>
  <view class="home-page">
    <!-- 顶部欢迎区域 -->
    <view class="header">
      <view class="welcome-card">
        <text class="welcome-title">欢迎使用</text>
        <text class="welcome-subtitle">Core Ledger</text>
      </view>
    </view>

    <!-- 主要内容区域 -->
    <view class="content">
      <view class="placeholder">
        <text class="placeholder-text">首页功能开发中...</text>
      </view>
    </view>

    <!-- 底部操作区域 -->
    <view class="footer">
      <wd-button
        type="danger"
        block
        size="large"
        @click="handleLogout"
      >
        登出
      </wd-button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.home-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.header {
  flex: 0 0 auto;
  padding: 40rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  .welcome-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60rpx 40rpx;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 16rpx;
    backdrop-filter: blur(10px);
    color: white;

    .welcome-title {
      font-size: 32rpx;
      opacity: 0.9;
      margin-bottom: 8rpx;
    }

    .welcome-subtitle {
      font-size: 48rpx;
      font-weight: bold;
      text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
    }
  }
}

.content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;

  .placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 300rpx;
    background: white;
    border-radius: 12rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);

    .placeholder-text {
      font-size: 28rpx;
      color: #999;
    }
  }
}

.footer {
  flex: 0 0 auto;
  padding: 40rpx;
  background: white;
  border-top: 1rpx solid #eee;
}
</style>
