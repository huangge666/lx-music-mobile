import { memo } from 'react'
import { View, StatusBar as RNStatusBar, StyleSheet, TouchableOpacity } from 'react-native'
import { pop } from '@/navigation'
import commonState from '@/store/common/state'
import { useStatusbarHeight } from '@/store/common/hook'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { Icon } from '@/components/common/Icon'
import Image from '@/components/common/Image'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { HEADER_HEIGHT as _HEADER_HEIGHT, NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { Immersive, MacSpacing } from '../../macOS'

export const HEADER_HEIGHT = scaleSizeH(_HEADER_HEIGHT)

const CIRCLE = 48

/**
 * 沉浸式顶栏
 * — 左侧圆形下拉关闭（关闭播放详情）
 * — 歌词态右侧显示封面缩略图，点击回到封面
 */
export default memo(({ showLyric, onBackToCover, onShowLyric }: {
  showLyric?: boolean
  onBackToCover?: () => void
  onShowLyric?: () => void
}) => {
  const t = useI18n()
  const statusBarHeight = useStatusbarHeight()
  const musicInfo = usePlayerMusicInfo()

  const back = () => {
    void pop(commonState.componentIds.playDetail!)
  }

  return (
    <View
      style={{ height: HEADER_HEIGHT + statusBarHeight, paddingTop: statusBarHeight }}
      nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_header}
    >
      <RNStatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={back}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('close')}
        >
          <Icon
            name="chevron-down"
            color={Immersive.text}
            rawSize={scaleSizeW(22)}
          />
        </TouchableOpacity>
        <View style={styles.brand}>
          <Text size={10} color={Immersive.textSecondary} style={styles.brandText}>LX / MUSIC</Text>
          <Text size={13} color={Immersive.text} style={styles.nowPlaying}>{t('player_now_playing')}</Text>
        </View>
        <View style={styles.spacer} />
        <TouchableOpacity
          style={styles.modeBtn}
          onPress={showLyric ? onBackToCover : onShowLyric}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t(showLyric ? 'player_show_cover' : 'player_show_lyrics')}
        >
          {showLyric
            ? <Image url={musicInfo.pic} style={styles.coverThumb} />
            : <Icon name="lyric-on" color={Immersive.text} size={19} />}
          <Text color={Immersive.text} size={13} style={styles.modeLabel}>{t(showLyric ? 'player_cover' : 'player_lyrics')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
})


const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: MacSpacing.xl,
  },
  circleBtn: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    backgroundColor: Immersive.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Immersive.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    flex: 1,
  },
  modeBtn: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Immersive.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Immersive.glassBorder,
  },
  modeLabel: { marginLeft: 8, fontWeight: '600' },
  brand: { marginLeft: 12, gap: 3 },
  brandText: { fontWeight: '700', letterSpacing: 2 },
  nowPlaying: { fontWeight: '500' },
  coverThumb: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
})
