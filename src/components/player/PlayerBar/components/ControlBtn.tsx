import { TouchableOpacity, View } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useIsPlay } from '@/store/player/hook'
import { useTheme } from '@/store/theme/hook'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
import { createStyle } from '@/utils/tools'
import { useHorizontalMode } from '@/utils/hooks'
import { useI18n } from '@/lang'

const NEXT_ICON_SIZE = 16
const PREV_ICON_SIZE = 16
const PLAY_ICON_SIZE = 18

const handlePlayPrev = () => {
  void playPrev()
}
const handlePlayNext = () => {
  void playNext()
}

const PlayPrevBtn = () => {
  const theme = useTheme()
  const t = useI18n()
  return (
    <TouchableOpacity style={styles.sideBtn} activeOpacity={0.5} onPress={handlePlayPrev} accessibilityRole="button" accessibilityLabel={t('play_prev')}>
      <Icon name="prevMusic" color={theme['c-font-label']} size={PREV_ICON_SIZE} />
    </TouchableOpacity>
  )
}

const PlayNextBtn = () => {
  const theme = useTheme()
  const t = useI18n()
  return (
    <TouchableOpacity style={styles.sideBtn} activeOpacity={0.5} onPress={handlePlayNext} accessibilityRole="button" accessibilityLabel={t('play_next')}>
      <Icon name="nextMusic" color={theme['c-font-label']} size={NEXT_ICON_SIZE} />
    </TouchableOpacity>
  )
}

const TogglePlayBtn = () => {
  const isPlay = useIsPlay()
  const theme = useTheme()
  const t = useI18n()
  return (
    <TouchableOpacity
      style={styles.playBtn}
      activeOpacity={0.6}
      onPress={togglePlay}
      accessibilityRole="button"
      accessibilityLabel={t(isPlay ? 'pause' : 'play')}
    >
      <View style={[styles.playInner, { backgroundColor: theme['c-accent'] }]}>
        <Icon name={isPlay ? 'pause' : 'play'} color={theme.isDark ? 'rgb(18, 16, 14)' : 'rgb(255, 255, 255)'} size={PLAY_ICON_SIZE} />
      </View>
    </TouchableOpacity>
  )
}

export default () => {
  const isHorizontalMode = useHorizontalMode()
  return (
    <>
      { isHorizontalMode ? <PlayPrevBtn /> : null }
      <TogglePlayBtn />
      <PlayNextBtn />
    </>
  )
}

const styles = createStyle({
  // 热区实际参与布局，避免相邻按钮的 hitSlop 重叠；可视图标仍保持轻量。
  sideBtn: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtn: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
