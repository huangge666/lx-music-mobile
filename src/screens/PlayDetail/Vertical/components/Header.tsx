import { memo, useEffect } from 'react'
import { View, StatusBar as RNStatusBar, StyleSheet, TouchableOpacity } from 'react-native'
import { pop } from '@/navigation'
import StatusBar from '@/components/common/StatusBar'
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

const CIRCLE = scaleSizeW(38)

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

  useEffect(() => {
    RNStatusBar.setBarStyle('light-content')
  }, [])

  const back = () => {
    void pop(commonState.componentIds.playDetail!)
  }

  return (
    <View
      style={{ height: HEADER_HEIGHT + statusBarHeight, paddingTop: statusBarHeight }}
      nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_header}
    >
      <StatusBar />
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
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Immersive.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Immersive.glassBorder,
  },
  modeLabel: { marginLeft: 8, fontWeight: '600' },
  coverThumb: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
})
