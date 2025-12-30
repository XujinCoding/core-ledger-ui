<script setup lang="ts">
/**
 * 账单详情页面
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onPullDownRefresh } from '@dcloudio/uni-app'
import { getLedgerDetail, recordLedger, settleLedger, addPaymentRecord } from '@/api/modules/ledger'
import type { LedgerVO } from '@/types/ledger'

// ==================== 页面参数 ====================

const ledgerId = ref<number>(0)

// ==================== 数据状态 ====================

const loading = ref(true)
const ledger = ref<LedgerVO | null>(null)

// 弹窗控制
const showPaymentPopup = ref(false)
const paymentAmount = ref('')
const paymentRemark = ref('')
const paymentLoading = ref(false)

// ==================== 计算属性 ====================

const customerInitial = computed(() => {
  return ledger.value?.customerName?.charAt(0) || '?'
})

const statusText = computed(() => {
  const map: Record<string, string> = {
    'IN_PROGRESS': '进行中',
    'ON_CREDIT': '赊账中',
    'SETTLED': '已结清',
    'CLOSED': '已关闭'
  }
  return map[ledger.value?.status || ''] || ledger.value?.status
})

const pendingAmount = computed(() => {
  if (!ledger.value) return 0
  return (ledger.value.totalAmount || 0) - (ledger.value.paidAmount || 0)
})

// ==================== 方法 ====================

/**
 * 加载账单详情
 */
