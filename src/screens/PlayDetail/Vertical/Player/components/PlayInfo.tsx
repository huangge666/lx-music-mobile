import { memo, useMemo } from 'react'
import { View } from 'react-native'

import Progress from '@/components/player/ProgressBar'
import { usePlayerMusicInfo, useProgress } from '@/store/player/hook'
import { createStyle } from '@/utils/tools'
import { formatPlayTime2 } from '@/utils'
import Text from '@/components/common/Text'
import { useBufferProgress } from '@/plugins/player'
import { useI18n } from '@/lang'
import {
  Immersive,
  MacSpacing,
  MacFontSize,
} from '../../../macOS'


/**
 * 进度区 — 无卡片背景
 * 左已播 / 中音质纯文字 / 右剩余 -m:ss
 */
const PlayTimeCurrent = ({ timeStr }: { timeStr: string }) => {
  return (
    <Text color={Immersive.textSecondary} size={MacFontSize.caption} style={styles.timeText}>
      {timeStr}
    </Text>
  )
}

const PlayTimeRemain = memo(({ remainStr }: { remainStr: string }) => {
  return (
    <Text color={Immersive.textSecondary} size={MacFontSize.caption} style={styles.timeText}>
      {remainStr}
    </Text>
  )
})

export default () => {
  const { nowPlayTimeStr, progress, maxPlayTime, nowPlayTime } = useProgress()
  const playerMusicInfo = usePlayerMusicInfo()
  const buffered = useBufferProgress()
  const t = useI18n()

  const remainStr = useMemo(() => {
    const remain = Math.max(0, maxPlayTime - nowPlayTime)
    return `-${formatPlayTime2(remain)}`
  }, [maxPlayTime, nowPlayTime])

  const qLabel = useMemo(() => {
    const quality = playerMusicInfo.quality
    if (!quality) return ''
    switch (quality) {
      case 'flac24bit':
        return t('quality_lossless_24bit')
      case 'flac':
      case 'ape':
      case 'wav':
        return '无损'
      case '320k':
        return t('quality_high_quality')
      case '192k':
      case '128k':
        return quality.toUpperCase()
      default:
        return String(quality)
    }
  }, [playerMusicInfo.quality, t])

  return (
    <View style={styles.container}>
      <View style={styles.progressRow}>
        <Progress
          progress={progress}
          duration={maxPlayTime}
          buffered={buffered}
          playedColor={Immersive.fill}
          bufferedColor="rgba(255,255,255,0.16)"
          dotColor={Immersive.fill}
          trackColor={Immersive.track}
        />
      </View>

      <View style={styles.info}>
        <PlayTimeCurrent timeStr={nowPlayTimeStr} />

        <View style={styles.status}>
          {qLabel
            ? (
                <Text color={Immersive.textSecondary} size={MacFontSize.caption} style={styles.quality}>
                  {qLabel}
                </Text>
              )
            : null}
        </View>

        <PlayTimeRemain remainStr={remainStr} />
      </View>
    </View>
  )
}


const styles = createStyle({
  container: {
    width: '100%',
    flexDirection: 'column',
    backgroundColor: 'transparent',
  },
  progressRow: {
    width: '100%',
    paddingTop: 0,
    paddingBottom: 0,
  },
  info: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  status: {
    flexGrow: 1,
    flexShrink: 1,
    paddingHorizontal: MacSpacing.sm,
    alignItems: 'center',
  },
  // 音质仅文字，无胶囊底
  quality: {
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  timeText: {
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.2,
    minWidth: 42,
  },
})
