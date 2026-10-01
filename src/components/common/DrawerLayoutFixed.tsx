import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react'
import { DrawerLayoutAndroid, type DrawerLayoutAndroidProps, StyleSheet, View, type LayoutChangeEvent } from 'react-native'
import { usePageVisible, useStatusbarHeight } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { type COMPONENT_IDS } from '@/config/constant'
import { BorderWidths } from '@/theme'
import { scaleSizeW } from '@/utils/pixelRatio'
import GlassSurface from './GlassSurface'

// 侧栏统一尺寸：首页导航 / 排行榜榜单 / 歌单标签共用，避免各页面板宽窄不一
const WIDTH_PERCENTAGE = 0.78
const WIDTH_MAX = scaleSizeW(320)

interface Props extends DrawerLayoutAndroidProps {
  visibleNavNames: COMPONENT_IDS[]
  widthPercentage?: number
  widthPercentageMax?: number
}

export interface DrawerLayoutFixedType {
  openDrawer: () => void
  closeDrawer: () => void
  fixWidth: () => void
}

const DrawerLayoutFixed = forwardRef<DrawerLayoutFixedType, Props>(({
  visibleNavNames,
  widthPercentage = WIDTH_PERCENTAGE,
  widthPercentageMax = WIDTH_MAX,
  drawerPosition = 'left',
  drawerBackgroundColor,
  renderNavigationView,
  children,
  ...props
}, ref) => {
  const theme = useTheme()
  const statusBarHeight = useStatusbarHeight()
  const drawerLayoutRef = useRef<DrawerLayoutAndroid>(null)
  const [w, setW] = useState<number | `${number}%`>('100%')
  const [drawerWidth, setDrawerWidth] = useState(0)
  const changedRef = useRef({ width: 0, changed: false })

  const fixDrawerWidth = useCallback(() => {
    if (!changedRef.current.width) return
    changedRef.current.changed = true
    // console.log('usePageVisible', visible, changedRef.current.width)
    setW(changedRef.current.width - 1)
  }, [])

  // 修复 DrawerLayoutAndroid 在导航到其他屏幕再返回后无法打开的问题
  usePageVisible(visibleNavNames, useCallback((visible) => {
    if (!visible || !changedRef.current.width) return
    fixDrawerWidth()
  }, [fixDrawerWidth]))

  useImperativeHandle(ref, () => ({
    openDrawer() {
      drawerLayoutRef.current?.openDrawer()
    },
    closeDrawer() {
      drawerLayoutRef.current?.closeDrawer()
    },
    fixWidth() {
      fixDrawerWidth()
    },
  }), [fixDrawerWidth])


  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    // console.log('handleLayout', e.nativeEvent.layout.width, changedRef.current.width)
    if (changedRef.current.changed) {
      // setW(e.nativeEvent.layout.width - 1)
      setW('100%')
      changedRef.current.changed = false
    } else {
      const width = e.nativeEvent.layout.width
      if (changedRef.current.width == width) return
      changedRef.current.width = width

      // 重新设置面板宽度
      const wp = Math.floor(width * widthPercentage)
      // console.log(wp, widthPercentageMax)
      setDrawerWidth(widthPercentageMax ? Math.min(wp, widthPercentageMax) : wp)

      // 强制触发渲染以应用更改
      changedRef.current.changed = true
      setW(width - 1)
    }
  }, [widthPercentage, widthPercentageMax])

  /**
   * 统一的面板外观，三个侧栏共用：
   * - 液态玻璃底 + 辅色柔光，与抽屉内部的玻璃控件同源
   * - 顶部留出状态栏高度，内容不会被状态栏压住
   * - 内缘补一条高光发丝线，侧栏滑出后与页面内容有明确的分界
   * 依赖只取实际用到的值，避免主题对象换身份时把整块面板连带重建。
   */
  const edgeColor = theme['c-glass-highlight']
  const renderNavigation = useCallback(() => (
    <GlassSurface highlight="none" style={styles.panel}>
      <View style={{ flex: 1, paddingTop: statusBarHeight }}>
        {renderNavigationView?.()}
      </View>
      <View
        pointerEvents="none"
        style={[
          styles.panelEdge,
          drawerPosition == 'right' ? styles.edgeLeft : styles.edgeRight,
          { backgroundColor: edgeColor },
        ]}
      />
    </GlassSurface>
  ), [drawerPosition, edgeColor, renderNavigationView, statusBarHeight])

  // The native drawer needs its own flex constraint; otherwise it can measure to content height.
  return (
    <View
      onLayout={handleLayout}
      // Keep the drawer host above floating playback controls and page menus.
      // Android uses elevation for native draw order; zIndex also covers RN siblings.
      style={{ width: w, flex: 1, zIndex: 1000, elevation: 1000 }}
    >
      <DrawerLayoutAndroid
        ref={drawerLayoutRef}
        keyboardDismissMode="on-drag"
        drawerWidth={drawerWidth}
        drawerPosition={drawerPosition}
        drawerBackgroundColor={drawerBackgroundColor ?? theme['c-glass-background']}
        renderNavigationView={renderNavigation}
        {...props}
        style={{ flex: 1, width: '100%' }}
      >
        <View style={{ marginRight: w == '100%' ? 0 : -1, flex: 1 }}>
          {children}
        </View>
      </DrawerLayoutAndroid>
    </View>
  )
})

const styles = StyleSheet.create({
  panel: {
    flex: 1,
  },
  panelEdge: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: BorderWidths.hairline,
  },
  edgeLeft: {
    left: 0,
  },
  edgeRight: {
    right: 0,
  },
})

export default DrawerLayoutFixed
