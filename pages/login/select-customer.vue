<script setup lang="ts">
/**
 * 客户身份选择页面
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, onMounted } from 'vue'
import { switchIdentity } from '@/api/modules/auth'
import { useNavbarSafeArea } from '@/composables/useNavbarSafeArea'
import { useUserStore } from '@/stores/modules/user'
import type { CustomerIdentity } from '@/types/auth'

// 使用 uni 的 showToast 替代 WOT-UI 的 useToast
const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'error') => {
  uni.showToast({
    title: message,
    icon: type === 'success' ? 'success' : 'none',
    duration: 2000
  })
}
const userStore = useUserStore()

// 导航栏安全区域
const { safeArea } = useNavbarSafeArea()

const customers = ref<CustomerIdentity[]>([])
const loading = ref(false)
const selectedId = ref<number | null>(null)

/**
 * 初始化页面，获取客户列表
 */
onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any

  // 从 eventChannel 获取数据
  const eventChannel = currentPage.getOpenerEventChannel?.()
  if (eventChannel) {
    eventChannel.on('customersData', (data: { customers: CustomerIdentity[], userInfo: any }) => {
      console.log('[Select Customer] 收到客户数据:', data)
      if (data.customers && data.customers.length > 0) {
        customers.value = data.customers
      }
    })
  }

  console.log('[Select Customer] 页面初始化完成')
})

/**
 * 处理客户选择
 */
const handleSelectCustomer = async (customer: CustomerIdentity) => {
  if (loading.value) return

  try {
    loading.value = true
    selectedId.value = customer.id

    console.log('[Select Customer] 选择客户:', customer.id, '商户ID:', customer.merchantId)

    // 调用切换身份接口
    const response = await switchIdentity({
      identityType: 'CUSTOMER' as any,
      customerId: customer.id,
      merchantId: customer.merchantId
    })

    console.log('[Select Customer] 切换身份响应:', response)

    if (response?.token) {
      // 保存 token 和用户信息
      userStore.setToken(response.token)
      userStore.setUserInfo(response.userInfo)
      userStore.setIdentityType(response.userInfo.identityType)

      showToast('登录成功', 'success')

      // 跳转到客户首页
      setTimeout(() => {
        uni.reLaunch({
          url: '/pages/customer/index'
        })
      }, 1000)
    } else {
      showToast('登录失败，请重试', 'error')
    }
  } catch (error) {
    console.error('[Select Customer] 切换身份失败:', error)
    showToast('登录失败，请重试', 'error')
  } finally {
    loading.value = false
    selectedId.value = null
  }
}
</script>

<template>
  <view class="select-customer-page">
    <!-- 头部区域 -->
    <view class="header">
      <view class="header-content">
        <view class="header-icon">
          <wd-icon name="user" size="80rpx" color="#fff" />
        </view>
        <view class="header-text">
          <text class="title">选择客户身份</text>
          <text class="subtitle">您有 {{ customers.length }} 个客户身份，请选择要登录的身份</text>
        </view>
      </view>
    </view>

    <!-- 客户列表 -->
    <view class="content">
      <view class="customer-list">
        <view
          v-for="customer in customers"
          :key="customer.id"
          class="customer-card"
          :class="{ selected: selectedId === customer.id }"
          @tap="handleSelectCustomer(customer)"
        >
          <view class="customer-icon">
            <wd-icon name="user" size="48rpx" />
          </view>
          <view class="customer-info">
            <view class="customer-name">{{ customer.customerName }}</view>
            <view class="customer-detail">
              <view class="detail-row">
                <text class="detail-label">商户</text>
                <text class="detail-value">{{ customer.merchantName }}</text>
              </view>
              <view class="detail-row">
                <text class="detail-label">编号</text>
                <text class="detail-value">{{ customer.customerNo }}</text>
              </view>
            </view>
          </view>
          <view class="customer-action">
            <wd-loading v-if="loading && selectedId === customer.id" type="ring" size="40rpx" color="#3B82F6" />
            <wd-icon v-else name="arrow-right" size="36rpx" color="#ccc" />
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="customers.length === 0" class="empty-state">
        <wd-icon name="user" size="120rpx" color="#ddd" />
        <text class="empty-text">暂无客户数据</text>
        <text class="empty-tip">请联系商户添加客户身份</text>
      </view>
    </view>

    <!-- 底部提示 -->
    <view class="footer">
      <view class="footer-tip">
        <wd-icon name="info-outline" size="28rpx" color="#999" />
        <text>选择客户身份后将进入对应的客户视图</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.select-customer-page {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

// 头部区域
.header {
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  padding-bottom: 60rpx;
}

.header-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 32rpx;
}

.header-icon {
  width: 140rpx;
  height: 140rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
}

.header-text {
  text-align: center;
  color: #fff;
}

.title {
  display: block;
  font-size: 40rpx;
  font-weight: 600;
  margin-bottom: 12rpx;
}

.subtitle {
  display: block;
  font-size: 26rpx;
  opacity: 0.9;
}

// 内容区域
.content {
  flex: 1;
  margin-top: -40rpx;
  padding: 0 32rpx;
  position: relative;
  z-index: 1;
}

.customer-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.customer-card {
  display: flex;
  align-items: center;
  padding: 32rpx;
  background: #fff;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
  gap: 24rpx;
  transition: all 0.2s;

  &:active {
    transform: scale(0.98);
    background: #f9f9f9;
  }

  &.selected {
    border: 4rpx solid #3B82F6;
    background: #EBF5FF;
  }
}

.customer-icon {
  width: 96rpx;
  height: 96rpx;
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.customer-info {
  flex: 1;
  min-width: 0;
}

.customer-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.customer-detail {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.detail-label {
  font-size: 24rpx;
  color: #999;
  width: 60rpx;
}

.detail-value {
  font-size: 24rpx;
  color: #666;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.customer-action {
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
  padding: 120rpx 32rpx;
  background: #fff;
  border-radius: 24rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #666;
  margin-top: 32rpx;
}

.empty-tip {
  font-size: 26rpx;
  color: #999;
  margin-top: 12rpx;
}

// 底部提示
.footer {
  padding: 32rpx;
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
}

.footer-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: #999;
}
</style>
