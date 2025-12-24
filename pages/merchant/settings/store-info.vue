<script setup lang="ts">
/**
 * 店铺信息修改页面
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, computed, onMounted } from 'vue'
import { getMerchant, updateMerchantInfo, createMerchant } from '@/api/modules/merchant'
import { useNavbarSafeArea } from '@/composables/useNavbarSafeArea'
import { useUserStore } from '@/stores/modules/user'
import AddressSelector from '@/components/AddressSelector.vue'
import type { MerchantVO } from '@/types/merchant'

// ==================== 数据状态 ====================

const loading = ref(false)
const submitting = ref(false)
const merchant = ref<MerchantVO | null>(null)
const isCreateMode = ref(false)
const userStore = useUserStore()

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
  phone: '',
  addressId: null as number | null,
  addressDetail: ''
})


// 页面标题
const pageTitle = computed(() => isCreateMode.value ? '创建店铺' : '店铺信息')

// ==================== 方法 ====================

/**
 * 加载店铺信息
 */
const loadStoreInfo = async () => {
  // 检查URL参数判断是否为创建模式
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  if (currentPage?.options?.mode === 'create') {
    isCreateMode.value = true
    return
  }

  // 获取当前商户ID
  const merchantId = userStore.userInfo?.id
  if (!merchantId) {
    uni.showToast({ title: '未找到商户信息', icon: 'none' })
    return
  }

  loading.value = true
  try {
    const info = await getMerchant(merchantId)
    merchant.value = info
    form.value = {
      name: info.name || '',
      phone: info.phone || '',
      addressId: info.addressId || null,
      addressDetail: info.addressDetail || ''
    }
  } catch (error) {
    console.error('加载店铺信息失败:', error)
    uni.showToast({ title: '加载失败', icon: 'error' })
  } finally {
    loading.value = false
  }
}

/**
 * 提交修改或创建
 */
const handleSubmit = async () => {
  if (!form.value.name.trim()) {
    uni.showToast({ title: '请输入店铺名称', icon: 'none' })
    return
  }
  
  submitting.value = true
  try {
    if (isCreateMode.value) {
      // 创建店铺
      await createMerchant({
        merchantName: form.value.name,
        phone: form.value.phone,
        addressId: form.value.addressId || undefined,
        addressDetail: form.value.addressDetail
      })
      uni.showToast({ title: '创建成功', icon: 'success' })
    } else {
      // 更新店铺
      if (!merchant.value?.id) return
      await updateMerchantInfo(merchant.value.id, {
        name: form.value.name,
        phone: form.value.phone,
        addressId: form.value.addressId || undefined,
        addressDetail: form.value.addressDetail
      })
      uni.showToast({ title: '修改成功', icon: 'success' })
    }
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error(isCreateMode.value ? '创建店铺失败:' : '修改店铺信息失败:', error)
    uni.showToast({ title: isCreateMode.value ? '创建失败' : '修改失败', icon: 'error' })
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
 * 切换到创建模式
 */
const switchToCreateMode = () => {
  isCreateMode.value = true
  form.value = {
    name: '',
    phone: merchant.value?.phone || '',
    addressId: null,
    addressDetail: ''
  }
}

// ==================== 生命周期 ====================

onMounted(() => {
  loadStoreInfo()
})
</script>

<template>
  <view class="store-info-page">
    <!-- 自定义导航栏 -->
    <view class="navbar" :style="{ height: navbarTotalHeight + 'px' }">
      <view class="navbar-content" :style="{ marginTop: (safeArea?.statusBarHeight || 20) + 'px' }">
        <view class="navbar-left" @tap="goBack">
          <wd-icon name="arrow-left" size="44rpx" />
        </view>
        <view class="navbar-title">{{ pageTitle }}</view>
        <view class="navbar-right">
          <text v-if="!isCreateMode" class="create-btn" @tap="switchToCreateMode">新建</text>
        </view>
      </view>
    </view>

    <!-- 表单内容 -->
    <view class="form-content" :style="{ paddingTop: navbarTotalHeight + 'px' }">
      <view class="form-section">
        <wd-cell-group border>
          <wd-input
            v-model="form.name"
            label="店铺名称"
            label-width="180rpx"
            placeholder="请输入店铺名称"
            clearable
            :disabled="loading"
          />
          <wd-input
            v-model="form.phone"
            label="联系电话"
            label-width="180rpx"
            placeholder="请输入联系电话"
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
          {{ isCreateMode ? '创建店铺' : '保存修改' }}
        </wd-button>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.store-info-page {
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

.create-btn {
  color: #3B82F6;
  font-size: 28rpx;
}

.form-content {
  padding: 32rpx;
}

.form-section {
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
  margin-bottom: 32rpx;
}

.address-group {
  padding: 24rpx 32rpx;
}

.submit-section {
  margin-top: 48rpx;
}
</style>
