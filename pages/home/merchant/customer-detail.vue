<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getCustomer, updateCustomer } from '@/api/modules/customer'
import type { CustomerVO, CustomerUpdateDTO } from '@/types/customer'

const loading = ref(false)
const saving = ref(false)
const customer = ref<CustomerVO | null>(null)
const showEdit = ref(false)
const form = ref<CustomerUpdateDTO>({})
let customerId = 0

onLoad((opts) => {
  const id = Number(opts?.customerId)
  if (id) {
    customerId = id
    fetchDetail()
  }
})

const fetchDetail = async () => {
  try {
    loading.value = true
    const data = await getCustomer(customerId)
    customer.value = data
    form.value = {
      name: data.name,
      phone: data.phone,
      gender: data.gender,
      addressId: data.addressId,
      addressDetail: data.addressDetail
    }
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  try {
    saving.value = true
    await updateCustomer(customerId, form.value)
    await fetchDetail()
    showEdit.value = false
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

const gotoLedgers = () => {
  uni.navigateTo({ url: `/pages/home/merchant/ledger-by-customer?customerId=${customerId}` })
}
</script>

<template>
  <view class="page">
    <wd-loading v-if="loading" />
    <view v-else>
      <wd-cell-group border>
        <wd-cell title="姓名" :value="customer?.name || '-'" />
        <wd-cell title="性别" :value="customer?.gender ?? '-'" />
        <wd-cell title="电话" :value="customer?.phone || '-'" />
        <wd-cell title="地址" :value="customer?.addressId ? String(customer?.addressId) : '-'" />
        <wd-cell title="详细地址" :value="customer?.addressDetail || '-'" />
      </wd-cell-group>

      <view class="ops">
        <wd-button type="primary" block @click="showEdit = true">管理客户信息</wd-button>
        <wd-button type="success" block plain style="margin-top: 16rpx" @click="gotoLedgers">查看该客户账单</wd-button>
      </view>

      <wd-popup v-model="showEdit" position="bottom" :close-on-click-modal="false">
        <view class="edit">
          <wd-cell-group border>
            <wd-input v-model="form.name" label="姓名" placeholder="请输入" />
            <wd-input v-model="form.phone" label="电话" placeholder="请输入" />
            <wd-input v-model="form.addressDetail" label="详细地址" placeholder="请输入" />
          </wd-cell-group>
          <view class="edit-footer">
            <wd-button block @click="showEdit = false">取消</wd-button>
            <wd-button type="primary" block :loading="saving" @click="handleSave">保存</wd-button>
          </view>
        </view>
      </wd-popup>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page { padding: 24rpx; }
.ops { margin-top: 24rpx; }
.edit { padding: 24rpx; }
.edit-footer { margin-top: 24rpx; display: grid; grid-gap: 16rpx; }
</style>
