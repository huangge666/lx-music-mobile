import { memo, useCallback, useRef, useEffect } from 'react'
import { type LayoutChangeEvent, StyleSheet, View, StatusBar } from 'react-native'
import commonState from '@/store/common/state'
import settingState from '@/store/setting/state'
import { setStatusbarHeight } from '@/core/common'
import { windowSizeTools, getWindowSize } from '@/utils/windowSizeTools'

const getStatusbarHeight = (winHeight: number, layoutHeight: number) => {
  const height = (!settingState.setting['common.alwaysKeepStatusbarHeight'] &&
          parseFloat(winHeight.toFixed(2)) >= parseFloat(layoutHeight.toFixed(2)))
    ? 0
    : (StatusBar.currentHeight ?? 0)

  return height
}

export default memo(() => {
  const currentHeightRef = useRef(commonState.statusbarHeight)
  const sizeRef = useRef([0, 0])
  const layoutRequestRef = useRef(0)
  const handleLayout = useCallback(({ nativeEvent: { layout } }: LayoutChangeEvent | { nativeEvent: { layout: { width: number, height: number } } }) => {
    // Android 可能先触发 onLayout 再通知 Dimensions；不能用后者的标记丢弃旋转后的实际布局。
    const request = ++layoutRequestRef.current
    void getWindowSize().then(size => {
      if (request != layoutRequestRef.current) return
      sizeRef.current = [size.height, layout.height]
      const height = getStatusbarHeight(size.height, layout.height)

      if (currentHeightRef.current != height) {
        currentHeightRef.current = height
        setStatusbarHeight(height)
      }
      const currentSize = windowSizeTools.getSize()
      if (currentSize.width != Math.round(layout.width) || currentSize.height != Math.round(layout.height)) {
        windowSizeTools.setWindowSize(layout.width, layout.height)
      }
    })
  }, [])
  useEffect(() => {
    const invalidateLayout = () => { layoutRequestRef.current++ }
    const handleSettingUpdate = (keys: Array<keyof LX.AppSetting>) => {
      if (!keys.includes('common.alwaysKeepStatusbarHeight') || !sizeRef.current[1]) return
      const height = getStatusbarHeight(sizeRef.current[0], sizeRef.current[1])

      if (currentHeightRef.current != height) {
        currentHeightRef.current = height
        setStatusbarHeight(height)
      }
    }
    global.state_event.on('configUpdated', handleSettingUpdate)

    return () => {
      invalidateLayout()
      global.state_event.off('configUpdated', handleSettingUpdate)
    }
  }, [])
  return (<View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={handleLayout} />)
}, () => true)

