<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getCustomer, updateCustomer } from '@/api/modules/customer'
import { createCustomer } from '@/api/modules/merchant'
import type { CreateCustomerDTO } from '@/types/merchant'
import type { CustomerUpdateDTO } from '@/types/customer'
import { useUserStore } from '@/stores/modules/user'
import AddressSelector from '@/components/AddressSelector.vue'
import ImageUploader from '@/components/ImageUploader.vue'

// 编辑模式
const isEdit = ref(false)
const customerId = ref<number | null>(null)

const userStore = useUserStore()

// 原始头像URL（用于判断是否修改了头像）
const originalAvatarUrl = ref('')

const form = ref<CreateCustomerDTO>({
  merchantId: 0,
  name: '',
  phone: '',
  alias: '',
  avatarUrl: '',
  gender: 1,
  age: undefined,
  addressId: undefined,
  addressDetail: '',
  remark: ''
})

const loading = ref(false)
const pageLoading = ref(false)

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入客户姓名', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入正确的手机号',
      trigger: 'blur'
    }
  ],
  addressId: [
    { required: true, message: '请选择所在地区', trigger: 'change' }
  ],
  addressDetail: [
    { required: true, message: '请输入详细地址', trigger: 'blur' }
  ]
}

/**
 * 加载客户数据（编辑模式）
 */
const loadCustomer = async () => {
  if (!customerId.value) return
  try {
    pageLoading.value = true
    const customer = await getCustomer(customerId.value)
    // 保存原始头像URL
    originalAvatarUrl.value = customer.avatarUrl || ''
    form.value = {
      merchantId: customer.merchantId || userStore.userInfo?.merchantId || 0,
      name: customer.name || '',
      phone: customer.phone || '',
      alias: customer.alias || '',
      avatarUrl: customer.avatarUrl || '',
      gender: customer.gender || 0,
      age: customer.age,
      addressId: customer.addressId,
      addressDetail: customer.addressDetail || '',
      remark: customer.remark || ''
    }
  } catch (error) {
    console.error('加载客户数据失败:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    pageLoading.value = false
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    loading.value = true
    if (isEdit.value && customerId.value) {
      // 编辑模式：判断头像是否修改
      const submitData: CustomerUpdateDTO = {
        name: form.value.name,
        phone: form.value.phone,
        alias: form.value.alias,
        gender: form.value.gender,
        age: form.value.age,
        addressId: form.value.addressId,
        addressDetail: form.value.addressDetail,
        remark: form.value.remark
      }
      // 只有当头像URL发生变化且不是预签名URL时才提交
      if (form.value.avatarUrl && form.value.avatarUrl !== originalAvatarUrl.value) {
        if (!form.value.avatarUrl.startsWith('http')) {
          submitData.avatarUrl = form.value.avatarUrl
        }
      }
      await updateCustomer(customerId.value, submitData)
      uni.showToast({ title: '修改成功', icon: 'success' })
    } else {
      // 设置当前商户ID
      form.value.merchantId = userStore.userInfo?.merchantId || 0
      await createCustomer(form.value)
      uni.showToast({ title: '添加成功', icon: 'success' })
    }
    setTimeout(() => {
      // 触发刷新事件，通知列表页面刷新数据
      uni.$emit('customer-changed')
      uni.navigateBack()
    }, 1500)
  } catch (error: any) {
    console.error(isEdit.value ? '修改客户失败:' : '添加客户失败:', error)
    // 错误提示已在 request.ts 的 handleBusinessError 中处理，这里不再重复显示
  } finally {
    loading.value = false
  }
}

/**
 * 地址选择变化回调
 */
const handleAddressChange = (addressId: number | null) => {
  form.value.addressId = addressId || undefined
}

// 生命周期 - 获取路由参数
onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const query = currentPage.options || {}
  
  if (query.id) {
    customerId.value = Number(query.id)
    isEdit.value = query.edit === 'true'
    if (isEdit.value) {
      // 设置页面标题
      uni.setNavigationBarTitle({ title: '编辑客户' })
      loadCustomer()
    }
  }
})
</script>

