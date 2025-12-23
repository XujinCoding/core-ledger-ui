<script setup lang="ts">
import type { CustomerVO } from '@/types/customer'

defineProps<{
  customer: CustomerVO
}>()

const genderText = (gender?: number) => {
  if (gender === 1) return '男'
  if (gender === 2) return '女'
  return '未知'
}
</script>

<template>
  <view class="info-card">
    <view class="section-title">基本信息</view>
    <view class="info-list">
      <view class="info-item">
        <text class="info-label">性别</text>
        <text class="info-value">{{ genderText(customer.gender) }}</text>
      </view>
      <view class="info-item">
        <text class="info-label">别名</text>
        <text class="info-value">{{ customer.alias || '-' }}</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.info-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 24rpx;
}

.info-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
}

.info-item {
  &.full {
    grid-column: span 2;
  }
}

.info-label {
  display: block;
  font-size: 24rpx;
  color: #999;
  margin-bottom: 8rpx;
}

.info-value {
  font-size: 28rpx;
  color: #333;
  word-break: break-all;
}
</style>
