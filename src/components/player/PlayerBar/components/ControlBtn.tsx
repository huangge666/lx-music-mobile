import { Pressable, StyleSheet } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useIsPlay } from '@/store/player/hook'
import { useTheme } from '@/store/theme/hook'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
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
    <Pressable style={({ pressed }) => [styles.btn, pressed && { backgroundColor: theme['c-glass-surface'] }]} onPress={handlePlayPrev} accessibilityRole="button" accessibilityLabel={t('play_prev')}>
      <Icon name="prevMusic" color={theme['c-font']} rawSize={dense ? 22 : PREV_ICON_SIZE} fill={theme['c-font']} />
    </Pressable>
  )
}

const PlayNextBtn = ({ dense = false }: { dense?: boolean }) => {
  const theme = useTheme()
  const t = useI18n()
  return (
    <Pressable style={({ pressed }) => [styles.btn, pressed && { backgroundColor: theme['c-glass-surface'] }]} onPress={handlePlayNext} accessibilityRole="button" accessibilityLabel={t('play_next')}>
      <Icon name="nextMusic" color={theme['c-font']} rawSize={dense ? 22 : NEXT_ICON_SIZE} fill={theme['c-font']} />
    </Pressable>
  )
}

/**
 * 迷你播放器的播放/暂停。
 * 图标不加实底；独立的 48dp 热区避免与打开详情、下一首互相抢点击。
 */
const TogglePlayBtn = ({ dense = false }: { dense?: boolean }) => {
  const isPlay = useIsPlay()
  const theme = useTheme()
  const t = useI18n()
  return (
    <Pressable
      style={({ pressed }) => [styles.btn, pressed && { backgroundColor: theme['c-glass-surface'] }]}
      onPress={togglePlay}
      accessibilityRole="button"
      accessibilityLabel={t(isPlay ? 'pause' : 'play')}
    >
      <Icon name={isPlay ? 'pause' : 'play'} color={theme['c-font']} rawSize={dense ? 22 : PLAY_ICON_SIZE} fill={theme['c-font']} />
    </Pressable>
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

const styles = StyleSheet.create({
  btn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
