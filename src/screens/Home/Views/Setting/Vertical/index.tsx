import { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, Easing, View, useWindowDimensions } from 'react-native'

import { navigations } from '@/navigation'
import commonState from '@/store/common/state'
import { useBackHandler } from '@/utils/hooks/useBackHandler'
import { setSettingActiveScreenId } from '@/store/setting/uiState'
import { createStyle } from '@/utils/tools'
import { type SettingScreenIds } from '../Main'
import Main from './Main'
import NavList from './NavList'

/** 子页转场时长与缓动 — iOS 风格推入曲线 */
const TRANSITION_DURATION = 320
const TRANSITION_EASING = Easing.out(Easing.cubic)

/**
 * 竖屏设置：先分组列表，再进入对应子页。
 * 音源管理已有独立页面，入口直接跳转，避免多一层空壳。
 *
 * 沉浸式转场：子页以绝对定位覆盖层形式从右侧推入（位移 + 淡入），
 * 返回时先播放滑出动效再卸载；NavList 始终保持挂载，
 * 返回后 ScrollView 滚动位置不丢失。
 */
export default () => {
  const [activeId, setActiveId] = useState<SettingScreenIds | null>(null)
  const { width: windowWidth } = useWindowDimensions()
  // 转场进度：0 = 列表态，1 = 子页完全推入
  const progress = useRef(new Animated.Value(0)).current
  // 关闭动画进行中标记，防止连点触发竞态
  const closingRef = useRef(false)
  const animRef = useRef<Animated.CompositeAnimation | null>(null)

  const openScreen = useCallback((id: SettingScreenIds) => {
    if (id == 'source') {
      const componentId = commonState.componentIds.home
      if (componentId) navigations.pushSourceManagerScreen(componentId)
      return
    }
    global.lx.settingActiveId = id
    closingRef.current = false
    setSettingActiveScreenId(id)
    setActiveId(id)
  }, [])

  const closeScreen = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    animRef.current?.stop()
    animRef.current = Animated.timing(progress, {
      toValue: 0,
      duration: TRANSITION_DURATION,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    })
    animRef.current.start(({ finished }) => {
      closingRef.current = false
      // 动画被打断（用户再次打开）时保留页面，避免闪黑
      if (!finished) return
      setActiveId(null)
      setSettingActiveScreenId(null)
    })
  }, [progress])

  useEffect(() => {
    global.app_event.on('closeSettingScreen', closeScreen)
    return () => {
      global.app_event.off('closeSettingScreen', closeScreen)
      animRef.current?.stop()
      setSettingActiveScreenId(null)
    }
  }, [closeScreen])

  // 每次打开子页：从零进度推入
  useEffect(() => {
    if (!activeId) return
    progress.setValue(0)
    animRef.current?.stop()
    animRef.current = Animated.timing(progress, {
      toValue: 1,
      duration: TRANSITION_DURATION,
      easing: TRANSITION_EASING,
      useNativeDriver: true,
    })
    animRef.current.start()
  }, [activeId, progress])

  useBackHandler(useCallback(() => {
    if (!activeId) return false
    closeScreen()
    return true
  }, [activeId, closeScreen]))

  return (
    <View style={styles.container}>
      {/* 列表保持挂载以保留滚动位置；子页转场时淡出底层内容。 */}
      <Animated.View
        pointerEvents={activeId ? 'none' : 'auto'}
        accessibilityElementsHidden={activeId != null}
        importantForAccessibility={activeId ? 'no-hide-descendants' : 'auto'}
        style={[
          styles.page,
          {
            opacity: progress.interpolate({
              inputRange: [0, 0.45, 1],
              outputRange: [1, 0, 0],
              extrapolate: 'clamp',
            }),
          },
        ]}
      >
        <NavList onChangeId={openScreen} />
      </Animated.View>
      {activeId
        ? (
            <Animated.View
              style={[
                styles.page,
                styles.overlay,
                {
                  opacity: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.4, 1],
                    extrapolate: 'clamp',
                  }),
                  transform: [{
                    translateX: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [windowWidth, 0],
                      extrapolate: 'clamp',
                    }),
                  }],
                },
              ]}
            >
              <Main id={activeId} />
            </Animated.View>
          )
        : null}
    </View>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  overlay: {
    // 绝对定位覆盖列表层；JSX 顺序保证其位于上层
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
})
