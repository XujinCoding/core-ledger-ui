<script setup lang="ts">
import { ref } from 'vue'
import type { CustomerRegisterDTO } from '@/types/auth'

const form = ref<Partial<CustomerRegisterDTO>>({
  customerName: '',
  phone: '',
  alias: '',
  gender: undefined,
  age: undefined,
  addressId: 1,
  addressDetail: ''
})

const loading = ref<boolean>(false)

/**
 * 验证表单
 */
const validateForm = (): boolean => {
  if (!form.value.customerName) {
    uni.showToast({
      title: '请填写客户名称',
      icon: 'error',
      duration: 2000
    })
    return false
  }

  if (!form.value.phone) {
    uni.showToast({
      title: '请填写手机号',
      icon: 'error',
      duration: 2000
    })
    return false
  }

  // 简单的手机号验证
  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(form.value.phone)) {
    uni.showToast({
      title: '请输入有效的手机号',
      icon: 'error',
      duration: 2000
    })
    return false
  }

  return true
}

/**
 * 点击注册按钮，跳转到绑定商户页面
 */
const handleRegister = async () => {
  if (!validateForm()) {
    return
  }

  // 保存表单数据到本地存储，供下一个页面使用
  uni.setStorageSync('CUSTOMER_REGISTER_FORM', JSON.stringify(form.value))

  // 跳转到绑定商户页面
  uni.navigateTo({
    url: '/pages/register/bind-merchant'
  })
}
</script>

<template>
  <view class="customer-register-page">
    <!-- 表单 -->
    <view class="form-container">
      <!-- 客户名称 -->
      <view class="form-group">
        <text class="form-label">客户名称 <text class="required">*</text></text>
        <input
          v-model="form.customerName"
          class="form-input"
          type="text"
          placeholder="请输入客户名称"
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

      <!-- 别名 -->
      <view class="form-group">
        <text class="form-label">别名</text>
        <input
          v-model="form.alias"
          class="form-input"
          type="text"
          placeholder="请输入别名"
        />
      </view>

      <!-- 性别 -->
      <view class="form-group">
        <text class="form-label">性别</text>
        <picker :range="['男', '女']" @change="(e: any) => form.gender = e.detail.value === 0 ? 1 : 2">
          <view class="picker-input">
            <text>{{ form.gender === 1 ? '男' : form.gender === 2 ? '女' : '请选择' }}</text>
          </view>
        </picker>
      </view>

      <!-- 年龄 -->
      <view class="form-group">
        <text class="form-label">年龄</text>
        <input
          v-model.number="form.age"
          class="form-input"
          type="number"
          placeholder="请输入年龄"
        />
      </view>

      <!-- 地址 -->
      <view class="form-group">
        <text class="form-label">地址</text>
        <input
          v-model="form.addressDetail"
          class="form-input"
          type="text"
          placeholder="请输入详细地址"
        />
      </view>
    </view>

    <!-- 底部按钮 -->
    <view class="button-group">
      <button class="btn-register" @click="handleRegister" :loading="loading">
        注册
      </button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.customer-register-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
  padding-bottom: 100rpx;
}

.form-container {
  background: white;
  border-radius: 8rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.05);
}

.form-group {
  margin-bottom: 20rpx;

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

  .form-input,
  .picker-input {
    width: 100%;
    padding: 12rpx 16rpx;
    border: 2rpx solid #e0e0e0;
    border-radius: 6rpx;
    font-size: 26rpx;
    color: #333;
    background: #f9f9f9;
  }

  .picker-input {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.button-group {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx;
  background: white;
  border-top: 2rpx solid #e0e0e0;

  .btn-register {
    width: 100%;
    padding: 16rpx 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 6rpx;
    font-size: 28rpx;
    font-weight: bold;
  }
}
</style>
