import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native'
import { Icon } from './Icon'
import GlassSurface from './GlassSurface'
import { useTheme } from '@/store/theme/hook'

interface Props {
  name: string
  label: string
  onPress: PressableProps['onPress']
  color?: string
  style?: StyleProp<ViewStyle>
}

/** 40dp 玻璃圆面与 48dp 热区分开，页头并列操作不会靠重叠 hitSlop 扩大点击范围。 */
export default ({ name, label, onPress, color, style }: Props) => {
  const theme = useTheme()
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}
      style={({ pressed }) => [styles.target, style, { opacity: pressed ? 0.7 : 1 }]}>
      <GlassSurface highlight="none" scrim={0.16} blurred={false} style={styles.surface}>
        <Icon name={name} rawSize={20} color={color ?? theme['c-font']} />
      </GlassSurface>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  target: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  surface: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
})
