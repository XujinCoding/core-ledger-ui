<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { UserInfoVO } from '@/types/auth'

const userInfo = ref<UserInfoVO | null>(null)

onMounted(() => {
  // 从本地存储获取用户信息
  const userInfoStr = uni.getStorageSync('USER_INFO')
  if (userInfoStr) {
    userInfo.value = JSON.parse(userInfoStr)
  }
})

/**
 * 登出
 */
const handleLogout = () => {
  uni.showModal({
    title: '确认登出',
    content: '确定要登出吗？',
    success: (res) => {
      if (res.confirm) {
        uni.removeStorageSync('ACCESS_TOKEN')
        uni.removeStorageSync('USER_INFO')
        uni.removeStorageSync('IDENTITY_TYPE')

        uni.reLaunch({
          url: '/pages/login/index'
        })
      }
    }
  })
}

</script>

<template>
  <view class="home-page">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="user-header">
        <view class="user-avatar">
          <text class="avatar-placeholder">👤</text>
        </view>
        <view class="user-info">
          <text class="user-name">{{ userInfo?.name || '默认用户' }}</text>
          <text class="user-phone">{{ userInfo?.phone || '' }}</text>
        </view>
      </view>

      <view class="user-identity">
        <text v-if="userInfo?.identityType === 'MERCHANT_OWNER'" class="identity-badge merchant">
          商户
        </text>
        <text v-else-if="userInfo?.identityType === 'CUSTOMER'" class="identity-badge customer">
          客户
        </text>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section">
      <text class="section-title">功能菜单</text>
      <view class="menu-grid">
        <view class="menu-item">
          <text class="menu-icon">📊</text>
          <text class="menu-label">账本管理</text>
        </view>
        <view class="menu-item">
          <text class="menu-icon">🛍️</text>
          <text class="menu-label">商品管理</text>
        </view>
        <view class="menu-item">
          <text class="menu-icon">👥</text>
          <text class="menu-label">客户管理</text>
        </view>
        <view class="menu-item">
          <text class="menu-icon">⚙️</text>
          <text class="menu-label">设置</text>
        </view>
      </view>
    </view>

    <!-- 登出按钮 -->
    <view class="footer">
      <button class="btn-logout" @click="handleLogout">登出</button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.home-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
  padding-bottom: 100rpx;
}

.user-card {
  background: white;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);

  .user-header {
    display: flex;
    gap: 16rpx;
    margin-bottom: 16rpx;

    .user-avatar {
      width: 80rpx;
      height: 80rpx;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      justify-content: center;
      align-items: center;

      .avatar-img,
      .avatar-placeholder {
        font-size: 40rpx;
      }
    }

    .user-info {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 8rpx;

      .user-name {
        font-size: 30rpx;
        color: #333;
        font-weight: bold;
      }

      .user-phone {
        font-size: 24rpx;
        color: #999;
      }
    }
  }

  .user-identity {
    display: flex;
    gap: 8rpx;

    .identity-badge {
      display: inline-block;
      padding: 6rpx 12rpx;
      border-radius: 20rpx;
      font-size: 22rpx;
      font-weight: bold;
      color: white;

      &.merchant {
        background: #667eea;
      }

      &.customer {
        background: #19be6b;
      }
    }
  }
}

.menu-section {
  background: white;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);

  .section-title {
    display: block;
    font-size: 28rpx;
    color: #333;
    font-weight: bold;
    margin-bottom: 16rpx;
  }

  .menu-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16rpx;
  }

  .menu-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24rpx;
    background: #f9f9f9;
    border-radius: 8rpx;
    gap: 8rpx;

    &:active {
      background: #f0f0f0;
    }

    .menu-icon {
      font-size: 40rpx;
    }

    .menu-label {
      font-size: 24rpx;
      color: #333;
      font-weight: 500;
    }
  }
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx;
  background: white;
  border-top: 2rpx solid #e0e0e0;

  .btn-logout {
    width: 100%;
    padding: 16rpx 0;
    background: #f56c6c;
    color: white;
    border: none;
    border-radius: 6rpx;
    font-size: 28rpx;
    font-weight: bold;
  }
}
</style>
