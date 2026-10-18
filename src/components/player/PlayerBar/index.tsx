import { memo, useMemo } from 'react'
import { View } from 'react-native'
import { useKeyboard } from '@/utils/hooks'

import Pic from './components/Pic'
import Title from './components/Title'
import PlayInfo from './components/PlayInfo'
import ControlBtn from './components/ControlBtn'
import { createStyle } from '@/utils/tools'
import { useSettingValue } from '@/store/setting/hook'
import { useNavActiveId } from '@/store/common/hook'
import commonState from '@/store/common/state'
import GlassSurface from '@/components/common/GlassSurface'

interface PlayerBarProps {
  isHome?: boolean
  floating?: boolean
  /** 由 HomeDock 绘制外层材质时使用，播放器只保留内容布局。 */
  embedded?: boolean
  componentId?: string
}

/**
 * 迷你播放器。
 * 首页组合 Dock 使用 embedded 模式；独立详情和横屏仍保留自己的表面与布局。
 */
export default memo(({ isHome = false, floating = false, embedded = false, componentId }: PlayerBarProps) => {
  const { keyboardShown } = useKeyboard()
  const autoHidePlayBar = useSettingValue('common.autoHidePlayBar')
  const navActiveId = useNavActiveId()
  const targetComponentId = componentId ?? commonState.componentIds.home

  const playerComponent = useMemo(() => {
    const content = (
      <View style={[styles.content, embedded ? styles.embedded : null]}>
        <View style={styles.left}>
          <Pic isHome={isHome} componentId={targetComponentId} />
        </View>
        <View style={styles.center}>
          <Title isHome={isHome} componentId={targetComponentId} />
          <PlayInfo isHome={isHome} />
        </View>
        <View style={styles.right}>
          <ControlBtn />
        </View>
      </View>
    )

    if (embedded) return content

    return (
      <View style={floating ? styles.floatWrap : null}>
        <GlassSurface style={floating ? styles.floating : styles.docked}>
          {content}
        </GlassSurface>
      </View>
    )
  }, [embedded, floating, isHome, targetComponentId])

  if (isHome && navActiveId == 'nav_setting') return null
  return autoHidePlayBar && keyboardShown ? null : playerComponent
})


const styles = createStyle({
  floatWrap: {
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  floating: {
    minHeight: 64,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 10,
    borderRadius: 22,
    borderWidth: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 8,
  },
  docked: {
    width: 'auto',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderTopWidth: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  embedded: {
    minHeight: 64,
    paddingVertical: 6,
    paddingHorizontal: 16,
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
