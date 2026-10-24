import { memo, useMemo, useRef } from 'react'
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { BlurView } from '@react-native-community/blur'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'

import { useTheme } from '@/store/theme/hook'
import { BorderWidths } from '@/theme'

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

let gradientSeed = 0

/**
 * iOS 26 Liquid Glass 表面。
 *
 * 用 `@react-native-community/blur` 的 `BlurView` 做**真实背景模糊**：
 * 它采样窗口内这一层后面的内容（列表封面、滚动中的页面），
 * 不是对封面图做高斯模糊，也不再需要 `blurSource`。
 *
 * 合成顺序：
 * 1. `BlurView`：原生背景模糊
 * 2. 半透明材质着色：`c-glass-background`
 * 3. 可选色膜：`scrim`（标签栏用，保证小字对比度）
 * 4. 斜向高光渐变 + 发丝边框 + 顶部亮边
 *
 * 布局样式落在内层（`clip`），外层只负责圆角与阴影：
 * 否则调用方传进来的 `flexDirection: 'row'` 会把内层挤成内容宽度，
 * 详情页的迷你播放器会只剩半宽。
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
  const gradientId = useRef(`liquid-glass-${++gradientSeed}`).current
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
      {/*
        布局样式落内层；内外两层都不能铺不透明底色，
        否则 BlurView 采样到的是自己这层白膜，看起来就是纯白面板。
      */}
      <View style={[styles.clip, { borderRadius: radius }, style]}>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType={isDark ? 'dark' : 'light'}
          blurAmount={blurAmount}
          // Android 走 blurRadius + overlayColor；overlayColor 必须透明，
          // 否则库的默认白色覆盖会把任何背景都洗成浅灰（就不是模糊了）。
          blurRadius={blurAmount}
          downsampleFactor={4}
          overlayColor="transparent"
          reducedTransparencyFallbackColor={theme['c-glass-background']}
        />
        {/* 材质着色：模糊图之上再加一层，保证任意内容下文字都可读 */}
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: theme['c-glass-background'] }]}
        />
        {scrim > 0
          ? (
              <View
                pointerEvents="none"
                style={[StyleSheet.absoluteFill, {
                  backgroundColor: isDark ? `rgba(0,0,0,${scrim})` : `rgba(255,255,255,${scrim})`,
                }]}
              />
            )
          : null}
        {/* 斜向镜面高光 */}
        <Svg
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          width="100%"
          height="100%"
        >
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="0.35" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={isDark ? 0.16 : 0.34} />
              <Stop offset="0.42" stopColor="#FFFFFF" stopOpacity={isDark ? 0.05 : 0.10} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0.01} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#${gradientId})`} />
        </Svg>
        {/* 边框与顶部亮边 */}
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, {
            borderRadius: radius,
            borderWidth: BorderWidths.hairline,
            borderColor: theme['c-glass-border'],
          }]}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: radius * 0.6,
            right: radius * 0.6,
            height: BorderWidths.hairline,
            backgroundColor: theme['c-glass-highlight'],
          }}
        />
        {children}
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  shadowWrap: {
    overflow: 'visible',
  },
  clip: {
    overflow: 'hidden',
  },
})
