<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { switchIdentity } from '@/api/modules/auth'
import type { CustomerIdentity, UserInfoVO } from '@/types/auth'

const customers = ref<CustomerIdentity[]>([])
const userInfo = ref<UserInfoVO | null>(null)
const loading = ref<boolean>(false)

onLoad((options: any) => {
  if (options.customers) {
    customers.value = JSON.parse(options.customers)
  }
  if (options.userInfo) {
    userInfo.value = JSON.parse(options.userInfo)
  }
})

/**
 * 选择客户
 */
const selectCustomer = async (customer: CustomerIdentity) => {
  loading.value = true

  try {
    const response = await switchIdentity({
      identityType: 'CUSTOMER',
      customerId: customer.id
    })

    if (response.token) {
      // 保存 token 和用户信息
      uni.setStorageSync('ACCESS_TOKEN', response.token)
      uni.setStorageSync('USER_INFO', JSON.stringify(response.userInfo))
      uni.setStorageSync('IDENTITY_TYPE', response.userInfo.identityType)

      // 进入首页
      uni.reLaunch({
        url: '/pages/home/index'
      })
    }
  } catch (error) {
    uni.showToast({
      title: '选择失败，请重试',
      icon: 'error',
      duration: 2000
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <view class="select-customer-page">
    <view class="customer-list">
      <view
        v-for="customer in customers"
        :key="customer.id"
        class="customer-item"
        @click="selectCustomer(customer)"
      >
        <view class="customer-info">
          <text class="customer-name">{{ customer.customerName }}</text>
          <text class="merchant-name">{{ customer.merchantName }}</text>
        </view>
        <text class="icon">›</text>
      </view>
    </view>

    <view v-if="loading" class="loading-overlay">
      <u-loading-page></u-loading-page>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.select-customer-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
}

.customer-list {
  margin-top: 20rpx;
}

.customer-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background: white;
  border-radius: 8rpx;
  margin-bottom: 12rpx;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.05);

  &:active {
    background: #f9f9f9;
  }

  .customer-info {
    display: flex;
    flex-direction: column;
    gap: 8rpx;

    .customer-name {
      font-size: 30rpx;
      color: #333;
      font-weight: 500;
    }

    .merchant-name {
      font-size: 26rpx;
      color: #999;
    }
  }

  .icon {
    font-size: 32rpx;
    color: #ccc;
  }
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}
</style>
