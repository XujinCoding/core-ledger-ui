/**
 * 获取导航栏安全区域信息
 * 用于适配微信小程序胶囊按钮位置
 */
import { ref, computed } from 'vue'

interface NavbarSafeArea {
  /** 状态栏高度 (px) */
  statusBarHeight: number
  /** 胶囊按钮信息 */
  menuButton: {
    top: number
    right: number
    bottom: number
    left: number
    width: number
    height: number
  }
  /** 导航栏内容区高度 (px) - 胶囊按钮高度 + 上下间距 */
  navbarContentHeight: number
  /** 整个导航栏高度 (px) - 状态栏 + 导航栏内容区 */
  navbarHeight: number
  /** 右侧安全距离 (px) - 避开胶囊按钮 */
  rightSafeWidth: number
}

const safeArea = ref<NavbarSafeArea | null>(null)

/**
 * 初始化安全区域信息
 */
function initSafeArea(): NavbarSafeArea {
  let statusBarHeight = 0
  let windowWidth = 375
  
  // 使用新的 API 替代已弃用的 getSystemInfoSync
  // #ifdef MP-WEIXIN
  try {
    const windowInfo = uni.getWindowInfo()
    statusBarHeight = windowInfo.statusBarHeight || 0
    windowWidth = windowInfo.windowWidth || 375
  } catch (e) {
    console.warn('获取窗口信息失败，使用默认值:', e)
  }
  // #endif
  
  // #ifndef MP-WEIXIN
  try {
    const systemInfo = uni.getSystemInfoSync()
    statusBarHeight = systemInfo.statusBarHeight || 0
    windowWidth = systemInfo.windowWidth || 375
  } catch (e) {
    console.warn('获取系统信息失败，使用默认值:', e)
  }
  // #endif

  // 默认值（用于非微信小程序环境）
  let menuButton = {
    top: statusBarHeight + 4,
    right: 7,
    bottom: statusBarHeight + 36,
    left: windowWidth - 87,
    width: 80,
    height: 32
  }

  // #ifdef MP-WEIXIN
  try {
    const rect = uni.getMenuButtonBoundingClientRect()
    if (rect && rect.width) {
      menuButton = {
        top: rect.top,
        right: windowWidth - rect.right,
        bottom: rect.bottom,
        left: rect.left,
        width: rect.width,
        height: rect.height
      }
    }
  } catch (e) {
    console.warn('获取胶囊按钮信息失败:', e)
  }
  // #endif

  // 导航栏内容区高度 = 胶囊按钮高度 + 上下各 8px 的间距
  const navbarContentHeight = menuButton.height + 16

  // 整个导航栏高度 = 胶囊按钮底部位置 + 底部间距 (更精确)
  const navbarHeight = menuButton.bottom + 8

  // 右侧安全宽度 = 胶囊按钮宽度 + 右侧间距 + 额外 16px 安全距离
  const rightSafeWidth = menuButton.width + menuButton.right + 16

  return {
    statusBarHeight,
    menuButton,
    navbarContentHeight,
    navbarHeight,
    rightSafeWidth
  }
}

export function useNavbarSafeArea() {
  if (!safeArea.value) {
    safeArea.value = initSafeArea()
  }

  /** 头部区域的内联样式 - 使用完整导航栏高度 */
  const headerStyle = computed(() => {
    if (!safeArea.value) return ''
    return `padding-top: ${safeArea.value.navbarHeight}px;`
  })

  /** 头部内容行的内联样式（避开胶囊按钮） */
  const headerContentStyle = computed(() => {
    if (!safeArea.value) return ''
    return `padding-right: ${safeArea.value.rightSafeWidth}px;`
  })

  /** 导航栏占位高度样式 */
  const navbarPlaceholderStyle = computed(() => {
    if (!safeArea.value) return ''
    return `height: ${safeArea.value.navbarHeight}px;`
  })

  return {
    safeArea: computed(() => safeArea.value),
    headerStyle,
    headerContentStyle,
    navbarPlaceholderStyle
  }
}
