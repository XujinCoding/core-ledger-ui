<script setup lang="ts">
/**
 * 添加/编辑商品页面
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, onMounted, computed } from 'vue'
import { getCategoryTree } from '@/api/modules/category'
import { createProduct, updateProduct, getProduct } from '@/api/modules/product'
import { batchUpdateAttrs, getProductAttrs } from '@/api/modules/productAttr'
import { uploadImage } from '@/api/modules/file'
import type { CategoryTreeVO, ProductVO, ProductAttrVO } from '@/types/product'

// ==================== 页面参数 ====================

const productId = ref<number | null>(null)
const isEdit = ref(false)

// ==================== 数据状态 ====================

const loading = ref(false)
const submitting = ref(false)

// 分类选择
const categories = ref<CategoryTreeVO[]>([])
const showCategoryPicker = ref(false)
const expandedCategories = ref<number[]>([])

// 扁平化分类项接口
interface FlattenedCategory {
  id: number
  name: string
  level: number
  parentId: number | null
  hasChildren: boolean
}

// 扁平化分类数据（用于递归显示）
const flattenedCategories = computed(() => {
  const result: FlattenedCategory[] = []
  const flatten = (items: CategoryTreeVO[], level: number, parentId: number | null) => {
    for (const item of items) {
      result.push({
        id: item.id,
        name: item.name,
        level,
        parentId,
        hasChildren: !!(item.children && item.children.length > 0)
      })
      if (item.children && item.children.length > 0) {
        flatten(item.children, level + 1, item.id)
      }
    }
  }
  flatten(categories.value, 0, null)
  return result
})

// 判断分类是否可见（父级都展开时才可见）
const isCategoryVisible = (cat: FlattenedCategory): boolean => {
  if (cat.level === 0) return true
  // 找到所有祖先节点，检查是否都已展开
  let currentParentId = cat.parentId
  while (currentParentId !== null) {
    if (!expandedCategories.value.includes(currentParentId)) {
      return false
    }
    const parent = flattenedCategories.value.find(c => c.id === currentParentId)
    currentParentId = parent?.parentId ?? null
  }
  return true
}

// 展开/收起分类
const toggleExpand = (id: number) => {
  const index = expandedCategories.value.indexOf(id)
  if (index > -1) {
    expandedCategories.value.splice(index, 1)
  } else {
    expandedCategories.value.push(id)
  }
}

// 表单数据
const form = ref({
  name: '',
  categoryId: null as number | null,
  categoryName: '',
  price: null as number | null,
  unit: '',
  description: '',
  imageUrl: '',
  imagePreviewUrl: ''  // 用于显示的预览URL
})

// 原始图片URL（用于判断是否修改了图片）
const originalImageUrl = ref('')

// 商品属性（用于生成SKU）
interface AttrValueItem {
  id?: number
  name: string
}
interface AttrItem {
  id?: number
  name: string
  values: AttrValueItem[]
}
const attrs = ref<AttrItem[]>([])

// 属性编辑弹窗状态
const showAttrDialog = ref(false)
const editingAttrIndex = ref(-1)  // -1 表示新增，>=0 表示编辑
const dialogAttrName = ref('')
const dialogAttrValues = ref<AttrValueItem[]>([])
const dialogValueInput = ref('')

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
    // 保存原始图片URL（预签名URL）
    originalImageUrl.value = res.imageUrl || ''
    form.value = {
      name: res.name || '',
      categoryId: res.categoryId,
      categoryName: res.categoryName || '',
      price: res.price || 0,
      unit: res.unit || '件',
      description: res.description || '',
      imageUrl: '',  // 编辑时不设置imageUrl，只有新上传时才设置
      imagePreviewUrl: res.imageUrl || ''  // 用于显示的预签名URL
    }
    // 加载商品属性
    await loadProductAttrs()
  } catch (error) {
    console.error('加载商品详情失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 加载商品属性
 * 后端返回字段：attrName, value；前端使用字段：name
 */
