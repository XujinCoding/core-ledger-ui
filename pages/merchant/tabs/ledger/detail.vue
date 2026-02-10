<script setup lang="ts">
/**
 * 账单详情页面
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onPullDownRefresh } from '@dcloudio/uni-app'
import { getLedgerDetail, recordLedger, settleLedger, addPaymentRecord, updateLedgerMemo } from '@/api/modules/ledger'
import { PaymentMethod, getPaymentMethodLabel, getLedgerStatusLabel } from '@/enums'
import type { LedgerVO, RecordLedgerDTO, SettleLedgerDTO, AddPaymentRecordDTO, UpdateLedgerMemoDTO } from '@/types/ledger'

const ledgerId = ref<number>(0)
const loading = ref(true)
const ledger = ref<LedgerVO | null>(null)

// 弹窗控制
const showPaymentPopup = ref(false)
const paymentAmount = ref('')
const paymentMemo = ref('')
const paymentMethod = ref<PaymentMethod>(PaymentMethod.CASH)
const paymentLoading = ref(false)
const popupType = ref<'record' | 'payment' | 'settle'>('payment')

// 结账二次确认弹窗
const showSettleConfirm = ref(false)
const settleConfirmData = ref({ settleAmount: 0, discountAmount: 0 })

// 备注编辑弹窗
const showMemoPopup = ref(false)
const editMemo = ref('')
const memoLoading = ref(false)

const paymentMethodOptions = [
  { value: PaymentMethod.CASH, label: '现金' },
  { value: PaymentMethod.WECHAT, label: '微信' },
  { value: PaymentMethod.ALIPAY, label: '支付宝' },
  { value: PaymentMethod.BANK_TRANSFER, label: '银行转账' }
]

const customerInitial = computed(() => ledger.value?.customerName?.charAt(0) || '?')

const statusText = computed(() => {
  if (!ledger.value?.ledgerStatus) return '未知'
  return getLedgerStatusLabel(ledger.value.ledgerStatus)
})

// 状态标签样式类
const statusClass = computed(() => {
  const status = ledger.value?.ledgerStatus
  const classMap: Record<number, string> = {
    1: 'status-progress',   // 进行中
    2: 'status-partial',    // 部分缴费
    3: 'status-cleared',    // 已结清
    4: 'status-credit',     // 赊账中
    5: 'status-closed'      // 已关闭
  }
  return classMap[status as number] || 'status-default'
})

const pendingAmount = computed(() => {
  if (!ledger.value) return 0
  // 优先使用后端返回的 remainingAmount，否则计算
  if (ledger.value.remainingAmount !== undefined) {
    return ledger.value.remainingAmount
  }
  return (ledger.value.totalAmount || 0) - (ledger.value.paidAmount || 0)
})

const popupTitle = computed(() => {
  const titles = { record: '记账', payment: '收款', settle: '结账' }
  return titles[popupType.value]
})

const confirmBtnText = computed(() => {
  const texts = { record: '确认记账', payment: '确认收款', settle: '确认结账' }
  return texts[popupType.value]
})

const formattedCreateTime = computed(() => {
  if (!ledger.value?.createInstant) return '-'
  return formatDateTime(ledger.value.createInstant)
})

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const h = String(date.getHours()).padStart(2, '0')
    const min = String(date.getMinutes()).padStart(2, '0')
    return `${y}-${m}-${d} ${h}:${min}`
  } catch { return dateStr }
}

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

const onRefresh = async () => {
  await loadDetail()
  uni.stopPullDownRefresh()
}

const handleEdit = () => {
  uni.navigateTo({ url: `/pages/merchant/tabs/ledger/edit?id=${ledgerId.value}` })
}

const handleRecord = () => { popupType.value = 'record'; openPaymentPopup() }
const handlePayment = () => { popupType.value = 'payment'; openPaymentPopup() }
const handleSettle = () => { popupType.value = 'settle'; openPaymentPopup() }

const openPaymentPopup = () => {
  paymentAmount.value = pendingAmount.value.toString()
  paymentMemo.value = ''
  paymentMethod.value = PaymentMethod.CASH
  showPaymentPopup.value = true
}

const closePaymentPopup = () => { showPaymentPopup.value = false }

const confirmPayment = async () => {
  const amount = parseFloat(paymentAmount.value)
  if (isNaN(amount) || amount < 0) {
    uni.showToast({ title: '请输入有效金额', icon: 'none' })
    return
  }
  if (popupType.value === 'payment' && amount <= 0) {
    uni.showToast({ title: '收款金额必须大于0', icon: 'none' })
    return
  }

  // 结账操作：先弹出二次确认
  if (popupType.value === 'settle') {
    const discount = pendingAmount.value - amount
    settleConfirmData.value = {
      settleAmount: amount,
      discountAmount: discount > 0 ? discount : 0
    }
    showSettleConfirm.value = true
    return
  }

  await doSubmit(amount)
}

const doSettleConfirm = async () => {
  await doSubmit(settleConfirmData.value.settleAmount)
  showSettleConfirm.value = false
}

const cancelSettleConfirm = () => {
  showSettleConfirm.value = false
}

const doSubmit = async (amount: number) => {
  try {
    paymentLoading.value = true
    if (popupType.value === 'record') {
      const dto: RecordLedgerDTO = {
        paymentAmount: amount,
        paymentMethod: amount > 0 ? paymentMethod.value : undefined,
        memo: paymentMemo.value || undefined
      }
      await recordLedger(ledgerId.value, dto)
      uni.showToast({ title: '记账成功', icon: 'success' })
    } else if (popupType.value === 'payment') {
      const dto: AddPaymentRecordDTO = {
        paymentAmount: amount,
        paymentMethod: paymentMethod.value,
        memo: paymentMemo.value || undefined
      }
      await addPaymentRecord(ledgerId.value, dto)
      uni.showToast({ title: '收款成功', icon: 'success' })
    } else if (popupType.value === 'settle') {
      const dto: SettleLedgerDTO = {
        paymentAmount: amount,
        paymentMethod: amount > 0 ? paymentMethod.value : undefined,
        memo: paymentMemo.value || undefined
      }
      await settleLedger(ledgerId.value, dto)
      uni.showToast({ title: '结账成功', icon: 'success' })
    }
    showPaymentPopup.value = false
    await loadDetail()
  } catch (error) {
    console.error('操作失败:', error)
  } finally {
    paymentLoading.value = false
  }
}

const openMemoPopup = () => {
  editMemo.value = ledger.value?.memo || ''
  showMemoPopup.value = true
}
const closeMemoPopup = () => { showMemoPopup.value = false }

const saveMemo = async () => {
  try {
    memoLoading.value = true
    const dto: UpdateLedgerMemoDTO = { memo: editMemo.value || undefined }
    await updateLedgerMemo(ledgerId.value, dto)
    uni.showToast({ title: '备注修改成功', icon: 'success' })
    showMemoPopup.value = false
    await loadDetail()
  } catch (error) {
    console.error('修改备注失败:', error)
  } finally {
    memoLoading.value = false
  }
}

const formatAmount = (amount: number | undefined) => (amount || 0).toFixed(2)
const formatPaymentTime = (dateStr: string) => formatDateTime(dateStr)

const handleLedgerChanged = () => { loadDetail() }

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
  uni.$on('ledger-changed', handleLedgerChanged)
})

onUnmounted(() => { uni.$off('ledger-changed', handleLedgerChanged) })
onPullDownRefresh(() => { onRefresh() })
</script>

<template>
  <view class="ledger-detail-page">
    <view v-if="loading" class="loading-state">
      <wd-loading size="48rpx" />
      <text>加载中...</text>
    </view>

    <template v-else-if="ledger">
      <view class="header">
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
          <view class="status-tag" :class="statusClass">{{ statusText }}</view>
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
          <view class="amount-item pending">
            <view class="amount-label">待收款</view>
            <view class="amount-value highlight">¥{{ formatAmount(pendingAmount) }}</view>
          </view>
        </view>
      </view>

      <scroll-view class="content-scroll" scroll-y>
        <view class="content-scroll-inner">
          <view class="section">
            <view class="section-header">
              <text class="section-title">商品明细</text>
              <text class="section-count">共{{ ledger.items?.length || 0 }}件</text>
            </view>
            <view v-if="!ledger.items?.length" class="empty-items">暂无商品</view>
            <view v-else class="item-list">
              <view v-for="item in ledger.items" :key="item.id" class="item-row">
                <view class="item-img"><wd-icon name="goods" size="40rpx" color="#999" /></view>
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
            <view class="summary-row">
              <text class="summary-label">商品小计</text>
              <text class="summary-value">¥{{ formatAmount(ledger.totalAmount) }}</text>
            </view>
            <view class="summary-row">
              <text class="summary-label">优惠</text>
              <text class="summary-value discount">-¥{{ formatAmount(ledger.discountAmount) }}</text>
            </view>
            <view class="summary-row total">
              <text class="summary-label">应付金额</text>
              <text class="summary-value">¥{{ formatAmount(ledger.totalAmount) }}</text>
            </view>
          </view>

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
                <view class="payment-icon"><wd-icon name="check" size="28rpx" /></view>
                <view class="payment-info">
                  <view class="payment-type">{{ record.paymentMethodDesc || getPaymentMethodLabel(record.paymentMethod) }}</view>
                  <view class="payment-time">{{ formatPaymentTime(record.createInstant) }}</view>
                  <view v-if="record.memo" class="payment-memo">{{ record.memo }}</view>
                </view>
                <view class="payment-amount">+¥{{ formatAmount(record.amount) }}</view>
              </view>
            </view>
          </view>

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
              <text class="info-value">{{ formattedCreateTime }}</text>
            </view>
            <view class="info-row clickable" @tap="openMemoPopup">
              <text class="info-label">备注</text>
              <view class="info-value-wrap">
                <text class="info-value">{{ ledger.memo || '无' }}</text>
                <wd-icon name="arrow-right" size="28rpx" color="#999" />
              </view>
            </view>
          </view>
          <view style="height: 180rpx;"></view>
        </view>
      </scroll-view>

      <view class="action-bar">
        <button class="btn btn-outline" @tap="handleEdit"><wd-icon name="edit" size="28rpx" /> 编辑</button>
        <button class="btn btn-warning" @tap="handleRecord"><wd-icon name="list" size="28rpx" /> 记账</button>
        <button class="btn btn-success" @tap="handlePayment"><wd-icon name="money-circle" size="28rpx" /> 收款</button>
        <button class="btn btn-primary" @tap="handleSettle"><wd-icon name="check-circle" size="28rpx" /> 结账</button>
      </view>
    </template>

    <!-- 支付弹窗 -->
    <view v-if="showPaymentPopup" class="popup-mask" @tap="closePaymentPopup">
      <view class="popup-container" @tap.stop>
        <view class="popup-panel">
          <view class="popup-header">
            <text class="popup-title">{{ popupTitle }}</text>
            <view class="popup-close" @tap="closePaymentPopup">
              <wd-icon name="close" size="40rpx" color="#999" />
            </view>
          </view>
          <view class="popup-content">
            <view class="form-group">
              <text class="form-label">金额</text>
              <view class="amount-input">
                <text class="currency">￥</text>
                <input type="digit" v-model="paymentAmount" placeholder="0.00" class="input" />
              </view>
            </view>
            <view class="form-group">
              <text class="form-label">支付方式</text>
              <view class="payment-methods">
                <view v-for="opt in paymentMethodOptions" :key="opt.value" class="method-item" :class="{ active: paymentMethod === opt.value }" @tap="paymentMethod = opt.value">{{ opt.label }}</view>
              </view>
            </view>
            <view class="form-group">
              <text class="form-label">备注</text>
              <input type="text" v-model="paymentMemo" placeholder="选填" class="form-input" />
            </view>
          </view>
          <view class="popup-footer">
            <button class="confirm-btn" :loading="paymentLoading" @tap="confirmPayment">{{ confirmBtnText }}</button>
          </view>
        </view>
      </view>
    </view>

    <!-- 备注编辑弹窗 -->
    <view v-if="showMemoPopup" class="popup-mask" @tap="closeMemoPopup">
      <view class="popup-container" @tap.stop>
        <view class="popup-panel">
          <view class="popup-header">
            <text class="popup-title">修改备注</text>
            <view class="popup-close" @tap="closeMemoPopup">
              <wd-icon name="close" size="40rpx" color="#999" />
            </view>
          </view>
          <view class="popup-content">
            <view class="form-group">
              <text class="form-label">备注内容</text>
              <textarea v-model="editMemo" placeholder="请输入备注" class="form-textarea" :maxlength="255" />
            </view>
          </view>
          <view class="popup-footer">
            <button class="confirm-btn" :loading="memoLoading" @tap="saveMemo">确认修改</button>
          </view>
        </view>
      </view>
    </view>

    <!-- 结账二次确认弹窗 -->
    <view v-if="showSettleConfirm" class="popup-mask" @tap="cancelSettleConfirm">
      <view class="settle-confirm-container" @tap.stop>
        <view class="settle-confirm-panel">
          <view class="settle-confirm-icon">
            <wd-icon name="warning" size="64rpx" color="#F59E0B" />
          </view>
          <view class="settle-confirm-title">确认结账</view>
          <view class="settle-confirm-desc">提交后将立即完成结账，请确认以下信息：</view>
          <view class="settle-confirm-info">
            <view class="settle-info-row">
              <text class="settle-info-label">待收款金额</text>
              <text class="settle-info-value">¥{{ formatAmount(pendingAmount) }}</text>
            </view>
            <view class="settle-info-row">
              <text class="settle-info-label">本次结账金额</text>
              <text class="settle-info-value">¥{{ formatAmount(settleConfirmData.settleAmount) }}</text>
            </view>
            <view class="settle-info-row discount-row" v-if="settleConfirmData.discountAmount > 0">
              <text class="settle-info-label">本次优惠金额</text>
              <text class="settle-info-value discount-value">¥{{ formatAmount(settleConfirmData.discountAmount) }}</text>
            </view>
          </view>
          <view v-if="settleConfirmData.discountAmount > 0" class="settle-confirm-tip">
            剩余 ¥{{ formatAmount(settleConfirmData.discountAmount) }} 未缴费将作为优惠处理
          </view>
          <view class="settle-confirm-btns">
            <button class="settle-cancel-btn" @tap="cancelSettleConfirm">取消</button>
            <button class="settle-ok-btn" :loading="paymentLoading" @tap="doSettleConfirm">确认结账</button>
          </view>
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
  &:last-child { margin-bottom: 0; }
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
}

.status-tag {
  padding: 8rpx 20rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
  font-weight: 500;
  
  &.status-progress {
    background: rgba(255, 255, 255, 0.25);
    color: #fff;
  }
  &.status-partial {
    background: #F59E0B;
    color: #fff;
  }
  &.status-cleared {
    background: #10B981;
    color: #fff;
  }
  &.status-credit {
    background: #EF4444;
    color: #fff;
  }
  &.status-closed {
    background: rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.7);
  }
  &.status-default {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
  }
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
  
  &.highlight {
    color: #FBBF24;
    text-shadow: 0 2rpx 8rpx rgba(251, 191, 36, 0.3);
  }
}

.amount-item.pending {
  .amount-label {
    color: #FBBF24;
  }
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

.empty-items, .empty-payments {
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
  &:last-child { border-bottom: none; }
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
    .summary-label { font-weight: 600; color: #333; }
    .summary-value { font-size: 36rpx; font-weight: 600; color: #EF4444; }
  }
}

.summary-label { color: #666; }
.summary-value { color: #333; &.discount { color: #10B981; } }

.payment-list {
  padding: 0 32rpx;
}

.payment-item {
  display: flex;
  align-items: center;
  padding: 28rpx 0;
  border-bottom: 2rpx solid #f5f5f5;
  &:last-child { border-bottom: none; }
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

.payment-memo {
  font-size: 24rpx;
  color: #666;
  margin-top: 4rpx;
}

.payment-amount {
  font-size: 32rpx;
  font-weight: 600;
  color: #10B981;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 32rpx;
  border-bottom: 2rpx solid #f5f5f5;
  &:last-child { border-bottom: none; }
  &.clickable { cursor: pointer; }
}

.info-label {
  font-size: 28rpx;
  color: #666;
}

.info-value {
  font-size: 28rpx;
  color: #333;
}

.info-value-wrap {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
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
  &::after { border: none; }
  &.btn-outline { background: #fff; color: #666; border: 2rpx solid #e5e5e5; }
  &.btn-warning { background: #F59E0B; color: #fff; }
  &.btn-success { background: #10B981; color: #fff; }
  &.btn-primary { background: #3B82F6; color: #fff; }
}

/* 弹窗样式 - 从底部滑出，圆角，四周留空 */
.popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.popup-container {
  width: 100%;
  padding: 24rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.popup-panel {
  background: #fff;
  border-radius: 32rpx;
  overflow: hidden;
  box-shadow: 0 -8rpx 40rpx rgba(0, 0, 0, 0.15);
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 2rpx solid #f5f5f5;
}

.popup-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #333;
}

