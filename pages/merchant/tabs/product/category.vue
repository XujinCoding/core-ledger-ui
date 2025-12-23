<script setup lang="ts">
/**
 * 分类管理页面
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, onMounted } from 'vue'
import { getCategoryTree, createCategory, updateCategory, deleteCategory } from '@/api/modules/category'
import type { CategoryTreeVO, CategoryCreateDTO } from '@/types/product'

// ==================== 数据状态 ====================

const loading = ref(false)
const categories = ref<CategoryTreeVO[]>([])

// 弹窗控制
const showAddPopup = ref(false)
const editMode = ref(false)
const editingId = ref<number | null>(null)

// 表单数据
const form = ref({
  name: '',
  parentId: null as number | null,
  parentName: '',
  sort: 0
})

// ==================== 方法 ====================

/**
 * 加载分类列表
 */
const loadCategories = async () => {
  try {
    loading.value = true
    const res = await getCategoryTree()
    categories.value = res || []
  } catch (error) {
    console.error('加载分类失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 打开添加弹窗
 */
const openAddPopup = (parent?: CategoryTreeVO) => {
  editMode.value = false
  editingId.value = null
  form.value = {
    name: '',
    parentId: parent?.id || null,
    parentName: parent?.name || '',
    sort: 0
  }
  showAddPopup.value = true
}

/**
 * 打开编辑弹窗
 */
const openEditPopup = (cat: CategoryTreeVO) => {
  editMode.value = true
  editingId.value = cat.id
  form.value = {
    name: cat.name,
    parentId: cat.parentId || null,
    parentName: '',
    sort: cat.sort || 0
  }
  showAddPopup.value = true
}

/**
 * 提交表单
 */
const submitForm = async () => {
  if (!form.value.name.trim()) {
    uni.showToast({ title: '请输入分类名称', icon: 'none' })
    return
  }

  try {
    uni.showLoading({ title: '保存中...' })
    const data: CategoryCreateDTO = {
      name: form.value.name,
      parentId: form.value.parentId || undefined,
      sort: form.value.sort
    }

    if (editMode.value && editingId.value) {
      await updateCategory(editingId.value, data)
      uni.showToast({ title: '修改成功', icon: 'success' })
    } else {
      await createCategory(data)
      uni.showToast({ title: '添加成功', icon: 'success' })
    }
    
    showAddPopup.value = false
    await loadCategories()
  } catch (error) {
    console.error('保存分类失败:', error)
  } finally {
    uni.hideLoading()
  }
}

/**
 * 删除分类
 */
const handleDelete = (cat: CategoryTreeVO) => {
  // 检查是否有子分类
  if (cat.children && cat.children.length > 0) {
    uni.showToast({ title: '请先删除子分类', icon: 'none' })
    return
  }

  uni.showModal({
    title: '确认删除',
    content: `确定要删除分类"${cat.name}"吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '删除中...' })
          await deleteCategory(cat.id)
          uni.showToast({ title: '删除成功', icon: 'success' })
          await loadCategories()
        } catch (error) {
          console.error('删除分类失败:', error)
        } finally {
          uni.hideLoading()
        }
      }
    }
  })
}

// ==================== 生命周期 ====================

onMounted(() => {
  loadCategories()
})
</script>

<template>
  <view class="category-page">
    <scroll-view class="content-scroll" scroll-y>
      <!-- 提示信息 -->
      <view class="tip-box">
        <wd-icon name="info-circle" size="32rpx" color="#F59E0B" />
        <text>分类下有商品时无法删除，请先移动或删除商品</text>
      </view>

      <!-- 加载中 -->
      <view v-if="loading" class="loading-state">
        <wd-loading size="48rpx" />
      </view>

      <!-- 空状态 -->
      <view v-else-if="categories.length === 0" class="empty-state">
        <wd-icon name="inbox" size="100rpx" color="#ddd" />
        <text>暂无分类</text>
        <button class="add-btn-empty" @tap="openAddPopup()">添加分类</button>
      </view>

      <!-- 分类列表 -->
      <view v-else class="category-list">
        <view v-for="cat in categories" :key="cat.id" class="category-group">
          <!-- 父级分类 -->
          <view class="category-item parent">
            <view class="item-content">
              <view class="category-icon">
                <wd-icon name="folder" size="36rpx" />
              </view>
              <view class="category-info">
                <text class="category-name">{{ cat.name }}</text>
                <text class="category-count">{{ cat.children?.length || 0 }}个子分类</text>
              </view>
            </view>
            <view class="item-actions">
              <view class="action-btn" @tap.stop="openAddPopup(cat)">
                <wd-icon name="add" size="32rpx" color="#3B82F6" />
              </view>
              <view class="action-btn" @tap.stop="openEditPopup(cat)">
                <wd-icon name="edit" size="32rpx" color="#666" />
              </view>
              <view class="action-btn" @tap.stop="handleDelete(cat)">
                <wd-icon name="delete" size="32rpx" color="#EF4444" />
              </view>
            </view>
          </view>

          <!-- 子分类 -->
          <view v-if="cat.children && cat.children.length > 0" class="children-list">
            <view
              v-for="child in cat.children"
              :key="child.id"
              class="category-item child"
            >
              <view class="item-content">
                <view class="category-icon small">
                  <wd-icon name="tag" size="28rpx" />
                </view>
                <text class="category-name">{{ child.name }}</text>
              </view>
              <view class="item-actions">
                <view class="action-btn" @tap.stop="openEditPopup(child)">
                  <wd-icon name="edit" size="28rpx" color="#666" />
                </view>
                <view class="action-btn" @tap.stop="handleDelete(child)">
                  <wd-icon name="delete" size="28rpx" color="#EF4444" />
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view style="height: 120rpx;"></view>
    </scroll-view>

    <!-- 浮动添加按钮 -->
    <view class="fab-btn" @tap="openAddPopup()">
      <wd-icon name="add" size="48rpx" color="#fff" />
    </view>

    <!-- 添加/编辑弹窗 -->
    <wd-popup v-model="showAddPopup" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="add-popup">
        <view class="popup-header">
          <text class="popup-title">{{ editMode ? '编辑分类' : '添加分类' }}</text>
          <wd-icon name="close" size="40rpx" color="#999" @click="showAddPopup = false" />
        </view>
        
        <view class="popup-content">
          <view class="form-item" v-if="form.parentName">
            <text class="form-label">父级分类</text>
            <view class="parent-tag">{{ form.parentName }}</view>
          </view>

          <view class="form-item">
            <text class="form-label">分类名称</text>
            <input
              class="form-input"
              v-model="form.name"
              placeholder="请输入分类名称"
              :maxlength="20"
            />
          </view>

          <view class="form-item">
            <text class="form-label">排序</text>
            <input
              class="form-input"
              type="number"
              v-model="form.sort"
              placeholder="数字越小越靠前"
            />
          </view>
        </view>

        <view class="popup-footer">
          <button class="cancel-btn" @tap="showAddPopup = false">取消</button>
          <button class="confirm-btn" @tap="submitForm">确定</button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<style lang="scss" scoped>
.category-page {
  height: 100vh;
  background: #f5f5f5;
}

.content-scroll {
  height: 100%;
  padding: 24rpx;
}

.tip-box {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 24rpx;
  background: #FEF3C7;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  font-size: 26rpx;
  color: #92400E;
}

.loading-state {
  padding: 100rpx 0;
  text-align: center;
}

.empty-state {
  padding: 120rpx 0;
  text-align: center;
  color: #999;
  font-size: 28rpx;

  text {
    display: block;
    margin: 24rpx 0 40rpx;
  }
}

.add-btn-empty {
  display: inline-flex;
  padding: 16rpx 48rpx;
  background: #3B82F6;
  color: #fff;
  font-size: 28rpx;
  border-radius: 40rpx;
  border: none;

  &::after {
    border: none;
  }
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.category-group {
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
}

.category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;

  &.parent {
    background: #fff;
  }

  &.child {
    background: #f9fafb;
    border-top: 2rpx solid #f0f0f0;
    padding-left: 64rpx;
  }
}

.item-content {
  display: flex;
  align-items: center;
  flex: 1;
}

.category-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 16rpx;
  background: #EBF5FF;
  color: #3B82F6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;

  &.small {
    width: 56rpx;
    height: 56rpx;
    border-radius: 12rpx;
    margin-right: 16rpx;
  }
}

.category-info {
  flex: 1;
}

.category-name {
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
}

.category-count {
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
  display: block;
}

.item-actions {
  display: flex;
  gap: 16rpx;
}

.action-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fab-btn {
  position: fixed;
  right: 32rpx;
  bottom: 100rpx;
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  background: #3B82F6;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(59, 130, 246, 0.4);
  z-index: 99;
}

/* 弹窗样式 */
.add-popup {
  padding: 32rpx;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 40rpx;
}

.popup-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #333;
}

.popup-content {
  margin-bottom: 40rpx;
}

.form-item {
  margin-bottom: 32rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 16rpx;
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

.parent-tag {
  display: inline-block;
  padding: 12rpx 24rpx;
  background: #EBF5FF;
  color: #3B82F6;
  border-radius: 8rpx;
  font-size: 26rpx;
}

.popup-footer {
  display: flex;
  gap: 24rpx;
}

.cancel-btn,
.confirm-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;

  &::after {
    border: none;
  }
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.confirm-btn {
  background: #3B82F6;
  color: #fff;
}
</style>