const loadProductAttrs = async () => {
  if (!productId.value) return
  try {
    const res = await getProductAttrs(productId.value)
    if (res && res.length > 0) {
      attrs.value = res.map((attr: any) => ({
        id: attr.id,
        name: attr.attrName || attr.name,  // 兼容后端字段 attrName
        values: attr.values.map((v: any) => ({
          id: v.id,
          name: v.value || v.name  // 兼容后端字段 value
        }))
      }))
    }
  } catch (error) {
    console.error('加载商品属性失败:', error)
  }
}

/**
 * 选择分类
 */
const selectCategory = (cat: FlattenedCategory | CategoryTreeVO) => {
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
  
  // 检查是否已存在同名属性
  if (attrs.value.some(attr => attr.name === newAttrName.value.trim())) {
    uni.showToast({ title: '该属性已存在', icon: 'none' })
    return
  }
  
  const newIndex = attrs.value.length
  attrs.value.push({
    name: newAttrName.value.trim(),
    values: []
  })
  
  // 初始化该属性的输入框值
  attrValueInputs.value[newIndex] = ''
  newAttrName.value = ''
}

/**
 * 添加属性值
 */
const addAttrValue = (index: number) => {
  const inputValue = attrValueInputs.value[index]
  if (!inputValue || !inputValue.trim()) {
    uni.showToast({ title: '请输入属性值', icon: 'none' })
    return
  }
  
  // 检查是否已存在同名属性值
  if (attrs.value[index].values.some(v => v.name === inputValue.trim())) {
    uni.showToast({ title: '该属性值已存在', icon: 'none' })
    return
  }
  
  attrs.value[index].values.push({ name: inputValue.trim() })
  attrValueInputs.value[index] = ''
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
  uni.showModal({
    title: '确认删除',
    content: `确定要删除属性"${attrs.value[index].name}"吗？`,
    success: (res) => {
      if (res.confirm) {
        attrs.value.splice(index, 1)
        delete attrValueInputs.value[index]
        // 重新索引
        const newInputs: Record<number, string> = {}
        attrs.value.forEach((_, i) => {
          newInputs[i] = attrValueInputs.value[i] || ''
        })
        attrValueInputs.value = newInputs
      }
    }
  })
}

/**
 * 打开属性编辑弹窗
 */
const openAttrDialog = (index?: number) => {
  if (index !== undefined && index >= 0) {
    // 编辑模式
    editingAttrIndex.value = index
    dialogAttrName.value = attrs.value[index].name
    dialogAttrValues.value = [...attrs.value[index].values]
  } else {
    // 新增模式
    editingAttrIndex.value = -1
    dialogAttrName.value = ''
    dialogAttrValues.value = []
  }
  dialogValueInput.value = ''
  showAttrDialog.value = true
}

/**
 * 关闭属性编辑弹窗
 */
const closeAttrDialog = () => {
  showAttrDialog.value = false
}

/**
 * 添加弹窗中的属性值
 */
const addDialogValue = () => {
  if (!dialogValueInput.value.trim()) {
    uni.showToast({ title: '请输入属性值', icon: 'none' })
    return
  }
  
  // 检查是否已存在
  if (dialogAttrValues.value.some(v => v.name === dialogValueInput.value.trim())) {
    uni.showToast({ title: '该属性值已存在', icon: 'none' })
    return
  }
  
  dialogAttrValues.value.push({ name: dialogValueInput.value.trim() })
  dialogValueInput.value = ''
}

/**
 * 删除弹窗中的属性值
 */
const removeDialogValue = (index: number) => {
  dialogAttrValues.value.splice(index, 1)
}

/**
 * 保存属性
 */
const saveAttr = () => {
  if (!dialogAttrName.value.trim()) {
    uni.showToast({ title: '请输入属性名称', icon: 'none' })
    return
  }
  
  if (dialogAttrValues.value.length === 0) {
    uni.showToast({ title: '请至少添加一个属性值', icon: 'none' })
    return
  }
  
  if (editingAttrIndex.value === -1) {
    // 新增
    // 检查是否已存在同名属性
    if (attrs.value.some(attr => attr.name === dialogAttrName.value.trim())) {
      uni.showToast({ title: '该属性已存在', icon: 'none' })
      return
    }
    
    attrs.value.push({
      name: dialogAttrName.value.trim(),
      values: [...dialogAttrValues.value]
    })
  } else {
    // 编辑
    attrs.value[editingAttrIndex.value].values = [...dialogAttrValues.value]
  }
  
  closeAttrDialog()
}

