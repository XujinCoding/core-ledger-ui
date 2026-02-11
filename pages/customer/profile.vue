<script setup lang="ts">
/**
 * 客户个人信息页面
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, onMounted, computed } from 'vue'
import { getProfile, updateProfile } from '@/api/modules/customer'
import { SmsScene } from '@/api/modules/sms'
import AddressSelector from '@/components/AddressSelector.vue'
import ImageUploader from '@/components/ImageUploader.vue'
import SmsCodeInput from '@/components/SmsCodeInput.vue'
import type { CustomerVO, CustomerProfileUpdateDTO } from '@/types/customer'
import { Gender } from '@/enums'

// ==================== 数据状态 ====================

const loading = ref(false)
const submitting = ref(false)
const customer = ref<CustomerVO | null>(null)

// 表单数据
const form = ref({
  name: '',
  alias: '',
  gender: Gender.UNKNOWN as Gender,
  age: undefined as number | undefined,
  avatarUrl: '',
  addressId: null as number | null,
  addressDetail: '',
  phone: '',
  smsCode: ''
})

// 原始手机号
const originalPhone = ref('')
// 原始头像URL（文件路径，非预签名URL）
const originalAvatarUrl = ref('')

// 是否修改了手机号
const isPhoneChanged = computed(() => form.value.phone !== originalPhone.value)

// ==================== 方法 ====================

/**
 * 加载个人信息
 */
const loadProfile = async () => {
  loading.value = true
  try {
    const info = await getProfile()
    customer.value = info
    originalPhone.value = info.phone || ''

    // 保存原始头像URL（这是预签名URL，我们需要从后端获取原始路径）
    // 由于后端返回的是预签名URL，我们需要保存一个标记来判断是否修改了头像
    originalAvatarUrl.value = info.avatarUrl || ''

    form.value = {
      name: info.name || '',
      alias: info.alias || '',
      gender: info.gender || Gender.UNKNOWN,
      age: info.age,
      avatarUrl: info.avatarUrl || '',
      addressId: info.addressId || null,
      addressDetail: info.addressDetail || '',
      phone: info.phone || '',
      smsCode: ''
    }
  } catch (error) {
    console.error('加载个人信息失败:', error)
    uni.showToast({ title: '加载失败', icon: 'error' })
  } finally {
    loading.value = false
  }
}

/**
 * 提交修改
 */
