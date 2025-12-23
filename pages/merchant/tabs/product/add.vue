<script setup lang="ts">
/**
 * 添加/编辑商品页面
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, onMounted } from 'vue'
import { getCategoryTree } from '@/api/modules/category'
import { createProduct, updateProduct, getProduct } from '@/api/modules/product'
import type { CategoryTreeVO, ProductVO } from '@/types/product'

// ==================== 页面参数 ====================

const productId = ref<number | null>(null)
const isEdit = ref(false)

// ==================== 数据状态 ====================

const loading = ref(false)
const submitting = ref(false)

// 分类选择
const categories = ref<CategoryTreeVO[]>([])
const showCategoryPicker = ref(false)

// 表单数据
const form = ref({
  name: '',
  categoryId: null as number | null,
  categoryName: '',
  unit: '件',
  description: '',
  imageUrl: ''
})

// 商品属性（用于生成SKU）
interface AttrItem {
  name: string
  values: string[]
}
const attrs = ref<AttrItem[]>([])
const newAttrName = ref('')
const newAttrValue = ref('')
const editingAttrIndex = ref(-1)

// ==================== 方法 ====================

/**
 * 加载分类
 */
const loadCategories = async () => {
  try {
    const res = await getCategoryTree()
    categories.value = res || []
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

/**
 * 加载商品详情（编辑模式）
 */
const loadProduct = async () => {
  if (!productId.value) return
  try {
    loading.value = true
    const res = await getProduct(productId.value)
    form.value = {
      name: res.name || '',
      categoryId: res.categoryId,
      categoryName: res.categoryName || '',
      unit: res.unit || '件',
      description: res.description || '',
      imageUrl: res.imageUrl || ''
    }
    // TODO: 加载属性
  } catch (error) {
    console.error('加载商品详情失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 选择分类
 */
const selectCategory = (cat: CategoryTreeVO) => {
  form.value.categoryId = cat.id
  form.value.categoryName = cat.name
  showCategoryPicker.value = false
}

/**
 * 添加属性
 */
const addAttr = () => {
  if (!newAttrName.value.trim()) {
    uni.showToast({ title: '请输入属性名', icon: 'none' })
    return
  }
  attrs.value.push({
    name: newAttrName.value.trim(),
    values: []
  })
  newAttrName.value = ''
  editingAttrIndex.value = attrs.value.length - 1
}

/**
 * 添加属性值
 */
const addAttrValue = (index: number) => {
  if (!newAttrValue.value.trim()) return
  attrs.value[index].values.push(newAttrValue.value.trim())
  newAttrValue.value = ''
}

/**
 * 删除属性值
 */
const removeAttrValue = (attrIndex: number, valueIndex: number) => {
  attrs.value[attrIndex].values.splice(valueIndex, 1)
}

/**
 * 删除属性
 */
const removeAttr = (index: number) => {
  attrs.value.splice(index, 1)
}

/**
 * 选择图片
 */
const chooseImage = () => {
  uni.chooseImage({
    count: 1,
    success: (res) => {
      form.value.imageUrl = res.tempFilePaths[0]
      // TODO: 上传图片到服务器
    }
  })
}

/**
 * 提交
 */
const submit = async () => {
  if (!form.value.name.trim()) {
    uni.showToast({ title: '请输入商品名称', icon: 'none' })
    return
  }
  if (!form.value.categoryId) {
    uni.showToast({ title: '请选择分类', icon: 'none' })
    return
  }

  try {
    submitting.value = true
    const data = {
      name: form.value.name,
      categoryId: form.value.categoryId,
      unit: form.value.unit,
      description: form.value.description,
      imageUrl: form.value.imageUrl,
      attrs: attrs.value.filter(a => a.values.length > 0)
    }

    if (isEdit.value && productId.value) {
      await updateProduct(productId.value, data)
      uni.showToast({ title: '修改成功', icon: 'success' })
    } else {
      await createProduct(data)
      uni.showToast({ title: '添加成功', icon: 'success' })
    }
    setTimeout(() => uni.navigateBack(), 1500)
  } catch (error) {
    console.error('保存商品失败:', error)
  } finally {
    submitting.value = false
  }
}

// ==================== 生命周期 ====================

onMounted(() => {
  loadCategories()
  
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const query = currentPage.options || {}
  
  if (query.id) {
    productId.value = Number(query.id)
    isEdit.value = true
    loadProduct()
  }
})
</script>

<template>
  <view class="product-add-page">
    <scroll-view class="content-scroll" scroll-y>
      <!-- 基本信息 -->
      <view class="form-section">
        <view class="section-title">基本信息</view>
        
        <view class="form-item">
          <text class="form-label required">商品名称</text>
          <input
            class="form-input"
            v-model="form.name"
            placeholder="请输入商品名称"
            :maxlength="50"
          />
        </view>

        <view class="form-item" @tap="showCategoryPicker = true">
          <text class="form-label required">商品分类</text>
          <view class="form-value">
            <text :class="{ placeholder: !form.categoryName }">
              {{ form.categoryName || '请选择分类' }}
            </text>
            <wd-icon name="arrow-right" size="32rpx" color="#ccc" />
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">单位</text>
          <input
            class="form-input"
            v-model="form.unit"
            placeholder="件"
          />
        </view>

        <view class="form-item">
          <text class="form-label">描述</text>
          <textarea
            class="form-textarea"
            v-model="form.description"
            placeholder="商品描述（选填）"
            :maxlength="200"
          />
        </view>
      </view>

      <!-- 商品图片 -->
      <view class="form-section">
        <view class="section-title">商品图片</view>
        <view class="image-upload" @tap="chooseImage">
          <image v-if="form.imageUrl" :src="form.imageUrl" mode="aspectFill" class="preview-img" />
          <view v-else class="upload-placeholder">
            <wd-icon name="add" size="56rpx" color="#999" />
            <text>添加图片</text>
          </view>
        </view>
      </view>

      <!-- 商品属性 -->
      <view class="form-section">
        <view class="section-header">
          <text class="section-title">商品属性</text>
          <text class="section-tip">添加属性后可自动生成SKU</text>
        </view>

        <!-- 已添加属性 -->
        <view v-for="(attr, index) in attrs" :key="index" class="attr-item">
          <view class="attr-header">
            <text class="attr-name">{{ attr.name }}</text>
            <wd-icon name="close" size="32rpx" color="#999" @click="removeAttr(index)" />
          </view>
          <view class="attr-values">
            <view
              v-for="(val, vIndex) in attr.values"
              :key="vIndex"
              class="value-tag"
            >
              {{ val }}
              <wd-icon name="close" size="24rpx" @click="removeAttrValue(index, vIndex)" />
            </view>
            <view class="add-value" v-if="editingAttrIndex === index">
              <input
                class="value-input"
                v-model="newAttrValue"
                placeholder="输入值"
                @confirm="addAttrValue(index)"
              />
              <text class="confirm-btn" @tap="addAttrValue(index)">添加</text>
            </view>
            <view v-else class="add-value-btn" @tap="editingAttrIndex = index">
              <wd-icon name="add" size="24rpx" /> 添加值
            </view>
          </view>
        </view>

        <!-- 添加新属性 -->
        <view class="add-attr">
          <input
            class="attr-input"
            v-model="newAttrName"
            placeholder="属性名称（如：颜色、规格）"
          />
          <button class="add-attr-btn" @tap="addAttr">添加属性</button>
        </view>
      </view>

      <view style="height: 180rpx;"></view>
    </scroll-view>

    <!-- 底部按钮 -->
    <view class="bottom-bar">
      <button class="save-btn" :loading="submitting" @tap="submit">
        {{ isEdit ? '保存修改' : '添加商品' }}
      </button>
    </view>

    <!-- 分类选择弹窗 -->
    <wd-popup v-model="showCategoryPicker" position="bottom" custom-style="height: 60%;">
      <view class="category-picker">
        <view class="picker-header">
          <text class="picker-title">选择分类</text>
          <wd-icon name="close" size="40rpx" @click="showCategoryPicker = false" />
        </view>
        <scroll-view class="picker-content" scroll-y>
          <view
            v-for="cat in categories"
            :key="cat.id"
            class="category-option"
            @tap="selectCategory(cat)"
          >
            <text>{{ cat.name }}</text>
            <wd-icon v-if="form.categoryId === cat.id" name="check" size="32rpx" color="#3B82F6" />
          </view>
        </scroll-view>
      </view>
    </wd-popup>
  </view>
</template>

<style lang="scss" scoped>
.product-add-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.content-scroll {
  flex: 1;
}

.form-section {
  background: #fff;
  margin: 24rpx;
  border-radius: 24rpx;
  padding: 32rpx;
}

.section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 24rpx;
}

.section-tip {
  font-size: 24rpx;
  color: #999;
}

.form-item {
  margin-bottom: 28rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 16rpx;

  &.required::before {
    content: '*';
    color: #EF4444;
    margin-right: 4rpx;
  }
}

.form-input {
  width: 100%;
  height: 88rpx;
  background: #f5f5f5;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.form-textarea {
  width: 100%;
  height: 160rpx;
  background: #f5f5f5;
  border-radius: 16rpx;
  padding: 24rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.form-value {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  background: #f5f5f5;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #333;

  .placeholder {
    color: #999;
  }
}

.image-upload {
  width: 200rpx;
  height: 200rpx;
  border-radius: 16rpx;
  overflow: hidden;
}

.preview-img {
  width: 100%;
  height: 100%;
}

.upload-placeholder {
  width: 100%;
  height: 100%;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  color: #999;
  font-size: 24rpx;
}

.attr-item {
  background: #f9fafb;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.attr-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.attr-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
}

.attr-values {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.value-tag {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 20rpx;
  background: #fff;
  border-radius: 8rpx;
  font-size: 26rpx;
  color: #333;
  border: 2rpx solid #e5e5e5;
}

.add-value {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.value-input {
  width: 160rpx;
  height: 64rpx;
  background: #fff;
  border-radius: 8rpx;
  padding: 0 16rpx;
  font-size: 26rpx;
  border: 2rpx solid #3B82F6;
}

.confirm-btn {
  color: #3B82F6;
  font-size: 26rpx;
}

.add-value-btn {
  display: flex;
  align-items: center;
  gap: 4rpx;
  padding: 12rpx 20rpx;
  border: 2rpx dashed #ccc;
  border-radius: 8rpx;
  font-size: 26rpx;
  color: #999;
}

.add-attr {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
}

.attr-input {
  flex: 1;
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
}

.add-attr-btn {
  width: 180rpx;
  height: 80rpx;
  background: #3B82F6;
  color: #fff;
  border-radius: 12rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;

  &::after {
    border: none;
  }
}

.bottom-bar {
  padding: 24rpx 32rpx;
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.save-btn {
  width: 100%;
  height: 96rpx;
  background: #3B82F6;
  color: #fff;
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;

  &::after {
    border: none;
  }
}

.category-picker {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

.picker-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #333;
}

.picker-content {
  flex: 1;
}

.category-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 2rpx solid #f5f5f5;
  font-size: 30rpx;
  color: #333;
}
</style>
