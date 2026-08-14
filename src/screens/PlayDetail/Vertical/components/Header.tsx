import { memo, useEffect } from 'react'
import { View, StatusBar as RNStatusBar, StyleSheet, TouchableOpacity } from 'react-native'
import { pop } from '@/navigation'
import StatusBar from '@/components/common/StatusBar'
import commonState from '@/store/common/state'
import { useStatusbarHeight } from '@/store/common/hook'
import { Icon } from '@/components/common/Icon'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { HEADER_HEIGHT as _HEADER_HEIGHT, NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { Immersive, MacSpacing } from '../../macOS'

export const HEADER_HEIGHT = scaleSizeH(_HEADER_HEIGHT)

const CIRCLE = scaleSizeW(38)

/**
 * 沉浸式顶栏
 * — 仅左侧圆形返回（下拉关闭）
 * — 无中间指示条、无右侧设置入口
 */
export default memo(() => {
  const statusBarHeight = useStatusbarHeight()

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
        <TouchableOpacity style={styles.circleBtn} onPress={back} activeOpacity={0.7}>
          <View style={styles.chevronDown}>
            <Icon name="chevron-left" color={Immersive.text} size={18} />
          </View>
        </TouchableOpacity>
        {/* 占位，保持左侧按钮不贴边即可 */}
        <View style={styles.spacer} />
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
  chevronDown: {
    transform: [{ rotate: '-90deg' }],
  },
  spacer: {
    flex: 1,
  },
})
