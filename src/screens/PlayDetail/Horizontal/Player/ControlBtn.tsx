import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
import { useIsPlay, usePlayerMusicInfo } from '@/store/player/hook'
import { useWindowSize } from '@/utils/hooks'
import { useI18n } from '@/lang'
import { Immersive } from '../../macOS'

/**
 * 横屏主控制使用与竖屏相同的强调色和点按合同。
 * 固定最小热区，不用自身 onLayout 反推自身尺寸，避免短屏首次测量时反复伸缩。
 */
const PrevBtn = ({ size }: { size: number }) => {
  const t = useI18n()
  const hasTrack = !!usePlayerMusicInfo().id
  const handlePlayPrev = () => {
    void playPrev()
  }
  return (
    <TouchableOpacity
      style={{ ...styles.cotrolBtn, width: size, height: size }}
      activeOpacity={0.6}
      onPress={handlePlayPrev}
      disabled={!hasTrack}
      accessibilityRole="button"
      accessibilityLabel={t('play_detail_action_prev')}
      accessibilityState={{ disabled: !hasTrack }}
    >
      <Icon name="prevMusic" color={Immersive.text} rawSize={size * 0.5} />
    </TouchableOpacity>
  )
}

const NextBtn = ({ size }: { size: number }) => {
  const t = useI18n()
  const hasTrack = !!usePlayerMusicInfo().id
  const handlePlayNext = () => {
    void playNext()
  }
  return (
    <TouchableOpacity
      style={{ ...styles.cotrolBtn, width: size, height: size }}
      activeOpacity={0.6}
      onPress={handlePlayNext}
      disabled={!hasTrack}
      accessibilityRole="button"
      accessibilityLabel={t('play_detail_action_next')}
      accessibilityState={{ disabled: !hasTrack }}
    >
      <Icon name="nextMusic" color={Immersive.text} rawSize={size * 0.5} />
    </TouchableOpacity>
  )
}

const TogglePlayBtn = ({ size }: { size: number }) => {
  const t = useI18n()
  const hasTrack = !!usePlayerMusicInfo().id
  const isPlay = useIsPlay()
  return (
    <TouchableOpacity
      style={{
        ...styles.toggleBtn,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: Immersive.accent,
        opacity: hasTrack ? 1 : 0.45,
      }}
      activeOpacity={0.75}
      onPress={togglePlay}
      disabled={!hasTrack}
      accessibilityRole="button"
      accessibilityLabel={t(isPlay ? 'pause' : 'play')}
      accessibilityState={{ selected: isPlay, disabled: !hasTrack }}
    >
      <Icon
        name={isPlay ? 'pause' : 'play'}
        color="#152310"
        fill="#152310"
        rawSize={size * 0.45}
      />
    </TouchableOpacity>
  )
}

const MIN_SIZE = 58
const MAX_SIZE = 64

export default () => {
  const { width } = useWindowSize()
  const size = Math.max(Math.min(width * 0.075, MAX_SIZE), MIN_SIZE)
  const subSize = 48

  return (
    <View style={styles.content}>
      <PrevBtn size={subSize} />
      <TogglePlayBtn size={size} />
      <NextBtn size={subSize} />
    </View>
  )
}


const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  cotrolBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
})
