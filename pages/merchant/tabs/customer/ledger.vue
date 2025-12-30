<script setup lang="ts">
/**
 * 客户账单页面
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, onMounted, onUnmounted } from 'vue'
import { getCustomer, getCustomerStats } from '@/api/modules/customer'
import { queryLedgersByCustomer } from '@/api/modules/ledger'
import { LedgerStatus } from '@/enums'
import LedgerCard from '@/components/ledger/LedgerCard.vue'
import type { CustomerVO, CustomerStatsVO } from '@/types/customer'
import type { LedgerListVO } from '@/types/ledger'

// ==================== 页面参数 ====================

const customerId = ref<number>(0)

// ==================== 数据状态 ====================

const loading = ref(false)
const refreshing = ref(false)
const customer = ref<CustomerVO | null>(null)
const stats = ref<CustomerStatsVO | null>(null)

// 筛选（使用数字状态值）
const statusFilter = ref<number | null>(null)
const statusOptions = [
  { value: null, label: '全部' },
  { value: LedgerStatus.IN_PROGRESS, label: '进行中' },
  { value: LedgerStatus.PARTIAL, label: '部分缴费' },
  { value: LedgerStatus.ON_CREDIT, label: '赊账中' },
  { value: LedgerStatus.CLEARED, label: '已结清' },
  { value: LedgerStatus.CLOSED, label: '已关闭' }
]

// 账单列表
const ledgers = ref<LedgerListVO[]>([])
const page = ref(0)
const hasMore = ref(true)

// ==================== 方法 ====================

/**
 * 加载客户信息
 */
const loadCustomer = async () => {
  try {
    const [customerRes, statsRes] = await Promise.all([
      getCustomer(customerId.value),
      getCustomerStats(customerId.value)
    ])
    customer.value = customerRes
    stats.value = statsRes
  } catch (error) {
    console.error('加载客户信息失败:', error)
  }
}

/**
 * 加载账单列表
 */
const loadLedgers = async (reset = false) => {
  if (loading.value) return
  if (!reset && !hasMore.value) return

  try {
    loading.value = true
    if (reset) {
      page.value = 0
      ledgers.value = []
    }

    const res = await queryLedgersByCustomer(
      {
        customerId: customerId.value,
        ledgerStatus: statusFilter.value ?? undefined
      },
      { page: page.value, size: 15 }
    )

    if (reset) {
      ledgers.value = res.content || []
    } else {
      ledgers.value.push(...(res.content || []))
    }

    hasMore.value = !res.last
    page.value++
  } catch (error) {
    console.error('加载账单列表失败:', error)
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

/**
 * 筛选状态变更
 */
const onStatusChange = (status: number | null) => {
  statusFilter.value = status
  loadLedgers(true)
}

/**
 * 下拉刷新
 */
const onRefresh = async () => {
  refreshing.value = true
  await Promise.all([loadCustomer(), loadLedgers(true)])
}

/**
 * 加载更多
 */
const onLoadMore = () => {
  if (!loading.value && hasMore.value) {
    loadLedgers()
  }
}

/**
 * 查看账单详情
 */
const viewLedgerDetail = (id: number) => {
  uni.navigateTo({ url: `/pages/merchant/tabs/ledger/detail?id=${id}` })
}

/**
 * 创建新账单
 */
const createLedger = () => {
  uni.navigateTo({ url: `/pages/merchant/tabs/ledger/add?customerId=${customerId.value}` })
}

/**
 * 查看账单详情
 */
const handleLedgerClick = (id: number) => {
  viewLedgerDetail(id)
}

// ==================== 生命周期 ====================

/**
 * 账单变更事件处理（新增/编辑账单后刷新）
 */
const handleLedgerChanged = () => {
  console.log('[CustomerLedger] 账单数据已变更，刷新列表')
  loadCustomer()
  loadLedgers(true)
}

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const query = currentPage.options || {}
  
  if (query.id) {
    customerId.value = Number(query.id)
    loadCustomer()
    loadLedgers(true)
  } else {
    uni.showToast({ title: '客户ID不能为空', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 1500)
  }
  
  // 监听账单变更事件
  uni.$on('ledger-changed', handleLedgerChanged)
})

onUnmounted(() => {
  // 移除事件监听
  uni.$off('ledger-changed', handleLedgerChanged)
})
</script>

<template>
  <view class="customer-ledger-page">
    <!-- 客户信息头部 -->
    <view class="header" v-if="customer">
      <view class="customer-info">
        <view class="customer-avatar">{{ customer.name?.charAt(0) }}</view>
        <view class="customer-detail">
          <view class="customer-name">{{ customer.name }}</view>
          <view class="customer-phone">{{ customer.phone || '暂无电话' }}</view>
        </view>
      </view>
      <view class="debt-info" v-if="stats">
        <view class="debt-label">当前欠款</view>
        <view class="debt-value">¥{{ (stats.debtAmount || 0).toFixed(2) }}</view>
      </view>
    </view>

    <!-- 筛选栏 -->
    <view class="filter-bar">
      <view
        v-for="option in statusOptions"
        :key="option.value"
        class="filter-item"
        :class="{ active: statusFilter === option.value }"
        @tap="onStatusChange(option.value)"
      >
        {{ option.label }}
      </view>
    </view>

    <!-- 账单列表 -->
    <scroll-view
      class="ledger-scroll"
      scroll-y
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="onLoadMore"
    >
      <view class="ledger-scroll-inner">
        <!-- 空状态 -->
        <view v-if="ledgers.length === 0 && !loading" class="empty-state">
          <wd-icon name="list" size="100rpx" color="#ddd" />
          <text>暂无账单记录</text>
        </view>

        <!-- 账单列表 -->
        <view v-else class="ledger-list">
          <LedgerCard
            v-for="ledger in ledgers"
            :key="ledger.id"
            :ledger="ledger"
            :show-customer="false"
            @click="handleLedgerClick"
          />
        </view>

        <!-- 加载更多 -->
        <view v-if="loading && ledgers.length > 0" class="loading-more">
          <wd-loading size="40rpx" />
          <text>加载中...</text>
        </view>

        <!-- 没有更多 -->
        <view v-if="!hasMore && ledgers.length > 0" class="no-more">
          没有更多了
        </view>

        <view style="height: 160rpx;"></view>
      </view>
    </scroll-view>

    <!-- 新建账单按钮 -->
    <view class="fab-btn" @tap="createLedger">
      <wd-icon name="add" size="48rpx" color="#fff" />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.customer-ledger-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.header {
  background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
  padding: 32rpx;
  color: #fff;
}

.customer-info {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}

.customer-avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  font-weight: 600;
  margin-right: 24rpx;
}

