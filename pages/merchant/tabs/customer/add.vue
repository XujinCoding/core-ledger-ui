<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { addCustomer, getCustomer, updateCustomer } from '@/api/modules/customer'
import type { CustomerAddDTO } from '@/types/customer'

// 编辑模式
const isEdit = ref(false)
const customerId = ref<number | null>(null)

const form = ref<CustomerAddDTO>({
  name: '',
  phone: '',
  alias: '',
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
    form.value = {
      name: customer.name || '',
      phone: customer.phone || '',
      alias: customer.alias || '',
      gender: customer.gender || 0,
      age: customer.age,
      addressId: customer.addressId,
      addressDetail: customer.addressDetail || '',
      remark: customer.remark || ''
    }
    // 设置地址文本显示
    if (customer.addressName) {
      addressText.value = customer.addressName
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
      await updateCustomer(customerId.value, form.value)
      uni.showToast({ title: '修改成功', icon: 'success' })
    } else {
      await addCustomer(form.value)
      uni.showToast({ title: '添加成功', icon: 'success' })
    }
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error(isEdit.value ? '修改客户失败:' : '添加客户失败:', error)
    uni.showToast({ title: isEdit.value ? '修改失败' : '添加失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// 选择地址
const showAddressPicker = ref(false)
const addressText = ref('')
const selectedAddress = ref<number[]>([])

/**
 * 地址列变化回调
 */
const handleAddressColumnChange = () => {
  // TODO: 实现地址级联加载
  return Promise.resolve([])
}

const onAddressConfirm = (e: { selectedItems: any[] }) => {
  showAddressPicker.value = false
  if (e.selectedItems && e.selectedItems.length > 0) {
    form.value.addressId = e.selectedItems[e.selectedItems.length - 1]?.value
    addressText.value = e.selectedItems.map((item: any) => item.label).join(' ')
  }
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

        <wd-radio-group v-model="form.gender" label="性别" required>
          <wd-radio :value="1">男</wd-radio>
          <wd-radio :value="2">女</wd-radio>
        </wd-radio-group>

        <wd-input
          v-model="form.age"
          label="年龄"
          type="number"
          placeholder="请输入年龄"
          clearable
        />

        <wd-cell
          title="所在地区"
          :value="addressText || '请选择'"
          @click="showAddressPicker = true"
          is-link
        />

        <wd-input
          v-model="form.addressDetail"
          label="详细地址"
          placeholder="请输入详细地址"
          clearable
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

    <!-- 地址选择器 -->
    <wd-col-picker
      v-model="selectedAddress"
      :visible="showAddressPicker"
      :columns="[]"
      :column-change="handleAddressColumnChange"
      @confirm="onAddressConfirm"
      @close="showAddressPicker = false"
    />
  </view>
</template>

<style lang="scss" scoped>
.customer-add-page {
  min-height: 100vh;
  background-color: #f8f8f8;
  padding: 20rpx 24rpx 120rpx;
  box-sizing: border-box;
}

:deep(.wd-cell-group) {
  margin-bottom: 24rpx;
  border-radius: 12rpx;
  overflow: hidden;
  
  .wd-cell {
    padding: 28rpx 30rpx;
  }
  
  .wd-radio-group {
    padding: 20rpx 30rpx;
  }
}

.form-actions {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 24rpx;
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
  z-index: 100;
}

:deep(.wd-button) {
  height: 88rpx;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 500;
}
</style>
