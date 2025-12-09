<script setup lang="ts">
import { ref } from 'vue'
import { merchantWechatRegister } from '@/api/modules/auth'
import type { MerchantRegisterDTO } from '@/types/auth'

const form = ref<Partial<MerchantRegisterDTO>>({
  username: '',
  password: '',
  phone: '',
  merchantName: '',
  nickname: '',
  avatarUrl: ''
})

const loading = ref<boolean>(false)

/**
 * 提交注册
 */
const handleRegister = async () => {
  // 验证必填字段
  if (!form.value.username) {
    uni.showToast({
      title: '请填写用户名',
      icon: 'error',
      duration: 2000
    })
    return
  }

  if (!form.value.password) {
    uni.showToast({
      title: '请填写密码',
      icon: 'error',
      duration: 2000
    })
    return
  }

  if (!form.value.phone) {
    uni.showToast({
      title: '请填写手机号',
      icon: 'error',
      duration: 2000
    })
    return
  }

  // 简单的手机号验证
  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(form.value.phone)) {
    uni.showToast({
      title: '请输入有效的手机号',
      icon: 'error',
      duration: 2000
    })
    return
  }

  if (!form.value.merchantName) {
    uni.showToast({
      title: '请填写商户名称',
      icon: 'error',
      duration: 2000
    })
    return
  }

  loading.value = true

  try {
    // 获取微信信息
    const loginRes = await uni.login({ provider: 'weixin' })

    const response = await merchantWechatRegister({
      code: loginRes.code,
      phone: form.value.phone || '',
      username: form.value.username!,
      password: form.value.password!,
      merchantName: form.value.merchantName!,
      nickname: form.value.nickname,
      avatarUrl: form.value.avatarUrl
    })

    if (response.token) {
      uni.setStorageSync('ACCESS_TOKEN', response.token)
      uni.setStorageSync('USER_INFO', JSON.stringify(response.userInfo))
      uni.setStorageSync('IDENTITY_TYPE', response.userInfo.identityType)

      uni.reLaunch({
        url: '/pages/home/index'
      })
    }
  } catch (error) {
    uni.showToast({
      title: '注册失败，请重试',
      icon: 'error',
      duration: 2000
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <view class="merchant-register-page">
    <view class="form-container">
      <!-- 用户名 -->
      <view class="form-group">
        <text class="form-label">用户名 <text class="required">*</text></text>
        <input
          v-model="form.username"
          class="form-input"
          type="text"
          placeholder="请输入用户名"
        />
      </view>

      <!-- 密码 -->
      <view class="form-group">
        <text class="form-label">密码 <text class="required">*</text></text>
        <input
          v-model="form.password"
          class="form-input"
          type="password"
          placeholder="请输入密码"
        />
      </view>

      <!-- 手机号 -->
      <view class="form-group">
        <text class="form-label">手机号 <text class="required">*</text></text>
        <input
          v-model="form.phone"
          class="form-input"
          type="tel"
          placeholder="请输入手机号"
        />
      </view>

      <!-- 商户名称 -->
      <view class="form-group">
        <text class="form-label">商户名称 <text class="required">*</text></text>
        <input
          v-model="form.merchantName"
          class="form-input"
          type="text"
          placeholder="请输入商户名称"
        />
      </view>

      <!-- 昵称 -->
      <view class="form-group">
        <text class="form-label">昵称</text>
        <input
          v-model="form.nickname"
          class="form-input"
          type="text"
          placeholder="请输入昵称"
        />
      </view>

      <!-- 提交按钮 -->
      <button
        class="btn-submit"
        @click="handleRegister"
        :loading="loading"
      >
        创建商户
      </button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.merchant-register-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
}

.form-container {
  background: white;
  border-radius: 8rpx;
  padding: 30rpx 20rpx;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.05);
  margin-top: 20rpx;
}

.form-group {
  margin-bottom: 24rpx;

  .form-label {
    display: block;
    font-size: 26rpx;
    color: #333;
    margin-bottom: 10rpx;
    font-weight: 500;

    .required {
      color: #f56c6c;
    }
  }

  .form-input {
    width: 100%;
    padding: 12rpx 16rpx;
    border: 2rpx solid #e0e0e0;
    border-radius: 6rpx;
    font-size: 26rpx;
    color: #333;
    background: #f9f9f9;
  }
}

.btn-submit {
  width: 100%;
  padding: 16rpx 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6rpx;
  font-size: 28rpx;
  font-weight: bold;
  margin-top: 20rpx;
}
</style>