<template>
  <view class="customer-add-page">
    <wd-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <wd-cell-group border>
        <!-- 头像上传 -->
        <view class="avatar-field">
          <view class="avatar-label">客户头像</view>
          <ImageUploader
            v-model="form.avatarUrl"
            width="120rpx"
            height="120rpx"
            placeholder="上传"
            round
          />
        </view>

        <wd-input
          v-model="form.name"
          label="客户姓名"
          prop="name"
          placeholder="请输入客户姓名"
          clearable
          required
        />

        <wd-input
          v-model="form.phone"
          label="手机号"
          prop="phone"
          type="number"
          :maxlength="11"
          placeholder="请输入手机号"
          clearable
          required
        />

        <wd-input
          v-model="form.alias"
          label="别名/昵称"
          placeholder="方便记忆的称呼（选填）"
          clearable
        />

        <wd-input
          v-model="form.age"
          label="年龄"
          type="number"
          placeholder="请输入年龄"
          clearable
        />

        <!-- 性别选择 - 按钮式一排显示 -->
        <view class="gender-field">
          <view class="gender-label">性别</view>
          <view class="gender-options">
            <view 
              class="gender-option male" 
              :class="{ active: form.gender === 1 }"
              @tap="form.gender = 1"
            >
              <text class="gender-icon">♂</text>
              <text>男</text>
            </view>
            <view 
              class="gender-option female" 
              :class="{ active: form.gender === 2 }"
              @tap="form.gender = 2"
            >
              <text class="gender-icon">♀</text>
              <text>女</text>
            </view>
          </view>
        </view>

        <!-- 地址选择器 -->
        <view class="address-field">
          <AddressSelector
            v-model="form.addressId"
            label="所在地区"
            placeholder="请选择地址"
            :min-level="2"
            required
            @change="handleAddressChange"
          />
        </view>

        <wd-input
          v-model="form.addressDetail"
          label="详细地址"
          prop="addressDetail"
          placeholder="请输入详细地址"
          clearable
          required
        />

        <wd-textarea
          v-model="form.remark"
          label="备注"
          placeholder="请输入备注信息"
          :maxlength="200"
          show-word-limit
        />
      </wd-cell-group>
    </wd-form>

    <view class="form-actions">
      <wd-button 
        type="primary" 
        block 
        size="large"
        :loading="loading"
        @click="handleSubmit"
      >
        {{ isEdit ? '保存修改' : '添加客户' }}
      </wd-button>
    </view>

  </view>
</template>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.customer-add-page {
  min-height: 100vh;
  background-color: #f8f8f8;
  padding: $spacing-sm $spacing-md 120rpx;
  box-sizing: border-box;
}

:deep(.wd-cell-group) {
  margin-bottom: $spacing-md;
  border-radius: $border-radius-md;
  overflow: hidden;
  
  .wd-cell {
    padding: $font-size-content $spacing-base;
  }
}

// 性别选择样式
.gender-field {
  display: flex;
  align-items: center;
  padding: 15rpx $spacing-base;
  background: #fff;
  border-top: 1rpx solid #f0f0f0;
  border-bottom: 1rpx solid #f0f0f0;
}

// 头像上传样式
.avatar-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md $spacing-base;
  background: #fff;
  border-bottom: 1rpx solid #f0f0f0;
}

.avatar-label {
  font-size: $font-size-content;
  color: rgba(0, 0, 0, 0.85);
}

.gender-label {
  font-size: $font-size-content;
  color: rgba(0, 0, 0, 0.85);
  width: 100px;
  flex-shrink: 0;
}

.gender-options {
  flex: 1;
  display: flex;
  gap: $spacing-md;
}

.gender-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-xs;
  padding: $spacing-sm $spacing-md;
  background: #f5f5f5;
  border-radius: $border-radius-md;
  border: 2rpx solid transparent;
  transition: all $transition-fast;
  
  .gender-icon {
    font-size: $font-size-xlarge;
  }
  
  text {
    font-size: $font-size-content;
    color: #666;
  }
  
  &.male {
    .gender-icon {
      color: #3B82F6;
    }
  }
  
  &.female {
    .gender-icon {
      color: #EC4899;
    }
  }
  
  &.active {
    border-color: #3B82F6;
    background: rgba(59, 130, 246, 0.1);
    
    text {
      color: #3B82F6;
      font-weight: 500;
    }
  }
  
  &.female.active {
    border-color: #EC4899;
    background: rgba(236, 72, 153, 0.1);
    
    text {
      color: #EC4899;
    }
  }
}

// 地址选择器样式
.address-field {
  padding: 0 $spacing-base;
  background: #fff;
  border-bottom: 1rpx solid #f0f0f0;
}

.form-actions {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: $spacing-sm $spacing-md;
  background: #fff;
  box-shadow: $box-shadow-md;
  z-index: 100;
}

:deep(.wd-button) {
  height: 88rpx;
  border-radius: 44rpx;
  font-size: $font-size-title;
  font-weight: 500;
}
</style>
