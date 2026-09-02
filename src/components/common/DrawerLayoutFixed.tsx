import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react'
import { DrawerLayoutAndroid, type DrawerLayoutAndroidProps, View, type LayoutChangeEvent } from 'react-native'
import { usePageVisible } from '@/store/common/hook'
import { type COMPONENT_IDS } from '@/config/constant'

interface Props extends DrawerLayoutAndroidProps {
  visibleNavNames: COMPONENT_IDS[]
  widthPercentage: number
  widthPercentageMax?: number
}

export interface DrawerLayoutFixedType {
  openDrawer: () => void
  closeDrawer: () => void
  fixWidth: () => void
}

const DrawerLayoutFixed = forwardRef<DrawerLayoutFixedType, Props>(({ visibleNavNames, widthPercentage, widthPercentageMax, children, ...props }, ref) => {
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

export default DrawerLayoutFixed
