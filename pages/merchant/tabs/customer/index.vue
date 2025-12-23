<script setup lang="ts">
/**
 * 客户列表Tab页
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, onMounted } from 'vue'
import { searchCustomers } from '@/api/modules/customer'
import type { CustomerVO } from '@/types/customer'
import CustomerCard from '@/components/customer/CustomerCard.vue'

// ==================== 数据状态 ====================

const refreshing = ref(false)
const loading = ref(false)
const keyword = ref('')

// 客户统计 - TODO: 从接口获取 customer.getCustomerStats()
const stats = ref({
  totalCount: 128,
  totalDebt: 12800,
  debtCount: 23
})

// 客户列表
const customers = ref<CustomerVO[]>([])
const page = ref(0)
const hasMore = ref(true)

// ==================== 方法 ====================

/**
 * 加载客户列表
 */
const loadCustomers = async (reset = false) => {
  if (loading.value) return
  if (!reset && !hasMore.value) return

  try {
    loading.value = true
    if (reset) {
      page.value = 0
      customers.value = []
    }

    const res = await searchCustomers(
      { keyword: keyword.value || undefined },
      { page: page.value, size: 20 }
    )

    if (reset) {
      customers.value = res.content || []
    } else {
      customers.value.push(...(res.content || []))
    }

    hasMore.value = (res.content?.length || 0) >= 20
    page.value++
  } catch (error) {
    console.error('加载客户列表失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 下拉刷新
 */
const onRefresh = async () => {
  refreshing.value = true
  await loadCustomers(true)
  refreshing.value = false
}

/**
 * 搜索
 */
const onSearch = () => {
  loadCustomers(true)
}

/**
 * 加载更多
 */
const onLoadMore = () => {
  if (!loading.value && hasMore.value) {
    loadCustomers()
  }
}

/**
 * 查看客户详情
 */
const viewCustomerDetail = (customer: CustomerVO) => {
  uni.navigateTo({ url: `/pages/merchant/tabs/customer/detail?id=${customer.id}` })
}

/**
 * 添加客户
 */
const addCustomer = () => {
  uni.navigateTo({ url: '/pages/merchant/tabs/customer/add' })
}

// ==================== 生命周期 ====================

onMounted(() => {
  loadCustomers(true)
})
</script>

<template>
  <view class="customer-page">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input-wrap">
        <wd-icon name="search" size="36rpx" color="#999" />
        <input
          class="search-input"
          v-model="keyword"
          placeholder="搜索客户姓名/手机号"
          placeholder-class="placeholder"
          confirm-type="search"
          @confirm="onSearch"
        />
        <wd-icon
          v-if="keyword"
          name="close-fill"
          size="32rpx"
          color="#ccc"
          @tap="keyword = ''; onSearch()"
        />
      </view>
    </view>

    <!-- 统计卡片 -->
    <view class="stats-card">
      <view class="stat-item">
        <view class="stat-value">{{ stats.totalCount }}</view>
        <view class="stat-label">客户总数</view>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <view class="stat-value debt">¥{{ stats.totalDebt.toLocaleString() }}</view>
        <view class="stat-label">总欠款</view>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <view class="stat-value">{{ stats.debtCount }}</view>
        <view class="stat-label">有欠款客户</view>
      </view>
    </view>

    <!-- 客户列表 -->
    <scroll-view
      class="customer-scroll"
      scroll-y
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="onLoadMore"
    >
      <view v-if="customers.length === 0 && !loading" class="empty-state">
        <wd-icon name="inbox" size="100rpx" color="#ddd" />
        <text>暂无客户数据</text>
        <button class="add-btn-empty" @tap="addCustomer">添加客户</button>
      </view>

      <view v-else class="customer-list">
        <CustomerCard
          v-for="customer in customers"
          :key="customer.id"
          :customer="customer"
          @click="viewCustomerDetail(customer)"
        />
      </view>

      <view v-if="loading" class="loading-more">
        <wd-loading size="40rpx" />
        <text>加载中...</text>
      </view>

      <view v-if="!hasMore && customers.length > 0" class="no-more">
        没有更多了
      </view>
    </scroll-view>

    <!-- 浮动添加按钮 -->
    <view class="fab-btn" @tap="addCustomer">
      <wd-icon name="add" size="48rpx" color="#fff" />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.customer-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.search-bar {
  padding: 24rpx;
  background: #fff;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 40rpx;
  padding: 16rpx 24rpx;
  gap: 16rpx;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.placeholder {
  color: #999;
}

.stats-card {
  display: flex;
  background: #fff;
  margin: 0 24rpx 24rpx;
  border-radius: 20rpx;
  padding: 32rpx 0;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  font-size: 40rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;

  &.debt {
    color: #EF4444;
  }
}

.stat-label {
  font-size: 24rpx;
  color: #999;
}

.stat-divider {
  width: 2rpx;
  background: #f0f0f0;
}

.customer-scroll {
  flex: 1;
  padding: 0 24rpx;
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

.add-btn-empty {
  margin-top: 32rpx;
  padding: 16rpx 48rpx;
  background: #3B82F6;
  color: #fff;
  font-size: 28rpx;
  border-radius: 40rpx;
  border: none;

  &::after {
    border: none;
  }
}

.customer-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding-bottom: 120rpx;
}

.customer-card {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  gap: 24rpx;
}

.customer-avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  font-weight: 600;
  flex-shrink: 0;
}

.customer-info {
  flex: 1;
  min-width: 0;
}

.customer-header {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
  margin-bottom: 8rpx;
}

.customer-name {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
}

.customer-nickname {
  font-size: 24rpx;
  color: #999;
}

.customer-phone,
.customer-address {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: #666;
  margin-top: 4rpx;
}

.customer-address {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 移除重复的样式 */

.customer-debt {
  font-size: 26rpx;
  color: #EF4444;
  font-weight: 500;
}

.customer-orders {
  font-size: 24rpx;
  color: #999;
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
  bottom: 200rpx;
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  background: #3B82F6;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(59, 130, 246, 0.4);
}
</style>
