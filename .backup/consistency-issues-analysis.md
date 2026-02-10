# 前端代码一致性问题分析报告

## 生成时间
2026-02-10

## 问题概述

根据用户反馈，前端代码存在以下**真实的一致性问题**：

1. **验证方式不一致**: 部分地方使用 `required` prop，部分使用自定义验证逻辑
2. **输入组件不一致**: 混用原生 `<input>` 和 `<wd-input>` 组件
3. **样式不一致**: 未使用 wot-design-uni CSS 变量，导致字体大小不一致
4. **间距不一致**: 表单和组件的 margin/padding 值不一致

## 详细分析

### 1. 验证方式不一致

#### 问题描述
- 部分页面使用 `required` prop 标记必填字段
- 部分页面使用自定义验证逻辑（如 `if (!form.value.name)` 等）
- 导致验证行为和错误提示不统一

#### 发现位置
- `pages/merchant/settings/store-info.vue`: 使用 `required` prop
- `pages/merchant/tabs/customer/add.vue`: 混用 `required` prop 和自定义验证
- `pages/merchant/tabs/ledger/add.vue`: 主要使用自定义验证逻辑
- `pages/register/merchant.vue`: 使用自定义验证 + 手动标记 `<text class="required">*</text>`

#### 推荐方案
统一使用 wot-design-uni 的 `required` prop + `wd-form` 验证机制

### 2. 输入组件不一致

#### 问题描述
经过搜索，**未发现**原生 `<input>` 标签的使用。
所有输入框都已使用 `<wd-input>` 或 `<wd-textarea>` 组件。

**结论**: 此问题不存在，无需修复。

### 3. 样式不一致 - 字体大小

#### 问题描述
大量页面使用硬编码的 `font-size` 值，未使用 wot-design-uni CSS 变量

#### wot-design-uni 可用字体变量
```scss
$-fs-big: var(--wot-fs-big, 24px)           // 大型标题
$-fs-important: var(--wot-fs-important, 19px) // 重要数据
$-fs-title: var(--wot-fs-title, 16px)       // 标题字号/重要正文字号
$-fs-content: var(--wot-fs-content, 14px)   // 普通正文
$-fs-secondary: var(--wot-fs-secondary, 12px) // 次要信息
$-fs-aid: var(--wot-fs-aid, 10px)           // 辅助文字字号
```

#### 发现的硬编码字体大小

**pages/merchant/settings/store-info.vue**
- `font-size: 34rpx` → 应使用 `$-fs-title` (16px = 32rpx)
- `font-size: 28rpx` → 应使用 `$-fs-content` (14px = 28rpx)

**pages/customer/switch-merchant.vue**
- `font-size: 30rpx` → 应使用 `$-fs-title` (16px = 32rpx)
- `font-size: 24rpx` → 应使用 `$-fs-secondary` (12px = 24rpx)
- `font-size: 20rpx` → 应使用 `$-fs-aid` (10px = 20rpx)

**pages/register/merchant.vue**
- `font-size: 36rpx` → 应使用 `$-fs-big` (24px = 48rpx) 或自定义
- `font-size: 32rpx` → 应使用 `$-fs-title` (16px = 32rpx)
- `font-size: 30rpx` → 应使用 `$-fs-title` (16px = 32rpx)
- `font-size: 28rpx` → 应使用 `$-fs-content` (14px = 28rpx)
- `font-size: 26rpx` → 应使用 `$-fs-secondary` (12px = 24rpx)
- `font-size: 24rpx` → 应使用 `$-fs-secondary` (12px = 24rpx)

**pages/register/customer.vue**
- 类似 merchant.vue 的问题

**pages/customer/profile.vue**
- `font-size: 36rpx` → 应使用 `$-fs-big` 或自定义
- `font-size: 30rpx` → 应使用 `$-fs-title`
- `font-size: 28rpx` → 应使用 `$-fs-content`
- `font-size: 26rpx` → 应使用 `$-fs-secondary`
- `font-size: 22rpx` → 应使用 `$-fs-aid` (10px = 20rpx) 或自定义

**pages/customer/index.vue**
- 类似问题

### 4. 间距不一致 - margin/padding

#### 问题描述
大量页面使用硬编码的 `margin` 和 `padding` 值，未使用 wot-design-uni 间距变量

#### wot-design-uni 可用间距变量
```scss
$-size-side-padding: var(--wot-size-side-padding, 15px)       // 屏幕两边留白 (30rpx)
$-size-side-padding-small: var(--wot-size-side-padding-small, 6px) // 屏幕两边留白小值 (12rpx)
```

#### 发现的硬编码间距

**pages/merchant/settings/store-info.vue**
- `padding: 0 32rpx` → 应使用 `$-size-side-padding` (15px = 30rpx)
- `padding: 32rpx` → 可使用 `$-size-side-padding`
- `padding: 24rpx 32rpx` → 混合值，需要标准化
- `padding: 24rpx` → 需要标准化

**pages/customer/switch-merchant.vue**
- `padding: 0` → 保持
- `margin: 16rpx 24rpx 0` → 需要标准化
- `padding: 24rpx` → 需要标准化
- `padding: 4rpx 12rpx` → 小间距，可能需要自定义
- `padding: 100rpx 32rpx` → 大间距，需要标准化
- `padding: 32rpx 24rpx` → 需要标准化

**pages/register/merchant.vue**
- `padding: 24rpx 32rpx` → 需要标准化
- `padding: 24rpx` → 需要标准化
- `margin: 0 auto 16rpx` → 需要标准化
- `padding: 0 24rpx` → 需要标准化

**其他页面**
- 类似问题广泛存在

#### 推荐标准化方案
```scss
// 定义项目级间距变量（基于 wot-design-uni）
$spacing-xs: 8rpx;   // 极小间距
$spacing-sm: 16rpx;  // 小间距
$spacing-md: 24rpx;  // 中等间距
$spacing-lg: 32rpx;  // 大间距
$spacing-xl: 48rpx;  // 超大间距

// 使用 wot-design-uni 变量
$spacing-side: $-size-side-padding; // 30rpx
$spacing-side-small: $-size-side-padding-small; // 12rpx
```

## 修复优先级

### P0 - 高优先级（影响用户体验）
1. **验证方式不一致** - 影响表单提交和错误提示
2. **字体大小不一致** - 影响视觉一致性

### P1 - 中优先级（影响代码质量）
3. **间距不一致** - 影响布局一致性

### P2 - 低优先级（已解决）
4. ~~输入组件不一致~~ - 已全部使用 wot-design-uni 组件

## 修复计划

### 阶段 1: 验证方式统一
- [ ] 分析所有表单页面的验证逻辑
- [ ] 统一使用 `required` prop + `wd-form` 验证
- [ ] 移除自定义验证逻辑
- [ ] 测试验证功能

### 阶段 2: 字体大小统一
- [ ] 创建 SCSS 变量映射文件
- [ ] 替换所有硬编码字体大小
- [ ] 测试视觉效果

### 阶段 3: 间距统一
- [ ] 定义项目级间距变量
- [ ] 替换所有硬编码间距
- [ ] 测试布局效果

## 注意事项

1. **渐进式修复**: 每修复一个页面，立即测试验证
2. **保持功能不变**: 修复过程中不改变任何业务逻辑
3. **用户确认**: 每个阶段完成后，征求用户确认
4. **备份机制**: 修改前已创建备份，可随时回滚
