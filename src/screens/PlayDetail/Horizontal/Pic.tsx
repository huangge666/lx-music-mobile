import { memo, useCallback, useEffect, useState } from 'react'
import { View, type LayoutChangeEvent } from 'react-native'
// import { useLayout } from '@/utils/hooks'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { useWindowSize } from '@/utils/hooks'
import { useNavigationComponentDidAppear } from '@/navigation'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { createStyle } from '@/utils/tools'
import { BorderRadius } from '@/theme'
import { HEADER_HEIGHT } from './components/Header'
import { BTN_WIDTH } from './MoreBtn/Btn'
import { marginLeft } from './constant'
import Image from '@/components/common/Image'
import { useStatusbarHeight } from '@/store/common/hook'
import commonState from '@/store/common/state'
import { getHorizontalCoverSize } from './coverSize'


export default memo(({ componentId }: { componentId: string }) => {
  const musicInfo = usePlayerMusicInfo()
  const { width: winWidth, height: winHeight } = useWindowSize()
  const statusBarHeight = useStatusbarHeight()
  const [box, setBox] = useState({ width: 0, height: 0 })

  const [animated, setAnimated] = useState(!!commonState.componentIds.playDetail)
  const [pic, setPic] = useState(musicInfo.pic)
  useEffect(() => {
    if (animated) setPic(musicInfo.pic)
  }, [musicInfo.pic, animated])

  useNavigationComponentDidAppear(componentId, () => {
    setAnimated(true)
  })

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout
    setBox(prev => (Math.abs(prev.width - width) > 0.5 || Math.abs(prev.height - height) > 0.5) ? { width, height } : prev)
  }, [])

  // 设计上限：窗口比例 + 字号补偿，保持正常屏幕上的观感
  let designCap = Math.min((winWidth * 0.45 - marginLeft - BTN_WIDTH) * 0.76, (winHeight - statusBarHeight - HEADER_HEIGHT) * 0.62)
  designCap -= designCap * (global.lx.fontSize - 1) * 0.3
  // 实测可用空间是硬约束：短屏横屏时封面收缩，不挤压播放控制
  const imgSize = getHorizontalCoverSize(box, designCap)

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <View style={{ ...styles.content, elevation: animated ? 3 : 0 }}>
        <Image url={pic} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic} style={{
          width: imgSize,
          height: imgSize,
          borderRadius: BorderRadius.small,
        }} />
      </View>
    </View>
  )
})

const styles = createStyle({
  container: {
    // 由父容器决定可用空间，实测尺寸再收敛封面大小
    flexShrink: 1,
    flexGrow: 1,
    minHeight: 0,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  content: {
    // elevation: 3,
    backgroundColor: 'rgba(0,0,0,0)',
    borderRadius: BorderRadius.medium,
  },
})
