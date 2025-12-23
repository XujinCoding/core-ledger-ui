<script setup lang="ts">
/**
 * 商户身份选择页面
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, onMounted } from 'vue'
import { switchIdentity } from '@/api/modules/auth'
import { useNavbarSafeArea } from '@/composables/useNavbarSafeArea'
import { useUserStore } from '@/stores/modules/user'
import type { MerchantIdentity } from '@/types/auth'

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

const merchants = ref<MerchantIdentity[]>([])
const loading = ref(false)
const selectedId = ref<number | null>(null)

/**
 * 初始化页面，获取商户列表
 */
onMounted(() => {
  // 从路由参数获取商户列表
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  
  // 尝试从路由参数获取
  if (currentPage.$route?.params?.merchants) {
    merchants.value = currentPage.$route.params.merchants
  }
  
  // 如果没有获取到，尝试从事件获取
  if (merchants.value.length === 0 && currentPage.$route?.query?.merchants) {
    try {
      merchants.value = JSON.parse(currentPage.$route.query.merchants as string)
    } catch (error) {
      console.error('[Select Merchant] 解析商户列表失败:', error)
    }
  }

  console.log('[Select Merchant] 商户列表:', merchants.value)
})

/**
 * 处理商户选择
 */
const handleSelectMerchant = async (merchant: MerchantIdentity) => {
  try {
    loading.value = true
    selectedId.value = merchant.id

    console.log('[Select Merchant] 选择商户:', merchant.id)

    // 调用切换身份接口
    const response = await switchIdentity({
      identityType: 'MERCHANT_OWNER',
      merchantId: merchant.id
    })

    console.log('[Select Merchant] 切换身份响应:', response)

    if (response?.token) {
      // 保存 token 和用户信息
      userStore.setToken(response.token)
      userStore.setUserInfo(response.userInfo)
      userStore.setIdentityType(response.userInfo.identityType)

      showToast('切换成功', 'success')

      // 跳转到首页
      uni.reLaunch({
        url: '/pages/home/index'
      })
    } else {
      showToast('切换失败，请重试', 'error')
    }
  } catch (error) {
    console.error('[Select Merchant] 切换身份失败:', error)
    showToast('切换失败，请重试', 'error')
  } finally {
    loading.value = false
    selectedId.value = null
  }
}
</script>

<template>
  <view class="select-merchant-page" :style="{ paddingTop: safeArea?.navbarHeight + 'px' }">
    <!-- 顶部说明 -->
    <view class="header">
      <text class="title">选择商户</text>
      <text class="subtitle">请选择要登录的商户</text>
    </view>

    <!-- 商户列表 -->
    <view class="content">
      <wd-cell-group border>
        <wd-cell
          v-for="merchant in merchants"
          :key="merchant.id"
          :title="merchant.merchantName"
          :label="merchant.merchantNo"
          is-link
          :clickable="!loading"
          @click="handleSelectMerchant(merchant)"
        >
          <template #right-icon>
            <wd-loading
              v-if="loading && selectedId === merchant.id"
              type="ring"
              size="24rpx"
            />
          </template>
        </wd-cell>
      </wd-cell-group>
    </view>

    <!-- 空状态 -->
    <view v-if="merchants.length === 0" class="empty">
      <text class="empty-text">暂无商户数据</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.select-merchant-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
  overflow: hidden;
}

.header {
  flex: 0 0 auto;
  padding: 40rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;

  .title {
    display: block;
    font-size: 36rpx;
    font-weight: bold;
    margin-bottom: 8rpx;
  }

  .subtitle {
    display: block;
    font-size: 26rpx;
    opacity: 0.9;
  }
}

.content {
  flex: 1;
  padding: 20rpx;

  :deep(.wd-cell-group) {
    background: white;
    border-radius: 8rpx;
    overflow: hidden;
  }

  :deep(.wd-cell) {
    padding: 20rpx;
    border-bottom: 1rpx solid #eee;

    &:last-child {
      border-bottom: none;
    }
  }
}

.empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;

  .empty-text {
    font-size: 28rpx;
    color: #999;
  }
}
</style>
