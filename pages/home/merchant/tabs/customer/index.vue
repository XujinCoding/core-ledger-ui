<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useToast } from '@/uni_modules/wot-design-uni'
import { searchCustomers } from '@/api/modules/customer'
import { getCurrentUser } from '@/api/modules/auth'
import { getAddress } from '@/api/modules/address'
import type { CustomerVO, CustomerSearchDTO } from '@/types/customer'
import type { UserInfoVO } from '@/types/auth'
import CustomerCard from './components/CustomerCard.vue'
import CustomerEditor from './components/CustomerEditor.vue'

type SearchType = 'name' | 'phone'

const toast = useToast()

const searchType = ref<SearchType>('name')
const keyword = ref('')

const list = ref<CustomerVO[]>([])
const page = ref(1)
const size = ref(10)
const total = ref(0)
const loading = ref(false)
const refreshing = ref(false)
const finished = ref(false)

const user = ref<UserInfoVO | null>(null)

const showEditor = ref(false)
const editorMode = ref<'create' | 'edit'>('create')
const editingCustomer = ref<CustomerVO | null>(null)

const showDetail = ref(false)
const detailCustomer = ref<CustomerVO | null>(null)
const detailAddressFull = ref('')

const loadDetailAddress = async (c?: CustomerVO | null) => {
  if (c?.addressId) {
    try {
      const a = await getAddress(c.addressId)
      detailAddressFull.value = a?.fullPath || ''
    } catch (e) {
      detailAddressFull.value = ''
    }
  } else {
    detailAddressFull.value = ''
  }
}

const fetchList = async (reset = false) => {
  if (loading.value) return
  loading.value = true
  try {
    if (reset) {
      page.value = 0
      finished.value = false
      list.value = []
    }
    const query: CustomerSearchDTO = {}
    const k = keyword.value.trim()
    if (k) {
      if (searchType.value === 'name') query.name = k
      if (searchType.value === 'phone') query.phone = k
    }
    const res = await searchCustomers(query, { page: page.value, size: size.value })
    const items = res.content || []
    total.value = res.totalElements || 0
    list.value = reset ? items : list.value.concat(items)
    if (!items.length || list.value.length >= total.value) {
      finished.value = true
    } else {
      page.value += 1
    }
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

const onRefresh = async () => {
  refreshing.value = true
  await fetchList(true)
}

const onReachBottom = async () => {
  if (!finished.value && !loading.value) {
    await fetchList(false)
  }
}

const onSearch = async () => {
  await fetchList(true)
}

const onView = async (c: CustomerVO) => {
  detailCustomer.value = c
  await loadDetailAddress(c)
  showDetail.value = true
}

const onEdit = (c: CustomerVO) => {
  editingCustomer.value = c
  editorMode.value = 'edit'
  showEditor.value = true
}

const onCreate = () => {
  editorMode.value = 'create'
  editingCustomer.value = null
  showEditor.value = true
}

const onSaved = async () => {
  toast.success('已更新')
  await fetchList(true)
}

onMounted(async () => {
  try {
    user.value = await getCurrentUser()
  } catch (e) {}
  await fetchList(true)
})
</script>

<template>
  <view class="customer-tab">
    <view class="search">
      <wd-radio-group v-model="searchType" shape="button" inline>
        <wd-radio :value="'name'">姓名</wd-radio>
        <wd-radio :value="'phone'">手机号</wd-radio>
      </wd-radio-group>
      <view class="search-input">
        <wd-input v-model="keyword" clearable placeholder="请输入关键词" />
        <wd-button size="small" type="primary" @click="onSearch">搜索</wd-button>
      </view>
    </view>

    <scroll-view
      class="list"
      scroll-y
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      lower-threshold="80"
      @scrolltolower="onReachBottom"
    >
      <view v-if="!list.length && !loading" class="empty">
        <wd-cell title="暂无数据" />
      </view>
      <view v-else>
        <CustomerCard
          v-for="item in list"
          :key="item.id"
          :customer="item"
          @view="onView"
          @edit="onEdit"
        />
        <view v-if="loading" class="loading">
          <wd-loading />
        </view>
        <view v-if="finished && list.length" class="finished">已无更多</view>
      </view>
    </scroll-view>

    <view class="create">
      <wd-button type="primary" block @click="onCreate">新建客户</wd-button>
    </view>

    <CustomerEditor
      v-model:visible="showEditor"
      :mode="editorMode"
      :customer="editingCustomer || undefined"
      :merchantId="user?.merchantId"
      @saved="onSaved"
    />

    <wd-popup v-model="showDetail" position="bottom" custom-style="height: 70vh">
      <view class="detail">
        <wd-cell-group border>
          <wd-cell :title="detailCustomer?.name || '-'" :label="detailCustomer?.customerNo || ''" />
          <wd-cell title="手机号" :value="detailCustomer?.phone || '-'" />
          <wd-cell title="别名" :value="detailCustomer?.alias || '-'" />
          <wd-cell title="地址" :label="detailAddressFull || '-'" :value="detailCustomer?.addressDetail || ''" />
        </wd-cell-group>
        <view class="detail-actions">
          <wd-button type="primary" block @click="showDetail = false">关闭</wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
  
</template>

<style lang="scss" scoped>
.customer-tab {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}
.search {
  padding: 16rpx;
}
.search-input {
  margin-top: 12rpx;
  display: flex;
  gap: 12rpx;
}
.list {
  height: 100%;
}
.empty {
  margin: 16rpx;
}
.loading, .finished {
  text-align: center;
  padding: 16rpx 0 32rpx;
  color: #999;
}
.create {
  padding: 12rpx 16rpx 24rpx;
  background: #fff;
}
.detail {
  padding: 16rpx 0;
}
.detail-actions {
  padding: 24rpx 16rpx;
}
</style>
