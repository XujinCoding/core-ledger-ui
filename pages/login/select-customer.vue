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
  // 从路由参数获取客户列表
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  
  // 尝试从路由参数获取
  if (currentPage.$route?.params?.customers) {
    customers.value = currentPage.$route.params.customers
  }
  
  // 如果没有获取到，尝试从事件获取
  if (customers.value.length === 0 && currentPage.$route?.query?.customers) {
    try {
      customers.value = JSON.parse(currentPage.$route.query.customers as string)
    } catch (error) {
      console.error('[Select Customer] 解析客户列表失败:', error)
    }
  }

  console.log('[Select Customer] 客户列表:', customers.value)
})

/**
 * 处理客户选择
 */
const handleSelectCustomer = async (customer: CustomerIdentity) => {
  try {
    loading.value = true
    selectedId.value = customer.id

    console.log('[Select Customer] 选择客户:', customer.id)

    // 调用切换身份接口
    const response = await switchIdentity({
      identityType: 'CUSTOMER',
      customerId: customer.id
    })

    console.log('[Select Customer] 切换身份响应:', response)

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
    console.error('[Select Customer] 切换身份失败:', error)
    showToast('切换失败，请重试', 'error')
  } finally {
    loading.value = false
    selectedId.value = null
  }
}
</script>

<template>
  <view class="select-customer-page" :style="{ paddingTop: safeArea?.navbarHeight + 'px' }">
    <!-- 顶部说明 -->
    <view class="header">
      <text class="title">选择客户</text>
      <text class="subtitle">请选择要登录的客户</text>
    </view>

    <!-- 客户列表 -->
    <view class="content">
      <wd-cell-group border>
        <wd-cell
          v-for="customer in customers"
          :key="customer.id"
          :title="customer.customerName"
          :label="`${customer.merchantName} - ${customer.customerNo}`"
          is-link
          :clickable="!loading"
          @click="handleSelectCustomer(customer)"
        >
          <template #right-icon>
            <wd-loading
              v-if="loading && selectedId === customer.id"
              type="ring"
              size="24rpx"
            />
          </template>
        </wd-cell>
      </wd-cell-group>
    </view>

    <!-- 空状态 -->
    <view v-if="customers.length === 0" class="empty">
      <text class="empty-text">暂无客户数据</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.select-customer-page {
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
