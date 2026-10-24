import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View, type LayoutChangeEvent } from 'react-native'

import LiquidGlass from '@/components/common/LiquidGlass'
import PlayerBar from '@/components/player/PlayerBar'
import BottomBar from './BottomBar'
import commonState from '@/store/common/state'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { useSettingValue } from '@/store/setting/hook'
import { useKeyboard } from '@/utils/hooks'

interface HomeDockProps {
  onLayout?: (event: LayoutChangeEvent) => void
}

/**
 * 槽位用固定 dp，不走 createStyle 的屏幕缩放。
 * 播放条内容也必须用同一套未缩放尺寸，否则封面会高于这 43dp。
 */
const MINI_SLOT = 43
const TAB_SLOT = 58

/**
 * 首页浮动 Dock。
 *
 * 迷你播放器和标签栏的玻璃高度保持不变，滚动时不再收起标签文字，
 * 两条玻璃都保持固定高度与圆角，只有迷你条在出现时弹入。
 */
export default ({ onLayout }: HomeDockProps) => {
  const musicInfo = usePlayerMusicInfo()
  const autoHidePlayBar = useSettingValue('common.autoHidePlayBar')
  const { keyboardShown } = useKeyboard()
  const showPlayer = !!musicInfo.id && !(autoHidePlayBar && keyboardShown)

  const presence = useRef(new Animated.Value(0)).current

  // 有当前曲时迷你条弹入
  useEffect(() => {
    if (!showPlayer) return
    presence.setValue(0)
    Animated.spring(presence, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 90,
    }).start()
  }, [showPlayer, presence])

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
              <View style={styles.miniSlot}>
                {/* 去阴影：迷你条只保留玻璃面，不再投悬浮阴影 */}
                <LiquidGlass radius={22} scrim={0.2} shadow={false} containerStyle={styles.fill} style={styles.fill}>
                  <PlayerBar isHome embedded componentId={commonState.componentIds.home} />
                </LiquidGlass>
              </View>
            </Animated.View>
          )
        : null}
      <View style={styles.tabSlot}>
        {/* 去阴影：标签栏同样只保留玻璃面 */}
        <LiquidGlass radius={29} scrim={0.12} shadow={false} containerStyle={styles.fill} style={styles.fill}>
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
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 8,
    gap: 6,
  },
  miniSlot: {
    height: MINI_SLOT,
    overflow: 'hidden',
  },
  tabSlot: {
    height: TAB_SLOT,
    justifyContent: 'flex-end',
  },
  fill: {
    flex: 1,
  },
})
