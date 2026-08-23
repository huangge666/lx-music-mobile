import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
import { useIsPlay } from '@/store/player/hook'
import { useLayout } from '@/utils/hooks'
import { marginLeft } from '../constant'
import { BTN_WIDTH } from '../MoreBtn/Btn'
import { MacSpacing } from '../../macOS'

/**
 * macOS 风格横屏主控制按钮
 *
 * 横屏空间有限 — 三个按钮水平排开，主按钮居中突出
 * — 上一首 / 下一首使用次要灰阶色
 * — 主播放按钮使用主色填充圆形按钮
 */
const PrevBtn = ({ size }: { size: number }) => {
  const theme = useTheme()
  const handlePlayPrev = () => {
    void playPrev()
  }
  return (
    <TouchableOpacity
      style={{ ...styles.cotrolBtn, width: size, height: size }}
      activeOpacity={0.6}
      onPress={handlePlayPrev}
      hitSlop={6}
    >
      <Icon name="prevMusic" color={theme['c-font']} rawSize={size * 0.5} />
    </TouchableOpacity>
  )
}

const NextBtn = ({ size }: { size: number }) => {
  const theme = useTheme()
  const handlePlayNext = () => {
    void playNext()
  }
  return (
    <TouchableOpacity
      style={{ ...styles.cotrolBtn, width: size, height: size }}
      activeOpacity={0.6}
      onPress={handlePlayNext}
      hitSlop={6}
    >
      <Icon name="nextMusic" color={theme['c-font']} rawSize={size * 0.5} />
    </TouchableOpacity>
  )
}

const TogglePlayBtn = ({ size }: { size: number }) => {
  const theme = useTheme()
  const isPlay = useIsPlay()
  return (
    <TouchableOpacity
      style={{
        ...styles.toggleBtn,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme['c-primary'],
        borderWidth: 0.5,
        borderColor: theme['c-glass-border'],
      }}
      activeOpacity={0.75}
      onPress={togglePlay}
      hitSlop={6}
    >
      <Icon
        name={isPlay ? 'pause' : 'play'}
        color="#ffffff"
        rawSize={size * 0.45}
      />
    </TouchableOpacity>
  )
}

const MIN_SIZE = BTN_WIDTH * 1.1
const MAX_SIZE = 88

export default () => {
  const { onLayout, height, width } = useLayout()
  const size = Math.max(
    Math.min(height * 0.5, MAX_SIZE, (width - marginLeft) * 0.18),
    MIN_SIZE,
  )
  const subSize = Math.max(size * 0.78, MIN_SIZE * 0.85)

  return (
    <View style={styles.content} onLayout={onLayout}>
      <PrevBtn size={subSize} />
      <TogglePlayBtn size={size} />
      <NextBtn size={subSize} />
    </View>
  )
}


const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    gap: MacSpacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: MacSpacing.xs,
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