/**
 * 删除属性（从弹窗中）
 */
const deleteAttr = () => {
  if (editingAttrIndex.value === -1) return
  
  uni.showModal({
    title: '确认删除',
    content: `确定要删除属性"${attrs.value[editingAttrIndex.value].name}"吗？`,
    success: (res) => {
      if (res.confirm) {
        attrs.value.splice(editingAttrIndex.value, 1)
        closeAttrDialog()
      }
    }
  })
}

/**
 * 选择图片
 */
const chooseImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const filePath = res.tempFilePaths[0]
      try {
        uni.showLoading({ title: '上传中...' })
        const result = await uploadImage(filePath)
        // 保存path用于提交，url用于显示
        form.value.imageUrl = result.path
        form.value.imagePreviewUrl = result.url
        uni.hideLoading()
      } catch (error) {
        uni.hideLoading()
        console.error('上传图片失败:', error)
        uni.showToast({ title: '上传失败', icon: 'none' })
      }
    },
    fail: (err) => {
      if (!err.errMsg?.includes('cancel')) {
        uni.showToast({ title: '选择图片失败', icon: 'none' })
      }
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
  if (!form.value.unit.trim()) {
    uni.showToast({ title: '请输入单位', icon: 'none' })
    return
  }
  if (form.value.price !== null && (form.value.price < 0 || form.value.price > 999999)) {
    uni.showToast({ title: '标准价格需在0-999999之间', icon: 'none' })
    return
  }

  try {
    submitting.value = true
    const data: any = {
      name: form.value.name,
      categoryId: form.value.categoryId,
      price: form.value.price || 0,
      unit: form.value.unit,
      description: form.value.description
    }

    // 只有当图片URL存在且不是预签名URL时才提交
    if (form.value.imageUrl && !form.value.imageUrl.startsWith('http')) {
      data.imageUrl = form.value.imageUrl
    }

    let savedProductId: number
    if (isEdit.value && productId.value) {
      await updateProduct(productId.value, data)
      savedProductId = productId.value
    } else {
      const res = await createProduct(data)
      savedProductId = res.id
    }

    // 保存商品属性（字段名需与后端DTO匹配：attrName, value）
    // 新增和编辑时都需要调用属性保存接口
    const validAttrs = attrs.value.filter(a => a.values.length > 0)
    if (validAttrs.length > 0) {
      await batchUpdateAttrs(savedProductId, {
        attrs: validAttrs.map((attr, index) => ({
          id: attr.id,
          attrName: attr.name,
          values: attr.values.map((v, vIndex) => ({
            id: v.id,
            value: v.name,
            sortOrder: vIndex
          })),
          sortOrder: index
        }))
      })
    }

    uni.showToast({ title: isEdit.value ? '修改成功' : '添加成功', icon: 'success' })
    setTimeout(() => {
      // 触发商品变更事件，通知相关页面刷新
      uni.$emit('product-changed')
      uni.navigateBack()
    }, 1500)
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
    // 设置导航栏标题为"编辑商品"
    uni.setNavigationBarTitle({ title: '编辑商品' })
    loadProduct()
  }
})
</script>