const loadDetail = async () => {
  try {
    loading.value = true
    ledger.value = await getLedgerDetail(ledgerId.value)
  } catch (error) {
    console.error('加载账单详情失败:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

/**
 * 刷新
 */
const onRefresh = async () => {
  await loadDetail()
  uni.stopPullDownRefresh()
}

/**
 * 编辑账单 - 跳转到编辑页面
 */
const handleEdit = () => {
  uni.navigateTo({ url: `/pages/merchant/tabs/ledger/edit?id=${ledgerId.value}` })
}

/**
 * 记账操作 - 弹出支付记录弹窗
 */
const handleRecord = () => {
  openPaymentPopup()
}

/**
 * 打开收款弹窗
 */
const openPaymentPopup = () => {
  paymentAmount.value = pendingAmount.value.toString()
  paymentRemark.value = ''
  showPaymentPopup.value = true
}

/**
 * 确认收款
 */
const confirmPayment = async () => {
  const amount = parseFloat(paymentAmount.value)
  if (isNaN(amount) || amount <= 0) {
    uni.showToast({ title: '请输入有效金额', icon: 'none' })
    return
  }

  try {
    paymentLoading.value = true
    await addPaymentRecord(ledgerId.value, {
      amount,
      remark: paymentRemark.value || undefined
    })
    uni.showToast({ title: '收款成功', icon: 'success' })
    showPaymentPopup.value = false
    await loadDetail()
  } catch (error) {
    console.error('收款失败:', error)
  } finally {
    paymentLoading.value = false
  }
}

/**
 * 结账 - 弹出支付记录弹窗
 */
const handleSettle = () => {
  openPaymentPopup()
}

/**
 * 格式化金额
 */
const formatAmount = (amount: number | undefined) => {
  return (amount || 0).toFixed(2)
}

// ==================== 生命周期 ====================

/**
 * 账单变更事件处理（编辑后刷新）
 */
const handleLedgerChanged = () => {
  console.log('[LedgerDetail] 账单数据已变更，刷新详情')
  loadDetail()
}

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const query = currentPage.options || {}
  
  if (query.id) {
    ledgerId.value = Number(query.id)
    loadDetail()
  } else {
    uni.showToast({ title: '账单ID不能为空', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 1500)
  }
  
  // 监听账单变更事件
  uni.$on('ledger-changed', handleLedgerChanged)
})

onUnmounted(() => {
  // 移除事件监听
  uni.$off('ledger-changed', handleLedgerChanged)
})

onPullDownRefresh(() => {
  onRefresh()
})
</script>

<template>
  <view class="ledger-detail-page">
    <!-- 加载中 -->
    <view v-if="loading" class="loading-state">
      <wd-loading size="48rpx" />
      <text>加载中...</text>
    </view>

    <template v-else-if="ledger">
      <!-- 头部信息 -->
      <view class="header">
        <!-- 客户电话和地址展示在最上方 -->
        <view class="customer-contact">
          <view class="contact-item" v-if="ledger.customerPhone">
            <wd-icon name="phone" size="28rpx" />
            <text>{{ ledger.customerPhone }}</text>
          </view>
          <view class="contact-item" v-if="ledger.customerAddress">
            <wd-icon name="location" size="28rpx" />
            <text>{{ ledger.customerAddress }}</text>
          </view>
        </view>
        
        <view class="header-top">
          <view class="customer-info">
            <view class="customer-avatar">{{ customerInitial }}</view>
            <view class="customer-detail">
              <view class="customer-name">{{ ledger.customerName }}</view>
            </view>
          </view>
        </view>

        <view class="amount-box">
          <view class="amount-item">
            <view class="amount-label">账单金额</view>
            <view class="amount-value">¥{{ formatAmount(ledger.totalAmount) }}</view>
          </view>
          <view class="amount-item">
            <view class="amount-label">已支付</view>
            <view class="amount-value">¥{{ formatAmount(ledger.paidAmount) }}</view>
          </view>
          <view class="amount-item">
            <view class="amount-label">待收款</view>
            <view class="amount-value">¥{{ formatAmount(pendingAmount) }}</view>
          </view>
        </view>
      </view>

      <!-- 页面内容 -->
      <scroll-view class="content-scroll" scroll-y>
        <view class="content-scroll-inner">
          <!-- 商品明细 -->
          <view class="section">
          <view class="section-header">
            <text class="section-title">商品明细</text>
            <text class="section-count">共{{ ledger.items?.length || 0 }}件</text>
          </view>

          <view v-if="!ledger.items?.length" class="empty-items">
            暂无商品
          </view>

          <view v-else class="item-list">
            <view v-for="item in ledger.items" :key="item.id" class="item-row">
              <view class="item-img">
                <wd-icon name="goods" size="40rpx" color="#999" />
              </view>
              <view class="item-info">
                <view class="item-name">{{ item.productName }}</view>
                <view class="item-spec">{{ item.skuName || '默认规格' }}</view>
              </view>
              <view class="item-right">
                <view class="item-price">¥{{ formatAmount(item.amount) }}</view>
                <view class="item-qty">x{{ item.quantity }}</view>
              </view>
            </view>
          </view>

          <!-- 汇总 -->
          <view class="summary-row">
            <text class="summary-label">商品小计</text>
            <text class="summary-value">¥{{ formatAmount(ledger.totalAmount) }}</text>
          </view>
          <view class="summary-row">
            <text class="summary-label">优惠</text>
            <text class="summary-value discount">-¥0.00</text>
          </view>
          <view class="summary-row total">
            <text class="summary-label">应付金额</text>
            <text class="summary-value">¥{{ formatAmount(ledger.totalAmount) }}</text>
          </view>
        </view>

        <!-- 支付记录 -->
        <view class="section">
          <view class="section-header">
            <text class="section-title">支付记录</text>
          </view>

          <view v-if="!ledger.paymentRecords?.length" class="empty-payments">
            <wd-icon name="inbox" size="64rpx" color="#ddd" />
            <text>暂无支付记录</text>
          </view>

          <view v-else class="payment-list">
            <view v-for="record in ledger.paymentRecords" :key="record.id" class="payment-item">
              <view class="payment-icon">
                <wd-icon name="check" size="28rpx" />
              </view>
              <view class="payment-info">
                <view class="payment-type">{{ record.method || '现金支付' }}</view>
                <view class="payment-time">{{ record.createdAt }}</view>
              </view>
              <view class="payment-amount">+¥{{ formatAmount(record.amount) }}</view>
            </view>
          </view>
        </view>

        <!-- 账单信息 -->
        <view class="section">
          <view class="section-header">
            <text class="section-title">账单信息</text>
          </view>
          <view class="info-row">
            <text class="info-label">账单编号</text>
            <text class="info-value">{{ ledger.code || ledger.id }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">创建时间</text>
            <text class="info-value">{{ ledger.createdAt }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">备注</text>
            <text class="info-value">{{ ledger.remark || '无' }}</text>
          </view>
        </view>

        <view style="height: 180rpx;"></view>
        </view>
      </scroll-view>

      <!-- 底部操作栏 -->
      <view class="action-bar">
        <button class="btn btn-outline" @tap="handleEdit">
          <wd-icon name="edit" size="28rpx" /> 编辑
        </button>
        <button class="btn btn-warning" @tap="handleRecord">
          <wd-icon name="list" size="28rpx" /> 记账
        </button>
        <button class="btn btn-success" @tap="openPaymentPopup">
          <wd-icon name="money-circle" size="28rpx" /> 收款
        </button>
        <button class="btn btn-primary" @tap="handleSettle">
          <wd-icon name="check-circle" size="28rpx" /> 结账
        </button>
      </view>
    </template>

    <!-- 收款弹窗 - 底部固定，挡住底部操作栏 -->
    <view v-if="showPaymentPopup" class="payment-overlay">
      <view class="payment-panel">
        <view class="popup-header">
          <text class="popup-title">添加支付记录</text>
          <wd-icon name="close" size="40rpx" color="#999" @click="showPaymentPopup = false" />
        </view>
        <view class="popup-content">
          <view class="form-group">
            <text class="form-label">收款金额</text>
            <view class="amount-input">
              <text class="currency">￥</text>
              <input
                type="digit"
                v-model="paymentAmount"
                placeholder="0.00"
                class="input"
                @confirm="confirmPayment"
              />
            </view>
          </view>
          <view class="form-group">
            <text class="form-label">备注</text>
            <input
              type="text"
              v-model="paymentRemark"
              placeholder="选填"
              class="form-input"
              @confirm="confirmPayment"
            />
          </view>
        </view>
        <view class="payment-footer">
          <button class="confirm-btn" :loading="paymentLoading" @tap="confirmPayment">
            确认收款
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.ledger-detail-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.loading-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  color: #999;
}

.header {
  background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
  padding: 32rpx;
  color: #fff;
}

.customer-contact {
  margin-bottom: 24rpx;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 26rpx;
  opacity: 0.9;
  margin-bottom: 8rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32rpx;
}

.customer-info {
  display: flex;
  align-items: center;
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

.customer-name {
  font-size: 34rpx;
  font-weight: 600;
  margin-bottom: 4rpx;
}

.customer-phone {
  font-size: 26rpx;
  opacity: 0.8;
}

.status-badge {
  padding: 12rpx 28rpx;
  border-radius: 32rpx;
  font-size: 26rpx;
  background: rgba(255, 255, 255, 0.2);
}

.amount-box {
  display: flex;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 24rpx;
  padding: 32rpx 0;
}

.amount-item {
  flex: 1;
  text-align: center;
}

.amount-label {
  font-size: 24rpx;
  opacity: 0.8;
  margin-bottom: 8rpx;
}

.amount-value {
  font-size: 40rpx;
  font-weight: 600;
}

.content-scroll {
  flex: 1;
}

.content-scroll-inner {
  padding: 24rpx;
}

.section {
  background: #fff;
  border-radius: 24rpx;
  margin-bottom: 24rpx;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
  border-bottom: 2rpx solid #f5f5f5;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.section-count {
  font-size: 26rpx;
  color: #999;
}

.section-action {
  font-size: 26rpx;
  color: #3B82F6;
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.empty-items,
.empty-payments {
  padding: 60rpx 0;
  text-align: center;
  color: #999;
  font-size: 28rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.item-list {
  padding: 0 32rpx;
}

.item-row {
  display: flex;
  align-items: center;
  padding: 28rpx 0;
  border-bottom: 2rpx solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }
}

.item-img {
  width: 96rpx;
  height: 96rpx;
  border-radius: 16rpx;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
}

.item-info {
  flex: 1;
}

.item-name {
  font-size: 30rpx;
  color: #333;
  margin-bottom: 8rpx;
}

.item-spec {
  font-size: 24rpx;
  color: #999;
}

.item-right {
  text-align: right;
}

.item-price {
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 4rpx;
}

.item-qty {
  font-size: 24rpx;
  color: #999;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  font-size: 28rpx;

  &.total {
    border-top: 2rpx solid #f5f5f5;
    padding-top: 28rpx;
    
    .summary-label {
      font-weight: 600;
      color: #333;
    }
    
    .summary-value {
      font-size: 36rpx;
      font-weight: 600;
      color: #EF4444;
    }
  }
}

.summary-label {
  color: #666;
}

.summary-value {
  color: #333;

  &.discount {
    color: #10B981;
  }
}

.payment-list {
  padding: 0 32rpx;
}

.payment-item {
  display: flex;
  align-items: center;
  padding: 28rpx 0;
  border-bottom: 2rpx solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }
}

.payment-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #D1FAE5;
  color: #10B981;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
}

.payment-info {
  flex: 1;
}

.payment-type {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 4rpx;
}

.payment-time {
  font-size: 24rpx;
  color: #999;
}

.payment-amount {
  font-size: 32rpx;
  font-weight: 600;
  color: #10B981;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  border-bottom: 2rpx solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }
}

.info-label {
  font-size: 28rpx;
  color: #666;
}

.info-value {
  font-size: 28rpx;
  color: #333;
}

.action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24rpx 32rpx;
  background: #fff;
  display: flex;
  gap: 16rpx;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.btn {
  flex: 1;
  height: 80rpx;
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  font-size: 26rpx;
  font-weight: 500;
  border: none;

  &::after {
    border: none;
  }

  &.btn-outline {
    background: #fff;
    color: #666;
    border: 2rpx solid #e5e5e5;
  }

  &.btn-warning {
    background: #F59E0B;
    color: #fff;
  }

  &.btn-success {
    background: #10B981;
    color: #fff;
  }

  &.btn-primary {
    background: #3B82F6;
    color: #fff;
  }

  &.btn-block {
    flex: none;
    width: 100%;
  }
}

/* 收款弹窗 */
.payment-popup {
  padding: 32rpx;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 40rpx;
}

.popup-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #333;
}

.popup-content {
  margin-bottom: 40rpx;
}

.form-group {
  margin-bottom: 32rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 16rpx;
}

.amount-input {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 16rpx;
  padding: 24rpx;
}

.currency {
  font-size: 40rpx;
  font-weight: 600;
  color: #333;
  margin-right: 8rpx;
}

.amount-input .input {
  flex: 1;
  font-size: 40rpx;
  font-weight: 600;
  color: #333;
}

.form-input {
  width: 100%;
  height: 88rpx;
  background: #f5f5f5;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

/* 支付面板样式 */
.payment-overlay {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
}

.payment-panel {
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  box-shadow: 0 -8rpx 40rpx rgba(0, 0, 0, 0.1);
}

.payment-footer {
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
}

.confirm-btn {
  width: 100%;
  height: 96rpx;
  background: #3B82F6;
  color: #fff;
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;

  &::after {
    border: none;
  }
}
</style>
