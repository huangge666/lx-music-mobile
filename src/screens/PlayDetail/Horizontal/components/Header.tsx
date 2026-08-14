import { memo, useRef } from 'react'

import { View, StyleSheet, TouchableOpacity } from 'react-native'

import { Icon } from '@/components/common/Icon'
import { pop } from '@/navigation'
import { useTheme } from '@/store/theme/hook'
import { usePlayerMusicInfo } from '@/store/player/hook'
import Text from '@/components/common/Text'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT as _HEADER_HEIGHT, NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import commonState from '@/store/common/state'
import CommentBtn from './CommentBtn'
import Btn from './Btn'
import SettingPopup, { type SettingPopupType } from '../../components/SettingPopup'
import DesktopLyricBtn from './DesktopLyricBtn'
import { MacRadius, MacSpacing, MacFontSize, getMacGlassBackground, getMacGlassBorder } from '../../macOS'

export const HEADER_HEIGHT = scaleSizeH(_HEADER_HEIGHT)

const Title = () => {
  const theme = useTheme()
  const musicInfo = usePlayerMusicInfo()
  const isDark = !!theme.isDark

  return (
    <View style={[styles.titleCard, {
      backgroundColor: getMacGlassBackground(isDark),
      borderColor: getMacGlassBorder(isDark),
    }]}>
      <Text numberOfLines={1} style={styles.title} size={MacFontSize.body} color={theme['c-font']}>{musicInfo.name}</Text>
      <Text numberOfLines={1} style={styles.subtitle} size={MacFontSize.caption} color={theme['c-font-label']}>{musicInfo.singer}</Text>
    </View>
  )
}

export default memo(() => {
  const popupRef = useRef<SettingPopupType>(null)

  const back = () => {
    void pop(commonState.componentIds.playDetail!)
  }
  const showSetting = () => {
    popupRef.current?.show()
  }

  return (
    <View style={{ height: HEADER_HEIGHT }} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_header}>
      <View style={styles.container}>
        <TouchableOpacity onPress={back} style={{ ...styles.button, width: HEADER_HEIGHT }}>
          <Icon name="chevron-left" size={20} />
        </TouchableOpacity>
        <Title />
        <DesktopLyricBtn />
        <CommentBtn />
        <Btn icon="slider" onPress={showSetting} />
      </View>
      <SettingPopup ref={popupRef} position="left" direction="horizontal" />
    </View>
  )
})


const styles = StyleSheet.create({
  container: {
    flex: 0,
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: MacSpacing.xs,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    flex: 0,
  },
  // macOS 风格的居中胶囊标题卡
  titleCard: {
    flex: 1,
    height: '78%',
    marginHorizontal: MacSpacing.xs,
    paddingHorizontal: MacSpacing.md,
    borderRadius: MacRadius.lg,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  subtitle: {
    marginTop: 2,
    letterSpacing: 0.1,
  },
  icon: {
    paddingLeft: 4,
    paddingRight: 4,
  },
})
