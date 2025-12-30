<script setup lang="ts">
/**
 * 账单列表页面
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { searchLedgers } from '@/api/modules/ledger'
import { useNavbarSafeArea } from '@/composables/useNavbarSafeArea'
import { LedgerStatus } from '@/enums'
import LedgerCard from '@/components/ledger/LedgerCard.vue'
import type { LedgerListVO } from '@/types/ledger'

// ==================== 页面参数 ====================

const { safeArea } = useNavbarSafeArea()

// ==================== 数据状态 ====================

const loading = ref(false)
const refreshing = ref(false)
const ledgers = ref<LedgerListVO[]>([])
const pageNum = ref(1)
const hasMore = ref(true)

// 筛选条件
const filter = ref({
  customerName: '',
  customerPhone: '',
  ledgerStatus: null as number | null
})

// 搜索关键词
const searchKeyword = ref('')
const searchType = ref<'name' | 'phone'>('name')
const showSearchTypePopup = ref(false)
const searchTypeOptions = [
  { name: '姓名', value: 'name' },
  { name: '手机号', value: 'phone' }
]

// 状态筛选选项
const statusOptions = [
  { value: null, label: '全部' },
  { value: LedgerStatus.IN_PROGRESS, label: '进行中' },
  { value: LedgerStatus.PARTIAL, label: '部分缴费' },
  { value: LedgerStatus.ON_CREDIT, label: '赊账中' },
  { value: LedgerStatus.CLEARED, label: '已结清' },
  { value: LedgerStatus.CLOSED, label: '已关闭' }
]

// 统计信息
const stats = ref({
  totalAmount: 0,
  paidAmount: 0,
  debtAmount: 0
})

// ==================== 计算属性 ====================

const showEmpty = computed(() => !loading.value && ledgers.value.length === 0)

// ==================== 方法 ====================

const loadLedgers = async (reset = false) => {
  if (loading.value) return
  if (!reset && !hasMore.value) return

  try {
    loading.value = true
    if (reset) {
      pageNum.value = 1
      ledgers.value = []
    }

    const res = await searchLedgers({
      customerName: filter.value.customerName || undefined,
      customerPhone: filter.value.customerPhone || undefined,
      ledgerStatus: filter.value.ledgerStatus ?? undefined,
      pageNumber: pageNum.value,
      pageSize: 15
    })

    if (reset) {
      ledgers.value = res.content || []
    } else {
      ledgers.value.push(...(res.content || []))
    }

    hasMore.value = pageNum.value < (res.totalPages || 1)
    pageNum.value++
  } catch (error) {
    console.error('加载账单列表失败:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

let searchTimer: ReturnType<typeof setTimeout> | null = null

const handleSearchInput = (val: string) => {
  if (searchTimer) clearTimeout(searchTimer)
  
  // 更新筛选条件
  if (searchType.value === 'name') {
    filter.value.customerName = val
    filter.value.customerPhone = ''
  } else {
    filter.value.customerPhone = val
    filter.value.customerName = ''
  }
  
  // 防抖搜索
  searchTimer = setTimeout(() => loadLedgers(true), 300)
}

watch(searchKeyword, handleSearchInput)

const clearSearch = () => {
  searchKeyword.value = ''
  filter.value.customerName = ''
  filter.value.customerPhone = ''
  loadLedgers(true)
}

/**
 * 处理搜索类型选择
 * @param item - action-sheet 选中项，包含 name 和自定义 value 属性
 * @param index - 选中项索引
 */
const handleSearchTypeSelect = ({ item, index }: { item: { name: string; value: string }; index: number }) => {
  searchType.value = item.value as 'name' | 'phone'
  showSearchTypePopup.value = false
  // 切换搜索类型后，如果有关键词则重新搜索
  if (searchKeyword.value.trim()) {
    if (searchType.value === 'name') {
      filter.value.customerName = searchKeyword.value
      filter.value.customerPhone = ''
    } else {
      filter.value.customerPhone = searchKeyword.value
      filter.value.customerName = ''
    }
    loadLedgers(true)
  }
}

const onRefresh = async () => {
  refreshing.value = true
  await loadLedgers(true)
}

const onLoadMore = () => {
  if (!loading.value && hasMore.value) loadLedgers()
}

