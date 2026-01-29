<script setup lang="ts">
/**
 * 客户切换商户页面
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, onMounted } from 'vue'
import { getUserIdentities, switchIdentity } from '@/api/modules/auth'
import { useUserStore } from '@/stores/modules/user'
import { IdentityType } from '@/enums'
import type { CustomerIdentity } from '@/types/auth'

const userStore = useUserStore()

// ==================== 状态 ====================

const customers = ref<CustomerIdentity[]>([])
const loading = ref(false)
const selectedId = ref<number | null>(null)
const currentMerchantId = ref<number | undefined>(undefined)

// ==================== 方法 ====================

/**
 * 加载客户身份列表
 */
const loadIdentities = async () => {
  try {
    loading.value = true
    const identities = await getUserIdentities()
    console.log('[Switch Merchant] 获取身份列表:', identities)

    customers.value = identities.customers || []

    // 获取当前商户ID
    const userInfo = userStore.userInfo
    currentMerchantId.value = userInfo?.merchantId

    console.log('[Switch Merchant] 当前商户ID:', currentMerchantId.value)
  } catch (error) {
    console.error('[Switch Merchant] 加载身份列表失败:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

/**
 * 处理切换商户
 */
const handleSwitchMerchant = async (customer: CustomerIdentity) => {
  if (loading.value) return

  // 如果选择的是当前商户，不需要切换
  if (customer.merchantId === currentMerchantId.value) {
    uni.showToast({ title: '当前已是该商户', icon: 'none' })
    return
  }

  try {
    loading.value = true
    selectedId.value = customer.id

    console.log('[Switch Merchant] 切换商户:', customer.merchantId)

    // 调用切换身份接口
    const response = await switchIdentity({
      identityType: IdentityType.CUSTOMER,
      customerId: customer.id,
      merchantId: customer.merchantId
    })

    console.log('[Switch Merchant] 切换响应:', response)

    if (response?.token) {
      // 保存 token 和用户信息
      userStore.setToken(response.token)
      userStore.setUserInfo(response.userInfo)
      userStore.setIdentityType(response.userInfo.identityType)

      uni.showToast({ title: '切换成功', icon: 'success' })

      // 返回上一页并刷新
      setTimeout(() => {
        uni.navigateBack()
      }, 1000)
    } else {
      uni.showToast({ title: '切换失败，请重试', icon: 'none' })
    }
  } catch (error) {
    console.error('[Switch Merchant] 切换失败:', error)
    uni.showToast({ title: '切换失败，请重试', icon: 'none' })
  } finally {
    loading.value = false
    selectedId.value = null
  }
}

// ==================== 生命周期 ====================

onMounted(() => {
  loadIdentities()
})
</script>

<template>
  <view class="switch-merchant-page">
    <!-- 商户列表 -->
    <scroll-view class="content" scroll-y>
      <view class="merchant-list">
        <view
          v-for="customer in customers"
          :key="customer.id"
          class="merchant-card"
          :class="{
            selected: selectedId === customer.id,
            current: customer.merchantId === currentMerchantId
          }"
          @tap="handleSwitchMerchant(customer)"
        >
          <view class="merchant-icon">
            <wd-icon name="shop" size="48rpx" />
          </view>
          <view class="merchant-info">
            <view class="merchant-name">
              {{ customer.merchantName }}
              <text v-if="customer.merchantId === currentMerchantId" class="current-badge">当前</text>
            </view>
            <view class="merchant-detail">
              <view class="detail-row">
                <text class="detail-label">编号</text>
                <text class="detail-value">{{ customer.customerNo }}</text>
              </view>
            </view>
          </view>
          <view class="merchant-action">
            <wd-loading v-if="loading && selectedId === customer.id" type="ring" size="40rpx" color="#3B82F6" />
            <wd-icon v-else-if="customer.merchantId === currentMerchantId" name="check" size="36rpx" color="#10B981" />
            <wd-icon v-else name="arrow-right" size="36rpx" color="#ccc" />
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="!loading && customers.length === 0" class="empty-state">
        <wd-icon name="shop" size="120rpx" color="#ddd" />
        <text class="empty-text">暂无商户数据</text>
        <text class="empty-tip">请先绑定商户</text>
      </view>

      <!-- 底部提示 -->
      <view class="footer-tip">
        <wd-icon name="info-outline" size="28rpx" color="#999" />
        <text>切换商户后将查看该商户下的账单信息</text>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.switch-merchant-page {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

// 内容区域
.content {
  flex: 1;
  padding: 0;
  box-sizing: border-box;
}

.merchant-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin: 16rpx 24rpx 0;
}

.merchant-card {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.03);
  gap: 20rpx;
  transition: all 0.2s;

  &:active {
    transform: scale(0.98);
    background: #f9f9f9;
  }

  &.selected {
    border: 4rpx solid #3B82F6;
    background: #EBF5FF;
  }

  &.current {
    border: 4rpx solid #10B981;
    background: #F0FDF4;
  }
}

.merchant-icon {
  width: 80rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.merchant-info {
  flex: 1;
  min-width: 0;
}

.merchant-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.current-badge {
  display: inline-block;
  padding: 4rpx 12rpx;
  background: #10B981;
  color: #fff;
  font-size: 20rpx;
  border-radius: 8rpx;
  font-weight: 500;
}

.merchant-detail {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.detail-label {
  font-size: 24rpx;
  color: #999;
  width: 70rpx;
}

.detail-value {
  font-size: 24rpx;
  color: #666;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.merchant-action {
  flex-shrink: 0;
  width: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 32rpx;
  background: #fff;
  border-radius: 16rpx;
  margin: 16rpx 24rpx 0;
}

.empty-text {
  font-size: 30rpx;
  color: #666;
  margin-top: 24rpx;
}

.empty-tip {
  font-size: 26rpx;
  color: #999;
  margin-top: 8rpx;
}

// 底部提示
.footer-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: #999;
  padding: 32rpx 24rpx;
}
</style>