.popup-close {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.popup-content {
  padding: 32rpx;
}

.form-group {
  margin-bottom: 32rpx;
  &:last-child { margin-bottom: 0; }
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

.form-textarea {
  width: 100%;
  height: 200rpx;
  background: #f5f5f5;
  border-radius: 16rpx;
  padding: 24rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.payment-methods {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.method-item {
  padding: 16rpx 32rpx;
  background: #f5f5f5;
  border-radius: 32rpx;
  font-size: 26rpx;
  color: #666;
  border: 2rpx solid transparent;
  transition: all 0.2s;
  &.active {
    background: #EBF5FF;
    color: #3B82F6;
    border-color: #3B82F6;
  }
}

.memo-tip {
  font-size: 24rpx;
  color: #999;
  margin-top: 16rpx;
}

.popup-footer {
  padding: 24rpx 32rpx;
  padding-bottom: 32rpx;
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
  &::after { border: none; }
}

/* 结账二次确认弹窗 */
.settle-confirm-container {
  width: 100%;
  padding: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: fadeScaleIn 0.25s ease;
}

@keyframes fadeScaleIn {
  from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

.settle-confirm-panel {
  width: 100%;
  max-width: 600rpx;
  background: #fff;
  border-radius: 32rpx;
  padding: 48rpx 40rpx 40rpx;
  text-align: center;
  box-shadow: 0 8rpx 60rpx rgba(0, 0, 0, 0.15);
}

.settle-confirm-icon {
  margin-bottom: 20rpx;
}

.settle-confirm-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
}

.settle-confirm-desc {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 32rpx;
}

.settle-confirm-info {
  background: #F9FAFB;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.settle-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12rpx 0;
  &.discount-row {
    border-top: 2rpx dashed #E5E7EB;
    margin-top: 8rpx;
    padding-top: 20rpx;
  }
}

.settle-info-label {
  font-size: 28rpx;
  color: #666;
}

.settle-info-value {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  &.discount-value {
    color: #EF4444;
    font-size: 32rpx;
  }
}

.settle-confirm-tip {
  background: #FEF3C7;
  color: #92400E;
  font-size: 26rpx;
  padding: 16rpx 24rpx;
  border-radius: 12rpx;
  margin-bottom: 32rpx;
  text-align: left;
}

.settle-confirm-btns {
  display: flex;
  gap: 24rpx;
}

.settle-cancel-btn {
  flex: 1;
  height: 88rpx;
  background: #F3F4F6;
  color: #666;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  &::after { border: none; }
}

.settle-ok-btn {
  flex: 1;
  height: 88rpx;
  background: #3B82F6;
  color: #fff;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  &::after { border: none; }
}
</style>
