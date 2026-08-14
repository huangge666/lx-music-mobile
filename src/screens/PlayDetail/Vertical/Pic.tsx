import { useEffect, useMemo, useState } from 'react'
import { View, TouchableOpacity, Platform } from 'react-native'
import { createStyle } from '@/utils/tools'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { useWindowSize } from '@/utils/hooks'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { useNavigationComponentDidAppear } from '@/navigation'
import { HEADER_HEIGHT } from './components/Header'
import Image from '@/components/common/Image'
import { useStatusbarHeight } from '@/store/common/hook'
import commonState from '@/store/common/state'
import { MacSpacing } from '../macOS'


/**
 * Apple Music 风格大封面
 * — 屏宽约 82%，大圆角矩形
 * — 深色长投影营造立体悬浮感
 * — 点击切换到歌词页（必填 onPress）
 */
export default ({ componentId, onPress }: {
  componentId: string
  /** 点击封面 → 切换歌词页 */
  onPress: () => void
}) => {
  const musicInfo = usePlayerMusicInfo()
  const { width: winWidth, height: winHeight } = useWindowSize()
  const statusBarHeight = useStatusbarHeight()

  const [animated, setAnimated] = useState(!!commonState.componentIds.playDetail)
  const [pic, setPic] = useState(musicInfo.pic)
  useEffect(() => {
    if (animated) setPic(musicInfo.pic)
  }, [musicInfo.pic, animated])

  useNavigationComponentDidAppear(componentId, () => {
    setAnimated(true)
  })

  const { imgStyle, shadowStyle } = useMemo(() => {
    // 大封面：宽 82%，高度上限 42% 可用区
    const maxByWidth = winWidth * 0.82
    const maxByHeight = (winHeight - statusBarHeight - HEADER_HEIGHT) * 0.42
    const imgWidth = Math.min(maxByWidth, maxByHeight)
    // 更大圆角 — Apple Music 质感
    const radius = Math.min(imgWidth * 0.1, 28)
    return {
      imgStyle: {
        width: imgWidth,
        height: imgWidth,
        borderRadius: radius,
      },
      shadowStyle: Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 22 },
          shadowOpacity: 0.45,
          shadowRadius: 36,
        },
        android: {
          elevation: animated ? 18 : 0,
          // Android elevation 阴影色
          shadowColor: '#000',
        },
        default: {},
      }) as object,
    }
  }, [animated, statusBarHeight, winHeight, winWidth])

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="查看歌词"
        style={[styles.shadowWrap, shadowStyle]}
      >
        <Image
          url={pic}
          nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic}
          style={imgStyle}
        />
      </TouchableOpacity>
    </View>
  )
}

const styles = createStyle({
  container: {
    flexGrow: 0,
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: MacSpacing.sm,
    width: '100%',
  },
  shadowWrap: {
    backgroundColor: 'transparent',
    // iOS 阴影需要背景不透明才能生效；用近黑极透明垫底
    borderRadius: 28,
  },
})