const handleSubmit = async () => {
  if (!form.value.name.trim()) {
    uni.showToast({ title: '请输入姓名', icon: 'none' })
    return
  }

  // 如果修改了手机号，需要验证码
  if (isPhoneChanged.value) {
    if (!form.value.phone) {
      uni.showToast({ title: '请输入手机号', icon: 'none' })
      return
    }
    if (!/^1[3-9]\d{9}$/.test(form.value.phone)) {
      uni.showToast({ title: '手机号格式不正确', icon: 'none' })
      return
    }
    if (!form.value.smsCode) {
      uni.showToast({ title: '请输入验证码', icon: 'none' })
      return
    }
  }

  submitting.value = true
  try {
    const data: CustomerProfileUpdateDTO = {
      name: form.value.name,
      alias: form.value.alias || undefined,
      gender: form.value.gender,
      age: form.value.age,
      addressId: form.value.addressId || undefined,
      addressDetail: form.value.addressDetail
    }

    // 只有当头像URL发生变化时才提交（排除预签名URL的情况）
    // 如果avatarUrl是新上传的（不是预签名URL），才提交
    if (form.value.avatarUrl && form.value.avatarUrl !== originalAvatarUrl.value) {
      // 判断是否是新上传的文件路径（不包含http/https）
      if (!form.value.avatarUrl.startsWith('http')) {
        data.avatarUrl = form.value.avatarUrl
      }
    }

    // 如果修改了手机号，添加手机号和验证码
    if (isPhoneChanged.value) {
      data.phone = form.value.phone
      data.smsCode = form.value.smsCode
    }

    await updateProfile(data)
    uni.showToast({ title: '修改成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error('修改个人信息失败:', error)
  } finally {
    submitting.value = false
  }
}

/**
 * 选择性别
 */
const selectGender = (gender: Gender) => {
  form.value.gender = gender
}

// ==================== 生命周期 ====================

onMounted(() => {
  loadProfile()
})
</script>

<template>
  <view class="profile-page">
    <!-- 表单内容 -->
    <scroll-view class="page-content" scroll-y>
      <!-- 头像卡片 -->
      <view class="avatar-card">
        <view class="avatar-wrapper">
          <ImageUploader
            v-model="form.avatarUrl"
            width="140rpx"
            height="140rpx"
            placeholder="上传"
            round
            :disabled="loading"
          />
        </view>
        <view class="avatar-tip">点击上传头像</view>
      </view>

      <!-- 基本信息 -->
      <view class="info-card">
        <view class="card-title">
          <wd-icon name="user" size="28rpx" color="#3B82F6" />
          <text>基本信息</text>
        </view>
        <view class="form-row">
          <view class="form-label">姓名</view>
          <view class="form-value">
            <wd-input
              v-model="form.name"
              placeholder="请输入真实姓名"
              :disabled="loading"
              required
              clearable
            />
          </view>
        </view>
        <view class="form-row">
          <view class="form-label">别名</view>
          <view class="form-value">
            <wd-input
              v-model="form.alias"
              placeholder="商户称呼您的方式"
              :disabled="loading"
              clearable
            />
          </view>
        </view>
        <view class="form-row">
          <view class="form-label">性别</view>
          <view class="gender-selector">
            <view
              class="gender-btn"
              :class="{ active: form.gender === Gender.MALE }"
              @tap="selectGender(Gender.MALE)"
            >♂ 男</view>
            <view
              class="gender-btn"
              :class="{ active: form.gender === Gender.FEMALE }"
              @tap="selectGender(Gender.FEMALE)"
            >♀ 女</view>
          </view>
        </view>
        <view class="form-row">
          <view class="form-label">年龄</view>
          <view class="form-value">
            <wd-input
              v-model="form.age"
              type="number"
              placeholder="选填"
              :disabled="loading"
              clearable
            />
          </view>
        </view>
      </view>

      <!-- 联系方式 -->
      <view class="info-card">
        <view class="card-title">
          <wd-icon name="phone" size="28rpx" color="#10B981" />
          <text>联系方式</text>
        </view>
        <view class="form-row">
          <view class="form-label">手机号</view>
          <view class="form-value">
            <wd-input
              v-model="form.phone"
              type="number"
              placeholder="请输入手机号"
              :maxlength="11"
              :disabled="loading"
              clearable
            />
          </view>
        </view>
        <view v-if="isPhoneChanged" class="form-row">
          <view class="form-label">验证码 <text class="required">*</text></view>
          <view class="form-value">
            <SmsCodeInput
              v-model="form.smsCode"
              :phone="form.phone"
              :scene="SmsScene.CHANGE_PHONE"
            />
          </view>
        </view>
      </view>

      <!-- 地址信息 -->
      <view class="info-card">
        <view class="card-title">
          <wd-icon name="location" size="28rpx" color="#F59E0B" />
          <text>地址信息</text>
        </view>
        <view class="form-row address-row">
          <AddressSelector
            v-model="form.addressId"
            label="所在地区"
            placeholder="请选择"
            :min-level="2"
          />
        </view>
        <view class="form-row">
          <view class="form-label">详细地址</view>
          <view class="form-value">
            <wd-input
              v-model="form.addressDetail"
              placeholder="街道、门牌号等"
              :disabled="loading"
              clearable
            />
          </view>
        </view>
      </view>

      <!-- 底部占位 -->
      <view style="height: 160rpx;"></view>
    </scroll-view>

    <!-- 底部按钮 -->
    <view class="footer-btns">
      <wd-button 
        type="primary" 
        block 
        size="large"
        :loading="submitting" 
        :disabled="loading" 
        @click="handleSubmit"
        custom-class="btn-primary-custom"
      >
        保存修改
      </wd-button>
    </view>
  </view>
</template>

<style lang="scss" scoped>

.profile-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: $color-bg;
}

.page-content {
  flex: 1;
}

// 头像卡片
.avatar-card {
  background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
  padding: 40rpx $spacing-lg;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-wrapper {
  background: rgba(255, 255, 255, 0.2);
  border-radius: $border-radius-round;
  padding: 6rpx;
}

.avatar-tip {
  font-size: $font-size-xsmall;
  color: rgba(255, 255, 255, 0.8);
  margin-top: $spacing-small;
}

// 信息卡片
.info-card {
  background: $color-white;
  border-radius: $border-radius-lg;
  margin: $spacing-sm $spacing-md;
  padding: $spacing-sm;
  box-shadow: $box-shadow-sm;

  &:first-of-type {
    margin-top: -30rpx;
    position: relative;
    z-index: 1;
  }
}

.card-title {
  font-size: $font-size-small;
  font-weight: 600;
  color: $color-text-primary;
  margin-bottom: $spacing-sm;
  padding-bottom: $spacing-small;
  border-bottom: 2rpx solid #f5f5f5;
  display: flex;
  align-items: center;
  gap: $spacing-xs;
}

// 表单行 - 标签和输入框在同一行
.form-row {
  display: flex;
  align-items: center;
  padding: $spacing-sm 0;
  border-bottom: 1rpx solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }

  &.address-row {
    padding: $spacing-xs 0;
  }
}

.form-label {
  font-size: $font-size-small;
  color: $color-text-regular;
  width: 140rpx;
  flex-shrink: 0;
}

.required {
  color: $color-danger;
}

.form-value {
  flex: 1;
  
  :deep(.wd-input) {
    background: transparent;
    border: none;
    text-align: right;
    padding: 0;
    
    .wd-input__inner {
      text-align: right;
      font-size: $font-size-content;
    }
  }
}

// 性别选择器
.gender-selector {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  gap: $spacing-sm;
}

.gender-btn {
  padding: $spacing-small $spacing-md;
  font-size: $font-size-small;
  color: $color-text-regular;
  background: $color-bg;
  border-radius: $border-radius-sm;
  transition: all $transition-fast;

  &.active {
    background: $color-primary-light;
    color: $color-primary;
    font-weight: 500;
  }
}

// 底部按钮
.footer-btns {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: $spacing-sm $spacing-lg;
  padding-bottom: calc(#{$spacing-sm} + env(safe-area-inset-bottom));
  background: $color-white;
  box-shadow: $box-shadow-md;
  z-index: 100;
}

:deep(.btn-primary-custom) {
  height: 84rpx;
  border-radius: 42rpx;
  font-size: $font-size-large;
  font-weight: 500;
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
}
</style>
