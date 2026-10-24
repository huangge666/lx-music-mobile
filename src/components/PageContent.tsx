// import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import ImageBackground from '@/components/common/ImageBackground'
import { useWindowSize } from '@/utils/hooks'
import { useMemo } from 'react'
import { scaleSizeAbsHR } from '@/utils/pixelRatio'
import { defaultHeaders } from './common/Image'
import SizeView from './SizeView'
import { useBgPic } from '@/store/common/hook'
import { getBgPicOverlayColor } from '@/theme/themes/palette'

interface Props {
  children: React.ReactNode
  /** 无背景图时的页面底色。设置页传分组灰，其余用内容白/黑。 */
  backgroundColor?: string
}

// Apple Music 风格背景模糊半径 — 较大值产生沉浸式氛围
const BLUR_RADIUS = Math.max(scaleSizeAbsHR(24), 12)

/**
 * 页面容器
 *
 * 两种背景模式：
 * 1. 主题背景（默认）：纯色内容底，设置页可改成分组灰
 * 2. 自定义背景图（useBgPic）：模糊放大 + 半透明遮罩
 */
export default ({ children, backgroundColor }: Props) => {
  const theme = useTheme()
  const windowSize = useWindowSize()
  const pic = useBgPic()
  const pageColor = backgroundColor ?? theme['c-content-background']

  // 主题背景模式 — 纯色，无叠加
  const themeComponent = useMemo(() => (
    <View style={{ flex: 1, overflow: 'hidden', backgroundColor: pageColor }}>
      {children}
    </View>
  ), [children, pageColor])

  // 自定义背景图模式 — 模糊 + 遮罩
  const picComponent = useMemo(() => {
    return (
      <View style={{ flex: 1, overflow: 'hidden' }}>
        <ImageBackground
          style={{ position: 'absolute', left: 0, top: 0, height: windowSize.height, width: windowSize.width, backgroundColor: theme['c-content-background'] }}
          source={{ uri: pic!, headers: defaultHeaders }}
          resizeMode="cover"
          blurRadius={BLUR_RADIUS}
        >
          {/* 半透明遮罩层 — 与内容底色同源，保证图片背景下的可读性 */}
          <View style={{ flex: 1, backgroundColor: getBgPicOverlayColor(theme.isDark) }}></View>
        </ImageBackground>
        <View style={{ flex: 1, flexDirection: 'column' }}>
          {children}
        </View>
      </View>
    )
  }, [children, pic, theme, windowSize.height, windowSize.width])

  return (
    <>
      <SizeView />
      {pic ? picComponent : themeComponent}
    </>
  )
}
