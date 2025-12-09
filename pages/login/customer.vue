<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import type { LoginVO } from '@/types/auth'

const loginResponse = ref<LoginVO | null>(null)
const loading = ref<boolean>(false)

onLoad((options: any) => {
  // 从路由参数获取登录响应
  if (options.response) {
    loginResponse.value = JSON.parse(options.response)
    handleResponse()
  }
})

/**
 * 处理登录响应
 */
const handleResponse = async () => {
  if (!loginResponse.value) return

  loading.value = true

  try {
    const response = loginResponse.value

    // 如果需要注册
    if (response.needRegister) {
      uni.navigateTo({
        url: '/pages/register/customer'
      })
      return
    }

    // 如果有客户列表，显示选择
    if (response.customers && response.customers.length > 0) {
      uni.navigateTo({
        url: `/pages/login/select-customer?customers=${JSON.stringify(response.customers)}&userInfo=${JSON.stringify(response.userInfo)}`
      })
      return
    }

    // 异常情况
    uni.showModal({
      title: '登录失败',
      content: '无法获取客户信息，请重试',
      showCancel: false
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <view class="customer-login-page">
    <view class="loading-container" v-if="loading">
      <u-loading-page></u-loading-page>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.customer-login-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f5f5;

  .loading-container {
    width: 100%;
    height: 100%;
  }
}
</style>
