<script setup lang="ts">
/**
 * 游客模式账单Tab页
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, computed } from 'vue'
import { useGuestData } from '@/composables/useGuestData'
import { useNavbarSafeArea } from '@/composables/useNavbarSafeArea'
import { useGuestMode } from '@/composables/useGuestMode'
import LedgerCard from '@/components/ledger/LedgerCard.vue'

// ==================== 数据状态 ====================

const refreshing = ref(false)
const searchKeyword = ref('')

// 导航栏安全区域
const { safeArea } = useNavbarSafeArea()

// 游客数据
const { getLedgers } = useGuestData()
const ledgers = ref(getLedgers())

// 游客模式限制
const { handleGuestAction } = useGuestMode()

// 状态筛选
const selectedStatus = ref<number | null>(null)

// 状态筛选选项
const statusOptions = [
  { value: null, label: '全部' },
  { value: 1, label: '进行中' },
  { value: 2, label: '部分缴费' },
  { value: 3, label: '赊账中' },
  { value: 4, label: '已结清' },
  { value: 5, label: '已关闭' }
]

// ==================== 计算属性 ====================

/**
 * 过滤后的账单列表
 */
const filteredLedgers = computed(() => {
  let result = ledgers.value

  // 按状态筛选
  if (selectedStatus.value !== null) {
    result = result.filter(l => l.ledgerStatus === selectedStatus.value)
  }

  // 按关键词搜索
  if (searchKeyword.value.trim()) {
    const kw = searchKeyword.value.toLowerCase()
    result = result.filter(l => 
      l.customerName.toLowerCase().includes(kw)
    )
  }

  return result
})

/**
 * 统计信息
 */
const stats = computed(() => {
  const filtered = filteredLedgers.value
  const totalAmount = filtered.reduce((sum, l) => sum + (l.totalAmount || 0), 0)
  const paidAmount = filtered.reduce((sum, l) => sum + (l.paidAmount || 0), 0)
  const pendingAmount = totalAmount - paidAmount

  return {
    totalAmount,
    paidAmount,
    pendingAmount,
    ledgerCount: filtered.length
  }
})

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
 * 清除搜索
 */
const clearSearch = () => {
  searchKeyword.value = ''
}

/**
 * 状态筛选
 */
const onStatusChange = (status: number | null) => {
  selectedStatus.value = status
}

/**
 * 查看账单详情 - 提示需要登录
 */
const viewLedgerDetail = (id: number) => {
  handleGuestAction('查看账单详情')
}

/**
 * 创建账单 - 提示需要登录
 */
const createLedger = () => {
  handleGuestAction('创建账单')
}
</script>

<template>
  <view class="ledger-page">
    <view class="fixed-header" :style="{ paddingTop: safeArea?.navbarHeight + 'px' }">
      <!-- 搜索栏 -->
      <view class="search-bar">
        <view class="search-input-wrap">
          <wd-icon name="search" size="36rpx" color="#999" />
          <input
            class="search-input"
            v-model="searchKeyword"
            placeholder="搜索客户姓名"
            placeholder-class="placeholder"
          />
          <wd-icon
            v-if="searchKeyword"
            name="close-fill"
            size="32rpx"
            color="#ccc"
            @tap="clearSearch"
          />
        </view>
      </view>

      <!-- 状态筛选栏 -->
      <scroll-view scroll-x class="status-filter-bar">
        <view class="status-options">
          <view
            v-for="option in statusOptions"
            :key="option.value"
            class="status-option"
            :class="{ active: selectedStatus === option.value }"
            @tap="onStatusChange(option.value)"
          >
            {{ option.label }}
          </view>
        </view>
      </scroll-view>

      <!-- 统计卡片 -->
      <view class="stats-card">
        <view class="stat-item">
          <view class="stat-value">¥0 </view>
          <view class="stat-label">总金额</view>
        </view>
        <view class="stat-item">
          <view class="stat-value">¥0</view>
          <view class="stat-label">已收金额</view>
        </view>
        <view class="stat-item">
          <view class="stat-value debt">¥{{ Number(stats.pendingAmount || 0).toLocaleString() }}</view>
          <view class="stat-label">待收金额</view>
        </view>
      </view>
    </view>

    <!-- 账单列表区域 -->
    <scroll-view
      class="ledger-scroll"
      scroll-y
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view v-if="filteredLedgers.length === 0" class="empty-state">
        <wd-icon name="list" size="100rpx" color="#ddd" />
        <text>{{ searchKeyword || selectedStatus !== null ? '未找到匹配的账单' : '暂无账单记录' }}</text>
      </view>

      <view v-else class="ledger-list">
        <LedgerCard
          v-for="ledger in filteredLedgers"
          :key="ledger.id"
          :ledger="ledger"
          :show-customer="true"
          @click="viewLedgerDetail"
        />
      </view>
    </scroll-view>

    <view class="fab-btn" @tap="createLedger">
      <wd-icon name="add" size="48rpx" color="#fff" />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.ledger-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  overflow: hidden;
}

.fixed-header {
  flex-shrink: 0;
  background: #fff;
  position: relative;
  z-index: 10;
}

.search-bar {
  padding: 16rpx 24rpx;
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

/* 状态筛选栏 */
.status-filter-bar {
  white-space: nowrap;
  background: #fff;
}

.status-options {
  display: inline-flex;
  padding: 12rpx 24rpx;
  gap: 12rpx;
}

.status-option {
  flex-shrink: 0;
  padding: 10rpx 24rpx;
  border-radius: 24rpx;
  font-size: 24rpx;
  color: #666;
  background: #f5f5f5;

  &.active {
    background: #3B82F6;
    color: #fff;
  }
}

/* 统计卡片 */
.stats-card {
  display: flex;
  background: #fff;
  margin: 16rpx 24rpx;
  border-radius: 20rpx;
  padding: 24rpx 0;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.stat-item {
  flex: 1;
  text-align: center;
  position: relative;
}

.stat-item:not(:last-child)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 2rpx;
  height: 40rpx;
  background: #f0f0f0;
}

.stat-value {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;

  &.debt {
    color: #ef4444;
  }
}

.stat-label {
  font-size: 24rpx;
  color: #999;
}

/* 账单列表 */
.ledger-scroll {
  flex: 1;
  padding: 0 24rpx 24rpx;
  box-sizing: border-box;
  overflow: hidden;
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
  gap: 16rpx;
  padding-bottom: 160rpx;
}

.fab-btn {
  position: fixed;
  right: 32rpx;
  bottom: 200rpx;
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  background: #10B981;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(16, 185, 129, 0.4);
  z-index: 99;
}
</style>
