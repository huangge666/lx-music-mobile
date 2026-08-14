import { memo } from 'react'
import { View } from 'react-native'

// import Title from './components/Title'
import { createStyle } from '@/utils/tools'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import PlayInfo from './PlayInfo'
import ControlBtn from './ControlBtn'
import { marginLeftRaw } from '../constant'
import { useTheme } from '@/store/theme/hook'
import { MacRadius, MacSpacing, getMacGlassBackground, getMacGlassBorder } from '../../macOS'


/**
 * macOS 风格横屏播放控制区
 *
 * 横屏布局（左 45% / 右 55%）：
 *
 *  ┌─ Card 1: 播放控制 ────────────┐
 *  │      ⏮    ⏯    ⏭              │
 *  └────────────────────────────────┘
 *  ┌─ Card 2: 进度 + 时间 ─────────┐
 *  │  ▰▰▰▰▰▰▰▰▰▱▱▱▱▱▱▱  01:23 / 04:56 │
 *  └────────────────────────────────┘
 *
 * 每张卡都是独立的毛玻璃面板，间距 8pt
 */
export default memo(() => {
  const theme = useTheme()
  const isDark = !!theme.isDark

  const cardBase = {
    backgroundColor: getMacGlassBackground(isDark),
    borderColor: getMacGlassBorder(isDark),
    borderWidth: 0.5,
    borderRadius: MacRadius.md,
  } as const

  return (
    <View style={styles.container} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_player}>
      {/* 卡片 1 — 主播放控制（上一首 / 播放 / 下一首） */}
      <View style={[styles.card, styles.controlCard, cardBase]}>
        <ControlBtn />
      </View>

      {/* 卡片 2 — 进度 + 时间 / 状态 */}
      <View style={[styles.card, cardBase]}>
        <PlayInfo />
      </View>
    </View>
  )
})

const styles = createStyle({
  container: {
    flexShrink: 0,
    flexGrow: 1,
    marginLeft: marginLeftRaw,
    paddingVertical: MacSpacing.sm,
    paddingRight: MacSpacing.md,
    // 卡片之间间距
    gap: 8,
  },
  card: {
    width: '100%',
    paddingVertical: MacSpacing.sm,
    paddingHorizontal: MacSpacing.md,
  },
  controlCard: {
    // 主控制卡需要更大的内边距，确保按钮触控舒适
    paddingVertical: MacSpacing.md,
    paddingHorizontal: MacSpacing.lg,
  },
})