<template>
  <view class="product-add-page">
    <scroll-view class="content-scroll" scroll-y>
      <view class="page-content">
        <!-- 基本信息 -->
        <view class="form-section">
          <view class="section-title">基本信息</view>
          
          <wd-cell-group border custom-class="product-form-group">
            <wd-input
              v-model="form.name"
              label="商品名称"
              label-width="160rpx"
              placeholder="请输入商品名称"
              clearable
              required
              :maxlength="50"
              align="right"
            />
            
            <wd-cell
              title="商品分类"
              title-width="160rpx"
              :value="form.categoryName || '请选择分类'"
              :value-class="form.categoryName ? '' : 'placeholder-text'"
              is-link
              required
              @click="showCategoryPicker = true"
            />
            
            <wd-input
              v-model="form.unit"
              label="单位"
              label-width="160rpx"
              placeholder="请输入单位（如：件、个、箱）"
              clearable
              required
              align="right"
            />
            
            <wd-cell 
              title="标准价格" 
              title-width="160rpx"
              required
            >
              <view class="price-input-wrapper">
                <text class="price-symbol">¥</text>
                <input
                  class="price-input"
                  type="digit"
                  v-model="form.price"
                  placeholder="0.00"
                  :maxlength="8"
                />
              </view>
            </wd-cell>
            
            <wd-cell 
              title="描述"
              title-width="160rpx"
            >
              <wd-textarea
                v-model="form.description"
                placeholder="商品描述（选填）"
                :maxlength="200"
                :auto-height="true"
                custom-class="form-textarea-custom"
              />
            </wd-cell>
          </wd-cell-group>
        </view>

        <!-- 商品图片 -->
        <view class="form-section">
          <view class="section-title">商品图片</view>
          <view class="image-upload-wrapper">
            <view class="image-upload" @tap="chooseImage">
              <image v-if="form.imagePreviewUrl" :src="form.imagePreviewUrl" mode="aspectFill" class="preview-img" />
              <view v-else class="upload-placeholder">
                <wd-icon name="add" size="56rpx" color="#999" />
                <text>添加图片</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 商品属性 -->
        <view class="form-section">
          <view class="section-header-with-action">
            <view class="section-title">商品属性（选填）</view>
            <wd-button 
              type="primary"
              size="small"
              @click="openAttrDialog()"
            >
              <wd-icon name="add" size="28rpx" />
              添加
            </wd-button>
          </view>

          <!-- 属性列表 - 限制高度可滚动 -->
          <scroll-view 
            v-if="attrs.length > 0" 
            class="attrs-scroll-list" 
            scroll-y
          >
            <view 
              v-for="(attr, index) in attrs" 
              :key="index" 
              class="attr-list-item"
              @tap="openAttrDialog(index)"
            >
              <view class="attr-item-content">
                <view class="attr-item-left">
                  <text class="attr-item-name">{{ attr.name }}</text>
                  <text class="attr-item-values">
                    {{ attr.values.length > 0 ? attr.values.map(v => v.name).join('、') : '暂无属性值' }}
                  </text>
                </view>
                <view class="attr-item-actions">
                  <wd-icon name="edit" size="36rpx" color="#3B82F6" />
                </view>
              </view>
            </view>
          </scroll-view>

          <!-- 空状态 -->
          <view v-else class="attrs-empty">
            <wd-icon name="inbox" size="80rpx" color="#ddd" />
            <text>暂无属性，点击右上角添加</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部按钮 -->
    <view class="bottom-bar">
      <wd-button 
        type="primary"
        :loading="submitting" 
        @click="submit"
        block
        size="large"
      >
        {{ isEdit ? '保存修改' : '添加商品' }}
      </wd-button>
    </view>

    <!-- 分类选择弹窗 -->
    <wd-popup v-model="showCategoryPicker" position="bottom" custom-style="height: 60%; border-radius: 24rpx 24rpx 0 0;">
      <view class="category-picker">
        <view class="picker-header">
          <text class="picker-title">选择分类</text>
          <wd-icon name="close" size="40rpx" @click="showCategoryPicker = false" />
        </view>
        <scroll-view class="picker-content" scroll-y>
          <!-- 树形分类列表（递归渲染） -->
          <template v-for="cat in flattenedCategories" :key="cat.id">
            <view
              v-if="isCategoryVisible(cat)"
              class="category-option"
              :class="{ selected: form.categoryId === cat.id }"
              :style="{ paddingLeft: (32 + cat.level * 48) + 'rpx' }"
            >
              <view class="option-left">
                <view
                  v-if="cat.hasChildren"
                  class="expand-btn"
                  @tap.stop="toggleExpand(cat.id)"
                >
                  <wd-icon
                    :name="expandedCategories.includes(cat.id) ? 'arrow-down' : 'arrow-right'"
                    size="28rpx"
                    color="#999"
                  />
                </view>
                <view v-else class="icon-placeholder"></view>
                <text @tap="selectCategory(cat)">{{ cat.name }}</text>
              </view>
              <wd-icon v-if="form.categoryId === cat.id" name="check" size="32rpx" color="#3B82F6" />
            </view>
          </template>
        </scroll-view>
      </view>
    </wd-popup>

    <!-- 属性编辑弹窗 -->
    <wd-popup 
      v-model="showAttrDialog" 
      position="bottom" 
      :safe-area-inset-bottom="true"
      custom-style="height: 70%; border-radius: 24rpx 24rpx 0 0;"
    >
      <view class="attr-dialog">
        <view class="dialog-header">
          <text class="dialog-title">{{ editingAttrIndex === -1 ? '添加属性' : '编辑属性' }}</text>
          <view class="dialog-actions">
            <text class="dialog-action cancel" @tap="closeAttrDialog">取消</text>
            <text class="dialog-action confirm" @tap="saveAttr">保存</text>
          </view>
        </view>

        <view class="dialog-content">
          <!-- 属性名称 -->
          <view class="dialog-field">
            <text class="field-label">属性名称</text>
            <input
              class="field-input"
              v-model="dialogAttrName"
              placeholder="如：颜色、尺寸、规格"
              :disabled="editingAttrIndex !== -1"
            />
          </view>

          <!-- 属性值列表 -->
          <view class="dialog-field">
            <text class="field-label">属性值</text>
            
            <!-- 已添加的属性值 -->
            <view v-if="dialogAttrValues.length > 0" class="dialog-values-list">
              <view
                v-for="(val, vIndex) in dialogAttrValues"
                :key="vIndex"
                class="dialog-value-chip"
              >
                <text>{{ val.name }}</text>
                <wd-icon 
                  name="close" 
                  size="28rpx" 
                  color="#666" 
                  @click="removeDialogValue(vIndex)" 
                />
              </view>
            </view>

            <!-- 添加属性值 -->
            <view class="dialog-add-value">
              <input
                class="dialog-value-input"
                v-model="dialogValueInput"
                placeholder="输入属性值后按回车"
                @confirm="addDialogValue"
              />
              <wd-button
                type="success"
                size="small"
                @click="addDialogValue"
              >
                添加
              </wd-button>
            </view>
          </view>

          <!-- 删除按钮（仅编辑模式） -->
          <view v-if="editingAttrIndex !== -1" class="dialog-delete-section">
            <wd-button
              type="error"
              plain
              block
              @click="deleteAttr"
            >
              <wd-icon name="delete" size="32rpx" />
              删除此属性
            </wd-button>
          </view>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<style lang="scss" scoped>
