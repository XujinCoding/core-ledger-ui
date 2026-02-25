<script setup lang="ts">
/**
 * 商户身份选择页面
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, computed, onMounted } from 'vue'
import { switchIdentity } from '@/api/modules/auth'
import { useNavbarSafeArea } from '@/composables/useNavbarSafeArea'
import { useUserStore } from '@/stores/modules/user'
import { IdentityType } from '@/enums'
import type { MerchantIdentity } from '@/types/auth'

const userStore = useUserStore()

// 导航栏安全区域
const { safeArea } = useNavbarSafeArea()

// 计算导航栏总高度
const navbarTotalHeight = computed(() => {
  if (!safeArea.value) return 88
  return safeArea.value.navbarHeight + 44
})

const merchants = ref<MerchantIdentity[]>([])
const loading = ref(false)
const selectedId = ref<number | null>(null)

/**
 * 初始化页面，获取商户列表
 */
onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  
  // 从 eventChannel 获取数据
  const eventChannel = currentPage.getOpenerEventChannel?.()
  if (eventChannel) {
    eventChannel.on('merchantsData', (data: { merchants: MerchantIdentity[], userInfo: any }) => {
      console.log('[Select Merchant] 收到商户数据:', data)
      if (data.merchants && data.merchants.length > 0) {
        merchants.value = data.merchants
      }
    })
  }

  console.log('[Select Merchant] 页面初始化完成')
})

/**
 * 处理商户选择
 */
const handleSelectMerchant = async (merchant: MerchantIdentity) => {
  if (loading.value) return
  
  try {
    loading.value = true
    selectedId.value = merchant.id

    console.log('[Select Merchant] 选择商户:', merchant.id)

    // 调用切换身份接口
    const response = await switchIdentity({
      identityType: IdentityType.MERCHANT_OWNER,
      merchantId: merchant.id
    })

    console.log('[Select Merchant] 切换身份响应:', response)

    if (response?.token) {
      // 保存 token 和用户信息
      userStore.setToken(response.token)
      userStore.setUserInfo(response.userInfo)
      userStore.setIdentityType(response.userInfo.identityType)

      uni.showToast({ title: '登录成功', icon: 'success' })

      // 跳转到商户首页
      setTimeout(() => {
        uni.reLaunch({ url: '/pages/merchant/index' })
      }, 1000)
    } else {
      uni.showToast({ title: '登录失败，请重试', icon: 'none' })
    }
  } catch (error) {
    console.error('[Select Merchant] 切换身份失败:', error)
    uni.showToast({ title: '登录失败，请重试', icon: 'none' })
  } finally {
    loading.value = false
    selectedId.value = null
  }
}

/**
 * 返回登录页
 */
const goBack = () => {
  uni.navigateBack()
}
</script>

<template>
  <view class="select-merchant-page">
    <!-- 头部区域 -->
    <view class="header">
      <view class="header-content">
        <view class="header-icon">
          <wd-icon name="shop" size="80rpx" color="#fff" />
        </view>
        <view class="header-text">
          <text class="title">选择您的店铺</text>
          <text class="subtitle">您有 {{ merchants.length }} 家店铺，请选择要登录的店铺</text>
        </view>
      </view>
    </view>

    <!-- 商户列表 -->
    <view class="content">
      <view class="merchant-list">
        <view
          v-for="merchant in merchants"
          :key="merchant.id"
          class="merchant-card"
          :class="{ selected: selectedId === merchant.id }"
          @tap="handleSelectMerchant(merchant)"
        >
          <view class="merchant-icon">
            <wd-icon name="shop" size="48rpx" />
          </view>
          <view class="merchant-info">
            <view class="merchant-name">{{ merchant.name }}</view>
            <view class="merchant-detail">
              <view class="detail-row">
                <text class="detail-label">编号</text>
                <text class="detail-value">{{ merchant.code }}</text>
              </view>
              <view class="detail-row">
                <text class="detail-label">电话</text>
                <text class="detail-value">{{ merchant.phone || '-' }}</text>
              </view>
            </view>
          </view>
          <view class="merchant-action">
            <wd-loading v-if="loading && selectedId === merchant.id" type="ring" size="40rpx" color="#3B82F6" />
            <wd-icon v-else name="arrow-right" size="36rpx" color="#ccc" />
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="merchants.length === 0" class="empty-state">
        <wd-icon name="shop" size="120rpx" color="#ddd" />
        <text class="empty-text">暂无店铺数据</text>
        <text class="empty-tip">请联系管理员添加店铺</text>
      </view>
    </view>

    <!-- 底部提示 -->
    <view class="footer">
      <view class="footer-tip">
        <wd-icon name="info-outline" size="28rpx" color="#999" />
        <text>选择店铺后将进入对应的店铺管理</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>

.select-merchant-page {
  min-height: 100vh;
  background: $color-bg;
  display: flex;
  flex-direction: column;
}

// 导航栏
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  z-index: 100;
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 32rpx;
}

.navbar-left,
.navbar-right {
  width: 80rpx;
}

.navbar-title {
  font-size: $font-size-important;
  font-weight: 600;
  color: $color-white;
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
  color: $color-white;
}

.title {
  display: block;
  font-size: $font-size-xlarge;
  font-weight: 600;
  margin-bottom: 12rpx;
}

.subtitle {
  display: block;
  font-size: $font-size-small;
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

.merchant-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.merchant-card {
  display: flex;
  align-items: center;
  padding: 32rpx;
  background: $color-white;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
  gap: 24rpx;
  transition: all 0.2s;

  &:active {
    transform: scale(0.98);
    background: $color-bg-light;
  }

  &.selected {
    border: 4rpx solid #3B82F6;
    background: rgba(59, 130, 246, 0.1);
  }
}

.merchant-icon {
  width: 96rpx;
  height: 96rpx;
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $color-white;
  flex-shrink: 0;
}

.merchant-info {
  flex: 1;
  min-width: 0;
}

.merchant-name {
  font-size: $font-size-title;
  font-weight: 600;
  color: $color-text-primary;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.merchant-detail {
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
  font-size: $font-size-secondary;
  color: $color-text-secondary;
  width: 60rpx;
}

.detail-value {
  font-size: $font-size-secondary;
  color: $color-text-regular;
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
  padding: 120rpx 32rpx;
  background: $color-white;
  border-radius: 24rpx;
}

.empty-text {
  font-size: $font-size-title;
  color: $color-text-regular;
  margin-top: 32rpx;
}

.empty-tip {
  font-size: $font-size-small;
  color: $color-text-secondary;
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
  font-size: $font-size-secondary;
  color: $color-text-secondary;
}
</style>
