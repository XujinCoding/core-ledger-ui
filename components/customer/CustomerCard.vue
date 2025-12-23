<script setup lang="ts">
import type { CustomerVO } from '@/types/customer'

const props = defineProps<{
  customer: CustomerVO
  showDetail?: boolean
}>()

const emit = defineEmits<{
  (e: 'click', customer: CustomerVO): void
}>()

const handleClick = () => {
  emit('click', props.customer)
}

// 获取客户类型文本
const getCustomerTypeText = (type: number) => {
  const types = {
    1: '普通客户',
    2: 'VIP客户',
    3: '企业客户'
  }
  return types[type as keyof typeof types] || '未知类型'
}
</script>

<template>
  <view class="customer-card" @click="handleClick">
    <view class="customer-avatar">
      {{ customer.name?.charAt(0) || '客' }}
    </view>
    <view class="customer-info">
      <view class="customer-name">
        {{ customer.name || '未命名客户' }}
        <text v-if="customer.alias" class="customer-alias">({{ customer.alias }})</text>
      </view>
      <view class="customer-phone">
        <wd-icon name="phone" size="28rpx" color="#999" />
        <text>{{ customer.phone || '未设置' }}</text>
      </view>
      <view v-if="customer.addressPath" class="customer-address">
        <wd-icon name="location" size="28rpx" color="#999" />
        <text>{{ customer.addressPath }}</text>
      </view>
    </view>
    <view class="customer-arrow">
      <wd-icon name="arrow-right" size="32rpx" color="#ccc" />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.customer-card {
  display: flex;
  align-items: center;
  padding: 24rpx 32rpx;
  background-color: #fff;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.customer-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 600;
  color: #fff;
  margin-right: 24rpx;
  flex-shrink: 0;
}

.customer-info {
  flex: 1;
  overflow: hidden;
}

.customer-name {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 8rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.customer-alias {
  font-size: 26rpx;
  color: #999;
  font-weight: 400;
}

.customer-phone,
.customer-address {
  font-size: 26rpx;
  color: #666;
  margin-top: 8rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.customer-arrow {
  margin-left: 16rpx;
  flex-shrink: 0;
}
</style>
