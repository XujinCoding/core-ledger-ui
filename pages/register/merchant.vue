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

// ==================== 验证 ====================

/**
 * 验证表单
 */
const validateForm = (): boolean => {
  if (!form.merchantName) {
    showToast('请输入店铺名称')
    return false
  }
  if (!form.username) {
    showToast('请输入用户名')
    return false
  }
  if (form.username.length < 3 || form.username.length > 20) {
    showToast('用户名长度应为3-20个字符')
    return false
  }
  if (!form.phone) {
    showToast('请输入手机号')
    return false
  }
  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    showToast('手机号格式不正确')
    return false
  }
  if (!form.smsCode) {
    showToast('请输入验证码')
    return false
  }
  if (!/^\d{4,6}$/.test(form.smsCode)) {
    showToast('验证码格式不正确')
    return false
  }
  if (!form.password) {
    showToast('请输入密码')
    return false
  }
  if (form.password.length < 6 || form.password.length > 20) {
    showToast('密码长度应为6-20个字符')
    return false
  }
  if (form.password !== form.confirmPassword) {
    showToast('两次输入的密码不一致')
    return false
  }
  if (!form.addressId) {
    showToast('请选择所在地区')
    return false
  }
  return true
}

// ==================== 提交 ====================

/**
 * 处理注册
 */
const handleRegister = async () => {
  if (!validateForm()) {
    return
  }

  try {
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
          <input
            class="form-input"
            v-model="form.merchantName"
            placeholder="请输入店铺名称"
            placeholder-class="placeholder"
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
          <input
            class="form-input"
            v-model="form.username"
            placeholder="请输入用户名（用于后台登录）"
            placeholder-class="placeholder"
          />
        </view>
        <view class="form-group">
          <view class="form-label">手机号 <text class="required">*</text></view>
          <input
            class="form-input"
            v-model="form.phone"
            type="number"
            placeholder="请输入手机号"
            placeholder-class="placeholder"
            maxlength="11"
          />
        </view>
        <view class="form-group">
          <view class="form-label">验证码 <text class="required">*</text></view>
          <SmsCodeInput
            v-model="form.smsCode"
            :phone="form.phone"
            :scene="SmsScene.MERCHANT_REGISTER"
          />
        </view>
        <view class="form-group">
          <view class="form-label">登录密码 <text class="required">*</text></view>
          <input
            class="form-input"
            v-model="form.password"
            password
            placeholder="请设置6-20位登录密码"
            placeholder-class="placeholder"
          />
        </view>
        <view class="form-group">
          <view class="form-label">确认密码 <text class="required">*</text></view>
          <input
            class="form-input"
            v-model="form.confirmPassword"
            password
            placeholder="请再次输入密码"
            placeholder-class="placeholder"
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
            label="所在地区"
            placeholder="请选择所在地区"
            :min-level="2"
            required
          />
        </view>
        <view class="form-group">
          <view class="form-label">详细地址</view>
          <input
            class="form-input"
            v-model="form.addressDetail"
            placeholder="街道、门牌号等详细地址（选填）"
            placeholder-class="placeholder"
          />
        </view>
      </view>
    </view>

    <!-- 底部按钮 -->
    <view class="footer-btns">
      <button class="btn-primary" :loading="loading" @tap="handleRegister">
        完成注册
      </button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.register-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  overflow: hidden;
}

.register-header {
  flex-shrink: 0;
  background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
  padding: 24rpx 32rpx;
  color: #fff;
  text-align: center;
}

.register-icon {
  width: 80rpx;
  height: 80rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16rpx;
}

.register-title {
  font-size: 36rpx;
  font-weight: 600;
  margin-bottom: 4rpx;
}

.register-subtitle {
  font-size: 26rpx;
  opacity: 0.8;
}

.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 24rpx;
}

.form-section {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
  padding-bottom: 16rpx;
  border-bottom: 2rpx solid #f5f5f5;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.wechat-info {
  background: #f0fdf4;
  border: 2rpx solid #bbf7d0;
  border-radius: 16rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.wechat-avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: #10B981;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wechat-detail {
  flex: 1;
}

.wechat-name {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
}

.wechat-status {
  font-size: 24rpx;
  color: #10B981;
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 4rpx;
}

.form-group {
  margin-bottom: 32rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 16rpx;
  font-weight: 500;
}

.required {
  color: #EF4444;
}

.form-input {
  width: 100%;
  height: 88rpx;
  background: #f9fafb;
  border: 2rpx solid #e5e5e5;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
  color: #333;
  box-sizing: border-box;
}

.placeholder {
  color: #999;
}

.form-tip {
  font-size: 24rpx;
  color: #999;
  margin-top: 12rpx;
}

.avatar-upload-wrapper {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.avatar-tip {
  font-size: 24rpx;
  color: #999;
}

.footer-btns {
  flex-shrink: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: #fff;
}

.btn-primary {
  width: 100%;
  height: 96rpx;
  background: #3B82F6;
  color: #fff;
  font-size: 32rpx;
  font-weight: 500;
  border-radius: 48rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;

  &::after {
    border: none;
  }
}
</style>
