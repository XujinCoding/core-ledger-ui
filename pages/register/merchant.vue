<script setup lang="ts">
/**
 * 商户注册页面
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, reactive } from 'vue'
import { merchantWechatRegister } from '@/api/modules/auth'
import { SmsScene } from '@/api/modules/sms'
import AddressSelector from '@/components/AddressSelector.vue'
import SmsCodeInput from '@/components/SmsCodeInput.vue'
import ImageUploader from '@/components/ImageUploader.vue'
import { useWechatLogin, getWechatCode } from '@/composables/useWechatLogin'

const { handleLoginResponse } = useWechatLogin()

// 使用 uni 的 showToast
const showToast = (message: string) => {
  uni.showToast({
    title: message,
    icon: 'none',
    duration: 2000
  })
}

// ==================== 表单数据 ====================

interface MerchantForm {
  phone: string
  smsCode: string
  username: string
  password: string
  confirmPassword: string
  merchantName: string
  avatarUrl: string
  addressId: number | null
  addressDetail: string
}

const form = reactive<MerchantForm>({
  phone: '',
  smsCode: '',
  username: '',
  password: '',
  confirmPassword: '',
  merchantName: '',
  avatarUrl: '',
  addressId: null,
  addressDetail: ''
})

// ==================== 其他状态 ====================

const loading = ref(false)

// ==================== 表单引用和校验规则 ====================

const formRef = ref()

const rules = {
  merchantName: [
    { required: true, message: '请输入店铺名称' }
  ],
  username: [
    { required: true, message: '请输入用户名' },
    {
      validator: (value: string) => {
        if (value.length < 3 || value.length > 20) {
          return Promise.reject('用户名长度应为3-20个字符')
        }
        return Promise.resolve()
      }
    }
  ],
  phone: [
    { required: true, message: '请输入手机号' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }
  ],
  smsCode: [
    { required: true, message: '请输入验证码' },
    { pattern: /^\d{4,6}$/, message: '验证码格式不正确' }
  ],
  password: [
    { required: true, message: '请输入密码' },
    {
      validator: (value: string) => {
        if (value.length < 6 || value.length > 20) {
          return Promise.reject('密码长度应为6-20个字符')
        }
        return Promise.resolve()
      }
    }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码' },
    {
      validator: (value: string) => {
        if (value !== form.password) {
          return Promise.reject('两次输入的密码不一致')
        }
        return Promise.resolve()
      }
    }
  ],
  addressId: [
    { required: true, message: '请选择所在地区' }
  ],
  addressDetail: [
    { required: true, message: '请输入详细地址' }
  ]
}

// ==================== 提交 ====================

/**
 * 处理注册
 */
