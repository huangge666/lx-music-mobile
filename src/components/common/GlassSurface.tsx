import { useState } from 'react'
import { BlurView } from '@react-native-community/blur'
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg'

import { useTheme } from '@/store/theme/hook'

interface Props {
  children?: React.ReactNode
  style?: StyleProp<ViewStyle>
  /** 高光条贴在顶部还是左侧，用于横向栏和竖向面板 */
  highlight?: 'top' | 'left' | 'none'
  /** 内容较密的面板使用更厚的中性色膜，导航胶囊可降低到 0。 */
  scrim?: number
  blurAmount?: number
  /** 小按钮已叠在玻璃上时只绘制镜面层，避免重复采样与额外模糊开销。 */
  blurred?: boolean
}

let materialSeed = 0

/**
 * 所有玻璃共用原生背景模糊、透光色膜和双向镜面边缘。
 * 装饰层不接收触摸；保持单层内容容器，兼容抽屉的 flex 和弹层的不对称圆角。
 */
export default ({ children, style, highlight = 'top', scrim = 0.24, blurAmount = 18, blurred = true }: Props) => {
  const theme = useTheme()
  const [materialId] = useState(() => `glass-${++materialSeed}`)
  const flatStyle = StyleSheet.flatten(style)
  const corners = {
    borderRadius: flatStyle?.borderRadius,
    borderTopLeftRadius: flatStyle?.borderTopLeftRadius,
    borderTopRightRadius: flatStyle?.borderTopRightRadius,
    borderBottomLeftRadius: flatStyle?.borderBottomLeftRadius,
    borderBottomRightRadius: flatStyle?.borderBottomRightRadius,
  }

  return (
    <View style={[styles.surface, style]}>
      {blurred ? <BlurView
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
        blurType={theme.isDark ? 'dark' : 'light'}
        blurAmount={blurAmount}
        // Android 的原生库仅支持 0–25；iOS 仍可使用完整的 0–100 强度。
        {...(Platform.OS == 'android' ? {
          blurRadius: Math.min(25, Math.max(0, blurAmount)),
          downsampleFactor: 4,
          overlayColor: 'transparent',
        } : { reducedTransparencyFallbackColor: theme['c-card-background'] })}
      /> : null}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: theme['c-glass-background'] }]}
      />
      {scrim > 0
        ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, {
          backgroundColor: theme.isDark ? `rgba(0,0,0,${scrim})` : `rgba(255,255,255,${scrim})`,
        }]} />
        : null}
      <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id={`${materialId}-light`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#fff" stopOpacity={theme.isDark ? 0.15 : 0.38} />
            <Stop offset="0.38" stopColor="#fff" stopOpacity={0.03} />
            <Stop offset="0.72" stopColor="#fff" stopOpacity={0} />
            <Stop offset="1" stopColor="#fff" stopOpacity={theme.isDark ? 0.07 : 0.18} />
          </LinearGradient>
          <RadialGradient id={`${materialId}-glow`} cx="0" cy="1" rx="0.8" ry="1">
            <Stop offset="0" stopColor="#8CAEFF" stopOpacity={theme.isDark ? 0.06 : 0.07} />
            <Stop offset="1" stopColor="#8CAEFF" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${materialId}-glow)`} />
        <Rect width="100%" height="100%" fill={`url(#${materialId}-light)`} />
      </Svg>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, corners, {
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme['c-glass-border'],
      }]} />
      {/* 内侧亮边保留一像素的厚度感，不把整块玻璃涂成白色。 */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, corners, {
        borderWidth: 1,
        borderColor: 'transparent',
        borderTopColor: theme['c-glass-highlight'],
        borderLeftColor: theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.65)',
        borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(60,60,67,0.07)',
      }]} />
      {highlight == 'none'
        ? null
        : (
            <View
              pointerEvents="none"
              style={highlight == 'left'
                ? {
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    width: 1,
                    backgroundColor: theme['c-glass-highlight'],
                  }
                : {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 1,
                    backgroundColor: theme['c-glass-highlight'],
                  }}
            />
          )}
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  surface: {
    overflow: 'hidden',
  },
})
