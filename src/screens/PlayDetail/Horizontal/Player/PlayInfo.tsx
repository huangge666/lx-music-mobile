import { memo, useRef } from 'react'
import { TouchableOpacity, View } from 'react-native'

import Progress from '@/components/player/Progress'
import Status from './Status'
import { usePlayerMusicInfo, useProgress } from '@/store/player/hook'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { useBufferProgress } from '@/plugins/player'
import Badge from '@/components/common/Badge'
import { MacSpacing, MacFontSize } from '../../macOS'
import QualitySwitchPopup, { type QualitySwitchPopupType } from '../../components/QualitySwitchPopup'


/**
 * macOS 风格横屏进度卡
 *
 * 紧凑布局：进度条 + 状态 / 时间合并为单行
 *   ┌────────────────────────────────────────┐
 *  │  ▰▰▰▰▰▰▰▰▰▱▱▱▱▱▱▱  ▶ 状态  HQ  01:23/04:56 │
 *  └────────────────────────────────────────┘
 */
const PlayTimeCurrent = ({ timeStr }: { timeStr: string }) => {
  const theme = useTheme()
  return (
    <Text color={theme['c-font-label']} size={MacFontSize.caption} style={styles.timeText}>
      {timeStr}
    </Text>
  )
}

const PlayTimeMax = memo(({ timeStr }: { timeStr: string }) => {
  const theme = useTheme()
  return (
    <Text color={theme['c-font-label']} size={MacFontSize.caption} style={styles.timeText}>
      {timeStr}
    </Text>
  )
})

export default () => {
  const theme = useTheme()
  const playerMusicInfo = usePlayerMusicInfo()
  const { maxPlayTimeStr, nowPlayTimeStr, progress, maxPlayTime } = useProgress()
  const buffered = useBufferProgress()
  // 音质切换弹窗引用
  const qualityPopupRef = useRef<QualitySwitchPopupType>(null)

  return (
    <View style={styles.container}>
      {/* 进度条 — 置于底部，绝对定位铺满 */}
      <View style={[StyleSheetAbsolute.progress, { justifyContent: 'center' }]}>
        <Progress progress={progress} duration={maxPlayTime} buffered={buffered} />
      </View>

      {/* 状态 / 时间 / 品质 — 浮于进度条之上 */}
      <View style={styles.infoRow}>
        <View style={styles.status}>
          <Status />
        </View>
        <View style={styles.timeRow}>
          {playerMusicInfo.quality
            ? (
                // 点击音质标签打开音质切换弹窗
                <TouchableOpacity
                  style={styles.qualityBtn}
                  onPress={() => { qualityPopupRef.current?.show() }}
                  activeOpacity={0.7}
                >
                  <Badge type="tertiary">{playerMusicInfo.quality}</Badge>
                </TouchableOpacity>
              )
            : null}
          <PlayTimeCurrent timeStr={nowPlayTimeStr} />
          <Text color={theme['c-500']} size={MacFontSize.caption}> / </Text>
          <PlayTimeMax timeStr={maxPlayTimeStr} />
        </View>
      </View>

      <QualitySwitchPopup ref={qualityPopupRef} />
    </View>
  )
}

const StyleSheetAbsolute = {
  progress: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
}


const styles = createStyle({
  container: {
    width: '100%',
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: MacSpacing.xs,
  },
  infoRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  status: {
    flexGrow: 1,
    flexShrink: 1,
    paddingRight: MacSpacing.sm,
  },
  timeRow: {
    flexGrow: 0,
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  // 音质点击区域，扩大热区便于触控
  qualityBtn: {
    minWidth: 40,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.2,
  },
})
