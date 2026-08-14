import { TouchableOpacity, View } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useIsPlay } from '@/store/player/hook'
import { useTheme } from '@/store/theme/hook'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
import { createStyle } from '@/utils/tools'
import { useHorizontalMode } from '@/utils/hooks'

// 下一首图标 — 次要色
const NEXT_ICON_SIZE = 16
// 上一首图标 — 次要色
const PREV_ICON_SIZE = 16
// 播放按钮内次要色图标
const PLAY_ICON_SIZE = 18

const handlePlayPrev = () => {
  void playPrev()
}
const handlePlayNext = () => {
  void playNext()
}

const PlayPrevBtn = () => {
  const theme = useTheme()
  return (
    <TouchableOpacity style={styles.sideBtn} activeOpacity={0.5} onPress={handlePlayPrev}>
      <Icon name='prevMusic' color={theme['c-font-label']} size={PREV_ICON_SIZE} />
    </TouchableOpacity>
  )
}

const PlayNextBtn = () => {
  const theme = useTheme()
  return (
    <TouchableOpacity style={styles.sideBtn} activeOpacity={0.5} onPress={handlePlayNext}>
      {/* 下一首 — 次要色，层级低于播放按钮 */}
      <Icon name='nextMusic' color={theme['c-font-label']} size={NEXT_ICON_SIZE} />
    </TouchableOpacity>
  )
}

const TogglePlayBtn = () => {
  const isPlay = useIsPlay()
  const theme = useTheme()
  return (
    <TouchableOpacity
      style={styles.playBtn}
      activeOpacity={0.6}
      onPress={togglePlay}
    >
      <View style={styles.playInner}>
        {/* 透明背景 + 次要色图标，线性、轻量、克制 */}
        <Icon name={isPlay ? 'pause' : 'play'} color={theme['c-font-label']} size={PLAY_ICON_SIZE} />
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
  // 上下首热区 — 28×36，轻量，跟手
  sideBtn: {
    width: 28,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 播放/暂停 — 透明背景 + 次要色图标，线性、克制
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    // 与两侧按钮拉开少量间距，制造呼吸感
    marginHorizontal: 3,
  },
  playInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
