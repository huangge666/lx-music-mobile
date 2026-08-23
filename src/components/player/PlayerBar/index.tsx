import { memo, useMemo } from 'react'
import { View } from 'react-native'
import { useKeyboard } from '@/utils/hooks'

import Pic from './components/Pic'
import Title from './components/Title'
import PlayInfo from './components/PlayInfo'
import ControlBtn from './components/ControlBtn'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { useNavActiveId } from '@/store/common/hook'


/**
 * 弥散流体水光玻璃 — 浮动迷你播放器
 *
 * 核心视觉特征：
 * — 水润通透底色 (Fluid Translucency)
 * — 双层水光漫反射光晕 (Diffuse Fluid Glow + Ambient Light)
 * — 水面流光微反射折射层
 */
export default memo(({ isHome = false }: { isHome?: boolean }) => {
  const { keyboardShown } = useKeyboard()
  const theme = useTheme()
  const autoHidePlayBar = useSettingValue('common.autoHidePlayBar')
  const navActiveId = useNavActiveId()

  const playerComponent = useMemo(() => (
    <View style={{
      ...styles.container,
      backgroundColor: theme['c-glass-background'],
      borderTopColor: theme['c-glass-border'],
      borderTopWidth: 0.5,
    }}>
      {/* 弥散水光环境微光层 */}
      <View
        pointerEvents="none"
        style={{
          ...styles.fluidGlowBackdrop,
          backgroundColor: theme['c-glass-fluid-glow'],
        }}
      />
      {/* 顶部水面流光反射波纹 */}
      <View
        pointerEvents="none"
        style={{
          ...styles.highlightLine,
          backgroundColor: theme['c-glass-highlight'],
        }}
      />
      <View style={styles.left}>
        <Pic isHome={isHome} />
      </View>
      <View style={styles.center}>
        <Title isHome={isHome} />
        <PlayInfo isHome={isHome} />
      </View>
      <View style={styles.right}>
        <ControlBtn />
      </View>
    </View>
  ), [theme, isHome])

  if (isHome && navActiveId == 'nav_setting') return null
  return autoHidePlayBar && keyboardShown ? null : playerComponent
})


const styles = createStyle({
  container: {
    width: 'auto',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  fluidGlowBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.35,
  },
  highlightLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.6,
  },
  left: {
    flexGrow: 0,
    flexShrink: 0,
  },
  center: {
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
    paddingLeft: 10,
    paddingRight: 6,
    justifyContent: 'center',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 0,
    flexShrink: 0,
  },
})