.product-add-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: $color-bg;
}

.content-scroll {
  flex: 1;
}

.page-content {
  padding: $spacing-sm $spacing-md 120rpx;
}

.form-section {
  background: $color-white;
  margin-bottom: $spacing-md;
  border-radius: $border-radius-xl;
  overflow: hidden;
}

.section-title {
  font-size: $font-size-title;
  font-weight: 600;
  color: $color-text-primary;
  padding: $spacing-lg $spacing-lg $spacing-md;
}

// 当 section-title 在 section-header-with-action 内部时，不需要 padding
.section-header-with-action .section-title {
  padding: 0;
}

.section-tip {
  font-size: $font-size-secondary;
  color: $color-text-secondary;
  margin-left: 8rpx;
}

// 价格输入样式
.price-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.price-symbol {
  font-size: $font-size-title;
  font-weight: 500;
  color: $color-text-primary;
}

.price-input {
  flex: 1;
  font-size: $font-size-title;
  font-weight: 500;
  color: $color-text-primary;
  text-align: right;
}

// 占位符文本样式
:deep(.placeholder-text) {
  color: $color-text-placeholder !important;
}

// Textarea 自定义样式
:deep(.form-textarea-custom) {
  width: 100%;
  
  .wd-textarea__inner {
    min-height: 120rpx;
    font-size: $font-size-content;
  }
}

