import { TouchableOpacity, View } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
import { useIsPlay } from '@/store/player/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { useWindowSize } from '@/utils/hooks'
import { Immersive, MacSpacing } from '../../../macOS'


/**
 * 主控制 — 无卡片、无圆形色底，纯白图标浮层
 * — 尺寸按屏宽自适应并夹在 58~72 之间，小屏与最大应用字号下都不会挤出控制区
 * — 全部按钮提供本地化读屏文字
 */
const PrevBtn = ({ size }: { size: number }) => {
  const t = useI18n()
  const handlePlayPrev = () => {
    void playPrev()
  }
  return (
    <TouchableOpacity
      style={{ ...styles.cotrolBtn, width: size, height: size }}
      activeOpacity={0.55}
      onPress={handlePlayPrev}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={t('play_detail_action_prev')}
    >
      <Icon name="prevMusic" color={Immersive.text} rawSize={size * 0.5} />
    </TouchableOpacity>
  )
}

const NextBtn = ({ size }: { size: number }) => {
  const t = useI18n()
  const handlePlayNext = () => {
    void playNext()
  }
  return (
    <TouchableOpacity
      style={{ ...styles.cotrolBtn, width: size, height: size }}
      activeOpacity={0.55}
      onPress={handlePlayNext}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={t('play_detail_action_next')}
    >
      <Icon name="nextMusic" color={Immersive.text} rawSize={size * 0.5} />
    </TouchableOpacity>
  )
}

const TogglePlayBtn = ({ size }: { size: number }) => {
  const isPlay = useIsPlay()
  const t = useI18n()
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
      accessibilityRole="button"
      accessibilityLabel={t(isPlay ? 'pause' : 'play')}
      accessibilityState={{ selected: isPlay }}
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
