<script setup lang="ts">
/**
 * 客户个人信息页面
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, computed, onMounted } from 'vue'
import { getProfile, updateProfile } from '@/api/modules/customer'
import { useNavbarSafeArea } from '@/composables/useNavbarSafeArea'
import AddressSelector from '@/components/AddressSelector.vue'
import ImageUploader from '@/components/ImageUploader.vue'
import type { CustomerVO, CustomerProfileUpdateDTO } from '@/types/customer'
import { Gender } from '@/enums'

// ==================== 数据状态 ====================

const loading = ref(false)
const submitting = ref(false)
const customer = ref<CustomerVO | null>(null)

// 导航栏安全区域
const { safeArea } = useNavbarSafeArea()

// 计算导航栏总高度
const navbarTotalHeight = computed(() => {
  if (!safeArea.value) return 88
  return safeArea.value.navbarHeight + 44
})

// 表单数据
const form = ref({
  name: '',
  alias: '',
  gender: Gender.UNKNOWN as Gender,
  age: undefined as number | undefined,
  avatarUrl: '',
  addressId: null as number | null,
  addressDetail: ''
})

// ==================== 方法 ====================

/**
 * 加载个人信息
 */
const loadProfile = async () => {
  loading.value = true
  try {
    const info = await getProfile()
    customer.value = info
    form.value = {
      name: info.name || '',
      alias: info.alias || '',
      gender: info.gender || Gender.UNKNOWN,
      age: info.age,
      avatarUrl: info.avatarUrl || '',
      addressId: info.addressId || null,
      addressDetail: info.addressDetail || ''
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

  submitting.value = true
  try {
    const data: CustomerProfileUpdateDTO = {
      name: form.value.name,
      alias: form.value.alias || undefined,
      gender: form.value.gender,
      age: form.value.age,
      avatarUrl: form.value.avatarUrl || undefined,
      addressId: form.value.addressId || undefined,
      addressDetail: form.value.addressDetail
    }

    await updateProfile(data)
    uni.showToast({ title: '修改成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error('修改个人信息失败:', error)
    // 错误提示已在 request.ts 中处理
  } finally {
    submitting.value = false
  }
}

/**
 * 返回上一页
 */
const goBack = () => {
  uni.navigateBack()
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
    <!-- 自定义导航栏 -->
    <view class="navbar" :style="{ height: navbarTotalHeight + 'px' }">
      <view class="navbar-content" :style="{ marginTop: (safeArea?.statusBarHeight || 20) + 'px' }">
        <view class="navbar-left" @tap="goBack">
          <wd-icon name="arrow-left" size="44rpx" />
        </view>
        <view class="navbar-title">个人信息</view>
        <view class="navbar-right"></view>
      </view>
    </view>

    <!-- 表单内容 -->
    <view class="form-content" :style="{ paddingTop: navbarTotalHeight + 'px' }">
      <!-- 头像上传 -->
      <view class="form-section avatar-section">
        <view class="avatar-label">头像</view>
        <ImageUploader
          v-model="form.avatarUrl"
          width="160rpx"
          height="160rpx"
          placeholder="上传头像"
          round
          :disabled="loading"
        />
      </view>

      <!-- 基本信息 -->
      <view class="form-section">
        <wd-cell-group border>
          <wd-input
            v-model="form.name"
            label="姓名"
            label-width="180rpx"
            placeholder="请输入姓名"
            clearable
            :disabled="loading"
            required
          />
          <wd-input
            v-model="form.alias"
            label="别名/昵称"
            label-width="180rpx"
            placeholder="请输入别名或昵称"
            clearable
            :disabled="loading"
          />
        </wd-cell-group>
      </view>

      <!-- 性别选择 -->
      <view class="form-section">
        <view class="gender-section">
          <view class="gender-label">性别</view>
          <view class="gender-buttons">
            <view
              class="gender-btn"
              :class="{ active: form.gender === Gender.MALE }"
              @tap="selectGender(Gender.MALE)"
            >
              <wd-icon name="male" size="32rpx" />
              <text>男</text>
            </view>
            <view
              class="gender-btn"
              :class="{ active: form.gender === Gender.FEMALE }"
              @tap="selectGender(Gender.FEMALE)"
            >
              <wd-icon name="female" size="32rpx" />
              <text>女</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 年龄 -->
      <view class="form-section">
        <wd-cell-group border>
          <wd-input
            v-model="form.age"
            label="年龄"
            label-width="180rpx"
            placeholder="请输入年龄"
            type="number"
            clearable
            :disabled="loading"
          />
        </wd-cell-group>
      </view>

      <!-- 地址选择 -->
      <view class="form-section">
        <view class="address-group">
          <AddressSelector
            v-model="form.addressId"
            label="所在地区"
            placeholder="请选择所在地区"
            :min-level="2"
          />
        </view>
      </view>

      <!-- 详细地址 -->
      <view class="form-section">
        <wd-cell-group border>
          <wd-input
            v-model="form.addressDetail"
            label="详细地址"
            label-width="180rpx"
            placeholder="请输入详细地址（街道门牌号等）"
            clearable
            :disabled="loading"
          />
        </wd-cell-group>
      </view>

      <!-- 提交按钮 -->
      <view class="submit-section">
        <wd-button
          type="primary"
          block
          size="large"
          :loading="submitting"
          :disabled="loading"
          @click="handleSubmit"
        >
          保存修改
        </wd-button>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.profile-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #fff;
  z-index: 100;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 32rpx;
}

.navbar-left,
.navbar-right {
  width: 80rpx;
}

.navbar-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #333;
}

.form-content {
  padding: 32rpx;
}

.form-section {
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
  margin-top: 16rpx;
  margin-bottom: 32rpx;
}

.avatar-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
}

.avatar-label {
  font-size: 28rpx;
  color: #333;
}

.gender-section {
  padding: 24rpx 32rpx;
}

.gender-label {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 24rpx;
}

.gender-buttons {
  display: flex;
  gap: 24rpx;
}

.gender-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  height: 80rpx;
  border: 2rpx solid #e5e5e5;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #666;
  transition: all 0.3s;

  &.active {
    border-color: #3B82F6;
    background: #EFF6FF;
    color: #3B82F6;
  }
}

.address-group {
  padding: 10px 15px;
}

.submit-section {
  margin-top: 48rpx;
}
</style>
