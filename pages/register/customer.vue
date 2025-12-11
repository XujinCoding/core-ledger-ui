<script setup lang="ts">
/**
 * 客户注册页面
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, reactive, onMounted } from 'vue'
import { customerWechatRegister } from '@/api/modules/auth'
import { useUserStore } from '@/stores/modules/user'
import AddressSelector from '@/components/AddressSelector.vue'
import { getWechatCode } from '@/composables/useWechatLogin'

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

interface CustomerForm {
  phone: string
  customerName: string
  gender?: string
  age?: number
  addressId: number | null
  addressDetail: string
  inviteCode: string
}

const form = reactive<CustomerForm>({
  phone: '',
  customerName: '',
  gender: '',
  age: undefined,
  addressId: null,
  addressDetail: '',
  inviteCode: ''
})

// ==================== 地址选择 ====================

const selectedAddressIds = ref<number[]>([])

// ==================== 性别选择 ====================

const genderOptions = [
  { label: '男', value: '1' },
  { label: '女', value: '2' }
]

const showGenderPicker = ref(false)

// ==================== 其他状态 ====================

const loading = ref(false)

// ==================== 初始化 ====================

onMounted(async () => {
  // 地址选择器组件自动加载数据
})

// ==================== 地址选择处理 ====================

/**
 * 处理地址选择变化
 */
const handleAddressChange = (addressIds: number[]) => {
  selectedAddressIds.value = addressIds
  if (addressIds.length > 0) {
    // 将最后一个ID作为地址ID
    form.addressId = addressIds[addressIds.length - 1]
  }
}

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
  if (!form.customerName) {
    showToast('请输入客户姓名')
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
  if (!form.inviteCode) {
    showToast('请输入商户邀请码')
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

    // 获取微信 code
    const code = await getWechatCode()

    // 调用注册接口
    const response = await customerWechatRegister({
      code,
      phone: form.phone,
      customerName: form.customerName,
      gender: form.gender ? parseInt(form.gender) : undefined,
      age: form.age,
      addressId: form.addressId!,
      addressDetail: form.addressDetail,
      inviteCode: form.inviteCode
    })

    console.log('[Customer Register] 注册响应:', response)

    if (response?.token) {
      // 保存用户信息
      userStore.setToken(response.token)
      userStore.setUserInfo(response.userInfo)
      userStore.setIdentityType(response.userInfo.identityType)

      showToast('注册成功', 'success')

      // 跳转到首页
      uni.reLaunch({
        url: '/pages/home/index'
      })
    } else {
      showToast('注册失败，请重试')
    }
  } catch (error) {
    console.error('[Customer Register] 注册失败:', error)
    showToast('注册失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <view class="customer-register-page">
    <!-- 顶部标题 -->
    <view class="header">
      <text class="title">客户注册</text>
    </view>

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

        <!-- 客户姓名 -->
        <wd-input
          v-model="form.customerName"
          label="客户姓名"
          placeholder="请输入客户姓名"
          clearable
          required
        />

        <!-- 性别 -->
        <wd-cell
          title="性别"
          :value="genderOptions.find(g => g.value === form.gender)?.label || '请选择'"
          is-link
          @click="showGenderPicker = true"
        />

        <!-- 年龄 -->
        <wd-input
          v-model.number="form.age"
          label="年龄"
          placeholder="请输入年龄"
          type="number"
          clearable
        />

        <!-- 邀请码 -->
        <wd-input
          v-model="form.inviteCode"
          label="商户邀请码"
          placeholder="请输入商户邀请码"
          clearable
          required
        />
      </wd-cell-group>

      <!-- 地址选择 -->
      <view class="address-section">
        <text class="section-title">地址选择</text>
        <AddressSelector 
          v-model="selectedAddressIds"
          @change="handleAddressChange"
        />
      </view>

      <!-- 性别选择器 -->
      <wd-picker
        v-model="form.gender"
        :columns="genderOptions"
        v-model:visible="showGenderPicker"
      />

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
.customer-register-page {
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

.footer {
  flex: 0 0 auto;
  padding: 20rpx;
  background: white;
  border-top: 1rpx solid #eee;
}
</style>
