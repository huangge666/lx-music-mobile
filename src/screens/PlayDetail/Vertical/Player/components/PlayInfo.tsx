import { memo, useMemo, useRef } from 'react'
import { View, TouchableOpacity } from 'react-native'

import Progress, { PROGRESS_HEIGHT } from '@/components/player/ProgressBar'
import { usePlayerMusicInfo, useProgress, useStatusText } from '@/store/player/hook'
import { createStyle } from '@/utils/tools'
import { formatPlayTime2 } from '@/utils'
import { getRemainTime, safePlayTime } from '@/utils/playTime'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useBufferProgress } from '@/plugins/player'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import QualitySwitchPopup, { useCurrentQuality, type QualitySwitchPopupType } from '../../../components/QualitySwitchPopup'
import {
  Immersive,
  MacSpacing,
  MacFontSize,
} from '../../../macOS'


/**
 * 进度区 — 无卡片背景
 * 左已播 / 中状态或音质 / 右剩余 -m:ss
 *
 * 约定：
 * — 总时长未知（还没取到 duration）时不画进度条，用状态文字占同一块高度，避免出现 NaN:NaN；
 * — 设置里关闭「允许拖动进度条」时进度条只展示、不挂手势，也不画拖拽手柄；
 * — 播放中出现的缓冲/取链/失败状态显示在中间槽位，不挤占进度条，也不改变布局高度。
 */
const PlayTime = memo(({ timeStr }: { timeStr: string }) => {
  return (
    <Text
      color={Immersive.textSecondary}
      size={MacFontSize.caption}
      numberOfLines={1}
      style={styles.timeText}
    >
      {timeStr}
    </Text>
  )
})

export default () => {
  const { progress, maxPlayTime, nowPlayTime } = useProgress()
  const playerMusicInfo = usePlayerMusicInfo()
  const buffered = useBufferProgress()
  const statusText = useStatusText()
  const allowSeek = useSettingValue('common.allowProgressBarSeek')
  const t = useI18n()
  // 音质切换弹窗引用
  const qualityPopupRef = useRef<QualitySwitchPopupType>(null)

  const hasTrack = !!playerMusicInfo.id
  // 歌曲是否已加载成功（有总时长说明音频已就绪）
  const duration = safePlayTime(maxPlayTime)
  const isLoaded = duration > 0
  const played = Math.min(safePlayTime(nowPlayTime), duration)

  const playedStr = useMemo(() => formatPlayTime2(played), [played])
  const remainStr = useMemo(() => `-${formatPlayTime2(getRemainTime(duration, played))}`, [duration, played])

  const quality = useCurrentQuality()
  const qLabel = useMemo(() => {
    if (!hasTrack || !quality) return ''
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
  }, [hasTrack, quality, t])

  // 没有当前曲目、也没有可展示状态时整块收起，避免留下空进度条
  if (!hasTrack && !statusText) return null

  return (
    <View style={styles.container}>
      <View style={[styles.trackRow, { height: PROGRESS_HEIGHT }]}>
        {isLoaded
          ? (
              <Progress
                progress={progress}
                duration={duration}
                buffered={buffered}
                seekable={allowSeek}
                playedColor={Immersive.fill}
                bufferedColor="rgba(255,255,255,0.16)"
                dotColor={Immersive.fill}
                trackColor={Immersive.track}
              />
            )
          : (
              <View style={styles.loadingContainer}>
                <Text
                  color={Immersive.textSecondary}
                  size={MacFontSize.footnote}
                  numberOfLines={1}
                  accessibilityLabel={statusText || t('player__loading')}
                  style={styles.loadingText}
                >
                  {statusText || t('player__loading')}
                </Text>
              </View>
            )}
      </View>

      <View style={styles.info}>
        <PlayTime timeStr={playedStr} />

        <View style={styles.status}>
          {/* 中间槽位只显示一条信息：已加载时优先显示播放状态（缓冲/取链/失败），否则显示音质入口 */}
          {isLoaded && statusText
            ? (
                <Text
                  color={Immersive.textSecondary}
                  size={MacFontSize.caption}
                  numberOfLines={1}
                  accessibilityLabel={statusText}
                  style={styles.statusText}
                >
                  {statusText}
                </Text>
              )
            : qLabel
              ? (
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

        <PlayTime timeStr={remainStr} />
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
  // 进度条与加载态共用同一高度（高度用实测缩放值内联给出，避免再被 createStyle 缩放一次）
  trackRow: {
    width: '100%',
    justifyContent: 'center',
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
  statusText: {
    letterSpacing: 0.2,
    opacity: 0.9,
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
  },
  loadingText: {
    textAlign: 'center',
    letterSpacing: 0.3,
    opacity: 0.85,
  },
})
