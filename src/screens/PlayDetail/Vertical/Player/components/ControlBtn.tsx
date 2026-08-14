import { TouchableOpacity, View } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
import { useIsPlay } from '@/store/player/hook'
import { createStyle } from '@/utils/tools'
import { useWindowSize } from '@/utils/hooks'
import { Immersive, MacSpacing } from '../../../macOS'


/**
 * 主控制 — 无卡片、无圆形色底，纯白图标浮层
 */
const PrevBtn = ({ size }: { size: number }) => {
  const handlePlayPrev = () => {
    void playPrev()
  }
  return (
    <TouchableOpacity
      style={{ ...styles.cotrolBtn, width: size, height: size }}
      activeOpacity={0.55}
      onPress={handlePlayPrev}
      hitSlop={10}
    >
      <Icon name="prevMusic" color={Immersive.text} rawSize={size * 0.5} />
    </TouchableOpacity>
  )
}

const NextBtn = ({ size }: { size: number }) => {
  const handlePlayNext = () => {
    void playNext()
  }
  return (
    <TouchableOpacity
      style={{ ...styles.cotrolBtn, width: size, height: size }}
      activeOpacity={0.55}
      onPress={handlePlayNext}
      hitSlop={10}
    >
      <Icon name="nextMusic" color={Immersive.text} rawSize={size * 0.5} />
    </TouchableOpacity>
  )
}

const TogglePlayBtn = ({ size }: { size: number }) => {
  const isPlay = useIsPlay()
  return (
    <TouchableOpacity
      style={{
        ...styles.toggleBtn,
        width: size,
        height: size,
      }}
      activeOpacity={0.7}
      onPress={togglePlay}
      hitSlop={10}
    >
      <Icon
        name={isPlay ? 'pause' : 'play'}
        color={Immersive.text}
        rawSize={size * 0.56}
      />
    </TouchableOpacity>
  )
}

const MAX_SIZE = 72
const MIN_SIZE = 58

export default () => {
  const winSize = useWindowSize()
  const size = Math.max(Math.min(winSize.width * 0.16, MAX_SIZE), MIN_SIZE)
  const subSize = Math.max(size * 0.7, MIN_SIZE * 0.7)

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
    justifyContent: 'space-evenly',
    alignItems: 'center',
    flexGrow: 1,
    flexShrink: 1,
    paddingHorizontal: MacSpacing.xxxl,
    // 与进度条、功能栏贴紧
    paddingVertical: MacSpacing.xs,
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