.customer-detail {
  flex: 1;
}

.customer-name {
  font-size: 34rpx;
  font-weight: 600;
  margin-bottom: 4rpx;
}

.customer-phone {
  font-size: 26rpx;
  opacity: 0.8;
}

.debt-info {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.debt-label {
  font-size: 28rpx;
  opacity: 0.9;
}

.debt-value {
  font-size: 40rpx;
  font-weight: 600;
}

.filter-bar {
  display: flex;
  padding: 20rpx 24rpx;
  background: #fff;
  gap: 16rpx;
  overflow-x: auto;
}

.filter-item {
  flex-shrink: 0;
  padding: 16rpx 32rpx;
  border-radius: 32rpx;
  font-size: 26rpx;
  color: #666;
  background: #f5f5f5;

  &.active {
    background: #3B82F6;
    color: #fff;
  }
}

.ledger-scroll {
  flex: 1;
}

.ledger-scroll-inner {
  padding: 24rpx;
}

.empty-state {
  padding: 120rpx 0;
  text-align: center;
  color: #999;
  font-size: 28rpx;

  text {
    display: block;
    margin-top: 24rpx;
  }
}

.ledger-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.ledger-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 28rpx;
}

.ledger-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.ledger-time {
  font-size: 26rpx;
  color: #999;
}

.ledger-status {
  font-size: 24rpx;
  padding: 8rpx 20rpx;
  border-radius: 20rpx;

  &.status-pending {
    background: #FEF3C7;
    color: #F59E0B;
  }

  &.status-debt {
    background: #FEE2E2;
    color: #EF4444;
  }

  &.status-paid {
    background: #D1FAE5;
    color: #10B981;
  }

  &.status-closed {
    background: #F3F4F6;
    color: #6B7280;
  }
}

.ledger-body {
  margin-bottom: 20rpx;
  padding-bottom: 20rpx;
  border-bottom: 2rpx solid #f5f5f5;
}

.ledger-remark {
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 8rpx;
}

.ledger-items {
  font-size: 26rpx;
  color: #999;
}

.ledger-footer {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.amount-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.amount-label {
  font-size: 26rpx;
  color: #666;
}

.amount-value {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.amount-paid {
  font-size: 28rpx;
  color: #10B981;
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  padding: 32rpx;
  color: #999;
  font-size: 26rpx;
}

.no-more {
  text-align: center;
  padding: 32rpx;
  color: #999;
  font-size: 26rpx;
}

.fab-btn {
  position: fixed;
  right: 32rpx;
  bottom: 100rpx;
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  background: #3B82F6;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(59, 130, 246, 0.4);
  z-index: 99;
}
</style>