// 图片上传区域
.image-upload-wrapper {
  padding: 0 $spacing-lg $spacing-lg;
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
  background: $color-bg;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  color: $color-text-secondary;
  font-size: $font-size-secondary;
}

// 属性部分样式
.section-header-with-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-lg $spacing-lg $spacing-md;
}

.attrs-scroll-list {
  max-height: 400rpx;
  padding: 0 0 $spacing-md 0;
}

.attr-list-item {
  background: $color-bg;
  border-radius: 16rpx;
  margin: 0 $spacing-lg 16rpx;
  overflow: hidden;
  transition: all $transition-fast;
  
  &:active {
    background: #f0f0f0;
  }
}

.attr-item-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
}

.attr-item-left {
  flex: 1;
  min-width: 0;
}

.attr-item-name {
  display: block;
  font-size: $font-size-content;
  font-weight: 500;
  color: $color-text-primary;
  margin-bottom: 8rpx;
}

.attr-item-values {
  display: block;
  font-size: $font-size-secondary;
  color: $color-text-secondary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attr-item-actions {
  margin-left: 16rpx;
  flex-shrink: 0;
}

.attrs-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx $spacing-lg;
  color: $color-text-secondary;
  font-size: $font-size-content;
  
  text {
    margin-top: 16rpx;
  }
}

// 属性编辑弹窗
.attr-dialog {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: $color-white;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-lg;
  border-bottom: 2rpx solid #f0f0f0;
  flex-shrink: 0;
}

.dialog-title {
  font-size: $font-size-title;
  font-weight: 600;
  color: $color-text-primary;
}

.dialog-actions {
  display: flex;
  gap: $spacing-lg;
}

.dialog-action {
  font-size: $font-size-content;
  
  &.cancel {
    color: $color-text-regular;
  }
  
  &.confirm {
    color: $color-primary;
    font-weight: 500;
  }
}

.dialog-content {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-lg;
}

.dialog-field {
  margin-bottom: $spacing-lg;
}

.field-label {
  display: block;
  font-size: $font-size-content;
  color: $color-text-primary;
  font-weight: 500;
  margin-bottom: 16rpx;
}

.field-input {
  width: 100%;
  height: 88rpx;
  background: $color-bg;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: $font-size-content;
  border: 2rpx solid #e5e5e5;
  
  &:focus {
    border-color: $color-primary;
  }
  
  &:disabled {
    color: $color-text-secondary;
    background: #f5f5f5;
  }
}

.dialog-values-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 16rpx;
  min-height: 80rpx;
}

.dialog-value-chip {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 20rpx;
  background: $color-primary-light;
  border-radius: 24rpx;
  font-size: $font-size-small;
  color: $color-primary;
  border: 2rpx solid $color-primary;
}

.dialog-add-value {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.dialog-value-input {
  flex: 1;
  height: 72rpx;
  background: $color-bg;
  border-radius: 36rpx;
  padding: 0 24rpx;
  font-size: $font-size-content;
  border: 2rpx solid #e5e5e5;
  
  &:focus {
    border-color: $color-success;
  }
}

.dialog-delete-section {
  margin-top: 48rpx;
  padding-top: $spacing-lg;
  border-top: 2rpx solid #f0f0f0;
}

// 底部按钮
.bottom-bar {
  padding: $spacing-md;
  background: $color-white;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
}

// 分类选择器
.category-picker {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-lg;
  border-bottom: 2rpx solid #f0f0f0;
}

.picker-title {
  font-size: $font-size-title;
  font-weight: 600;
  color: $color-text-primary;
}

.picker-content {
  flex: 1;
}

.category-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx $spacing-lg;
  font-size: $font-size-content;
  color: $color-text-primary;
  background: $color-white;
  border-bottom: 2rpx solid #f5f5f5;

  &.selected {
    color: $color-primary;
    font-weight: 500;
    background: rgba(59, 130, 246, 0.05);
  }
}

.option-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.icon-placeholder {
  width: 28rpx;
}

.expand-btn {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: -10rpx;
}
</style>
