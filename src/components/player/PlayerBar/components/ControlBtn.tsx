import { StyleSheet, TouchableOpacity } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useIsPlay } from '@/store/player/hook'
import { useTheme } from '@/store/theme/hook'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
import { createStyle } from '@/utils/tools'
import { useHorizontalMode } from '@/utils/hooks'
import { useI18n } from '@/lang'

const NEXT_ICON_SIZE = 22
const PREV_ICON_SIZE = 20
const PLAY_ICON_SIZE = 24

const handlePlayPrev = () => {
  void playPrev()
}
const handlePlayNext = () => {
  void playNext()
}

const PlayPrevBtn = ({ dense = false }: { dense?: boolean }) => {
  const theme = useTheme()
  const t = useI18n()
  return (
    <TouchableOpacity style={dense ? denseStyles.btn : styles.sideBtn} activeOpacity={0.5} onPress={handlePlayPrev} accessibilityRole="button" accessibilityLabel={t('play_prev')}>
      <Icon name="prevMusic" color={theme['c-font']} size={dense ? 22 : PREV_ICON_SIZE} fill={theme['c-font']} />
    </TouchableOpacity>
  )
}

const PlayNextBtn = ({ dense = false }: { dense?: boolean }) => {
  const theme = useTheme()
  const t = useI18n()
  return (
    <TouchableOpacity style={[dense ? denseStyles.btn : styles.sideBtn, dense ? denseStyles.next : null]} activeOpacity={0.5} onPress={handlePlayNext} accessibilityRole="button" accessibilityLabel={t('play_next')}>
      <Icon name="nextMusic" color={theme['c-font']} size={dense ? 22 : NEXT_ICON_SIZE} fill={theme['c-font']} />
    </TouchableOpacity>
  )
}

/**
 * 迷你播放器的播放/暂停。
 * 对齐 Sonify 迷你条：纯图标，手机热区 30dp，不套实底圆。
 */
const TogglePlayBtn = ({ dense = false }: { dense?: boolean }) => {
  const isPlay = useIsPlay()
  const theme = useTheme()
  const t = useI18n()
  return (
    <TouchableOpacity
      style={dense ? denseStyles.btn : styles.playBtn}
      activeOpacity={0.6}
      onPress={togglePlay}
      accessibilityRole="button"
      accessibilityLabel={t(isPlay ? 'pause' : 'play')}
    >
      <Icon name={isPlay ? 'pause' : 'play'} color={theme['c-font']} size={dense ? 22 : PLAY_ICON_SIZE} fill={theme['c-font']} />
    </TouchableOpacity>
  )
}

export default ({ dense = false }: { dense?: boolean }) => {
  const isHorizontalMode = useHorizontalMode()
  return (
    <>
      { isHorizontalMode ? <PlayPrevBtn dense={dense} /> : null }
      <TogglePlayBtn dense={dense} />
      <PlayNextBtn dense={dense} />
    </>
  )
}

const styles = createStyle({
  // 热区实际参与布局，避免相邻按钮的 hitSlop 重叠；可视图标仍保持轻量。
  sideBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

const denseStyles = StyleSheet.create({
  btn: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  next: {
    marginLeft: 9,
  },
})