const handleRegister = async () => {
  try {
    // 使用 wd-form 的校验机制
    const { valid, errors } = await formRef.value.validate()
    if (!valid) {
      // 显示第一个错误信息
      if (errors && errors.length > 0) {
        showToast(errors[0].message)
      }
      return
    }

    loading.value = true
    const code = await getWechatCode()
    const response = await merchantWechatRegister({
      code,
      phone: form.phone,
      smsCode: form.smsCode,
      username: form.username,
      password: form.password,
      merchantName: form.merchantName,
      avatarUrl: form.avatarUrl || undefined,
      addressId: form.addressId!,
      addressDetail: form.addressDetail
    })
    await handleLoginResponse(response)
  } catch (error) {
    console.error('[Merchant Register] 注册失败:', error)
    // 错误提示已在 request.ts 中处理
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <view class="register-page">
    <!-- 头部 -->
    <view class="register-header">
      <view class="register-icon">
        <wd-icon name="shop" size="56rpx" color="#fff" />
      </view>
      <view class="register-title">注册成为商户</view>
      <view class="register-subtitle">开启您的智能记账之旅</view>
    </view>

    <!-- 表单内容 -->
    <view class="page-content">
      <wd-form ref="formRef" :model="form" :rules="rules">
        <!-- 微信账号信息 -->
        <view class="form-section">
          <view class="section-title">
            <wd-icon name="user" size="32rpx" color="#3B82F6" />
            <text>微信账号</text>
          </view>
          <view class="wechat-info">
            <view class="wechat-avatar">
              <wd-icon name="user" size="40rpx" color="#fff" />
            </view>
            <view class="wechat-detail">
              <view class="wechat-name">微信用户</view>
              <view class="wechat-status">
                <wd-icon name="check-outline" size="24rpx" color="#10B981" />
                <text>已授权</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 店铺信息 -->
        <view class="form-section">
          <view class="section-title">
            <wd-icon name="shop" size="32rpx" color="#3B82F6" />
            <text>店铺信息</text>
          </view>
          <view class="form-group">
            <view class="form-label">店铺头像</view>
            <view class="avatar-upload-wrapper">
              <ImageUploader
                v-model="form.avatarUrl"
                width="160rpx"
                height="160rpx"
                placeholder="上传头像"
                round
              />
              <view class="avatar-tip">建议上传正方形图片</view>
            </view>
          </view>
          <view class="form-group">
            <view class="form-label">店铺名称 <text class="required">*</text></view>
            <wd-input
              v-model="form.merchantName"
              prop="merchantName"
              placeholder="请输入店铺名称"
              clearable
            />
            <view class="form-tip">店铺名称将展示给您的客户</view>
          </view>
        </view>

        <!-- 账号信息 -->
        <view class="form-section">
          <view class="section-title">
            <wd-icon name="user" size="32rpx" color="#3B82F6" />
            <text>账号信息</text>
          </view>
          <view class="form-group">
            <view class="form-label">用户名 <text class="required">*</text></view>
            <wd-input
              v-model="form.username"
              prop="username"
              placeholder="请输入用户名（用于后台登录）"
              clearable
            />
          </view>
          <view class="form-group">
            <view class="form-label">手机号 <text class="required">*</text></view>
            <wd-input
              v-model="form.phone"
              prop="phone"
              type="number"
              placeholder="请输入手机号"
              :maxlength="11"
              clearable
            />
          </view>
          <view class="form-group">
            <view class="form-label">验证码 <text class="required">*</text></view>
            <SmsCodeInput
              v-model="form.smsCode"
              prop="smsCode"
              :phone="form.phone"
              :scene="SmsScene.MERCHANT_REGISTER"
            />
          </view>
          <view class="form-group">
            <view class="form-label">登录密码 <text class="required">*</text></view>
            <wd-input
              v-model="form.password"
              prop="password"
              type="password"
              placeholder="请设置6-20位登录密码"
              show-password
              clearable
            />
          </view>
          <view class="form-group">
            <view class="form-label">确认密码 <text class="required">*</text></view>
            <wd-input
              v-model="form.confirmPassword"
              prop="confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              show-password
              clearable
            />
          </view>
        </view>

        <!-- 地址信息 -->
        <view class="form-section">
          <view class="section-title">
            <wd-icon name="location" size="32rpx" color="#3B82F6" />
            <text>地址信息</text>
          </view>
          <view class="form-group">
            <AddressSelector 
              v-model="form.addressId"
              prop="addressId"
              label="所在地区"
              placeholder="请选择所在地区"
              :min-level="2"
              required
            />
          </view>
          <view class="form-group">
            <view class="form-label">详细地址 <text class="required">*</text></view>
            <wd-input
              v-model="form.addressDetail"
              prop="addressDetail"
              placeholder="街道、门牌号等详细地址"
              clearable
            />
          </view>
        </view>
      </wd-form>
    </view>

    <!-- 底部按钮 -->
    <view class="footer-btns">
      <wd-button 
        type="primary"
        :loading="loading" 
        @click="handleRegister"
        block
        size="large"
        custom-class="btn-primary-custom"
      >
        完成注册
      </wd-button>
    </view>
  </view>
</template>

<style lang="scss" scoped>

.register-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: $color-bg;
  overflow: hidden;
}

.register-header {
  flex-shrink: 0;
  background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
  padding: $spacing-md $spacing-lg;
  color: $color-white;
  text-align: center;
}

.register-icon {
  width: 80rpx;
  height: 80rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: $border-radius-round;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto $spacing-sm;
}

.register-title {
  font-size: $font-size-xlarge;
  font-weight: 600;
  margin-bottom: 4rpx;
}

.register-subtitle {
  font-size: $font-size-small;
  opacity: 0.8;
}

.page-content {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-md;
}

.form-section {
  background: $color-white;
  border-radius: $spacing-sm;
  padding: $spacing-md;
  margin-bottom: $spacing-sm;
}

.section-title {
  font-size: $font-size-content;
  font-weight: 600;
  color: $color-text-primary;
  margin-bottom: $spacing-sm;
  padding-bottom: $spacing-sm;
  border-bottom: 2rpx solid #f5f5f5;
  display: flex;
  align-items: center;
  gap: $spacing-small;
}

.wechat-info {
  background: rgba(16, 185, 129, 0.05);
  border: 2rpx solid #bbf7d0;
  border-radius: $border-radius-lg;
  padding: $spacing-md;
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.wechat-avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: $border-radius-round;
  background: $color-success;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wechat-detail {
  flex: 1;
}

.wechat-name {
  font-size: $font-size-large;
  color: $color-text-primary;
  font-weight: 500;
}

.wechat-status {
  font-size: $font-size-secondary;
  color: $color-success;
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  margin-top: 4rpx;
}

.form-group {
  margin-bottom: $spacing-lg;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  font-size: $font-size-content;
  color: $color-text-primary;
  margin-bottom: $spacing-sm;
  font-weight: 500;
}

.required {
  color: $color-danger;
}

:deep(.wd-input) {
  width: 100%;
  height: 88rpx;
  background: $color-bg;
  border: 2rpx solid #e5e5e5;
  border-radius: $border-radius-lg;
  
  .wd-input__inner {
    font-size: $font-size-large;
    padding: 0 $spacing-md;
  }
}

.form-tip {
  font-size: $font-size-secondary;
  color: $color-text-secondary;
  margin-top: $spacing-small;
}

.avatar-upload-wrapper {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.avatar-tip {
  font-size: $font-size-secondary;
  color: $color-text-secondary;
}

.footer-btns {
  flex-shrink: 0;
  padding: $spacing-md $spacing-lg;
  padding-bottom: calc(#{$spacing-md} + env(safe-area-inset-bottom));
  background: $color-white;
}

:deep(.btn-primary-custom) {
  height: 96rpx;
  border-radius: 48rpx;
  font-size: $font-size-title;
  font-weight: 500;
}
</style>
