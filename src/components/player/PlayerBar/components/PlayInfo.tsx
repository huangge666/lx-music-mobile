import { useCallback, useState } from 'react'
import { View } from 'react-native'

import Progress, { ProgressPlain } from '@/components/player/Progress'
import { usePlayerMusicInfo, useProgress, useStatusText } from '@/store/player/hook'
import { createStyle } from '@/utils/tools'
import { COMPONENT_IDS } from '@/config/constant'
import { usePageVisible } from '@/store/common/hook'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { useBufferProgress } from '@/plugins/player'
import { useSettingValue } from '@/store/setting/hook'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'

const TRACK_HEIGHT = scaleSizeH(2)
// 触控热区上下留白 — 保证小播放栏内进度条仍可舒适拖动
const HIT_PADDING = scaleSizeH(6)

/**
 * 小播放栏播放信息区
 *
 * 只负责进度条；时间文字已迁到 Title 区（与歌手名同一行右侧）。
 *
 * 加载状态：歌曲未加载成功时（maxPlayTime === 0），
 * 显示当前加载状态文字（statusText），替代进度条，
 * 参考项目最初的歌曲加载提示设计。
 */
export default ({ isHome }: { isHome: boolean }) => {
  const [autoUpdate, setAutoUpdate] = useState(true)
  const playerMusicInfo = usePlayerMusicInfo()
  const { progress, maxPlayTime } = useProgress(autoUpdate)
  const buffered = useBufferProgress()
  const allowProgressBarSeek = useSettingValue('common.allowProgressBarSeek')
  const statusText = useStatusText()
  const theme = useTheme()

  usePageVisible([COMPONENT_IDS.home], useCallback((visible) => {
    if (isHome) setAutoUpdate(visible)
  }, [isHome]))

  // 没有歌曲时不渲染进度条
  if (!playerMusicInfo.id) return null

  // 歌曲未加载成功时显示加载状态文字
  const isLoaded = maxPlayTime > 0
  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingRow}>
          <Text
            size={10}
            color={theme['c-font-label']}
            numberOfLines={1}
            style={styles.loadingText}
          >
            {statusText || '...'}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.progressRow}>
        {
          allowProgressBarSeek
            ? <Progress progress={progress} duration={maxPlayTime} buffered={buffered} trackHeight={TRACK_HEIGHT} showDot />
            : <ProgressPlain progress={progress} duration={maxPlayTime} buffered={buffered} trackHeight={TRACK_HEIGHT} />
        }
      </View>
    </View>
  )
}


const styles = createStyle({
  container: {
    width: '100%',
    paddingRight: scaleSizeW(5),
    paddingTop: scaleSizeH(2),
  },
  progressRow: {
    // 可视轨道 2pt；上下 padding 各 6pt 撑出触控热区，跟手
    height: TRACK_HEIGHT + HIT_PADDING * 2,
    paddingVertical: HIT_PADDING,
    justifyContent: 'center',
  },
  // 加载状态行 — 与进度条等高，避免布局跳动
  loadingRow: {
    height: TRACK_HEIGHT + HIT_PADDING * 2,
    justifyContent: 'center',
  },
  loadingText: {
    letterSpacing: 0.2,
  },
})
