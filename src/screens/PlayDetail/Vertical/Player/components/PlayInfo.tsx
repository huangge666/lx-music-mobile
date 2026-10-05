import { memo, useMemo, useRef } from 'react'
import { View, TouchableOpacity } from 'react-native'

import Progress from '@/components/player/ProgressBar'
import { usePlayerMusicInfo, useProgress, useStatusText } from '@/store/player/hook'
import { createStyle } from '@/utils/tools'
import { formatPlayTime2 } from '@/utils'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useBufferProgress } from '@/plugins/player'
import { useI18n } from '@/lang'
import QualitySwitchPopup, { useCurrentQuality, type QualitySwitchPopupType } from '../../../components/QualitySwitchPopup'
import {
  Immersive,
  MacSpacing,
  MacFontSize,
} from '../../../macOS'


/**
 * 进度区 — 无卡片背景
 * 左已播 / 中音质纯文字 / 右剩余 -m:ss
 *
 * 加载状态：歌曲未加载成功时（maxPlayTime === 0），
 * 显示当前加载状态文字（statusText），替代进度条
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

/**
 * 加载状态指示器
 * 在歌曲未加载成功时显示当前加载进度文字
 */
const LoadingStatus = ({ statusText }: { statusText: string }) => {
  return (
    <View style={styles.loadingContainer}>
      <Text
        color={Immersive.textSecondary}
        size={MacFontSize.footnote}
        numberOfLines={1}
        style={styles.loadingText}
      >
        {statusText || '...'}
      </Text>
    </View>
  )
}

export default () => {
  const { nowPlayTimeStr, progress, maxPlayTime, nowPlayTime } = useProgress()
  const playerMusicInfo = usePlayerMusicInfo()
  const buffered = useBufferProgress()
  const statusText = useStatusText()
  const t = useI18n()
  // 音质切换弹窗引用
  const qualityPopupRef = useRef<QualitySwitchPopupType>(null)

  // 歌曲是否已加载成功（有总时长说明音频已就绪）
  const isLoaded = maxPlayTime > 0

  const remainStr = useMemo(() => {
    const remain = Math.max(0, maxPlayTime - nowPlayTime)
    return `-${formatPlayTime2(remain)}`
  }, [maxPlayTime, nowPlayTime])

  const quality = useCurrentQuality()
  const qLabel = useMemo(() => {
    if (!quality) return ''
    switch (quality) {
      case 'flac24bit':
        return t('quality_lossless_24bit')
      case 'flac':
      case 'ape':
      case 'wav':
        return t('quality_lossless')
      case '320k':
        return t('quality_high_quality')
      case '192k':
      case '128k':
        return quality.toUpperCase()
      default:
        return String(quality)
    }
  }, [quality, t])

  return (
    <View style={styles.container}>
      {/* 加载状态只替换进度条，音质入口和弹窗始终保留。 */}
      {!isLoaded && playerMusicInfo.id
        ? <LoadingStatus statusText={statusText} />
        : (
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
          )}

      <View style={styles.info}>
        <PlayTimeCurrent timeStr={nowPlayTimeStr} />

        <View style={styles.status}>
          {qLabel
            ? (
                // 点击音质标签打开音质切换弹窗
                <TouchableOpacity
                  style={styles.qualityBtn}
                  onPress={() => { qualityPopupRef.current?.show() }}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={t('player_change_quality', { quality: qLabel })}
                >
                  <Text color={Immersive.textSecondary} size={MacFontSize.caption} style={styles.quality}>
                    {qLabel}
                  </Text>
                  <Icon name="chevron-down" size={12} color={Immersive.textSecondary} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              )
            : null}
        </View>

        <PlayTimeRemain remainStr={remainStr} />
      </View>

      <QualitySwitchPopup ref={qualityPopupRef} />
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
  // 音质点击区域，扩大热区便于触控
  qualityBtn: {
    minWidth: 44,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: MacSpacing.xs,
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
  // 加载状态区域 — 与进度条等高，避免布局跳动
  loadingContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: MacSpacing.sm,
  },
  loadingText: {
    textAlign: 'center',
    letterSpacing: 0.3,
    opacity: 0.85,
  },
})
