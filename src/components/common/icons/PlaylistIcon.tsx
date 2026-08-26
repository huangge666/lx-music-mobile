import { memo } from 'react'
import { View, type StyleProp, type ViewStyle } from 'react-native'

/**
 * 24gf-playlist.svg（1024 画板）的矢量绘制：
 * 左上播放三角 + 三条圆角横线
 * 不走 IcoMoon 字体，热重载即可显示
 */
const PlaylistIcon = ({ size, color, style }: {
  size: number
  color: string
  style?: StyleProp<ViewStyle>
}) => {
  const u = size / 1024
  const barH = 42.667 * u
  const radius = barH / 2
  const barLeft = 64 * u
  const barWidth = 896 * u
  const topBarLeft = 405.333 * u
  const topBarWidth = 554.667 * u

  const triH = 160 * u
  const triW = 132 * u
  const triLeft = 48 * u
  const triTop = 69.333 * u

  return (
    <View style={[{ width: size, height: size }, style]}>
      <View
        style={{
          position: 'absolute',
          left: triLeft,
          top: triTop,
          width: 0,
          height: 0,
          borderTopWidth: triH / 2,
          borderBottomWidth: triH / 2,
          borderLeftWidth: triW,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          borderLeftColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: topBarLeft,
          top: 128 * u,
          width: topBarWidth,
          height: barH,
          borderRadius: radius,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: barLeft,
          top: 512 * u,
          width: barWidth,
          height: barH,
          borderRadius: radius,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: barLeft,
          top: 896 * u,
          width: barWidth,
          height: barH,
          borderRadius: radius,
          backgroundColor: color,
        }}
      />
    </View>
  )
}

export default memo(PlaylistIcon)
