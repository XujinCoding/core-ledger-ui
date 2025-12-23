<script setup lang="ts">
/**
 * 账单列表页面
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, onMounted, computed } from 'vue'
import { queryLedgers } from '@/api/modules/ledger'
import { useNavbarSafeArea } from '@/composables/useNavbarSafeArea'
import type { LedgerListVO } from '@/types/ledger'

// ==================== 页面参数 ====================

// 从路由参数获取客户ID（可选）
const customerId = ref<number | null>(null)

// 导航栏安全区域
const { safeArea } = useNavbarSafeArea()

// ==================== 数据状态 ====================

const loading = ref(false)
const refreshing = ref(false)
const ledgers = ref<LedgerListVO[]>([])
const page = ref(0)
const hasMore = ref(true)

// 筛选条件
const filter = ref({
  status: '', // 状态筛选
  startDate: '', // 开始日期
  endDate: '', // 结束日期
  keyword: '' // 关键词搜索
})

// 筛选弹窗
const showFilter = ref(false)

// 统计信息 - TODO: 从接口获取
const stats = ref({
  totalAmount: 0,
  paidAmount: 0,
  debtAmount: 0
})

// ==================== 计算属性 ====================

// 是否显示空状态
const showEmpty = computed(() => {
  return !loading.value && ledgers.value.length === 0
})

// ==================== 方法 ====================

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

    const res = await queryLedgers(
      {
        customerId: customerId.value || undefined,
        status: filter.value.status || undefined,
        startDate: filter.value.startDate || undefined,
        endDate: filter.value.endDate || undefined,
        keyword: filter.value.keyword || undefined
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
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

/**
 * 下拉刷新
 */
const onRefresh = async () => {
  refreshing.value = true
  await loadLedgers(true)
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
 * 搜索
 */
const onSearch = () => {
  loadLedgers(true)
}

/**
 * 重置筛选
 */
const resetFilter = () => {
  filter.value = {
    status: '',
    startDate: '',
    endDate: '',
    keyword: ''
  }
  showFilter.value = false
  loadLedgers(true)
}

/**
 * 确认筛选
 */
const onFilterConfirm = () => {
  showFilter.value = false
  loadLedgers(true)
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
  const params = customerId.value ? `?customerId=${customerId.value}` : ''
  uni.navigateTo({ url: `/pages/merchant/tabs/ledger/add${params}` })
}

/**
 * 获取状态文本
 */
const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    'IN_PROGRESS': '进行中',
    'ON_CREDIT': '赊账中',
    'SETTLED': '已结清',
    'CLOSED': '已关闭'
  }
  return map[status] || status
}

/**
 * 获取状态样式类
 */
const getStatusClass = (status: string) => {
  const map: Record<string, string> = {
    'IN_PROGRESS': 'status-pending',
    'ON_CREDIT': 'status-debt',
    'SETTLED': 'status-paid',
    'CLOSED': 'status-closed'
  }
  return map[status] || 'status-pending'
}

// ==================== 生命周期 ====================

onMounted(() => {
  // 获取路由参数
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const query = currentPage.options || {}
  
  if (query.customerId) {
    customerId.value = Number(query.customerId)
  }
  
  // 加载数据
  loadLedgers(true)
})
</script>

