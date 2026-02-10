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

// ==================== 验证 ====================

const validateForm = (): boolean => {
  if (!form.customerName) {
    showToast('请输入姓名')
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
  if (!form.addressId) {
    showToast('请选择所在地区')
    return false
  }
  if (!form.addressDetail) {
    showToast('请输入详细地址')
    return false
  }
  return true
}

// ==================== 提交 ====================

const handleRegister = async () => {
  if (!validateForm()) {
    return
  }

  try {
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
          <input
            class="form-input"
            v-model="form.customerName"
            placeholder="请输入您的真实姓名"
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
            :scene="SmsScene.CUSTOMER_REGISTER"
          />
        </view>
        <view class="form-group">
          <view class="form-label">别名/昵称</view>
          <input
            class="form-input"
            v-model="form.nickname"
            placeholder="商户称呼您的方式（选填）"
            placeholder-class="placeholder"
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
          <input
            class="form-input"
            v-model="form.age"
            type="number"
            placeholder="请输入年龄（选填）"
            placeholder-class="placeholder"
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
            label="所在地区"
            placeholder="请选择所在地区"
            :min-level="2"
            required
          />
        </view>
        <view class="form-group">
          <view class="form-label">详细地址 <text class="required">*</text></view>
          <input
            class="form-input"
            v-model="form.addressDetail"
            placeholder="街道、门牌号等详细地址"
            placeholder-class="placeholder"
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
          <button class="scan-btn" @tap="handleScanCode">
            <wd-icon name="scan" size="32rpx" />
            <text>扫码绑定</text>
          </button>
        </view>
        <view class="divider">
          <view class="divider-line"></view>
          <text class="divider-text">或手动输入</text>
          <view class="divider-line"></view>
        </view>
        <view class="form-group">
          <input
            class="form-input"
            v-model="form.inviteCode"
            placeholder="请输入商户邀请码"
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
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
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

.gender-selector {
  display: flex;
  gap: 24rpx;
}

.gender-item {
  flex: 1;
  padding: 24rpx;
  border: 4rpx solid #e5e5e5;
  border-radius: 16rpx;
  text-align: center;
  transition: all 0.2s;

  &.active {
    border-color: #10B981;
    background: #f0fdf4;
  }

  .gender-icon {
    font-size: 44rpx;
    margin-top: 0;
  }

  text {
    display: block;
    font-size: 26rpx;
    color: #666;
    margin-top: 8rpx;
  }

  &.active text {
    color: #10B981;
    font-weight: 500;
  }

  &.male {
    color: #3B82F6;
  }

  &.female {
    color: #EC4899;
  }
}

.invite-box {
  background: #fef3c7;
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
  background: #f59e0b;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.invite-info {
  flex: 1;
}

.invite-title {
  font-size: 28rpx;
  color: #92400e;
  font-weight: 500;
}

.invite-desc {
  font-size: 24rpx;
  color: #a16207;
  margin-top: 4rpx;
}

.scan-btn-wrapper {
  margin-bottom: 24rpx;
}

.scan-btn {
  width: 100%;
  height: 88rpx;
  background: #fff;
  border: 2rpx solid #10B981;
  border-radius: 16rpx;
  color: #10B981;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;

  &::after {
    border: none;
  }
}

.divider {
  display: flex;
  align-items: center;
  margin: 32rpx 0 24rpx;
}

.divider-line {
  flex: 1;
  height: 2rpx;
  background: #e5e5e5;
}

.divider-text {
  padding: 0 24rpx;
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
  background: #10B981;
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