const onStatusChange = (status: number | null) => {
  filter.value.ledgerStatus = status
  loadLedgers(true)
}

const viewLedgerDetail = (id: number) => {
  uni.navigateTo({ url: `/pages/merchant/tabs/ledger/detail?id=${id}` })
}

const createLedger = () => {
  uni.navigateTo({ url: `/pages/merchant/tabs/ledger/add` })
}

const handleLedgerClick = (id: number) => viewLedgerDetail(id)

const handleMerchantChanged = () => {
  console.log('[Ledger] 商户已切换，刷新账单列表')
  clearSearch()
}

/**
 * 账单变更事件处理（新增/编辑账单后刷新）
 */
const handleLedgerChanged = () => {
  console.log('[Ledger] 账单数据已变更，刷新列表')
  loadLedgers(true)
}

const handleFilterFromHome = (params: { status?: number }) => {
  if (params.status !== undefined) {
    filter.value.ledgerStatus = params.status
    loadLedgers(true)
  }
}

onMounted(() => {
  loadLedgers(true)
  uni.$on('merchant-changed', handleMerchantChanged)
  uni.$on('ledger-changed', handleLedgerChanged)
  uni.$on('ledger-tab-filter', handleFilterFromHome)
})

onUnmounted(() => {
  uni.$off('merchant-changed', handleMerchantChanged)
  uni.$off('ledger-changed', handleLedgerChanged)
  uni.$off('ledger-tab-filter', handleFilterFromHome)
  if (searchTimer) clearTimeout(searchTimer)
})
</script>

<template>
  <view class="ledger-page">
    <view class="fixed-header" :style="{ paddingTop: safeArea?.navbarHeight + 'px' }">
      <!-- 搜索栏 -->
      <view class="search-bar">
        <view class="search-input-wrap">
          <view class="search-type-select" @tap="showSearchTypePopup = true">
            <text class="search-type-text">{{ searchType === 'name' ? '姓名' : '手机号' }}</text>
            <wd-icon name="arrow-down" size="24rpx" color="#666" />
          </view>
          <view class="search-divider"></view>
          <input
            class="search-input"
            v-model="searchKeyword"
            :placeholder="searchType === 'name' ? '搜索客户姓名' : '搜索客户手机号'"
            placeholder-class="placeholder"
            :type="searchType === 'phone' ? 'number' : 'text'"
          />
          <wd-icon
            v-if="searchKeyword"
            name="close-fill"
            size="32rpx"
            color="#ccc"
            @tap="clearSearch"
          />
          <wd-icon v-else name="search" size="36rpx" color="#999" />
        </view>
      </view>

      <wd-action-sheet
        v-model="showSearchTypePopup"
        :actions="searchTypeOptions"
        @select="handleSearchTypeSelect"
        cancel-text="取消"
      />

      <!-- 状态筛选栏 -->
      <scroll-view scroll-x class="status-filter-bar">
        <view class="status-options">
          <view
            v-for="option in statusOptions"
            :key="option.value"
            class="status-option"
            :class="{ active: filter.ledgerStatus === option.value }"
            @tap="onStatusChange(option.value)"
          >
            {{ option.label }}
          </view>
        </view>
      </scroll-view>

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
      <view v-if="showEmpty" class="empty-state">
        <wd-icon name="list" size="100rpx" color="#ddd" />
        <text>暂无账单记录</text>
      </view>

      <view v-else class="ledger-list">
        <LedgerCard
          v-for="ledger in ledgers"
          :key="ledger.id"
          :ledger="ledger"
          :show-customer="true"
          @click="handleLedgerClick"
        />
      </view>

      <view v-if="loading && ledgers.length > 0" class="loading-more">
        <wd-loading size="40rpx" />
        <text>加载中...</text>
      </view>

      <view v-if="!hasMore && ledgers.length > 0" class="no-more">
        没有更多了
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
  gap: 12rpx;
}

.search-type-select {
  display: flex;
  align-items: center;
  gap: 4rpx;
  padding-right: 12rpx;
  flex-shrink: 0;
}

.search-type-text {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.search-divider {
  width: 2rpx;
  height: 32rpx;
  background: #ddd;
  flex-shrink: 0;
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
  background: #10B981;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(16, 185, 129, 0.4);
  z-index: 99;
}
</style>
