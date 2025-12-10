<script setup lang="ts">
/**
 * 商户注册页面
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, reactive, onMounted } from 'vue'
import { merchantWechatRegister } from '@/api/modules/auth'
import { listAddresses, listAddressesByParent } from '@/api/modules/address'
import { useUserStore } from '@/stores/modules/user'
import type { AddressVO } from '@/types/address'
import { AddressSelector } from '@/components/AddressSelector.vue'
import { useWechatLogin } from '@/composables/useWechatLogin'


const { handleLoginResponse } = useWechatLogin()

// 使用 uni 的 showToast 替代 WOT-UI 的 useToast
const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'error') => {
  uni.showToast({
    title: message,
    icon: type === 'success' ? 'success' : 'none',
    duration: 2000
  })
}
const userStore = useUserStore()

// ==================== 表单数据 ====================

interface MerchantForm {
  phone: string
  username: string
  password: string
  merchantName: string
  addressId: number | null
  addressDetail: string
}

const form = reactive<MerchantForm>({
  phone: '',
  username: '',
  password: '',
  merchantName: '',
  addressId: null,
  addressDetail: ''
})

// ==================== 其他状态 ====================

const loading = ref(false)
// ==================== 验证 ====================

/**
 * 验证表单
 */
const validateForm = (): boolean => {
  if (!form.phone) {
    showToast('请输入手机号')
    return false
  }
  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    showToast('手机号格式不正确')
    return false
  }
  if (!form.username) {
    showToast('请输入用户名')
    return false
  }
  if (form.username.length < 3 || form.username.length > 20) {
    showToast('用户名长度应为3-20个字符')
    return false
  }
  if (!form.password) {
    showToast('请输入密码')
    return false
  }
  if (form.password.length < 6 || form.password.length > 20) {
    showToast('密码长度应为6-20个字符')
    return false
  }
  if (!form.merchantName) {
    showToast('请输入商户名称')
    return false
  }
  if (!form.addressId) {
    showToast('请选择地址')
    return false
  }
  if (!form.addressDetail) {
    showToast('请输入详细地址')
    return false
  }

  return true
}

// ==================== 提交 ====================

/**
 * 处理注册
 */
const handleRegister = async () => {
  if (!validateForm()) {
    return
  }

  try {
    loading.value = true

    // 调用注册接口
    const response = await merchantWechatRegister({
      code: '', // 从微信登录流程中获取，这里暂时为空
      phone: form.phone,
      username: form.username,
      password: form.password,
      merchantName: form.merchantName,
      addressId: 1, // 需要补充选择的地址标识
      addressDetail: form.addressDetail
    })

	await handleLoginResponse(response)

  } catch (error) {
    console.error('[Merchant Register] 注册失败:', error)
    showToast('注册失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <view class="merchant-register-page">
    <!-- 表单内容 -->
    <view class="content">
      <wd-cell-group border>
        <!-- 手机号 -->
        <wd-input
          v-model="form.phone"
          label="手机号"
          placeholder="请输入手机号"
          type="number"
          clearable
          required
        />

        <!-- 用户名 -->
        <wd-input
          v-model="form.username"
          label="用户名"
          placeholder="请输入用户名"
          clearable
          required
        />

        <!-- 密码 -->
        <wd-input
          v-model="form.password"
          label="密码"
          placeholder="请输入密码"
          show-password
          clearable
          required
        >
        </wd-input>

        <!-- 商户名称 -->
        <wd-input
          v-model="form.merchantName"
          label="商户名称"
          placeholder="请输入商户名称"
          clearable
          required
        />
		<AddressSelector></AddressSelector>
      </wd-cell-group>


      <!-- 详细地址 -->
      <view class="detail-section">
        <wd-cell-group border>
          <wd-textarea
            v-model="form.addressDetail"
            label="详细地址"
            placeholder="请输入详细地址"
            :maxlength="200"
            show-word-limit
            required
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
        @click="handleRegister"
      >
        注册
      </wd-button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.merchant-register-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.header {
  flex: 0 0 auto;
  padding: 40rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;

  .title {
    font-size: 36rpx;
    font-weight: bold;
  }
}

.content {
  flex: 1;
  padding: 20rpx;
  overflow-y: auto;

  :deep(.wd-cell-group) {
    margin-bottom: 20rpx;
    background: white;
    border-radius: 8rpx;
  }
}

.address-section {
  margin-bottom: 20rpx;

  .section-title {
    display: block;
    padding: 20rpx;
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
  }
}

.detail-section {
  margin-bottom: 20rpx;
}

.password-toggle {
  font-size: 24rpx;
  color: #667eea;
  cursor: pointer;
  padding: 0 10rpx;
}

.footer {
  flex: 0 0 auto;
  padding: 20rpx;
  background: white;
  border-top: 1rpx solid #eee;
}
</style>
