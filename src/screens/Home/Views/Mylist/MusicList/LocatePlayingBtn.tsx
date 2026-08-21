import { memo } from 'react'
import { Platform, TouchableOpacity, View } from 'react-native'
import { useI18n } from '@/lang'
import { usePlayMusicInfo } from '@/store/player/hook'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'

export interface LocatePlayingBtnProps {
  onPress: () => void
}

/**
 * 右下角定位当前播放悬浮按钮（纯图标）
 *
 * 无正在播放歌曲时不渲染；点击后交由列表滚动到对应位置。
 */
export default memo(({ onPress }: LocatePlayingBtnProps) => {
  const t = useI18n()
  const theme = useTheme()
  const playMusicInfo = usePlayMusicInfo()

  if (!playMusicInfo.musicInfo) return null

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={t('list_locate_playing')}
      onPress={onPress}
      style={{
        ...styles.btn,
        backgroundColor: theme['c-primary'],
        borderColor: theme['c-primary-alpha-700'],
      }}
    >
      <View style={styles.locateIcon}>
        <View style={styles.locateRing}>
          <View style={styles.locateDot} />
        </View>
        <View style={styles.locateLineTop} />
        <View style={styles.locateLineRight} />
        <View style={styles.locateLineBottom} />
        <View style={styles.locateLineLeft} />
      </View>
    </TouchableOpacity>
  )
})

const styles = createStyle({
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 14,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  locateIcon: {
    position: 'relative',
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locateRing: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locateDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  locateLineTop: {
    position: 'absolute',
    top: 0,
    width: 1.5,
    height: 5,
    backgroundColor: '#fff',
  },
  locateLineRight: {
    position: 'absolute',
    right: 0,
    width: 5,
    height: 1.5,
    backgroundColor: '#fff',
  },
  locateLineBottom: {
    position: 'absolute',
    bottom: 0,
    width: 1.5,
    height: 5,
    backgroundColor: '#fff',
  },
  locateLineLeft: {
    position: 'absolute',
    left: 0,
    width: 5,
    height: 1.5,
    backgroundColor: '#fff',
  },
})
