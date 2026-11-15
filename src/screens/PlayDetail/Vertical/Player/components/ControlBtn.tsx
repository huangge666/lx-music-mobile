import { Pressable, View } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
import { useIsPlay, usePlayerMusicInfo } from '@/store/player/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { useWindowSize } from '@/utils/hooks'
import { Immersive } from '../../../macOS'


/**
 * 主控制 — 无卡片、无圆形色底，纯白图标浮层
 * — 尺寸按屏宽自适应并夹在 58~72 之间，小屏与最大应用字号下都不会挤出控制区
 * — 全部按钮提供本地化读屏文字
 */
const PrevBtn = ({ size }: { size: number }) => {
  const t = useI18n()
  const hasTrack = !!usePlayerMusicInfo().id
  const handlePlayPrev = () => {
    void playPrev()
  }
  return (
    <Pressable
      style={{ ...styles.cotrolBtn, width: size, height: size }}
      onPress={handlePlayPrev}
      disabled={!hasTrack}
      accessibilityState={{ disabled: !hasTrack }}
      accessibilityRole="button"
      accessibilityLabel={t('play_detail_action_prev')}
    >
      <Icon name="prevMusic" color={Immersive.text} rawSize={size * 0.5} />
    </Pressable>
  )
}

const NextBtn = ({ size }: { size: number }) => {
  const t = useI18n()
  const hasTrack = !!usePlayerMusicInfo().id
  const handlePlayNext = () => {
    void playNext()
  }
  return (
    <Pressable
      style={{ ...styles.cotrolBtn, width: size, height: size }}
      onPress={handlePlayNext}
      disabled={!hasTrack}
      accessibilityState={{ disabled: !hasTrack }}
      accessibilityRole="button"
      accessibilityLabel={t('play_detail_action_next')}
    >
      <Icon name="nextMusic" color={Immersive.text} rawSize={size * 0.5} />
    </Pressable>
  )
}

const TogglePlayBtn = ({ size }: { size: number }) => {
  const isPlay = useIsPlay()
  const t = useI18n()
  const hasTrack = !!usePlayerMusicInfo().id
  return (
    <Pressable
      style={({ pressed }) => [{
        ...styles.toggleBtn,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: Immersive.accent,
        opacity: !hasTrack ? 0.45 : pressed ? 0.8 : 1,
        transform: [{ scale: pressed ? 0.94 : 1 }],
      }]}
      onPress={togglePlay}
      disabled={!hasTrack}
      accessibilityRole="button"
      accessibilityLabel={t(isPlay ? 'pause' : 'play')}
      accessibilityState={{ selected: isPlay, disabled: !hasTrack }}
    >
      <Icon
        name={isPlay ? 'pause' : 'play'}
        color="#152310"
        rawSize={size * 0.48}
        fill="#152310"
      />
    </Pressable>
  )
}

const MAX_SIZE = 72
const MIN_SIZE = 58

export default () => {
  const winSize = useWindowSize()
  const size = Math.max(Math.min(winSize.width * 0.16, MAX_SIZE), MIN_SIZE)
  const subSize = Math.max(size * 0.7, 48)

  return (
    <View style={styles.conatiner}>
      <PrevBtn size={subSize} />
      <TogglePlayBtn size={size} />
      <NextBtn size={subSize} />
    </View>
  )
}


const styles = createStyle({
  conatiner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexGrow: 1,
    flexShrink: 1,
    paddingHorizontal: 24,
    // 与进度条、功能栏贴紧
    paddingVertical: 10,
    backgroundColor: 'transparent',
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
