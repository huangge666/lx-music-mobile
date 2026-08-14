import { memo } from 'react'
import { View } from 'react-native'

import MoreBtn from './components/MoreBtn'
import PlayInfo from './components/PlayInfo'
import ControlBtn from './components/ControlBtn'
import { createStyle } from '@/utils/tools'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { MacSpacing } from '../../macOS'


/**
 * 下半操作区 — 彻底无底板
 * 进度 / 切歌 / 功能栏直接浮在氛围底上
 */
export default memo(() => {
  return (
    <View
      style={styles.container}
      nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_player}
      collapsable={false}
    >
      <PlayInfo />
      <ControlBtn />
      <MoreBtn />
    </View>
  )
})

const styles = createStyle({
  container: {
    flex: 0,
    width: '100%',
    paddingHorizontal: MacSpacing.xxl,
    paddingTop: 0,
    paddingBottom: MacSpacing.xl,
    flexDirection: 'column',
    gap: 2,
    backgroundColor: 'transparent',
    // 明确清掉可能被原生层带上的边框/圆角
    borderWidth: 0,
    borderRadius: 0,
    elevation: 0,
  },
})
