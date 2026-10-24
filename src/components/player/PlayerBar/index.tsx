import { memo, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { useHorizontalMode, useKeyboard } from '@/utils/hooks'

import Pic from './components/Pic'
import Title from './components/Title'
import ControlBtn from './components/ControlBtn'
import { createStyle } from '@/utils/tools'
import { useSettingValue } from '@/store/setting/hook'
import { useNavActiveId } from '@/store/common/hook'
import commonState from '@/store/common/state'
import LiquidGlass from '@/components/common/LiquidGlass'

interface PlayerBarProps {
  isHome?: boolean
  /** 由 HomeDock 绘制外层材质时使用，播放器只保留内容布局。 */
  embedded?: boolean
  componentId?: string
}

/**
 * 迷你播放器。
 * 首页组合 Dock 使用 embedded 模式；独立详情和横屏作为页内浮动胶囊。
 */
export default memo(({ isHome = false, embedded = false, componentId }: PlayerBarProps) => {
  const { keyboardShown } = useKeyboard()
  const wide = useHorizontalMode()
  const autoHidePlayBar = useSettingValue('common.autoHidePlayBar')
  const navActiveId = useNavActiveId()
  const targetComponentId = componentId ?? commonState.componentIds.home
  // 手机迷你条 43dp 胶囊；横屏对齐 Sonify 平板条 62dp。
  const barHeight = wide ? 62 : 43
  const barRadius = barHeight / 2

  const playerComponent = useMemo(() => {
    const content = (
      <View style={embedded ? embeddedLayout.content : styles.content}>
        <View style={styles.left}>
          <Pic isHome={isHome} embedded={embedded} componentId={targetComponentId} />
        </View>
        <View style={styles.center}>
          <Title isHome={isHome} componentId={targetComponentId} />
        </View>
        <View style={styles.right}>
          <ControlBtn dense={!wide} />
        </View>
      </View>
    )

    if (embedded) return content

    return (
      <View style={styles.detailWrap}>
        <LiquidGlass radius={barRadius} shadow={false} style={[styles.docked, { minHeight: barHeight, borderRadius: barRadius }]}>
          {content}
        </LiquidGlass>
      </View>
    )
  }, [barHeight, barRadius, embedded, isHome, targetComponentId, wide])

  if (isHome && navActiveId == 'nav_setting') return null
  return autoHidePlayBar && keyboardShown ? null : playerComponent
})


const styles = createStyle({
  detailWrap: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 10,
  },
  // 详情页/横屏的浮动迷你条：内容布局落在这里，圆角与阴影由 LiquidGlass 绘制
  docked: {
    minHeight: 43,
    paddingVertical: 0,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  left: {
    flexGrow: 0,
    flexShrink: 0,
  },
  center: {
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
    paddingLeft: 8,
    paddingRight: 5,
    justifyContent: 'center',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 0,
    flexShrink: 0,
  },
})

// 首页胶囊高度是固定 dp。这里不能走 createStyle，否则 padding 和封面会被放大到槽位外面。
const embeddedLayout = StyleSheet.create({
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 8,
    overflow: 'hidden',
  },
})
