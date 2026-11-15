import { memo, useMemo } from 'react'
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { useTheme } from '@/store/theme/hook'
import GlassSurface from './GlassSurface'

interface Props {
  children?: React.ReactNode
  style?: StyleProp<ViewStyle>
  /** 外层（只负责圆角与阴影）的布局样式，例如在固定高度槽位里 flex:1 */
  containerStyle?: StyleProp<ViewStyle>
  /** 圆角：胶囊传高度的一半，卡片传 18~22 */
  radius?: number
  /**
   * 额外压一层同向色膜（0~1）：用来把玻璃提亮/压暗到文字可读的程度。
   * 标签栏背后是滚动内容，需要比迷你播放器更强的中性度。
   */
  scrim?: number
  /** 是否投悬浮阴影 */
  shadow?: boolean
  /** 原生模糊强度 0~100（Android 实际映射到半径） */
  blurAmount?: number
}

/**
 * 浮动玻璃容器。材质与抽屉、弹层共用 GlassSurface。
 * 布局落在内层，外层只负责阴影，避免 row 布局把播放器挤成半宽。
 */
export default memo(({
  children,
  style,
  containerStyle,
  radius = 22,
  scrim = 0,
  shadow = true,
  blurAmount = 18,
}: Props) => {
  const theme = useTheme()
  const isDark = theme.isDark

  const shadowStyle = useMemo(() => {
    if (!shadow) return null
    return Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDark ? 0.42 : 0.16,
        shadowRadius: 18,
      },
      android: {
        elevation: 10,
        shadowColor: '#000',
      },
      default: {},
    }) as ViewStyle
  }, [isDark, shadow])

  return (
    <View
      style={[
        styles.shadowWrap,
        { borderRadius: radius },
        shadowStyle,
        containerStyle,
      ]}
    >
      <GlassSurface
        highlight="none"
        scrim={scrim}
        blurAmount={blurAmount}
        style={[{ borderRadius: radius }, style]}
      >
        {children}
      </GlassSurface>
    </View>
  )
})

const styles = StyleSheet.create({
  shadowWrap: {
    overflow: 'visible',
  },
})
