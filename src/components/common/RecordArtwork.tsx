import { memo, useId } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg'
import { getPlaylistCoverTint } from './playlistCover'

interface Props {
  seed: string
  style?: StyleProp<ViewStyle>
}

/** 程序化唱片封面：按稳定歌单 id 派生颜色，零网络请求，大小完全由父容器决定。 */
export default memo(({ seed, style }: Props) => {
  const id = useId().replace(/:/g, '')
  const tint = getPlaylistCoverTint(seed)
  return (
    <View style={[styles.frame, style]} pointerEvents="none" accessible={false}>
      <Svg width="100%" height="100%" viewBox="0 0 240 240" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id={`${id}-paper`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={tint.backgroundColor} />
            <Stop offset="1" stopColor="#15231A" />
          </LinearGradient>
          <LinearGradient id={`${id}-record`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#343E31" />
            <Stop offset="0.5" stopColor="#101610" />
            <Stop offset="1" stopColor="#46513E" />
          </LinearGradient>
        </Defs>
        <Rect width="240" height="240" fill={`url(#${id}-paper)`} />
        <Path d="M-20 190L170 0H210L0 210Z" fill="#FFFFFF" opacity="0.06" />
        <Path d="M-20 220L220-20H240L0 240Z" fill="#FFFFFF" opacity="0.07" />
        <Circle cx="171" cy="130" r="109" fill="#000000" opacity="0.18" />
        <Circle cx="164" cy="121" r="105" fill={`url(#${id}-record)`} />
        <G fill="none" stroke="#DCECCB" strokeWidth="0.6" opacity="0.18">
          {[96, 90, 84, 78, 72, 66, 60, 54, 48].map(radius => <Circle key={radius} cx="164" cy="121" r={radius} />)}
        </G>
        <Path d="M164 121L88 49A105 105 0 0 1 180 17Z" fill="#E7F4D3" opacity="0.08" />
        <Path d="M164 121L240 193A105 105 0 0 1 150 225Z" fill="#E7F4D3" opacity="0.07" />
        <Circle cx="164" cy="121" r="35" fill="#D3EFA5" />
        <Circle cx="164" cy="121" r="27" fill="none" stroke="#39582F" strokeWidth="0.7" opacity="0.45" />
        <Path d="M151 115H177M151 121H171M151 127H174" stroke="#39582F" strokeWidth="2" />
        <Circle cx="164" cy="121" r="4" fill="#111A11" />
        <Path d="M18 20H50M18 26H40M18 218H65" stroke="#F0F5E7" strokeWidth="2" opacity="0.65" />
      </Svg>
    </View>
  )
})

const styles = StyleSheet.create({ frame: { overflow: 'hidden' } })
