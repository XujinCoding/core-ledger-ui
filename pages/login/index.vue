<script setup lang="ts">
	/**
 * 登录首页 - 身份选择和登录入口
 * @author Core Ledger Team
 * @since 1.0.0
 */

	import { ref } from 'vue'
	import { useWechatLogin } from '@/composables/useWechatLogin'
	import { useNavbarSafeArea } from '@/composables/useNavbarSafeArea'
	import { IdentityType } from '@/enums'
	import AgreementModal from '@/components/AgreementModal.vue'
	import { USER_AGREEMENT, PRIVACY_POLICY } from '@/constants/agreements'

	const { loading, handleWechatLogin, handleLoginResponse } = useWechatLogin()

	// 导航栏安全区域
	const { safeArea } = useNavbarSafeArea()

	// 身份选择：默认选择商户
	const selectedIdentity = ref<IdentityType>(IdentityType.MERCHANT_OWNER)

	// 隐私政策复选框状态
	const agreed = ref<boolean>(false)
	const showUserAgreement = ref<boolean>(false)
	const showPrivacyPolicy = ref<boolean>(false)

	/**
	 * 选择身份
	 */
	const selectIdentity = (identity: IdentityType) => {
	  selectedIdentity.value = identity
	}

	/**
	 * 打开用户协议弹窗
	 */
	const openUserAgreement = () => {
	  showUserAgreement.value = true
	}

	/**
	 * 打开隐私政策弹窗
	 */
	const openPrivacyPolicy = () => {
	  showPrivacyPolicy.value = true
	}

	/**
	 * 处理登录
	 */
	const handleLogin = async () => {
	  // 检查是否勾选隐私政策复选框
	  if (!agreed.value) {
	    uni.showToast({
	      title: '请先阅读并同意用户协议和隐私政策',
	      icon: 'none',
	      duration: 2000
	    })
	    return
	  }

	  const response = await handleWechatLogin(selectedIdentity.value, agreed.value)
	  // 处理登录响应（跳转或显示注册/身份选择页面）
	  await handleLoginResponse(response)
	}
</script>

<template>
  <view class="login-page" :style="{ paddingTop: safeArea?.navbarHeight + 'px' }">
    <!-- Logo区域 -->
    <view class="login-header">
      <image class="login-logo" src="https://image-1304329767.cos.ap-guangzhou.myqcloud.com/logo/logo.png" mode="aspectFit" />
      <view class="login-title">账单管理</view>
      <view class="login-subtitle">简单高效的商户记账工具</view>
    </view>

    <!-- 登录内容区 -->
    <view class="login-content">
      <!-- 身份选择 -->
      <view class="identity-section">
        <view class="identity-title">请选择您的身份</view>
        <view class="identity-selector">
          <view
            class="identity-item"
            :class="{ active: selectedIdentity === IdentityType.MERCHANT_OWNER, merchant: true }"
            @tap="selectIdentity(IdentityType.MERCHANT_OWNER)"
          >
            <view class="identity-icon">
              <wd-icon name="shop" size="48rpx" />
            </view>
            <view class="identity-name">我是商户</view>
            <view class="identity-desc">管理店铺和客户账单</view>
          </view>
          <view
            class="identity-item"
            :class="{ active: selectedIdentity === IdentityType.CUSTOMER, customer: true }"
            @tap="selectIdentity(IdentityType.CUSTOMER)"
          >
            <view class="identity-icon">
              <wd-icon name="user" size="48rpx" />
            </view>
            <view class="identity-name">我是客户</view>
            <view class="identity-desc">查看我的消费记录</view>
          </view>
        </view>
      </view>

      <!-- 登录按钮区域 -->
      <view class="login-action">
        <!-- 隐私政策复选框 -->
        <view class="privacy-checkbox">
          <wd-checkbox v-model="agreed" shape="square">
            <view class="checkbox-label">
              我已阅读并同意
              <text class="link" @tap.stop="openUserAgreement">《用户协议》</text>
              和
              <text class="link" @tap.stop="openPrivacyPolicy">《隐私政策》</text>
            </view>
          </wd-checkbox>
        </view>

        <wd-button 
          type="success"
          :loading="loading" 
          @click="handleLogin"
          block
          size="large"
          custom-class="wechat-btn-custom"
        >
          <text v-if="!loading">微信一键登录</text>
        </wd-button>

        <view class="login-tip">
          <wd-icon name="info-outline" size="28rpx" />
          <text>首次登录将自动跳转至注册页面</text>
        </view>
      </view>
    </view>

    <!-- 用户协议弹窗 -->
    <AgreementModal
      v-model:visible="showUserAgreement"
      :title="USER_AGREEMENT.title"
      :content="USER_AGREEMENT.content"
    />

    <!-- 隐私政策弹窗 -->
    <AgreementModal
      v-model:visible="showPrivacyPolicy"
      :title="PRIVACY_POLICY.title"
      :content="PRIVACY_POLICY.content"
    />
  </view>
