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

interface Props {
  children: React.ReactNode
}

// Apple Music 风格背景模糊半径 — 较大值产生沉浸式氛围
const BLUR_RADIUS = Math.max(scaleSizeAbsHR(24), 12)

/**
 * Apple Music 风格页面容器
 *
 * 两种背景模式：
 * 1. 主题背景（默认）：纯色 c-content-background，干净简洁
 * 2. 自定义背景图（useBgPic）：模糊放大 + 半透明遮罩，营造氛围感
 *
 * 不再使用 c-main-background 的半透明叠加层 — Apple Music 用单一纯色背景
 */
export default ({ children }: Props) => {
  const theme = useTheme()
  const windowSize = useWindowSize()
  const pic = useBgPic()

  // 主题背景模式 — 纯色，无叠加
  const themeComponent = useMemo(() => (
    <View style={{ flex: 1, overflow: 'hidden', backgroundColor: theme['c-content-background'] }}>
      {children}
    </View>
  ), [children, theme])

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
          {/* 半透明遮罩层 — 保证内容可读性 */}
          <View style={{ flex: 1, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.78)' }}></View>
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
