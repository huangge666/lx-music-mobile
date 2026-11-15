import { memo } from 'react'
import { View } from 'react-native'

// import Title from './components/Title'
import { createStyle } from '@/utils/tools'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import PlayInfo from '../../Vertical/Player/components/PlayInfo'
import ControlBtn from './ControlBtn'


/** 横屏与竖屏共用进度、音质与加载状态合同，不再让时间文字覆盖进度条。 */
export default memo(() => {
  return (
    <View style={styles.container} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_player}>
      <PlayInfo />
      <ControlBtn />
    </View>
  )
})

const styles = createStyle({
  container: {
    flexShrink: 0,
    paddingHorizontal: 24,
    gap: 2,
  },
})
