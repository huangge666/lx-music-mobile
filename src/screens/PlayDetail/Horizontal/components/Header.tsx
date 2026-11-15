import { memo, useRef } from 'react'

import { View, StyleSheet, TouchableOpacity, StatusBar } from 'react-native'

import { Icon } from '@/components/common/Icon'
import { pop } from '@/navigation'
import Text from '@/components/common/Text'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT as _HEADER_HEIGHT, NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import commonState from '@/store/common/state'
import Btn from './Btn'
import SettingPopup, { type SettingPopupType } from '../../components/SettingPopup'
import { Immersive } from '../../macOS'
import { useI18n } from '@/lang'
import { useStatusbarHeight } from '@/store/common/hook'

export const HEADER_HEIGHT = scaleSizeH(_HEADER_HEIGHT)

export default memo(() => {
  const popupRef = useRef<SettingPopupType>(null)
  const t = useI18n()
  const statusBarHeight = useStatusbarHeight()

  const back = () => {
    void pop(commonState.componentIds.playDetail!)
  }
  const showSetting = () => {
    popupRef.current?.show()
  }

  return (
    <View style={{ minHeight: HEADER_HEIGHT + statusBarHeight, paddingTop: statusBarHeight }} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_header}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.container}>
        <TouchableOpacity onPress={back} style={styles.button} accessibilityRole="button" accessibilityLabel={t('close')}>
          <Icon name="chevron-down" rawSize={22} color={Immersive.text} />
        </TouchableOpacity>
        <View style={styles.titleGroup}>
          <Text size={10} color={Immersive.textSecondary} style={styles.wordmark}>LX / MUSIC</Text>
          <Text size={13} color={Immersive.text} numberOfLines={1}>{t('player_now_playing')}</Text>
        </View>
        <Btn icon="slider" onPress={showSetting} label={t('play_detail_setting_title')} />
      </View>
      <SettingPopup ref={popupRef} position="left" direction="horizontal" />
    </View>
  )
})


const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 24,
    paddingBottom: 4,
    gap: 10,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Immersive.glass,
  },
  titleGroup: { flex: 1, minWidth: 0, gap: 2 },
  wordmark: { letterSpacing: 2, fontWeight: '700' },
})
