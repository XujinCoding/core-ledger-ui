<script setup lang="ts">
import type { CustomerStatsVO } from '@/types/customer'

defineProps<{
  stats: CustomerStatsVO
}>()
</script>

<template>
  <view class="stats-card">
    <view class="section-title">消费统计</view>
    <view class="stats-row">
      <view class="stat-item">
        <view class="stat-value">¥{{ stats.totalAmount?.toLocaleString() || '0' }}</view>
        <view class="stat-label">累计消费</view>
      </view>
      <view class="stat-item">
        <view class="stat-value">{{ stats.orderCount || '0' }}</view>
        <view class="stat-label">订单数</view>
      </view>
      <view class="stat-item">
        <view class="stat-value">¥{{ stats.avgAmount?.toFixed(2) || '0.00' }}</view>
        <view class="stat-label">平均单价</view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.stats-card {
  background: $color-white;
  border-radius: 20rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: $font-size-title;
  font-weight: 600;
  color: $color-text-primary;
  margin-bottom: 24rpx;
}

.stats-row {
  display: flex;
  justify-content: space-between;
  text-align: center;
}

.stat-item {
  flex: 1;
  padding: 0 12rpx;
}

.stat-value {
  font-size: $font-size-xlarge;
  font-weight: 600;
  color: $color-primary;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: $font-size-secondary;
  color: $color-text-secondary;
}
</style>
