<script setup lang="ts">
/**
 * 分类管理页面
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, computed, onMounted } from 'vue'
import { getCategoryTree, createCategory, updateCategory, deleteCategory } from '@/api/modules/category'
import type { CategoryTreeVO, CategoryCreateDTO } from '@/types/product'

// ==================== 数据状态 ====================

const loading = ref(false)
const categories = ref<CategoryTreeVO[]>([])

// 展开的分类ID列表
const expandedIds = ref<number[]>([])

// 切换展开/收起
const toggleExpand = (id: number) => {
  const index = expandedIds.value.indexOf(id)
  if (index > -1) {
    expandedIds.value.splice(index, 1)
  } else {
    expandedIds.value.push(id)
  }
}

// 检查是否展开
const isExpanded = (id: number) => expandedIds.value.includes(id)

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
      parentId: form.value.parentId ?? 0,
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
    // 触发分类变更事件，通知商品列表刷新分类数据
    uni.$emit('category-changed')
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
          // 触发分类变更事件，通知商品列表刷新分类数据
          uni.$emit('category-changed')
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

    <!-- 树形列表 -->
    <scroll-view v-else class="category-tree" scroll-y>
      <!-- 添加根分类按钮 -->
      <view class="add-root-btn" @tap="openAddPopup()">
        <wd-icon name="add" size="32rpx" color="#3B82F6" />
        <text>添加根分类</text>
      </view>

      <!-- 一级分类 -->
      <view v-for="cat1 in categories" :key="cat1.id" class="tree-node level-1">
        <view class="node-row">
          <view class="node-left" @tap.stop="toggleExpand(cat1.id)">
            <wd-icon
              v-if="cat1.children && cat1.children.length > 0"
              :name="isExpanded(cat1.id) ? 'arrow-down' : 'arrow-right'"
              size="28rpx"
              color="#999"
            />
            <view v-else class="expand-placeholder"></view>
          </view>
          <text class="node-name">{{ cat1.name }}</text>
          <view class="node-actions">
            <view class="action-btn" @tap.stop="openAddPopup(cat1)">
              <wd-icon name="add" size="28rpx" color="#3B82F6" />
            </view>
            <view class="action-btn" @tap.stop="openEditPopup(cat1)">
              <wd-icon name="edit" size="28rpx" color="#666" />
            </view>
            <view class="action-btn" @tap.stop="handleDelete(cat1)">
              <wd-icon name="delete" size="28rpx" color="#EF4444" />
            </view>
          </view>
        </view>

        <!-- 二级分类 -->
        <view v-if="isExpanded(cat1.id) && cat1.children" class="children-wrap">
          <view v-for="cat2 in cat1.children" :key="cat2.id" class="tree-node level-2">
            <view class="node-row">
              <view class="node-left" @tap.stop="toggleExpand(cat2.id)">
                <wd-icon
                  v-if="cat2.children && cat2.children.length > 0"
                  :name="isExpanded(cat2.id) ? 'arrow-down' : 'arrow-right'"
                  size="28rpx"
                  color="#999"
                />
                <view v-else class="expand-placeholder"></view>
              </view>
              <text class="node-name">{{ cat2.name }}</text>
              <view class="node-actions">
                <view class="action-btn" @tap.stop="openAddPopup(cat2)">
                  <wd-icon name="add" size="28rpx" color="#3B82F6" />
                </view>
                <view class="action-btn" @tap.stop="openEditPopup(cat2)">
                  <wd-icon name="edit" size="28rpx" color="#666" />
                </view>
                <view class="action-btn" @tap.stop="handleDelete(cat2)">
                  <wd-icon name="delete" size="28rpx" color="#EF4444" />
                </view>
              </view>
            </view>

            <!-- 三级分类 -->
            <view v-if="isExpanded(cat2.id) && cat2.children" class="children-wrap">
              <view v-for="cat3 in cat2.children" :key="cat3.id" class="tree-node level-3">
                <view class="node-row">
                  <view class="expand-placeholder"></view>
                  <text class="node-name">{{ cat3.name }}</text>
                  <view class="node-actions">
                    <view class="action-btn" @tap.stop="openEditPopup(cat3)">
                      <wd-icon name="edit" size="28rpx" color="#666" />
                    </view>
                    <view class="action-btn" @tap.stop="handleDelete(cat3)">
                      <wd-icon name="delete" size="28rpx" color="#EF4444" />
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

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

.loading-state {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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

/* 树形列表 */
.category-tree {
  height: 100vh;
  padding: 24rpx;
  box-sizing: border-box;
}

.add-root-btn {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 24rpx 32rpx;
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  font-size: 28rpx;
  color: #3B82F6;
}

.tree-node {
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 16rpx;
  overflow: hidden;

  &.level-2, &.level-3 {
    margin-bottom: 0;
    border-radius: 0;
  }
}

.node-row {
  display: flex;
  align-items: center;
  padding: 24rpx 24rpx 24rpx 16rpx;
  border-bottom: 2rpx solid #f5f5f5;

  .level-2 & {
    padding-left: 48rpx;
    background: #f9fafb;
  }

  .level-3 & {
    padding-left: 80rpx;
    background: #f5f5f5;
  }
}

.node-left {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.expand-placeholder {
  width: 28rpx;
}

.node-name {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  margin-left: 8rpx;
}

.node-actions {
  display: flex;
  gap: 8rpx;
}

.action-btn {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.children-wrap {
  border-top: 2rpx solid #f0f0f0;
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
