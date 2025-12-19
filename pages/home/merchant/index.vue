<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/modules/user'
import AddressSelector from '@/components/AddressSelector.vue'
import { searchCustomers } from '@/api/modules/customer'
import { queryLedgersByCustomer } from '@/api/modules/ledger'
import { listProducts } from '@/api/modules/product'
import type { CustomerVO } from '@/types/customer'
import type { LedgerListVO } from '@/types/ledger'
import type { ProductVO } from '@/types/product'

const active = ref<number>(0)
const userStore = useUserStore()

// =============== 账单 Tab ===============
const billSearch = ref<string>('')
const billLoading = ref(false)
const billList = ref<LedgerListVO[]>([])

const searchBillsByCustomer = async () => {
  try {
    billLoading.value = true
    if (!billSearch.value) {
      billList.value = []
      return
    }
    // 先根据名称查客户，取首个匹配作为 customerId
    const res = await searchCustomers({ name: billSearch.value }, { page: 1, size: 1 })
    const customer = res.content?.[0]
    if (!customer) {
      billList.value = []
      return
    }
    const ledgers = await queryLedgersByCustomer({ customerId: customer.id }, { page: 1, size: 20 })
    billList.value = ledgers.content || []
  } catch (e) {
    billList.value = []
  } finally {
    billLoading.value = false
  }
}

// =============== 客户 Tab ===============
const customerLoading = ref(false)
const customerName = ref('')
const selectedAddressIds = ref<number[]>([])
const customerList = ref<CustomerVO[]>([])
const selectedAddressId = computed(() => selectedAddressIds.value.length ? selectedAddressIds.value[selectedAddressIds.value.length - 1] : undefined)

const fetchCustomers = async () => {
  try {
    customerLoading.value = true
    const name = (customerName.value || '').trim()
    const addr = selectedAddressId.value
    if (!name && !addr) {
      customerList.value = []
      return
    }
    const res = await searchCustomers({
      name: name || undefined,
      addressId: addr
    }, { page: 1, size: 20 })
    customerList.value = res.content || []
  } finally {
    customerLoading.value = false
  }
}

const gotoCustomerDetail = (id: number) => {
  uni.navigateTo({ url: `/pages/home/merchant/customer-detail?customerId=${id}` })
}

const onAddressChange = (ids: number[]) => {
  selectedAddressIds.value = ids
  fetchCustomers()
}

// =============== 商品 Tab ===============
const productLoading = ref(false)
const productList = ref<ProductVO[]>([])

const fetchProducts = async () => {
  try {
    productLoading.value = true
    const res = await listProducts({}, { page: 1, size: 20 })
    productList.value = res.content || []
  } finally {
    productLoading.value = false
  }
}

onMounted(() => {
  // 默认加载一次各列表，避免空白
  searchBillsByCustomer()
  fetchCustomers()
  fetchProducts()
})

// =============== 我的 Tab ===============
const merchantName = computed(() => userStore.userName)
const merchantPhone = computed(() => userStore.userPhone)
const handleLogout = () => {
  userStore.logout()
}
</script>

<template>
  <view class="page">
    <view class="content">
      <!-- 账单 -->
      <view v-show="active === 0" class="pane">
        <wd-search v-model="billSearch" placeholder="输入客户名称搜索账单" @search="searchBillsByCustomer" />
        <view class="list">
          <wd-loading v-if="billLoading" />
          <wd-status-tip v-else-if="!billList.length" tip="暂无账单" image="content" />
          <view v-else>
            <wd-cell-group v-for="item in billList" :key="item.id" border>
              <wd-cell :title="item.customerName" :label="`总额：${item.totalAmount} ｜ 已付：${item.paidAmount} ｜ 待付：${item.pendingAmount}`" :value="item.createTime" />
            </wd-cell-group>
          </view>
        </view>
      </view>

      <!-- 客户 -->
      <view v-show="active === 1" class="pane">
        <wd-search v-model="customerName" placeholder="客户姓名" @search="fetchCustomers" />
        <AddressSelector v-model="selectedAddressIds" @change="onAddressChange" />
        <view class="list">
          <wd-loading v-if="customerLoading" />
          <wd-status-tip v-else-if="!customerList.length" tip="暂无客户" image="content" />
          <view v-else>
            <view v-for="c in customerList" :key="c.id" class="card" @click="gotoCustomerDetail(c.id)">
              <wd-cell-group border>
                <wd-cell :title="c.name" :label="`性别：${c.gender ?? '-'} ｜ 电话：${c.phone}`" :value="c.addressDetail || '-'" is-link />
              </wd-cell-group>
            </view>
          </view>
        </view>
      </view>

      <!-- 商品 -->
      <view v-show="active === 2" class="pane">
        <view class="list">
          <wd-loading v-if="productLoading" />
          <wd-status-tip v-else-if="!productList.length" tip="暂无商品" image="content" />
          <view v-else>
            <view v-for="p in productList" :key="p.id" class="card">
              <wd-cell-group border>
                <wd-cell :title="p.name" :label="`分类：${p.categoryName} ｜ 单位：${p.unit}`" :value="String(p.price)" />
              </wd-cell-group>
            </view>
          </view>
        </view>
      </view>

      <!-- 我的 -->
      <view v-show="active === 3" class="pane">
        <wd-cell-group border>
          <wd-cell title="商家名称" :value="merchantName" />
          <wd-cell title="电话" :value="merchantPhone" />
        </wd-cell-group>
        <view class="ops">
          <wd-button type="error" block @click="handleLogout">退出登录</wd-button>
        </view>
      </view>
    </view>

    <wd-tabbar v-model="active" fixed>
      <wd-tabbar-item title="账单" />
      <wd-tabbar-item title="客户" />
      <wd-tabbar-item title="商品" />
      <wd-tabbar-item title="我的" />
    </wd-tabbar>
  </view>
</template>

<style lang="scss" scoped>
.page { padding-bottom: 120rpx; }
.content { min-height: calc(100vh - 120rpx); }
.pane { padding: 24rpx; }
.list { margin-top: 16rpx; }
.card { margin-bottom: 16rpx; }
.ops { margin-top: 24rpx; }
</style>
