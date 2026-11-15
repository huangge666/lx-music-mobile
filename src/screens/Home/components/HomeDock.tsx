import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View, type LayoutChangeEvent } from 'react-native'

import LiquidGlass from '@/components/common/LiquidGlass'
import PlayerBar from '@/components/player/PlayerBar'
import BottomBar, { getTabBarHeight } from './BottomBar'
import commonState from '@/store/common/state'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { useSettingValue } from '@/store/setting/hook'
import { useKeyboard } from '@/utils/hooks'
import { useFontSize } from '@/store/common/hook'
import { getMiniPlayerHeight } from '@/components/player/PlayerBar/layout'
import { useReduceMotion } from '@/utils/hooks/useReduceMotion'

interface HomeDockProps {
  onLayout?: (event: LayoutChangeEvent) => void
}

/**
 * 首页浮动 Dock。
 * 槽位按真实字号避让；滚动不收起标签文字，只有当前曲首次出现时弹入。
 */
export default ({ onLayout }: HomeDockProps) => {
  const musicInfo = usePlayerMusicInfo()
  const autoHidePlayBar = useSettingValue('common.autoHidePlayBar')
  const { keyboardShown } = useKeyboard()
  useFontSize()
  const reducedMotion = useReduceMotion()
  const miniHeight = getMiniPlayerHeight()
  const tabHeight = getTabBarHeight()
  const showPlayer = !!musicInfo.id && !(autoHidePlayBar && keyboardShown)

  const presence = useRef(new Animated.Value(1)).current

  // 有当前曲时迷你条弹入
  useEffect(() => {
    if (!showPlayer) return
    if (reducedMotion) {
      presence.setValue(1)
      return
    }
    presence.setValue(0)
    const animation = Animated.spring(presence, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 90,
    })
    animation.start()
    return () => { animation.stop() }
  }, [showPlayer, presence, reducedMotion])

  return (
    <View pointerEvents="box-none" onLayout={onLayout} style={styles.dock}>
      {showPlayer
        ? (
            <Animated.View style={{
              opacity: presence,
              transform: [
                { translateY: presence.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
                { scale: presence.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
              ],
            }}>
              <View style={{ height: miniHeight }}>
                <LiquidGlass radius={miniHeight / 2} scrim={0.16} shadow={false} containerStyle={styles.fill} style={styles.fill}>
                  <PlayerBar isHome embedded componentId={commonState.componentIds.home} />
                </LiquidGlass>
              </View>
            </Animated.View>
          )
        : null}
      <View style={{ height: tabHeight }}>
        <LiquidGlass radius={tabHeight / 2} scrim={0.22} shadow={false} containerStyle={styles.fill} style={styles.fill}>
          <BottomBar />
        </LiquidGlass>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 8,
    gap: 8,
  },
  fill: {
    flex: 1,
  },
})
