<script setup lang="ts">
/**
 * 游客模式客户Tab页
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, computed } from 'vue'
import { useGuestData } from '@/composables/useGuestData'
import { useNavbarSafeArea } from '@/composables/useNavbarSafeArea'
import { useGuestMode } from '@/composables/useGuestMode'
import CustomerCard from '@/components/customer/CustomerCard.vue'
import type { GuestCustomer } from '@/composables/useGuestData'

// ==================== 数据状态 ====================

const refreshing = ref(false)
const keyword = ref('')

// 导航栏安全区域
const { safeArea } = useNavbarSafeArea()

// 游客数据
const { getCustomers } = useGuestData()
const customers = ref(getCustomers())

// 游客模式限制
const { handleGuestAction } = useGuestMode()

// ==================== 计算属性 ====================

/**
 * 过滤后的客户列表
 */
const filteredCustomers = computed(() => {
  if (!keyword.value.trim()) {
    return customers.value
  }
  const kw = keyword.value.toLowerCase()
  return customers.value.filter(c => 
    c.name.toLowerCase().includes(kw) || 
    c.phone.includes(kw)
  )
})

/**
 * 客户统计
 */
const customerCount = computed(() => filteredCustomers.value.length)

// ==================== 方法 ====================

/**
 * 下拉刷新
 */
const onRefresh = async () => {
  refreshing.value = true
  // 模拟刷新延迟
  await new Promise(resolve => setTimeout(resolve, 500))
  refreshing.value = false
  uni.showToast({ title: '刷新成功', icon: 'success', duration: 1500 })
}

/**
 * 搜索
 */
const onSearch = () => {
  // 搜索逻辑已通过 computed 实现
}

/**
 * 查看客户详情 - 提示需要登录
 */
const viewCustomerDetail = (customer: GuestCustomer) => {
  handleGuestAction('查看客户详情')
}

/**
 * 添加客户 - 提示需要登录
 */
const addCustomer = () => {
  handleGuestAction('添加客户')
}
</script>

<template>
  <view class="customer-page">
    <!-- 固定头部区域 -->
    <view class="fixed-header" :style="{ paddingTop: safeArea?.navbarHeight + 'px' }">
      <!-- 搜索栏 -->
      <view class="search-bar">
        <view class="search-input-wrap">
          <wd-icon name="search" size="36rpx" color="#999" />
          <input
            class="search-input"
            v-model="keyword"
            placeholder="搜索客户姓名或手机号"
            placeholder-class="placeholder"
            confirm-type="search"
            @confirm="onSearch"
          />
          <wd-icon
            v-if="keyword"
            name="close-fill"
            size="32rpx"
            color="#ccc"
            @tap="keyword = ''"
          />
        </view>
      </view>

      <!-- 统计卡片 -->
      <view class="stats-card stats-card-single">
        <view class="stat-item">
          <view class="stat-value">{{ customerCount }}</view>
          <view class="stat-label">客户总数</view>
        </view>
      </view>
    </view>

    <!-- 客户列表区域 -->
    <scroll-view
      class="customer-scroll"
      scroll-y
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view class="customer-scroll-inner">
        <view v-if="filteredCustomers.length === 0" class="empty-state">
          <wd-icon name="inbox" size="100rpx" color="#ddd" />
          <text>{{ keyword ? '未找到匹配的客户' : '暂无客户数据' }}</text>
        </view>

        <view v-else class="customer-list">
          <CustomerCard
            v-for="customer in filteredCustomers"
            :key="customer.id"
            :customer="customer"
            @click="viewCustomerDetail(customer)"
          />
        </view>
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
  overflow: hidden;
}

.fixed-header {
  flex-shrink: 0;
  background: #fff;
}

.search-bar {
  padding: 24rpx;
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
  margin: 24rpx;
  border-radius: 20rpx;
  padding: 32rpx 0;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);

  &.stats-card-single {
    justify-content: center;
    padding: 24rpx 0;
  }
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
}

.stat-label {
  font-size: 24rpx;
  color: #999;
}

.customer-scroll {
  flex: 1;
  overflow: hidden;
}

.customer-scroll-inner {
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

.customer-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding-bottom: 120rpx;
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
