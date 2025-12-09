<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { switchIdentity } from '@/api/modules/auth'
import type { MerchantIdentity, UserInfoVO } from '@/types/auth'

const merchants = ref<MerchantIdentity[]>([])
const userInfo = ref<UserInfoVO | null>(null)
const loading = ref<boolean>(false)

onLoad((options: any) => {
  if (options.merchants) {
    merchants.value = JSON.parse(options.merchants)
  }
  if (options.userInfo) {
    userInfo.value = JSON.parse(options.userInfo)
  }
})

/**
 * 选择商户
 */
const selectMerchant = async (merchant: MerchantIdentity) => {
  loading.value = true

  try {
    const response = await switchIdentity({
      identityType: 'MERCHANT_OWNER',
      merchantId: merchant.id
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
  <view class="select-merchant-page">
    <view class="merchant-list">
      <view
        v-for="merchant in merchants"
        :key="merchant.id"
        class="merchant-item"
        @click="selectMerchant(merchant)"
      >
        <view class="merchant-info">
          <text class="merchant-name">{{ merchant.merchantName }}</text>
          <text class="merchant-no">{{ merchant.merchantNo }}</text>
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
.select-merchant-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
}

.merchant-list {
  margin-top: 20rpx;
}

.merchant-item {
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

  .merchant-info {
    display: flex;
    flex-direction: column;
    gap: 8rpx;

    .merchant-name {
      font-size: 30rpx;
      color: #333;
      font-weight: 500;
    }

    .merchant-no {
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
