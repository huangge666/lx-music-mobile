import { memo } from 'react'
import { Platform, TouchableOpacity } from 'react-native'
import { Icon } from '@/components/common/Icon'
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
        backgroundColor: theme['c-glass-background'],
        borderColor: theme['c-glass-border'],
      }}
    >
      <Icon name="crosshair" size={18} color={theme['c-accent']} />
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
})
