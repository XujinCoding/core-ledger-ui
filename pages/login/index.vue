<script setup lang="ts">
import { ref } from 'vue'
import { IdentityType } from '@/enums'
import { useWechatLogin } from '@/composables/useWechatLogin'

// 身份选择选项
const identityOptions = [
  { label: '商户登录', value: IdentityType.MERCHANT_OWNER },
  { label: '客户登录', value: IdentityType.CUSTOMER }
]

// 响应式数据
const selectedIdentity = ref<IdentityType | null>(IdentityType.CUSTOMER)
const { loading, handleWechatLogin, handleLoginResponse } = useWechatLogin()

/**
 * 处理微信登录
 */
const onWechatLogin = async () => {
  if (selectedIdentity.value === null) {
    uni.showToast({
      title: '请选择身份',
      icon: 'error',
      duration: 2000
    })
    return
  }

  const response = await handleWechatLogin(selectedIdentity.value)
  await handleLoginResponse(response)
}
</script>

<template>
  <view class="login-page">
    <!-- 背景装饰 -->
    <view class="login-bg">
      <view class="bg-circle bg-circle-1"></view>
      <view class="bg-circle bg-circle-2"></view>
    </view>

    <!-- 登录容器 -->
    <view class="login-container">
      <!-- Logo 和标题 -->
      <view class="login-header">
        <view class="logo">📚</view>
        <text class="title">Core Ledger</text>
        <text class="subtitle">账本管理系统</text>
      </view>

      <!-- 身份选择 -->
      <view class="form-group">
        <text class="form-label">选择身份</text>
        <picker
          :range="identityOptions"
          range-key="label"
          @change="(e) => selectedIdentity = identityOptions[e.detail.value].value"
        >
          <view class="picker-input">
            <text>{{ identityOptions.find(opt => opt.value === selectedIdentity)?.label || '请选择身份' }}</text>
            <text class="icon">▼</text>
          </view>
        </picker>
      </view>

      <!-- 微信登录按钮 -->
      <view class="form-group">
        <button
          class="btn-wechat"
          :loading="loading"
          @click="onWechatLogin"
        >
          <text class="icon">🔐</text>
          <text>微信一键登录</text>
        </button>
      </view>

      <!-- 提示信息 -->
      <view class="tips">
        <text>首次登录将自动创建账户</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.login-bg {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  overflow: hidden;

  .bg-circle {
    position: absolute;
    border-radius: 50%;
    opacity: 0.1;

    &.bg-circle-1 {
      width: 300rpx;
      height: 300rpx;
      top: -100rpx;
      right: -100rpx;
      background: white;
    }

    &.bg-circle-2 {
      width: 200rpx;
      height: 200rpx;
      bottom: -50rpx;
      left: -50rpx;
      background: white;
    }
  }
}

.login-container {
  position: relative;
  z-index: 1;
  width: 90%;
  max-width: 400rpx;
  background: white;
  border-radius: 20rpx;
  padding: 60rpx 40rpx;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 60rpx;

  .logo {
    font-size: 80rpx;
    margin-bottom: 20rpx;
  }

  .title {
    display: block;
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 10rpx;
  }

  .subtitle {
    display: block;
    font-size: 26rpx;
    color: #999;
  }
}

.form-group {
  margin-bottom: 30rpx;

  .form-label {
    display: block;
    font-size: 28rpx;
    color: #333;
    margin-bottom: 12rpx;
    font-weight: 500;
  }

  .picker-input {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16rpx 20rpx;
    border: 2rpx solid #e0e0e0;
    border-radius: 8rpx;
    background: #f9f9f9;
    font-size: 28rpx;
    color: #333;

    .icon {
      color: #999;
      font-size: 20rpx;
    }
  }
}

.btn-wechat {
  width: 100%;
  padding: 18rpx 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8rpx;
  font-size: 32rpx;
  font-weight: bold;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10rpx;

  .icon {
    font-size: 28rpx;
  }

  &:active {
    opacity: 0.9;
  }
}

.tips {
  text-align: center;
  margin-top: 30rpx;
  font-size: 24rpx;
  color: #999;
}
</style>
