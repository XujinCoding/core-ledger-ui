<script setup lang="ts">
/**
 * 客户注册页面
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, reactive } from 'vue'
import { customerWechatRegister } from '@/api/modules/auth'
import { SmsScene } from '@/api/modules/sms'
import { useUserStore } from '@/stores/modules/user'
import AddressSelector from '@/components/AddressSelector.vue'
import SmsCodeInput from '@/components/SmsCodeInput.vue'
import ImageUploader from '@/components/ImageUploader.vue'
import { getWechatCode } from '@/composables/useWechatLogin'

const userStore = useUserStore()

// 使用 uni 的 showToast
const showToast = (message: string, success = false) => {
  uni.showToast({
    title: message,
    icon: success ? 'success' : 'none',
    duration: 2000
  })
}

// ==================== 表单数据 ====================

interface CustomerForm {
  phone: string
  smsCode: string
  customerName: string
  nickname: string
  avatarUrl: string
  gender: number  // 0-未知 1-男 2-女
  age: string
  addressId: number | null
  addressDetail: string
  inviteCode: string
}

const form = reactive<CustomerForm>({
  phone: '',
  smsCode: '',
  customerName: '',
  nickname: '',
  avatarUrl: '',
  gender: 0,
  age: '',
  addressId: null,
  addressDetail: '',
  inviteCode: ''
})

// ==================== 性别选择 ====================

const selectGender = (gender: number) => {
  form.gender = gender
}

// ==================== 其他状态 ====================

const loading = ref(false)

// ==================== 表单引用和校验规则 ====================

const formRef = ref()

const rules = {
  customerName: [
    { required: true, message: '请输入姓名' }
  ],
  phone: [
    { required: true, message: '请输入手机号' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }
  ],
  smsCode: [
    { required: true, message: '请输入验证码' },
    { pattern: /^\d{4,6}$/, message: '验证码格式不正确' }
  ],
  addressId: [
    { required: true, message: '请选择所在地区' }
  ],
  addressDetail: [
    { required: true, message: '请输入详细地址' }
  ]
}

// ==================== 提交 ====================

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
    console.log('[Customer Register] 开始注册, code:', code)
    
    const response = await customerWechatRegister({
      code,
      phone: form.phone,
      smsCode: form.smsCode,
      customerName: form.customerName,
      avatarUrl: form.avatarUrl || undefined,
      gender: form.gender || undefined,
      age: form.age ? parseInt(form.age) : undefined,
      addressId: form.addressId!,
      addressDetail: form.addressDetail,
      inviteCode: form.inviteCode || undefined
    })

    console.log('[Customer Register] 注册响应:', response)

    if (response?.token) {
      console.log('[Customer Register] 保存token并跳转')
      userStore.setToken(response.token)
      userStore.setUserInfo(response.userInfo)
      userStore.setIdentityType(response.userInfo.identityType)
      showToast('注册成功', true)
      setTimeout(() => {
        uni.reLaunch({ url: '/pages/customer/index' })
      }, 1500)
    } else {
      console.log('[Customer Register] 响应中没有token:', response)
      showToast('注册失败，请重试')
    }
  } catch (error) {
    console.error('[Customer Register] 注册失败:', error)
    // 错误提示已在 request.ts 中处理
  } finally {
    loading.value = false
  }
}

// ==================== 扫码绑定 ====================

const handleScanCode = () => {
  uni.scanCode({
    onlyFromCamera: false,
    success: (res) => {
      form.inviteCode = res.result
    },
    fail: () => {
      showToast('扫码失败')
    }
  })
}
</script>

<template>
  <view class="register-page">
    <!-- 头部 -->
    <view class="register-header">
      <view class="register-icon">
        <wd-icon name="user" size="56rpx" color="#fff" />
      </view>
      <view class="register-title">注册成为客户</view>
      <view class="register-subtitle">轻松查看您的消费记录</view>
    </view>

    <!-- 表单内容 -->
    <view class="page-content">
      <wd-form ref="formRef" :model="form" :rules="rules">
        <!-- 微信账号信息 -->
        <view class="form-section">
          <view class="section-title">
            <wd-icon name="user" size="32rpx" color="#10B981" />
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

        <!-- 基本信息 -->
        <view class="form-section">
          <view class="section-title">
            <wd-icon name="user" size="32rpx" color="#10B981" />
            <text>基本信息</text>
          </view>
          <view class="form-group">
            <view class="form-label">头像</view>
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
            <view class="form-label">姓名 <text class="required">*</text></view>
            <wd-input
              v-model="form.customerName"
              prop="customerName"
              placeholder="请输入您的真实姓名"
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
              :scene="SmsScene.CUSTOMER_REGISTER"
            />
          </view>
          <view class="form-group">
            <view class="form-label">别名/昵称</view>
            <wd-input
              v-model="form.nickname"
              placeholder="商户称呼您的方式（选填）"
              clearable
            />
            <view class="form-tip">例如：老李、隔壁王叔</view>
          </view>
          <view class="form-group">
            <view class="form-label">性别</view>
            <view class="gender-selector">
              <view
                class="gender-item male"
                :class="{ active: form.gender === 1 }"
                @tap="selectGender(1)"
              >
                <text class="gender-icon">♂</text>
                <text>男</text>
              </view>
              <view
                class="gender-item female"
                :class="{ active: form.gender === 2 }"
                @tap="selectGender(2)"
              >
                <text class="gender-icon">♀</text>
                <text>女</text>
              </view>
            </view>
          </view>
          <view class="form-group">
            <view class="form-label">年龄</view>
            <wd-input
              v-model="form.age"
              type="number"
              placeholder="请输入年龄（选填）"
              clearable
            />
          </view>
        </view>

        <!-- 地址信息 -->
        <view class="form-section">
          <view class="section-title">
            <wd-icon name="location" size="32rpx" color="#10B981" />
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

        <!-- 商户邀请码 -->
        <view class="form-section">
          <view class="section-title">
            <wd-icon name="scan" size="32rpx" color="#10B981" />
            <text>绑定商户（选填）</text>
          </view>
          <view class="invite-box">
            <view class="invite-icon">
              <wd-icon name="link" size="36rpx" color="#fff" />
            </view>
            <view class="invite-info">
              <view class="invite-title">扫码或输入邀请码绑定商户</view>
              <view class="invite-desc">绑定后可直接在该商户下单</view>
            </view>
          </view>
          <view class="scan-btn-wrapper">
            <wd-button 
              block
              @click="handleScanCode"
              custom-class="scan-btn-custom"
            >
              <wd-icon name="scan" size="32rpx" />
              <text>扫码绑定</text>
            </wd-button>
          </view>
          <view class="divider">
            <view class="divider-line"></view>
            <text class="divider-text">或手动输入</text>
            <view class="divider-line"></view>
          </view>
          <view class="form-group">
            <wd-input
              v-model="form.inviteCode"
              placeholder="请输入商户邀请码"
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
        block 
        size="large"
        :loading="loading" 
        @click="handleRegister"
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
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
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
  font-size: $font-size-content;
  color: $color-text-primary;
  margin-bottom: 16rpx;
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
  margin-top: 12rpx;
}

.avatar-upload-wrapper {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.avatar-tip {
  font-size: $font-size-secondary;
  color: $color-text-secondary;
}

.gender-selector {
  display: flex;
  gap: $spacing-md;
}

.gender-item {
  flex: 1;
  padding: $spacing-md;
  border: 4rpx solid #e5e5e5;
  border-radius: $border-radius-lg;
  text-align: center;
  transition: all $transition-fast;

  &.active {
    border-color: $color-success;
    background: rgba(16, 185, 129, 0.05);
  }

  .gender-icon {
    font-size: $font-size-big;
    margin-top: 0;
  }

  text {
    display: block;
    font-size: $font-size-small;
    color: $color-text-regular;
    margin-top: $spacing-xs;
  }

  &.active text {
    color: $color-success;
    font-weight: 500;
  }

  &.male {
    color: $color-primary;
  }

  &.female {
    color: $color-danger;
  }
}

.invite-box {
  background: rgba(245, 158, 11, 0.1);
  border: 2rpx solid #fcd34d;
  border-radius: 16rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 24rpx;
}

.invite-icon {
  width: 80rpx;
  height: 80rpx;
  background: $color-warning;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.invite-info {
  flex: 1;
}

.invite-title {
  font-size: $font-size-content;
  color: $color-warning;
  font-weight: 500;
}

.invite-desc {
  font-size: $font-size-secondary;
  color: $color-warning;
  margin-top: 4rpx;
}

.scan-btn-wrapper {
  margin-bottom: 24rpx;
}

:deep(.scan-btn-custom) {
  height: 88rpx;
  background: $color-white !important;
  border: 2rpx solid #10B981 !important;
  border-radius: 16rpx;
  color: $color-success !important;
  font-size: $font-size-content;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.divider {
  display: flex;
  align-items: center;
  margin: 32rpx 0 24rpx;
}

.divider-line {
  flex: 1;
  height: 2rpx;
  background: $color-border;
}

.divider-text {
  padding: 0 24rpx;
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
  background: $color-success !important;
  border-radius: 48rpx;
  font-size: $font-size-title;
  font-weight: 500;
}
</style>