</template>

<style lang="scss" scoped>

.login-page {
  height: 100vh;
  box-sizing: border-box;
  background: $color-white;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.login-header {
  flex-shrink: 0;
  padding: 40rpx 48rpx 48rpx;
  text-align: center;
}

.login-logo {
  width: 180rpx;
  height: 180rpx;
  border-radius: 32rpx;
  margin: 0 auto 24rpx;
}

.login-title {
  font-size: $font-size-xlarge;
  font-weight: 600;
  color: $color-text-primary;
  margin-bottom: 8rpx;
}

.login-subtitle {
  font-size: $font-size-small;
  color: $color-text-secondary;
}

.login-content {
  flex: 1;
  padding: 0 48rpx;
  display: flex;
  flex-direction: column;
}

.identity-section {
  margin-bottom: 32rpx;
}

.identity-title {
  font-size: $font-size-small;
  color: $color-text-regular;
  margin-bottom: 20rpx;
  text-align: center;
}

.identity-selector {
  display: flex;
  gap: 32rpx;
}

.identity-item {
  flex: 1;
  padding: 24rpx 20rpx;
  border: 4rpx solid #e5e5e5;
  border-radius: 20rpx;
  text-align: center;
  transition: all 0.2s;

  &.active {
    border-color: $color-primary;
    background: rgba(59, 130, 246, 0.1);
  }

  &.active.customer {
    border-color: $color-success;
    background: rgba(16, 185, 129, 0.1);
  }
}

.identity-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: $color-bg;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12rpx;
  color: $color-text-secondary;

  .identity-item.merchant & {
    color: $color-primary;
  }

  .identity-item.customer & {
    color: $color-success;
  }

  .identity-item.active.merchant & {
    background: $color-primary;
    color: $color-white;
  }

  .identity-item.active.customer & {
    background: $color-success;
    color: $color-white;
  }
}

.identity-name {
  font-size: $font-size-content;
  font-weight: 500;
  color: $color-text-primary;
  margin-bottom: 4rpx;

  .identity-item.active.merchant & {
    color: $color-primary;
  }

  .identity-item.active.customer & {
    color: $color-success;
  }
}

.identity-desc {
  font-size: $font-size-xsmall;
  color: $color-text-secondary;
}

.login-action {
  margin-top: auto;
  padding-bottom: env(safe-area-inset-bottom, 32rpx);
}

.privacy-checkbox {
  margin-bottom: 32rpx;
  padding: 0 8rpx;

  .checkbox-label {
    font-size: $font-size-small;
    color: $color-text-regular;
    line-height: 1.6;
  }

  .link {
    color: $color-primary;
    text-decoration: none;
  }
}

:deep(.wechat-btn-custom) {
  height: 100rpx;
  background: $color-wechat;
  border-radius: 50rpx;
  font-size: $font-size-important;
  font-weight: 500;
}

.agreement {
  margin-top: 32rpx;
  font-size: $font-size-secondary;
  color: $color-text-secondary;
  text-align: center;

  .link {
    color: $color-primary;
  }
}

.login-tip {
  text-align: center;
  margin-top: 48rpx;
  font-size: $font-size-small;
  color: $color-text-secondary;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}
</style>