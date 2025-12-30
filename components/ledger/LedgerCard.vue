<script setup lang="ts">
/**
 * 账单卡片组件 - 用于账单列表和客户账单页面
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { computed } from 'vue'
import { LedgerStatus, getLedgerStatusLabel } from '@/enums'
import type { LedgerListVO } from '@/types/ledger'

// ==================== Props ====================

const props = defineProps<{
  ledger: LedgerListVO
  /** 是否显示客户名称（在客户账单页面不需要显示） */
  showCustomer?: boolean
}>()

// ==================== Emits ====================

const emit = defineEmits<{
  (e: 'click', id: number): void
}>()

// ==================== 计算属性 ====================

/**
 * 格式化账单标题：yyyy-mm-dd - 客户名称账单
 */
const ledgerTitle = computed(() => {
  const date = props.ledger.createInstant ? props.ledger.createInstant.substring(0, 10) : ''
  const customerName = props.ledger.customerName || ''
  return `${date} - ${customerName}账单`
})

/**
 * 获取状态标签
 */
const statusLabel = computed(() => {
  return getLedgerStatusLabel(props.ledger.ledgerStatus)
})

/**
 * 获取状态样式类
 */
const statusClass = computed(() => {
  const status = props.ledger.ledgerStatus
  const map: Record<number, string> = {
    [LedgerStatus.IN_PROGRESS]: 'status-progress',
    [LedgerStatus.PARTIAL]: 'status-partial',
    [LedgerStatus.CLEARED]: 'status-cleared',
    [LedgerStatus.ON_CREDIT]: 'status-credit',
    [LedgerStatus.CLOSED]: 'status-closed'
  }
  return map[status] || 'status-progress'
})

/**
 * 格式化金额
 */
const formatAmount = (amount: number | string | undefined) => {
  const num = Number(amount) || 0
  return num.toFixed(2)
}

// ==================== 方法 ====================

const handleClick = () => {
  emit('click', props.ledger.id)
}
</script>

<template>
  <view class="ledger-card" @tap="handleClick">
    <view class="card-main">
      <view class="ledger-avatar">
        {{ ledger.customerName?.charAt(0) || '?' }}
      </view>
      <view class="ledger-info">
        <view class="ledger-header">
          <text class="ledger-title">{{ ledgerTitle }}</text>
          <text class="ledger-amount">¥{{ formatAmount(ledger.totalAmount) }}</text>
        </view>
        <view class="ledger-footer">
          <text class="ledger-customer" v-if="showCustomer && ledger.customerName">
            {{ ledger.customerName }}
          </text>
          <text class="ledger-status" :class="statusClass">
            {{ statusLabel }}
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.ledger-card {
  display: flex;
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.card-main {
  flex: 1;
  display: flex;
  gap: 20rpx;
}

.ledger-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 600;
  flex-shrink: 0;
}

.ledger-info {
  flex: 1;
  min-width: 0;
}

.ledger-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12rpx;
}

.ledger-title {
  flex: 1;
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
  margin-right: 16rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ledger-amount {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  flex-shrink: 0;
}

.ledger-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ledger-customer {
  font-size: 24rpx;
  color: #999;
}

.ledger-status {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;

  &.status-progress {
    background: #fef3c7;
    color: #f59e0b;
  }

  &.status-partial {
    background: #dbeafe;
    color: #3b82f6;
  }

  &.status-cleared {
    background: #d1fae5;
    color: #10b981;
  }

  &.status-credit {
    background: #fee2e2;
    color: #ef4444;
  }

  &.status-closed {
    background: #f3f4f6;
    color: #6b7280;
  }
}
</style>
