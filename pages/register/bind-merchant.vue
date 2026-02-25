<script setup lang="ts">
/**
 * 客户绑定商户页面
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref } from 'vue'
import { bindMerchant } from '@/api/modules/auth'
import { useNavbarSafeArea } from '@/composables/useNavbarSafeArea'
import { useUserStore } from '@/stores/modules/user'

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

// ==================== 状态 ====================

const inviteCode = ref('')
const loading = ref(false)
const scanned = ref(false)

// ==================== 扫码 ====================

/**
 * 处理扫码
 */
const handleScan = async () => {
  try {
    const result = await new Promise<any>((resolve, reject) => {
      uni.scanCode({
        success: resolve,
        fail: reject
      })
    })

    console.log('[Bind Merchant] 扫码结果:', result)

    // 从扫码结果中提取邀请码
    // 假设二维码内容就是邀请码
    inviteCode.value = result.result || ''
    scanned.value = true

    if (inviteCode.value) {
      showToast('扫码成功', 'success')
    }
  } catch (error) {
    console.error('[Bind Merchant] 扫码失败:', error)
    showToast('扫码失败，请重试')
  }
}

// ==================== 绑定 ====================

/**
 * 处理绑定
 */
const handleBind = async () => {
  if (!inviteCode.value) {
    showToast('请输入或扫描邀请码')
    return
  }

  try {
    loading.value = true

    const response = await bindMerchant({
      code: '',
      inviteCode: inviteCode.value
    })

    console.log('[Bind Merchant] 绑定响应:', response)

    if (response?.token) {
      // 保存用户信息
      userStore.setToken(response.token)
      userStore.setUserInfo(response.userInfo)
      userStore.setIdentityType(response.userInfo.identityType)

      showToast('绑定成功', 'success')

      // 跳转到首页
      uni.reLaunch({
        url: '/pages/home/index'
      })
    } else {
      showToast('绑定失败，请重试')
    }
  } catch (error) {
    console.error('[Bind Merchant] 绑定失败:', error)
    // 错误提示已在 request.ts 中处理
  } finally {
    loading.value = false
  }
}

/**
 * 处理跳过
 */
const handleSkip = () => {
  // 直接跳转到首页
  uni.reLaunch({
    url: '/pages/home/index'
  })
}
</script>

<template>
  <view class="bind-merchant-page" :style="{ paddingTop: safeArea?.navbarHeight + 'px' }">
    <!-- 顶部标题 -->
    <view class="header">
      <text class="title">绑定商户</text>
      <text class="subtitle">扫描商户二维码或输入邀请码</text>
    </view>

    <!-- 主要内容 -->
    <view class="content">
      <!-- 扫码区域 -->
      <view class="scan-section">
        <view class="scan-icon">
          <text class="icon-text">📱</text>
        </view>
        <text class="scan-title">扫描商户二维码</text>
        <text class="scan-subtitle">使用微信扫一扫快速绑定</text>

        <wd-button
          type="primary"
          block
          size="large"
          @click="handleScan"
          class="scan-button"
        >
          点击扫码
        </wd-button>
      </view>

      <!-- 分割线 -->
      <view class="divider">
        <text class="divider-text">或</text>
      </view>

      <!-- 邀请码输入区域 -->
      <view class="input-section">
        <text class="input-title">手动输入邀请码</text>

        <wd-cell-group border>
          <wd-input
            v-model="inviteCode"
            label="邀请码"
            placeholder="请输入商户邀请码"
            clearable
          />
        </wd-cell-group>
      </view>
    </view>

    <!-- 底部按钮 -->
    <view class="footer">
      <wd-button
        type="primary"
        block
        size="large"
        :loading="loading"
        @click="handleBind"
        class="bind-button"
      >
        绑定
      </wd-button>

      <wd-button
        type="default"
        block
        size="large"
        @click="handleSkip"
        class="skip-button"
      >
        跳过
      </wd-button>
    </view>
  </view>
</template>

<style lang="scss" scoped>

.bind-merchant-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: $color-bg;
  overflow: hidden;
}

.header {
  flex: 0 0 auto;
  padding: 40rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;

  .title {
    display: block;
    font-size: $font-size-xlarge;
    font-weight: bold;
    margin-bottom: 8rpx;
  }

  .subtitle {
    display: block;
    font-size: $font-size-small;
    opacity: 0.9;
  }
}

.content {
  flex: 1;
  padding: 40rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.scan-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx;
  background: white;
  border-radius: 12rpx;
  margin-bottom: 40rpx;

  .scan-icon {
    font-size: 80rpx;
    margin-bottom: 20rpx;

    .icon-text {
      display: block;
    }
  }

  .scan-title {
    font-size: $font-size-content;
    font-weight: bold;
    color: $color-text-primary;
    margin-bottom: 8rpx;
  }

  .scan-subtitle {
    font-size: $font-size-secondary;
    color: $color-text-secondary;
    margin-bottom: 30rpx;
  }

  .scan-button {
    width: 100%;
  }
}

.divider {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20rpx 0;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    height: 1rpx;
    background: $color-border;
  }

  .divider-text {
    position: relative;
    background: $color-bg;
    padding: 0 20rpx;
    color: $color-text-secondary;
    font-size: $font-size-secondary;
  }
}

.input-section {
  display: flex;
  flex-direction: column;
  padding: 40rpx;
  background: white;
  border-radius: 12rpx;

  .input-title {
    font-size: $font-size-content;
    font-weight: bold;
    color: $color-text-primary;
    margin-bottom: 20rpx;
  }

  :deep(.wd-cell-group) {
    border-radius: 8rpx;
  }
}

.footer {
  flex: 0 0 auto;
  padding: 20rpx;
  background: white;
  border-top: 1rpx solid #eee;

  .bind-button {
    margin-bottom: 12rpx;
  }

  .skip-button {
    color: $color-text-secondary;
  }
}
</style>