<template>
  <view class="ledger-page">
    <!-- 固定头部区域 -->
    <view class="fixed-header" :style="{ paddingTop: safeArea?.navbarHeight + 'px' }">
      <!-- 搜索栏 -->
      <view class="search-bar">
      <view class="search-input-wrap">
        <wd-icon name="search" size="36rpx" color="#999" />
        <input
          class="search-input"
          v-model="filter.keyword"
          placeholder="搜索账单备注/客户名"
          placeholder-class="placeholder"
          confirm-type="search"
          @confirm="onSearch"
        />
        <wd-icon
          v-if="filter.keyword"
          name="close-fill"
          size="32rpx"
          color="#ccc"
          @tap="filter.keyword = ''; onSearch()"
        />
      </view>
      <view class="filter-btn" @tap="showFilter = true">
        <wd-icon name="filter" size="36rpx" />
        </view>
      </view>

      <!-- 统计卡片 -->
      <view class="stats-card">
      <view class="stat-item">
        <view class="stat-value">¥{{ stats.totalAmount.toLocaleString() }}</view>
        <view class="stat-label">总金额</view>
      </view>
      <view class="stat-item">
        <view class="stat-value">¥{{ stats.paidAmount.toLocaleString() }}</view>
        <view class="stat-label">已收金额</view>
      </view>
      <view class="stat-item">
        <view class="stat-value debt">¥{{ stats.debtAmount.toLocaleString() }}</view>
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
      @scrolltolower="onLoadMore"
    >
      <!-- 空状态 -->
      <view v-if="showEmpty" class="empty-state">
        <wd-icon name="list" size="100rpx" color="#ddd" />
        <text>暂无账单记录</text>
        <button class="add-btn-empty" @tap="createLedger">创建账单</button>
      </view>

      <!-- 账单列表 -->
      <view v-else class="ledger-list">
        <view
          v-for="ledger in ledgers"
          :key="ledger.id"
          class="ledger-item"
          @tap="viewLedgerDetail(ledger.id)"
        >
          <view class="ledger-avatar">
            {{ ledger.customerName?.charAt(0) || '?' }}
          </view>
          <view class="ledger-info">
            <view class="ledger-header">
              <text class="ledger-title">
                {{ ledger.remark || (ledger.customerName ? `${ledger.customerName}的账单` : '未命名账单') }}
              </text>
              <text class="ledger-amount">¥{{ ledger.totalAmount }}</text>
            </view>
            <view class="ledger-footer">
              <text class="ledger-customer" v-if="ledger.customerName">
                <wd-icon name="user" size="24rpx" />
                {{ ledger.customerName }}
              </text>
              <text class="ledger-time">
                <wd-icon name="clock" size="24rpx" />
                {{ ledger.createdAt }}
              </text>
              <text class="ledger-status" :class="getStatusClass(ledger.status)">
                {{ getStatusText(ledger.status) }}
              </text>
            </view>
          </view>
        </view>
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
    </scroll-view>

    <!-- 创建按钮 -->
    <view class="fab-btn" @tap="createLedger">
      <wd-icon name="add" size="48rpx" color="#fff" />
    </view>

    <!-- 筛选弹窗 -->
    <wd-popup v-model:show="showFilter" position="right" custom-style="width: 75%;">
      <view class="filter-panel">
        <view class="filter-header">
          <text class="filter-title">筛选</text>
          <wd-icon name="close" size="40rpx" @tap="showFilter = false" />
        </view>

        <view class="filter-content">
          <view class="filter-section">
            <view class="section-title">账单状态</view>
            <wd-radio-group v-model="filter.status">
              <wd-radio value="">全部</wd-radio>
              <wd-radio value="IN_PROGRESS">进行中</wd-radio>
              <wd-radio value="ON_CREDIT">赊账中</wd-radio>
              <wd-radio value="SETTLED">已结清</wd-radio>
              <wd-radio value="CLOSED">已关闭</wd-radio>
            </wd-radio-group>
          </view>

          <view class="filter-section">
            <view class="section-title">时间范围</view>
            <view class="date-range">
              <wd-input
                v-model="filter.startDate"
                placeholder="开始日期"
                type="date"
                clearable
              />
              <text class="date-separator">至</text>
              <wd-input
                v-model="filter.endDate"
                placeholder="结束日期"
                type="date"
                clearable
              />
            </view>
          </view>
        </view>

        <view class="filter-footer">
          <button class="btn-reset" @tap="resetFilter">重置</button>
          <button class="btn-confirm" @tap="onFilterConfirm">确定</button>
        </view>
      </view>
    </wd-popup>
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
}

.search-bar {
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  background: #fff;
  gap: 16rpx;
}

.search-input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 40rpx;
  padding: 12rpx 24rpx;
  gap: 12rpx;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  height: 56rpx;
  line-height: 56rpx;
}

.placeholder {
  color: #999;
  font-size: 28rpx;
}

.filter-btn {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stats-card {
  display: flex;
  background: #fff;
  margin: 24rpx;
  border-radius: 20rpx;
  padding: 32rpx 0;
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
    margin-bottom: 40rpx;
  }
}

.add-btn-empty {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 16rpx 48rpx;
  background: #3b82f6;
  color: #fff;
  font-size: 28rpx;
  border-radius: 40rpx;
  border: none;
  gap: 8rpx;

  &::after {
    border: none;
  }
}

.ledger-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding-bottom: 160rpx;
}

.ledger-item {
  display: flex;
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  gap: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
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
  gap: 16rpx;
  flex-wrap: wrap;
}

.ledger-customer,
.ledger-time {
  display: flex;
  align-items: center;
  gap: 4rpx;
  font-size: 24rpx;
  color: #999;
}

.ledger-status {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  margin-left: auto;

  &.status-pending {
    background: #fef3c7;
    color: #f59e0b;
  }

  &.status-debt {
    background: #fee2e2;
    color: #ef4444;
  }

  &.status-paid {
    background: #d1fae5;
    color: #10b981;
  }

  &.status-closed {
    background: #f3f4f6;
    color: #6b7280;
  }
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
  bottom: 180rpx;
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  background: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(59, 130, 246, 0.4);
  z-index: 99;
}

/* 筛选面板样式 */
.filter-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

.filter-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
}

.filter-content {
  flex: 1;
  padding: 32rpx;
  overflow-y: auto;
}

.filter-section {
  margin-bottom: 48rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 24rpx;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.date-separator {
  color: #999;
  padding: 0 8rpx;
}

.filter-footer {
  display: flex;
  padding: 24rpx 32rpx;
  gap: 24rpx;
  border-top: 2rpx solid #f0f0f0;
}

.btn-reset,
.btn-confirm {
  flex: 1;
  height: 88rpx;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;

  &::after {
    border: none;
  }
}

.btn-reset {
  background: #f5f5f5;
  color: #666;
}

.btn-confirm {
  background: #3b82f6;
  color: #fff;
}
</style>
